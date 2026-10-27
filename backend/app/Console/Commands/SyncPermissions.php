<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Database\Seeders\Support\RbacCatalog;

/**
 * Sync permission definitions ke semua sekolah yang sudah ada di database.
 *
 * Berguna ketika ada permission baru yang ditambahkan ke SchoolSeeder
 * tapi sekolah sudah terdaftar sebelum permission baru itu ada.
 *
 * Jalankan: php artisan permissions:sync
 */
class SyncPermissions extends Command
{
    protected $signature = 'permissions:sync {--school= : Sync hanya untuk school_id tertentu}';
    protected $description = 'Sync permission definitions ke semua sekolah yang ada';


    public function handle(): int
    {
        $schoolId = $this->option('school');

        $schools = $schoolId
            ? DB::table('schools')->where('id', $schoolId)->get()
            : DB::table('schools')->whereNull('deleted_at')->get();

        if ($schools->isEmpty()) {
            $this->warn('Tidak ada sekolah ditemukan.');
            return 0;
        }

        foreach ($schools as $school) {
            $this->info("Syncing permissions untuk: {$school->nama} (ID: {$school->id})");
            $this->syncForSchool($school->id);
        }

        $this->info('✅ Sync selesai.');
        return 0;
    }

    /**
     * Permission yang TIDAK boleh di-auto-assign ke operator.
     * Ini domain Wakasek & Kepsek — bukan administrasi harian operator.
     */
    private function syncForSchool(int $schoolId): void
    {
        $existing = DB::table('permissions')
            ->where('school_id', $schoolId)
            ->pluck('slug')
            ->toArray();

        $toInsert = [];
        foreach (RbacCatalog::permissionDefinitions() as $def) {
            if (!in_array($def['slug'], $existing)) {
                $toInsert[] = array_merge($def, [
                    'school_id' => $schoolId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        if (empty($toInsert)) {
            $this->line("   ✓ Semua permission sudah ada.");
            return;
        }

        DB::table('permissions')->insert($toInsert);
        $this->line("   + Ditambahkan " . count($toInsert) . " permission baru.");

        // Auto-assign ke operator — KECUALI yang masuk blacklist domain Wakasek/Kepsek
        $superOpRole = DB::table('roles')
            ->where('school_id', $schoolId)
            ->where('slug', 'operator')
            ->first();

        if ($superOpRole) {
            $allowedSlugs = array_intersect(
                array_column($toInsert, 'slug'),
                RbacCatalog::rolePermissionMatrix()['operator'] ?? []
            );

            if (!empty($allowedSlugs)) {
                $newPermIds = DB::table('permissions')
                    ->where('school_id', $schoolId)
                    ->whereIn('slug', $allowedSlugs)
                    ->pluck('id');

                $pivotData = $newPermIds->map(fn($permId) => [
                    'role_id' => $superOpRole->id,
                    'permission_id' => $permId,
                ])->toArray();

                DB::table('role_permissions')->insertOrIgnore($pivotData);
                $this->line('   + Ditambahkan ke role operator (' . count($allowedSlugs) . ' permission).');
            }

            // Cabut ulang blacklist dari operator — jaga-jaga kalau sebelumnya
            // sudah terlanjur ter-assign (misal dari run SyncPermissions lama)
            $blacklistPermIds = DB::table('permissions')
                ->where('school_id', $schoolId)
                ->whereIn('slug', $this->operatorBlacklist)
                ->pluck('id');

            if ($blacklistPermIds->isNotEmpty()) {
                $deleted = DB::table('role_permissions')
                    ->where('role_id', $superOpRole->id)
                    ->whereIn('permission_id', $blacklistPermIds)
                    ->delete();

                if ($deleted > 0) {
                    $this->line("   - Dicabut {$deleted} permission dari operator (domain Wakasek/Kepsek).");
                }
            }
        }
    }
}