<?php

namespace Tests\Feature;

use App\Services\KurikulumCakupanService as S;
use PHPUnit\Framework\TestCase;

/**
 * Logika murni laporan cakupan (tanpa database / tanpa boot Laravel).
 * Jalankan: php artisan test --filter=KurikulumCakupanTest
 */
class KurikulumCakupanTest extends TestCase
{
    private function struktur(int $tingkat, int $mapelId, int $jp, ?int $program = null, array $extra = []): array
    {
        return $extra + [
            'tingkat' => $tingkat,
            'program_pendidikan_id' => $program,
            'mapel_id' => $mapelId,
            'mapel_ulid' => "M{$mapelId}",
            'mapel_kode' => "KD{$mapelId}",
            'mapel_nama' => "Mapel {$mapelId}",
            'kelompok' => null,
            'alokasi_jp_minggu' => $jp,
            'jenis_komponen' => 'intrakurikuler',
            'is_wajib' => true,
            'urutan_rapor' => null,
        ];
    }

    private function plot(int $kelasId, int $mapelId, string $guru, int $beban): array
    {
        return [
            'kelas_id' => $kelasId,
            'mapel_id' => $mapelId,
            'mapel_ulid' => "M{$mapelId}",
            'mapel_kode' => "KD{$mapelId}",
            'mapel_nama' => "Mapel {$mapelId}",
            'guru_ulid' => "G-{$guru}",
            'guru_nama' => $guru,
            'beban_jam' => $beban,
        ];
    }

    private function kelas(int $id, int $tingkat, ?int $program = null): array
    {
        return ['id' => $id, 'nama_kelas' => "K{$id}", 'tingkat' => $tingkat, 'program_pendidikan_id' => $program];
    }

    public function test_status_per_kondisi_beban(): void
    {
        $this->assertSame(S::STATUS_BELUM_ADA_GURU, S::tentukanStatus(0, 0, 4));
        $this->assertSame(S::STATUS_BEBAN_BELUM_DIISI, S::tentukanStatus(1, 0, 4));
        $this->assertSame(S::STATUS_BEBAN_KURANG, S::tentukanStatus(1, 2, 4));
        $this->assertSame(S::STATUS_SESUAI, S::tentukanStatus(1, 4, 4));
        $this->assertSame(S::STATUS_BEBAN_LEBIH, S::tentukanStatus(2, 6, 4));
    }

    public function test_struktur_efektif_menyaring_tingkat_dan_program(): void
    {
        $struktur = [
            $this->struktur(7, 1, 4),            // umum tingkat 7
            $this->struktur(8, 2, 4),            // tingkat lain
            $this->struktur(7, 3, 2, 10),        // khusus program 10
            $this->struktur(7, 4, 2, 20),        // khusus program 20
        ];

        $tanpaProgram = S::strukturEfektif($this->kelas(1, 7), $struktur);
        $this->assertSame([1], array_keys($tanpaProgram));

        $program10 = S::strukturEfektif($this->kelas(2, 7, 10), $struktur);
        $this->assertSame([1, 3], array_keys($program10));
    }

    public function test_baris_khusus_program_mengalahkan_baris_umum_untuk_mapel_sama(): void
    {
        $struktur = [
            $this->struktur(10, 5, 2),         // umum: 2 JP
            $this->struktur(10, 5, 4, 10),     // khusus program 10: 4 JP
        ];

        $efektif = S::strukturEfektif($this->kelas(1, 10, 10), $struktur);

        $this->assertSame(4, $efektif[5]['alokasi_jp_minggu']);

        // urutan data terbalik tidak boleh mengubah hasil
        $efektif2 = S::strukturEfektif($this->kelas(1, 10, 10), array_reverse($struktur));
        $this->assertSame(4, $efektif2[5]['alokasi_jp_minggu']);

        // kelas tanpa program tetap memakai baris umum
        $umum = S::strukturEfektif($this->kelas(2, 10), $struktur);
        $this->assertSame(2, $umum[5]['alokasi_jp_minggu']);
    }

    public function test_laporan_menandai_belum_ada_guru_dan_beban(): void
    {
        $kelas = [$this->kelas(1, 7)];
        $struktur = [
            $this->struktur(7, 1, 4),   // sesuai
            $this->struktur(7, 2, 4),   // belum ada guru
            $this->struktur(7, 3, 4),   // beban kurang
            $this->struktur(7, 4, 4),   // beban lebih
            $this->struktur(7, 5, 4),   // beban belum diisi
        ];
        $plot = [
            $this->plot(1, 1, 'Budi', 4),
            $this->plot(1, 3, 'Citra', 2),
            $this->plot(1, 4, 'Dedi', 6),
            $this->plot(1, 5, 'Eka', 0),
        ];

        $hasil = S::susunCakupan($kelas, $struktur, $plot);
        $status = [];
        foreach ($hasil['kelas'][0]['mapel'] as $m) {
            $status[$m['mapel']['ulid']] = $m['status'];
        }

        $this->assertSame([
            'M1' => 'sesuai',
            'M2' => 'belum_ada_guru',
            'M3' => 'beban_kurang',
            'M4' => 'beban_lebih',
            'M5' => 'beban_belum_diisi',
        ], $status);

        $r = $hasil['ringkasan'];
        $this->assertSame(1, $r['jumlah_kelas']);
        $this->assertSame(5, $r['total']);
        $this->assertSame(1, $r['sesuai']);
        $this->assertSame(1, $r['belum_ada_guru']);
        $this->assertSame(1, $r['beban_kurang']);
        $this->assertSame(1, $r['beban_lebih']);
        $this->assertSame(1, $r['beban_belum_diisi']);
        $this->assertSame(1, $r['wajib_belum_ada_guru']);
    }

