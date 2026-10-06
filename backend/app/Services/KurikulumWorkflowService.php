<?php

namespace App\Services;

use App\Enums\StatusImplementasiKurikulum as Status;
use App\Enums\StatusTahunAjaran;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

/**
 * Workflow implementasi kurikulum (kurikulum_tahun_ajarans).
 *
 *   DRAFT → UNDER_REVIEW → APPROVED → ACTIVE → COMPLETED
 *
 * Permission dijaga di route (middleware permission:...). Service ini menjaga
 * ATURAN BISNIS: transisi yang sah dan prasyarat tiap transisi.
 *
 * Setiap transisi berjalan dalam transaksi dengan lockForUpdate sehingga klik
 * ganda / dua request bersamaan tidak bisa melompati status.
 *
 * Pelanggaran aturan dilempar sebagai \DomainException → 422 (handler global).
 */
class KurikulumWorkflowService
{
    /**
     * Aksi → [permission, status tujuan]. Dipakai untuk "aksi_tersedia" di UI.
     */
    private const AKSI = [
        'ajukan_review' => ['master_data.kurikulum.review', Status::UNDER_REVIEW],
        'setujui' => ['master_data.kurikulum.approve', Status::APPROVED],
        'tolak' => ['master_data.kurikulum.approve', Status::DRAFT],
        'aktifkan' => ['master_data.kurikulum.activate', Status::ACTIVE],
        'selesaikan' => ['master_data.kurikulum.complete', Status::COMPLETED],
    ];

    // ── Baca ─────────────────────────────────────────────────────────────────

    /**
     * Ringkasan implementasi + status workflow. Tanpa integer ID.
     */
    public function detail(int $schoolId, string $ulid): ?array
    {
        $row = DB::table('kurikulum_tahun_ajarans as kta')
            ->join('kurikulums as k', 'k.id', '=', 'kta.kurikulum_id')
            ->join('tahun_ajarans as ta', 'ta.id', '=', 'kta.tahun_ajaran_id')
            ->where('kta.school_id', $schoolId)
            ->where('kta.ulid', $ulid)
            ->select([
                'kta.id',
                'kta.ulid',
                'kta.status',
                'kta.is_active',
                'kta.tingkat_kelas',
                'kta.catatan_review',
                'kta.reviewed_at',
                'kta.approved_at',
                'kta.activated_at',
                'kta.completed_at',
                'k.ulid as kurikulum_ulid',
                'k.nama as kurikulum_nama',
                'k.kode as kurikulum_kode',
                'ta.ulid as tahun_ajaran_ulid',
                'ta.tahun as tahun_ajaran',
            ])
            ->first();

        if (!$row) {
            return null;
        }

        $status = Status::dari($row->status);

        return [
            'ulid' => $row->ulid,
            'status' => $status->value,
            'status_label' => $status->label(),
            'is_editable' => $status->isEditable() && (bool) $row->is_active,
            'is_active' => (bool) $row->is_active,
            'kurikulum' => [
                'ulid' => $row->kurikulum_ulid,
                'nama' => $row->kurikulum_nama,
                'kode' => $row->kurikulum_kode,
            ],
            'tahun_ajaran' => [
                'ulid' => $row->tahun_ajaran_ulid,
                'tahun' => $row->tahun_ajaran,
            ],
            'tingkat_kelas' => $this->tingkatDiizinkan($row),
            'jumlah_struktur' => DB::table('kurikulum_strukturs')
                ->where('kurikulum_tahun_ajaran_id', $row->id)
                ->count(),
            'catatan_review' => $row->catatan_review,
            'reviewed_at' => $row->reviewed_at,
            'approved_at' => $row->approved_at,
            'activated_at' => $row->activated_at,
            'completed_at' => $row->completed_at,
        ];
    }

    /**
     * Aksi yang bisa dilakukan user SAAT INI (permission + transisi sah).
     *
     * @return array<int, string>
     */
    public function aksiTersedia(Status $status, User $user): array
    {
        $hasil = [];

        foreach (self::AKSI as $aksi => [$permission, $tujuan]) {
            if ($status->canTransitionTo($tujuan) && $user->hasPermission($permission)) {
                $hasil[] = $aksi;
            }
        }

        return $hasil;
    }

    // ── Transisi ─────────────────────────────────────────────────────────────

