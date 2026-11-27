<?php

namespace App\Jobs;

use App\Services\ExamBufferService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * FlushExamBuffer — Batch sync jawaban CBT dari Redis ke MySQL
 *
 * Dijadwalkan tiap 30 detik via routes/console.php.
 * Memproses semua session di `cbt:dirty_sessions` set.
 *
 * STRATEGI:
 *   - Baca dirty_sessions dari Redis (set)
 *   - Per session: upsert batch ke exam_answers
 *   - Remove dari dirty set setelah berhasil
 *   - Jika Redis down: job gagal, Laravel retry otomatis
 *   - Jika MySQL down: jawaban tetap aman di Redis sampai TTL habis
 *
 * IDEMPOTENT:
 *   Menggunakan upsert (ON DUPLICATE KEY UPDATE) sehingga aman
 *   dijalankan ulang jika terjadi partial failure.
 */
class FlushExamBuffer implements ShouldQueue
{
    use Queueable;

    /**
     * Jumlah retry jika job gagal.
     */
    public int $tries = 3;

    /**
     * Timeout job (detik). Harus < interval scheduler (30 detik).
     */
    public int $timeout = 25;

    public function __construct()
    {
        $this->onQueue('cbt');
    }

    public function handle(ExamBufferService $buffer): void
    {
        $sessionIds = $buffer->getDirtySessions();

        if (empty($sessionIds)) {
            return;
        }

        $totalFlushed = 0;
        $failed       = [];

        foreach ($sessionIds as $sessionId) {
            try {
                $count = $this->flushOne($buffer, $sessionId);
                $totalFlushed += $count;
                $buffer->markFlushed($sessionId);
            } catch (\Throwable $e) {
                $failed[] = $sessionId;
                Log::warning('[FlushExamBuffer] Gagal flush session', [
                    'session_id' => $sessionId,
                    'error'      => $e->getMessage(),
                ]);
                // Biarkan session tetap di dirty set → akan dicoba di run berikutnya
            }
        }

        if ($totalFlushed > 0) {
            Log::info('[FlushExamBuffer] Batch selesai', [
                'sessions_processed' => count($sessionIds) - count($failed),
                'sessions_failed'    => count($failed),
                'rows_flushed'       => $totalFlushed,
            ]);
        }

        // Jika semua gagal, lempar exception supaya job masuk failed_jobs
        if (count($failed) === count($sessionIds) && !empty($failed)) {
            throw new \RuntimeException(
                'FlushExamBuffer: semua session gagal di-flush. Cek koneksi MySQL.'
            );
        }
    }

    /**
     * Flush satu session ke MySQL, return jumlah baris yang di-upsert.
     */
    private function flushOne(ExamBufferService $buffer, int $sessionId): int
    {
        $answers = $buffer->getBufferedAnswers($sessionId);

        if (empty($answers)) {
            $buffer->markFlushed($sessionId);
            return 0;
        }

        $meta     = \Illuminate\Support\Facades\Redis::hgetall('cbt:session_meta:' . $sessionId);
        $schoolId = (int) ($meta['school_id'] ?? 0);

        $rows = [];
        foreach ($answers as $questionId => $payload) {
            $rows[] = [
                'school_id'   => $schoolId ?: ($payload['school_id'] ?? null),
                'session_id'  => $sessionId,
                'question_id' => $questionId,
                'jawaban'     => is_array($payload['jawaban'])
                    ? json_encode($payload['jawaban'])
                    : $payload['jawaban'],
                'is_correct'  => $payload['is_correct'] ?? null,
                'skor'        => $payload['skor'] ?? null,
                'dijawab_at'  => $payload['dijawab_at'] ?? now(),
                'created_at'  => $payload['dijawab_at'] ?? now(),
                'updated_at'  => now(),
            ];
        }

        // Batch upsert — satu query untuk semua jawaban session ini
        DB::table('exam_answers')->upsert(
            $rows,
            uniqueBy: ['school_id', 'session_id', 'question_id'],
            update:   ['jawaban', 'is_correct', 'skor', 'dijawab_at', 'updated_at'],
        );

        return count($rows);
    }

    /**
     * Jika job akhirnya gagal setelah semua retry habis.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('[FlushExamBuffer] Job gagal permanen', [
            'error' => $exception->getMessage(),
        ]);
    }
}
