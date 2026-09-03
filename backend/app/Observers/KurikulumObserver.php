<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\Kurikulum;

class KurikulumObserver
{
    public function created(Kurikulum $kurikulum): void
    {
        $this->log('create', $kurikulum, "Kurikulum \"{$kurikulum->nama}\" ({$kurikulum->kode}) ditambahkan.");
    }

    public function updated(Kurikulum $kurikulum): void
    {
        $changed = $this->buildDiff($kurikulum);
        $this->log('update', $kurikulum, "Kurikulum \"{$kurikulum->nama}\" diperbarui. {$changed}");
    }

    public function deleted(Kurikulum $kurikulum): void
    {
        $this->log('delete', $kurikulum, "Kurikulum \"{$kurikulum->nama}\" ({$kurikulum->kode}) dihapus.");
    }

    public function restored(Kurikulum $kurikulum): void
    {
        $this->log('restore', $kurikulum, "Kurikulum \"{$kurikulum->nama}\" dipulihkan.");
    }

    // ──────────────────────────────────────────────────────────────────────────

    private function log(string $action, Kurikulum $kurikulum, string $keterangan): void
    {
        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => $action,
            'module' => 'kurikulum',
            'subject_id' => $kurikulum->id,
            'keterangan' => $keterangan,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    private function buildDiff(Kurikulum $kurikulum): string
    {
        $skip = ['updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'created_at', 'created_by'];

        $dirty = collect($kurikulum->getDirty())
            ->except($skip)
            ->keys()
            ->implode(', ');

        return $dirty ? "Field berubah: {$dirty}." : '';
    }
}