    public function ajukanReview(int $schoolId, string $ulid): array
    {
        return $this->jalankan(
            $schoolId,
            $ulid,
            Status::UNDER_REVIEW,
            fn () => [
                'reviewed_by' => auth()->id(),
                'reviewed_at' => now(),
            ],
            'submit_review',
            'Wakasek mengajukan struktur kurikulum untuk direview kepala sekolah.',
            fn (object $impl) => $this->assertStrukturLengkap($impl),
        );
    }

    public function setujui(int $schoolId, string $ulid, ?string $catatan = null): array
    {
        return $this->jalankan(
            $schoolId,
            $ulid,
            Status::APPROVED,
            fn () => [
                'approved_by' => auth()->id(),
                'approved_at' => now(),
                'catatan_review' => $catatan,
            ],
            'approve',
            'Kepala sekolah menyetujui struktur kurikulum.' . ($catatan ? " Catatan: {$catatan}" : ''),
        );
    }

    public function tolak(int $schoolId, string $ulid, string $catatan): array
    {
        if (trim($catatan) === '') {
            throw new \DomainException('Catatan alasan penolakan wajib diisi.');
        }

        return $this->jalankan(
            $schoolId,
            $ulid,
            Status::DRAFT,
            fn () => [
                'catatan_review' => $catatan,
                // Reset agar Wakasek bisa memperbaiki lalu mengajukan ulang
                'reviewed_by' => null,
                'reviewed_at' => null,
                'approved_by' => null,
                'approved_at' => null,
            ],
            'reject',
            "Kepala sekolah menolak struktur kurikulum. Catatan: {$catatan}",
        );
    }

    public function aktifkan(int $schoolId, string $ulid): array
    {
        return $this->jalankan(
            $schoolId,
            $ulid,
            Status::ACTIVE,
            fn () => ['activated_at' => now()],
            'activate',
            'Kepala sekolah mengaktifkan struktur kurikulum.',
            fn (object $impl) => $this->assertBisaDiaktifkan($impl),
        );
    }

    public function selesaikan(int $schoolId, string $ulid): array
    {
        return $this->jalankan(
            $schoolId,
            $ulid,
            Status::COMPLETED,
            fn () => ['completed_at' => now()],
            'complete',
            'Wakasek menyelesaikan struktur kurikulum.',
        );
    }

    // ── Inti ─────────────────────────────────────────────────────────────────

    /**
     * @param callable():array        $kolom      kolom tambahan yang diisi saat transisi
     * @param callable(object):void|null $prasyarat dilempar \DomainException jika tidak terpenuhi
     */
    private function jalankan(
        int $schoolId,
        string $ulid,
        Status $tujuan,
        callable $kolom,
        string $aksiLog,
        string $keterangan,
        ?callable $prasyarat = null,
    ): array {
        DB::transaction(function () use ($schoolId, $ulid, $tujuan, $kolom, $aksiLog, $keterangan, $prasyarat) {
            $impl = DB::table('kurikulum_tahun_ajarans')
                ->where('school_id', $schoolId)
                ->where('ulid', $ulid)
                ->lockForUpdate()
                ->first();

            if (!$impl) {
                throw new ModelNotFoundException('Implementasi kurikulum tidak ditemukan.');
            }

            if (!$impl->is_active) {
                throw new \DomainException('Implementasi kurikulum ini dinonaktifkan, status tidak bisa diubah.');
            }

            $dari = Status::dari($impl->status);

            if (!$dari->canTransitionTo($tujuan)) {
                throw new \DomainException(
                    "Struktur kurikulum berstatus \"{$dari->label()}\", tidak bisa diubah ke \"{$tujuan->label()}\"."
                );
            }

            if ($prasyarat) {
                $prasyarat($impl);
            }

            DB::table('kurikulum_tahun_ajarans')
                ->where('id', $impl->id)
                ->update(array_merge(
                    ['status' => $tujuan->value, 'updated_at' => now()],
                    $kolom(),
                ));

            ActivityLog::log($aksiLog, 'kurikulum_implementasi', (int) $impl->id, $keterangan);
        });

        return $this->detail($schoolId, $ulid);
    }

    // ── Prasyarat ────────────────────────────────────────────────────────────

