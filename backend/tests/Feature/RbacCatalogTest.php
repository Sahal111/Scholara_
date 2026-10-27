<?php

namespace Tests\Feature;

use Database\Seeders\Support\RbacCatalog;
use PHPUnit\Framework\TestCase;

/**
 * Penjaga konsistensi RBAC — tanpa database, jalan dalam hitungan milidetik.
 *
 * Mencegah terulangnya masalah "permission dipakai rute tapi tidak pernah
 * diberikan ke siapa pun" (mis. tombol workflow kurikulum tidak muncul karena
 * seeder tertinggal).
 */
class RbacCatalogTest extends TestCase
{
    /** @return string[] */
    private function definisi(): array
    {
        return array_column(RbacCatalog::permissionDefinitions(), 'slug');
    }

    /** @return string[] slug yang dipakai middleware `permission:` di folder routes/ */
    private function slugDipakaiRute(): array
    {
        $dir = dirname(__DIR__, 2) . '/routes';
        $slugs = [];

        $it = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir, \FilesystemIterator::SKIP_DOTS));
        foreach ($it as $file) {
            if ($file->getExtension() !== 'php') {
                continue;
            }
            preg_match_all('/permission:([A-Za-z0-9_.,]+)/', file_get_contents($file->getPathname()), $m);
            foreach ($m[1] as $daftar) {
                foreach (explode(',', $daftar) as $slug) {
                    $slugs[] = trim($slug);
                }
            }
        }

        return array_values(array_unique(array_filter($slugs)));
    }

    public function test_slug_permission_tidak_ada_yang_kembar(): void
    {
        $kembar = array_keys(array_filter(array_count_values($this->definisi()), fn ($n) => $n > 1));

        $this->assertSame([], $kembar, 'Slug kembar di RbacCatalog: ' . implode(', ', $kembar));
    }

    public function test_semua_slug_di_matriks_role_terdefinisi(): void
    {
        $terdefinisi = $this->definisi();

        foreach (RbacCatalog::rolePermissionMatrix() as $role => $slugs) {
            $takDikenal = array_values(array_diff($slugs, $terdefinisi));

            $this->assertSame(
                [],
                $takDikenal,
                "Role '{$role}' memakai permission yang tidak didefinisikan: " . implode(', ', $takDikenal)
            );
        }
    }

    public function test_setiap_permission_yang_dipakai_rute_terdefinisi_dan_diberikan_ke_minimal_satu_role(): void
    {
        $dipakai = $this->slugDipakaiRute();
        $this->assertNotEmpty($dipakai, 'Tidak ada permission ditemukan di routes/ (pola pencarian rusak?)');

        $tidakTerdefinisi = array_values(array_diff($dipakai, $this->definisi()));
        $this->assertSame(
            [],
            $tidakTerdefinisi,
            'Dipakai rute tapi tidak ada di RbacCatalog: ' . implode(', ', $tidakTerdefinisi)
        );

        $diberikan = array_unique(array_merge(...array_values(RbacCatalog::rolePermissionMatrix())));
        $tidakDiberikan = array_values(array_diff($dipakai, $diberikan));
        $this->assertSame(
            [],
            $tidakDiberikan,
            'Dipakai rute tapi tidak diberikan ke role mana pun (endpoint tak bisa diakses): ' . implode(', ', $tidakDiberikan)
        );
    }

    public function test_pembagian_peran_workflow_kurikulum(): void
    {
        $m = RbacCatalog::rolePermissionMatrix();
        $kur = fn (string ...$aksi) => array_map(fn ($a) => "master_data.kurikulum.{$a}", $aksi);

        // Wakasek memegang kebijakan: kelola, ajukan review, selesaikan
        $this->assertSame([], array_diff($kur('view', 'manage', 'review', 'complete'), $m['wakasek']));

        // Kepsek mengesahkan: lihat, setujui/tolak, aktifkan
        $this->assertSame([], array_diff($kur('view', 'approve', 'activate'), $m['kepsek']));

        // Operator hanya administrasi: tidak menyentuh kebijakan kurikulum
        $this->assertSame(
            [],
            array_intersect($kur('manage', 'review', 'approve', 'activate', 'complete'), $m['operator']),
            'Operator tidak boleh memegang permission kebijakan/workflow kurikulum.'
        );
    }

    public function test_operator_tidak_memegang_workflow_tahun_ajaran(): void
    {
        $m = RbacCatalog::rolePermissionMatrix();
        $tahunAjaran = array_map(
            fn ($a) => "master_data.tahun_ajaran.{$a}",
            ['review', 'approve', 'activate', 'complete']
        );

        $this->assertSame([], array_intersect($tahunAjaran, $m['operator']));
    }
}
