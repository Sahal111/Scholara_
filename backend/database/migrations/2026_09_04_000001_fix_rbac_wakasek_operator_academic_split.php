<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Fix RBAC: Pisahkan tanggung jawab kebijakan akademik (wakasek)
 * dari administrasi teknis (operator).
 *
 * ═══════════════════════════════════════════════════════════════
 * LATAR BELAKANG
 * ═══════════════════════════════════════════════════════════════
 * Sebelumnya, `operator => $all` membuat operator mendapat SEMUA
 * permission termasuk kebijakan kurikulum — padahal di sekolah nyata:
 *
 *   Wakasek Kurikulum = penanggung jawab KEBIJAKAN akademik
 *     (kurikulum, tahun ajaran, semester, program, mapel, jadwal)
 *   Operator / TU     = pelaksana ADMINISTRASI & input data teknis
 *     (data guru, data siswa, import/export, sinkronisasi)
 *
 * Referensi: Permendiknas, tugas pokok Waka Kurikulum di sekolah nyata.
 *
 * ═══════════════════════════════════════════════════════════════
 * PERUBAHAN
 * ═══════════════════════════════════════════════════════════════
 *
 * 1. WAKASEK — tambahkan permission yang hilang:
 *    + master_data.tahun_ajaran.manage  (bug: sudah punya .view tapi tidak .manage)
 *    + akademik.nilai.view_all          (wakasek perlu pantau nilai semua kelas)
 *    + akademik.rapor.manage            (wakasek yang finalisasi/lock rapor)
 *
 * 2. OPERATOR — cabut permission KEBIJAKAN akademik, sisakan VIEW saja:
 *    - master_data.kelas.manage         → tetap VIEW
 *    - master_data.mapel.manage         → tetap VIEW
 *    - master_data.tahun_ajaran.manage  → tetap VIEW
 *    - master_data.program.manage       → tetap VIEW
 *    - master_data.kurikulum.manage     → tetap VIEW
 *    - akademik.jadwal.manage           → tetap VIEW (jadwal bisa dilihat, tidak diubah)
 *    - akademik.kalender.manage         → dihapus dari operator
 *
 *    Operator TETAP punya: create/update/delete guru & siswa, import/export,
 *    semua administrasi, pengaturan RBAC (agar bisa buat role custom).
 *
 * 3. Permission BARU yang ditambahkan ke sistem:
 *    + akademik.nilai.view_all   → Lihat nilai semua siswa/kelas
 *    + akademik.rapor.manage     → Finalisasi & kelola rapor
 *    + akademik.jadwal.view      → Lihat jadwal (read-only, untuk operator & guru)
 *
 * ═══════════════════════════════════════════════════════════════
 * IDEMPOTENT — aman dijalankan berulang kali.
 * ═══════════════════════════════════════════════════════════════
 */