    /**
     * Struktur tidak boleh kosong; dan jika implementasi dibatasi ke tingkat
     * tertentu, setiap tingkat itu harus punya minimal satu mata pelajaran.
     */
    private function assertStrukturLengkap(object $impl): void
    {
        $adaPerTingkat = DB::table('kurikulum_strukturs')
            ->where('kurikulum_tahun_ajaran_id', $impl->id)
            ->distinct()
            ->pluck('tingkat')
            ->map(fn ($t) => (int) $t)
            ->all();

        if ($adaPerTingkat === []) {
            throw new \DomainException(
                'Struktur kurikulum masih kosong. Tambahkan mata pelajaran sebelum diajukan.'
            );
        }

        $kosong = $this->tingkatBelumTerisi($this->tingkatDiizinkan($impl), $adaPerTingkat);

        if ($kosong !== []) {
            throw new \DomainException(
                'Tingkat ' . implode(', ', $kosong) . ' belum memiliki mata pelajaran di struktur.'
            );
        }
    }

    /**
     * Aktivasi: tahun ajaran belum selesai/diarsip, dan tidak boleh ada
     * kurikulum lain yang sudah AKTIF pada tingkat yang sama di tahun ajaran
     * yang sama (satu tingkat = satu kurikulum aktif).
     */
    private function assertBisaDiaktifkan(object $impl): void
    {
        $ta = DB::table('tahun_ajarans')->where('id', $impl->tahun_ajaran_id)->first(['tahun', 'status']);

        if ($ta && in_array($ta->status, [StatusTahunAjaran::COMPLETED->value, StatusTahunAjaran::ARCHIVED->value], true)) {
            throw new \DomainException(
                "Tahun ajaran {$ta->tahun} sudah selesai/diarsipkan, kurikulum tidak bisa diaktifkan."
            );
        }

        $lain = DB::table('kurikulum_tahun_ajarans as kta')
            ->join('kurikulums as k', 'k.id', '=', 'kta.kurikulum_id')
            ->where('kta.school_id', $impl->school_id)
            ->where('kta.tahun_ajaran_id', $impl->tahun_ajaran_id)
            ->where('kta.id', '!=', $impl->id)
            ->where('kta.status', Status::ACTIVE->value)
            ->get(['kta.semester_id', 'kta.tingkat_kelas', 'k.nama']);

        $tingkatSaya = $this->tingkatDiizinkan($impl);

        foreach ($lain as $o) {
            if (!$this->semesterBentrok($impl->semester_id, $o->semester_id)) {
                continue;
            }

            if ($this->tingkatBentrok($tingkatSaya, $this->tingkatDiizinkan($o))) {
                throw new \DomainException(
                    "Kurikulum \"{$o->nama}\" sudah aktif pada tingkat yang sama di tahun ajaran ini. "
                    . 'Satu tingkat hanya boleh memakai satu kurikulum aktif.'
                );
            }
        }
    }

    // ── Aturan murni (tanpa DB) ──────────────────────────────────────────────

    /**
     * tingkat_kelas NULL / kosong = tidak dibatasi → null.
     *
     * @return array<int, int>|null
     */
    private function tingkatDiizinkan(object $impl): ?array
    {
        if ($impl->tingkat_kelas === null) {
            return null;
        }

        $daftar = json_decode($impl->tingkat_kelas, true);

        if (!is_array($daftar) || $daftar === []) {
            return null;
        }

        $daftar = array_values(array_unique(array_map('intval', $daftar)));
        sort($daftar);

        return $daftar;
    }

    /**
     * Dua daftar tingkat bentrok bila salah satunya "semua tingkat" (null)
     * atau keduanya beririsan.
     *
     * @param array<int,int>|null $a
     * @param array<int,int>|null $b
     */
    private function tingkatBentrok(?array $a, ?array $b): bool
    {
        if ($a === null || $b === null) {
            return true;
        }

        return array_intersect($a, $b) !== [];
    }

    /**
     * Implementasi per-semester hanya bentrok jika semesternya sama, atau salah
     * satunya berlaku untuk seluruh tahun ajaran (NULL).
     */
    private function semesterBentrok(?int $a, ?int $b): bool
    {
        if ($a === null || $b === null) {
            return true;
        }

        return $a === $b;
    }

    /**
     * Tingkat wajib (jika dibatasi) yang belum punya baris struktur.
     *
     * @param array<int,int>|null $wajib
     * @param array<int,int>      $ada
     * @return array<int,int>
     */
    private function tingkatBelumTerisi(?array $wajib, array $ada): array
    {
        if ($wajib === null) {
            return [];
        }

        return array_values(array_diff($wajib, $ada));
    }
}
