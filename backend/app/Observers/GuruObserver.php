<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\Guru;

class GuruObserver
{
    public function created(Guru $guru): void
    {
        $this->log('create', $guru, "Guru {$guru->nama_lengkap} (NUPTK: {$guru->nuptk}) ditambahkan.");
    }

    public function updated(Guru $guru): void
    {
        $changed = $this->buildDiff($guru);
        $this->log('update', $guru, "Guru {$guru->nama_lengkap} diperbarui. {$changed}");
    }

    public function deleted(Guru $guru): void
    {
        $this->log('delete', $guru, "Guru {$guru->nama_lengkap} (NUPTK: {$guru->nuptk}) dihapus.");
    }

    public function restored(Guru $guru): void
    {
        $this->log('restore', $guru, "Guru {$guru->nama_lengkap} dipulihkan.");
    }

    // ──────────────────────────────────────────────────────────

    private function log(string $action, Guru $guru, string $keterangan): void
    {
        ActivityLog::create([
            'school_id' => $guru->school_id,
            'user_id' => auth()->id(),
            'action' => $action,
            'module' => 'guru',
            'subject_id' => $guru->id,
            'keterangan' => $keterangan,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * Buat ringkasan field yang berubah (skip audit fields & timestamps).
     */
    private function buildDiff(Guru $guru): string
    {
        $skip = ['updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'created_at', 'created_by'];

        $dirty = collect($guru->getDirty())
            ->except($skip)
            ->keys()
            ->implode(', ');

        return $dirty ? "Field berubah: {$dirty}." : '';
    }
}