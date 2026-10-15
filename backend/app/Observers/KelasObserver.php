<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\Kelas;

class KelasObserver
{
    public function created(Kelas $kelas): void
    {
        $this->log('create', $kelas, "Kelas {$kelas->nama_kelas} (Tingkat {$kelas->tingkat}) dibuat.");
    }

    public function updated(Kelas $kelas): void
    {
        $changed = $this->buildDiff($kelas);
        $this->log('update', $kelas, "Kelas {$kelas->nama_kelas} diperbarui. {$changed}");
    }

    public function deleted(Kelas $kelas): void
    {
        $this->log('delete', $kelas, "Kelas {$kelas->nama_kelas} dihapus.");
    }

    public function restored(Kelas $kelas): void
    {
        $this->log('restore', $kelas, "Kelas {$kelas->nama_kelas} dipulihkan.");
    }

    // ──────────────────────────────────────────────────────────

    private function log(string $action, Kelas $kelas, string $keterangan): void
    {
        ActivityLog::create([
            'school_id' => $kelas->school_id,
            'user_id' => auth()->id(),
            'action' => $action,
            'module' => 'kelas',
            'subject_id' => $kelas->id,
            'keterangan' => $keterangan,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    private function buildDiff(Kelas $kelas): string
    {
        $skip = ['updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'created_at', 'created_by'];

        $dirty = collect($kelas->getDirty())
            ->except($skip)
            ->keys()
            ->implode(', ');

        return $dirty ? "Field berubah: {$dirty}." : '';
    }
}