    public function test_dua_guru_pada_satu_mapel_dijumlahkan(): void
    {
        $hasil = S::susunCakupan(
            [$this->kelas(1, 7)],
            [$this->struktur(7, 1, 4)],
            [$this->plot(1, 1, 'Budi', 2), $this->plot(1, 1, 'Ani', 2)]
        );

        $baris = $hasil['kelas'][0]['mapel'][0];

        $this->assertSame(4, $baris['total_beban_jam']);
        $this->assertSame('sesuai', $baris['status']);
        $this->assertSame(['Ani', 'Budi'], array_column($baris['guru'], 'nama')); // urut abjad
    }

    public function test_mapel_non_wajib_tanpa_guru_tidak_dihitung_sebagai_wajib(): void
    {
        $hasil = S::susunCakupan(
            [$this->kelas(1, 7)],
            [$this->struktur(7, 1, 2, null, ['is_wajib' => false, 'jenis_komponen' => 'ekstrakurikuler'])],
            []
        );

        $this->assertSame(1, $hasil['ringkasan']['belum_ada_guru']);
        $this->assertSame(0, $hasil['ringkasan']['wajib_belum_ada_guru']);
    }

    public function test_guru_pada_mapel_di_luar_struktur_dilaporkan(): void
    {
        $hasil = S::susunCakupan(
            [$this->kelas(1, 7)],
            [$this->struktur(7, 1, 4)],
            [$this->plot(1, 1, 'Budi', 4), $this->plot(1, 9, 'Zaki', 3)]
        );

        $luar = $hasil['kelas'][0]['di_luar_struktur'];

        $this->assertCount(1, $luar);
        $this->assertSame('M9', $luar[0]['mapel']['ulid']);
        $this->assertSame('Zaki', $luar[0]['guru'][0]['nama']);
        $this->assertSame(1, $hasil['ringkasan']['di_luar_struktur']);
        $this->assertSame(1, $hasil['ringkasan']['total']); // mapel di luar struktur bukan bagian "total"
    }

    public function test_plot_kelas_lain_tidak_tercampur(): void
    {
        $hasil = S::susunCakupan(
            [$this->kelas(1, 7), $this->kelas(2, 7)],
            [$this->struktur(7, 1, 4)],
            [$this->plot(1, 1, 'Budi', 4)]   // hanya kelas 1 yang punya guru
        );

        $this->assertSame('sesuai', $hasil['kelas'][0]['mapel'][0]['status']);
        $this->assertSame('belum_ada_guru', $hasil['kelas'][1]['mapel'][0]['status']);
        $this->assertSame(2, $hasil['ringkasan']['total']);
        $this->assertSame(1, $hasil['ringkasan']['belum_ada_guru']);
    }

    public function test_urutan_mapel_mengikuti_urutan_rapor_lalu_nama(): void
    {
        $struktur = [
            $this->struktur(7, 1, 2, null, ['urutan_rapor' => null, 'mapel_nama' => 'Zoologi']),
            $this->struktur(7, 2, 2, null, ['urutan_rapor' => 2, 'mapel_nama' => 'Matematika']),
            $this->struktur(7, 3, 2, null, ['urutan_rapor' => 1, 'mapel_nama' => 'Agama']),
            $this->struktur(7, 4, 2, null, ['urutan_rapor' => null, 'mapel_nama' => 'Aljabar']),
        ];

        $hasil = S::susunCakupan([$this->kelas(1, 7)], $struktur, []);

        $this->assertSame(
            ['Agama', 'Matematika', 'Aljabar', 'Zoologi'],
            array_map(fn ($m) => $m['mapel']['nama'], $hasil['kelas'][0]['mapel'])
        );
    }

    public function test_tanpa_kelas_menghasilkan_laporan_kosong(): void
    {
        $hasil = S::susunCakupan([], [$this->struktur(7, 1, 4)], []);

        $this->assertSame(0, $hasil['ringkasan']['jumlah_kelas']);
        $this->assertSame(0, $hasil['ringkasan']['total']);
        $this->assertSame([], $hasil['kelas']);
    }
}