return new class extends Migration {

    public function up(): void
    {
        $schoolIds = DB::table('schools')->whereNull('deleted_at')->pluck('id');

        foreach ($schoolIds as $schoolId) {
            // ── 1. Buat permission baru (idempotent) ──────────────────────
            $jadwalViewId = $this->firstOrCreatePermission(
                $schoolId,
                'akademik.jadwal.view',
                'Lihat Jadwal Pelajaran',
                'akademik'
            );
            $nilaiViewAllId = $this->firstOrCreatePermission(
                $schoolId,
                'akademik.nilai.view_all',
                'Lihat Nilai Semua Kelas',
                'akademik'
            );
            $raporManageId = $this->firstOrCreatePermission(
                $schoolId,
                'akademik.rapor.manage',
                'Kelola & Finalisasi Rapor',
                'akademik'
            );

            // ── 2. WAKASEK: tambah permission yang hilang ─────────────────
            $tahunAjaranManageId = DB::table('permissions')
                ->where('school_id', $schoolId)
                ->where('slug', 'master_data.tahun_ajaran.manage')
                ->value('id');

            if ($tahunAjaranManageId) {
                $this->assignToRole($schoolId, 'wakasek', [$tahunAjaranManageId]);
            }

            $this->assignToRole($schoolId, 'wakasek', [
                $nilaiViewAllId,
                $raporManageId,
            ]);

            // Wakasek juga dapat jadwal.view (redundant tapi eksplisit)
            $this->assignToRole($schoolId, 'wakasek', [$jadwalViewId]);

            // ── 3. OPERATOR: cabut manage kebijakan akademik ──────────────
            $slugsToRevokeFromOperator = [
                'master_data.kelas.manage',
                'master_data.mapel.manage',
                'master_data.tahun_ajaran.manage',
                'master_data.program.manage',
                'master_data.kurikulum.manage',
                'akademik.jadwal.manage',
                'akademik.kalender.manage',
            ];

            $this->revokeFromRole($schoolId, 'operator', $slugsToRevokeFromOperator);

            // Operator dapat jadwal.view (bisa lihat, tidak bisa ubah)
            $this->assignToRole($schoolId, 'operator', [$jadwalViewId]);

            // ── 4. KEPSEK: tambah nilai.view_all & rapor.manage (oversight) ──
            $this->assignToRole($schoolId, 'kepsek', [
                $nilaiViewAllId,
                $jadwalViewId,
            ]);

            // ── 5. GURU & WALI_KELAS: dapat jadwal.view ───────────────────
            $this->assignToRole($schoolId, 'guru', [$jadwalViewId]);
            $this->assignToRole($schoolId, 'wali_kelas', [
                $jadwalViewId,
                $nilaiViewAllId, // wali kelas perlu lihat nilai kelasnya
            ]);
        }
    }

    public function down(): void
    {
        // ── Rollback: kembalikan manage permissions ke operator ───────────
        $schoolIds = DB::table('schools')->whereNull('deleted_at')->pluck('id');

        $slugsToRestoreForOperator = [
            'master_data.kelas.manage',
            'master_data.mapel.manage',
            'master_data.tahun_ajaran.manage',
            'master_data.program.manage',
            'master_data.kurikulum.manage',
            'akademik.jadwal.manage',
            'akademik.kalender.manage',
        ];

        foreach ($schoolIds as $schoolId) {
            $permIds = DB::table('permissions')
                ->where('school_id', $schoolId)
                ->whereIn('slug', $slugsToRestoreForOperator)
                ->pluck('id');

            $operatorId = DB::table('roles')
                ->where('school_id', $schoolId)
                ->where('slug', 'operator')
                ->value('id');

            if ($operatorId) {
                foreach ($permIds as $permId) {
                    DB::table('role_permissions')->insertOrIgnore([
                        'role_id' => $operatorId,
                        'permission_id' => $permId,
                        'school_id' => $schoolId,
                    ]);
                }
            }

            // Hapus permission baru yang ditambahkan migration ini
            $newPermIds = DB::table('permissions')
                ->where('school_id', $schoolId)
                ->whereIn('slug', [
                    'akademik.jadwal.view',
                    'akademik.nilai.view_all',
                    'akademik.rapor.manage',
                ])
                ->pluck('id');

            DB::table('role_permissions')
                ->whereIn('permission_id', $newPermIds)
                ->delete();

            DB::table('permissions')
                ->whereIn('id', $newPermIds)
                ->delete();
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function firstOrCreatePermission(
        int $schoolId,
        string $slug,
        string $nama,
        string $modul
    ): int {
        $existing = DB::table('permissions')
            ->where('school_id', $schoolId)
            ->where('slug', $slug)
            ->value('id');

        if ($existing) {
            return $existing;
        }

        return DB::table('permissions')->insertGetId([
            'school_id' => $schoolId,
            'slug' => $slug,
            'nama' => $nama,
            'modul' => $modul,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function assignToRole(int $schoolId, string $roleSlug, array $permissionIds): void
    {
        $roleId = DB::table('roles')
            ->where('school_id', $schoolId)
            ->where('slug', $roleSlug)
            ->value('id');

        if (!$roleId) {
            return;
        }

        foreach ($permissionIds as $permId) {
            DB::table('role_permissions')->insertOrIgnore([
                'role_id' => $roleId,
                'permission_id' => $permId,
                'school_id' => $schoolId,
            ]);
        }
    }

    private function revokeFromRole(int $schoolId, string $roleSlug, array $slugs): void
    {
        $roleId = DB::table('roles')
            ->where('school_id', $schoolId)
            ->where('slug', $roleSlug)
            ->value('id');

        if (!$roleId) {
            return;
        }

        $permIds = DB::table('permissions')
            ->where('school_id', $schoolId)
            ->whereIn('slug', $slugs)
            ->pluck('id');

        DB::table('role_permissions')
            ->where('role_id', $roleId)
            ->where('school_id', $schoolId)
            ->whereIn('permission_id', $permIds)
            ->delete();
    }
};