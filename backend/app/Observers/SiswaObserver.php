<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\Siswa;

class SiswaObserver
{
    public function created(Siswa $siswa): void
    {
        $this->log('create', $siswa, "Siswa {$siswa->nama} (NISN: {$siswa->nisn}) ditambahkan.");
    }

    public function updated(Siswa $siswa): void
    {
        $changed = $this->buildDiff($siswa);
        $this->log('update', $siswa, "Siswa {$siswa->nama} diperbarui. {$changed}");
    }

    public function deleted(Siswa $siswa): void
    {
        $this->log('delete', $siswa, "Siswa {$siswa->nama} (NISN: {$siswa->nisn}) dihapus.");
    }

    public function restored(Siswa $siswa): void
    {
        $this->log('restore', $siswa, "Siswa {$siswa->nama} dipulihkan.");
    }

    // ──────────────────────────────────────────────────────────

    private function log(string $action, Siswa $siswa, string $keterangan): void
    {
        ActivityLog::create([
            'school_id' => $siswa->school_id,
            'user_id' => auth()->id(),
            'action' => $action,
            'module' => 'siswa',
            'subject_id' => $siswa->id,
            'keterangan' => $keterangan,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    private function buildDiff(Siswa $siswa): string
    {
        $skip = ['updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'created_at', 'created_by'];

        $dirty = collect($siswa->getDirty())
            ->except($skip)
            ->keys()
            ->implode(', ');

        return $dirty ? "Field berubah: {$dirty}." : '';
    }
}