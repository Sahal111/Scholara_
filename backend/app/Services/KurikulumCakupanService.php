<?php

namespace App\Services;

use App\Enums\StatusSemester;
use Illuminate\Support\Facades\DB;

/**
 * Laporan CAKUPAN: struktur kurikulum vs penugasan guru (plot_guru_mapels).
 *
 * Menjawab pertanyaan Wakasek:
 *   - Mapel apa di kelas mana yang BELUM punya guru?
 *   - Apakah beban jam guru sesuai alokasi JP di struktur?
 *   - Adakah guru yang ditugaskan pada mapel yang TIDAK ada di struktur?
 *
 * READ-ONLY. Tidak mengubah plot, jadwal, kelas, maupun mapel. Hubungan struktur
 * ↔ plot DITURUNKAN, bukan disimpan:
 *
 *   kelas (tingkat, program, kurikulum, tahun ajaran)
 *     → baris struktur berlaku bila tingkat sama dan (program NULL atau sama)
 *     → plot yang cocok = plot di kelas itu dengan mapel yang sama
 *
 * Jadi tidak ada kolom baru di plot_guru_mapels dan tidak ada tautan basi.
 *
 * Satu laporan = satu semester (plot bersifat per semester; menjumlahkan dua
 * semester akan menggandakan beban).
 */
class KurikulumCakupanService
{
    public const STATUS_SESUAI = 'sesuai';
    public const STATUS_BELUM_ADA_GURU = 'belum_ada_guru';
    public const STATUS_BEBAN_BELUM_DIISI = 'beban_belum_diisi';
    public const STATUS_BEBAN_KURANG = 'beban_kurang';
    public const STATUS_BEBAN_LEBIH = 'beban_lebih';

    // ── Akses data ───────────────────────────────────────────────────────────

    public function cariImplementasi(int $schoolId, string $ulid): ?object
    {
        return DB::table('kurikulum_tahun_ajarans')
            ->where('school_id', $schoolId)
            ->where('ulid', $ulid)
            ->first();
    }

    public function idSemesterDariUlid(int $schoolId, string $ulid): ?int
    {
        $id = DB::table('semesters')
            ->where('school_id', $schoolId)
            ->where('ulid', $ulid)
            ->whereNull('deleted_at')
            ->value('id');

        return $id !== null ? (int) $id : null;
    }

    /**
     * @throws \DomainException
     */
    public function laporan(
        int $schoolId,
        object $implementasi,
        ?int $semesterId = null,
        ?int $tingkat = null,
        ?int $kelasId = null
    ): array {
        $semester = $this->tentukanSemester($schoolId, $implementasi, $semesterId);
        $diizinkan = $this->tingkatDiizinkan($implementasi);

        // Kelas yang memakai implementasi ini: kurikulum & tahun ajaran sama
        $kelas = DB::table('kelas')
            ->where('school_id', $schoolId)
            ->where('tahun_ajaran_id', $implementasi->tahun_ajaran_id)
            ->where('kurikulum_id', $implementasi->kurikulum_id)
            ->where('is_active', true)
            ->whereNull('deleted_at')
            ->when($diizinkan !== null, fn ($q) => $q->whereIn('tingkat', $diizinkan))
            ->when($tingkat !== null, fn ($q) => $q->where('tingkat', $tingkat))
            ->when($kelasId !== null, fn ($q) => $q->where('id', $kelasId))
            ->orderBy('tingkat')
            ->orderBy('nama_kelas')
            ->get(['id', 'nama_kelas', 'tingkat', 'program_pendidikan_id'])
            ->map(fn ($k) => [
                'id' => (int) $k->id,
                'nama_kelas' => (string) $k->nama_kelas,
                'tingkat' => (int) $k->tingkat,
                'program_pendidikan_id' => $k->program_pendidikan_id !== null ? (int) $k->program_pendidikan_id : null,
            ])
            ->all();

        $struktur = DB::table('kurikulum_strukturs as s')
            ->join('mapels as m', 'm.id', '=', 's.mapel_id')
            ->where('s.school_id', $schoolId)
            ->where('s.kurikulum_tahun_ajaran_id', $implementasi->id)
            ->get([
                's.tingkat',
                's.program_pendidikan_id',
                's.mapel_id',
                's.kelompok',
                's.alokasi_jp_minggu',
                's.jenis_komponen',
                's.is_wajib',
                's.urutan_rapor',
                'm.ulid as mapel_ulid',
                'm.kode as mapel_kode',
                'm.nama_mapel as mapel_nama',
            ])
            ->map(fn ($s) => [
                'tingkat' => (int) $s->tingkat,
                'program_pendidikan_id' => $s->program_pendidikan_id !== null ? (int) $s->program_pendidikan_id : null,
                'mapel_id' => (int) $s->mapel_id,
                'mapel_ulid' => $s->mapel_ulid,
                'mapel_kode' => $s->mapel_kode,
                'mapel_nama' => (string) $s->mapel_nama,
                'kelompok' => $s->kelompok,
                'alokasi_jp_minggu' => (int) $s->alokasi_jp_minggu,
                'jenis_komponen' => (string) $s->jenis_komponen,
                'is_wajib' => (bool) $s->is_wajib,
                'urutan_rapor' => $s->urutan_rapor !== null ? (int) $s->urutan_rapor : null,
            ])
            ->all();

        $plot = [];
        if ($kelas !== []) {
            $plot = DB::table('plot_guru_mapels as p')
                ->join('gurus as g', 'g.id', '=', 'p.guru_id')
                ->join('mapels as m', 'm.id', '=', 'p.mapel_id')
                ->where('p.school_id', $schoolId)
                ->where('p.tahun_ajaran_id', $implementasi->tahun_ajaran_id)
                ->where('p.semester_id', $semester->id)
                ->whereIn('p.kelas_id', array_column($kelas, 'id'))
                ->where('p.is_active', true)
                ->whereNull('p.deleted_at')
                ->whereNull('g.deleted_at')
                ->get([
                    'p.kelas_id',
                    'p.mapel_id',
                    'p.beban_jam',
                    'g.ulid as guru_ulid',
                    'g.nama as guru_nama',
                    'g.gelar_depan',
                    'g.gelar_belakang',
                    'm.ulid as mapel_ulid',
                    'm.kode as mapel_kode',
                    'm.nama_mapel as mapel_nama',
                ])
                ->map(fn ($p) => [
                    'kelas_id' => (int) $p->kelas_id,
                    'mapel_id' => (int) $p->mapel_id,
                    'mapel_ulid' => $p->mapel_ulid,
                    'mapel_kode' => $p->mapel_kode,
                    'mapel_nama' => (string) $p->mapel_nama,
                    'guru_ulid' => $p->guru_ulid,
                    'guru_nama' => $this->namaLengkap($p->gelar_depan, $p->guru_nama, $p->gelar_belakang),
                    'beban_jam' => (int) $p->beban_jam,
                ])
                ->all();
        }

        return [
            'implementasi' => [
                'ulid' => $implementasi->ulid,
                'status' => $implementasi->status ?? 'draft',
            ],
            'semester' => [
                'ulid' => $semester->ulid,
                'nama' => $semester->nama,
            ],
        ] + self::susunCakupan($kelas, $struktur, $plot);
    }

    // ── Aturan murni (tanpa DB — diuji unit) ─────────────────────────────────

    /**
     * @param array<int, array{id:int, nama_kelas:string, tingkat:int, program_pendidikan_id:?int}> $kelas
     * @param array<int, array{tingkat:int, program_pendidikan_id:?int, mapel_id:int, mapel_ulid:?string,
     *   mapel_kode:?string, mapel_nama:string, kelompok:?string, alokasi_jp_minggu:int,
     *   jenis_komponen:string, is_wajib:bool, urutan_rapor:?int}> $struktur
     * @param array<int, array{kelas_id:int, mapel_id:int, mapel_ulid:?string, mapel_kode:?string,
     *   mapel_nama:string, guru_ulid:?string, guru_nama:string, beban_jam:int}> $plot
     */
    public static function susunCakupan(array $kelas, array $struktur, array $plot): array
    {
        $plotPerKelas = [];
        foreach ($plot as $p) {
            $plotPerKelas[$p['kelas_id']][$p['mapel_id']][] = $p;
        }

        $total = self::ringkasanKosong();
        $hasilKelas = [];

        foreach ($kelas as $k) {
            $efektif = self::strukturEfektif($k, $struktur);
            $plotKelas = $plotPerKelas[$k['id']] ?? [];
            $ringkasan = self::ringkasanKosong();
            $baris = [];

            foreach ($efektif as $mapelId => $s) {
                $guru = self::daftarGuru($plotKelas[$mapelId] ?? []);
                $beban = array_sum(array_column($guru, 'beban_jam'));
                $status = self::tentukanStatus(count($guru), $beban, $s['alokasi_jp_minggu']);

                $baris[] = [
                    'mapel' => [
                        'ulid' => $s['mapel_ulid'],
                        'kode' => $s['mapel_kode'],
                        'nama' => $s['mapel_nama'],
                    ],
                    'kelompok' => $s['kelompok'],
                    'jenis_komponen' => $s['jenis_komponen'],
                    'is_wajib' => $s['is_wajib'],
                    'urutan_rapor' => $s['urutan_rapor'],
                    'alokasi_jp_minggu' => $s['alokasi_jp_minggu'],
                    'total_beban_jam' => $beban,
                    'status' => $status,
                    'guru' => $guru,
                ];

                $ringkasan['total']++;
                $ringkasan[$status]++;
                if ($status === self::STATUS_BELUM_ADA_GURU && $s['is_wajib']) {
                    $ringkasan['wajib_belum_ada_guru']++;
                }
            }

            usort($baris, function (array $a, array $b) {
                return [$a['urutan_rapor'] ?? PHP_INT_MAX, strtolower($a['mapel']['nama'])]
                    <=> [$b['urutan_rapor'] ?? PHP_INT_MAX, strtolower($b['mapel']['nama'])];
            });

            // Guru yang ditugaskan pada mapel yang tidak ada di struktur kelas ini
            $luar = [];
            foreach ($plotKelas as $mapelId => $plots) {
                if (isset($efektif[$mapelId])) {
                    continue;
                }

                $luar[] = [
                    'mapel' => [
                        'ulid' => $plots[0]['mapel_ulid'],
                        'kode' => $plots[0]['mapel_kode'],
                        'nama' => $plots[0]['mapel_nama'],
                    ],
                    'guru' => self::daftarGuru($plots),
                ];
            }
            usort($luar, fn (array $a, array $b) => strcasecmp($a['mapel']['nama'], $b['mapel']['nama']));
            $ringkasan['di_luar_struktur'] = count($luar);

            foreach ($ringkasan as $kunci => $nilai) {
                $total[$kunci] += $nilai;
            }

            $hasilKelas[] = [
                'id' => $k['id'],
                'nama_kelas' => $k['nama_kelas'],
                'tingkat' => $k['tingkat'],
                'ringkasan' => $ringkasan,
                'mapel' => $baris,
                'di_luar_struktur' => $luar,
            ];
        }

        return [
            'ringkasan' => ['jumlah_kelas' => count($kelas)] + $total,
            'kelas' => $hasilKelas,
        ];
    }

    /**
     * Baris struktur yang berlaku untuk sebuah kelas, dikunci per mapel.
     * Tingkat harus sama; baris ber-program hanya untuk kelas dengan program itu;
     * baris umum (program NULL) berlaku untuk semua. Jika sebuah mapel punya baris
     * umum DAN baris khusus program, baris khusus program yang dipakai.
     *
     * @return array<int, array>
     */
    public static function strukturEfektif(array $kelas, array $struktur): array
    {
        $hasil = [];

        foreach ($struktur as $s) {
            if ((int) $s['tingkat'] !== (int) $kelas['tingkat']) {
                continue;
            }

            $programBaris = $s['program_pendidikan_id'];

            if ($programBaris !== null && (int) $programBaris !== (int) ($kelas['program_pendidikan_id'] ?? 0)) {
                continue;
            }

            $mapelId = (int) $s['mapel_id'];

            if (!isset($hasil[$mapelId]) || ($hasil[$mapelId]['program_pendidikan_id'] === null && $programBaris !== null)) {
                $hasil[$mapelId] = $s;
            }
        }

        return $hasil;
    }

    public static function tentukanStatus(int $jumlahGuru, int $totalBeban, int $alokasi): string
    {
        if ($jumlahGuru === 0) {
            return self::STATUS_BELUM_ADA_GURU;
        }

        if ($totalBeban === 0) {
            return self::STATUS_BEBAN_BELUM_DIISI;
        }

        return match (true) {
            $totalBeban < $alokasi => self::STATUS_BEBAN_KURANG,
            $totalBeban > $alokasi => self::STATUS_BEBAN_LEBIH,
            default => self::STATUS_SESUAI,
        };
    }

    // ── Private ──────────────────────────────────────────────────────────────

    private static function ringkasanKosong(): array
    {
        return [
            'total' => 0,
            self::STATUS_SESUAI => 0,
            self::STATUS_BELUM_ADA_GURU => 0,
            self::STATUS_BEBAN_BELUM_DIISI => 0,
            self::STATUS_BEBAN_KURANG => 0,
            self::STATUS_BEBAN_LEBIH => 0,
            'wajib_belum_ada_guru' => 0,
            'di_luar_struktur' => 0,
        ];
    }

    /**
     * @return array<int, array{ulid:?string, nama:string, beban_jam:int}>
     */
    private static function daftarGuru(array $plots): array
    {
        $guru = array_map(fn (array $p) => [
            'ulid' => $p['guru_ulid'],
            'nama' => $p['guru_nama'],
            'beban_jam' => (int) $p['beban_jam'],
        ], $plots);

        usort($guru, fn (array $a, array $b) => strcasecmp($a['nama'], $b['nama']));

        return $guru;
    }

    private function namaLengkap(?string $depan, ?string $nama, ?string $belakang): string
    {
        $bagian = array_filter([trim((string) $depan), trim((string) $nama)], fn ($v) => $v !== '');
        $teks = implode(' ', $bagian);

        $belakang = trim((string) $belakang);

        return $belakang !== '' ? "{$teks}, {$belakang}" : $teks;
    }

    /**
     * @return array<int,int>|null  null = semua tingkat
     */
    private function tingkatDiizinkan(object $implementasi): ?array
    {
        if ($implementasi->tingkat_kelas === null) {
            return null;
        }

        $daftar = json_decode($implementasi->tingkat_kelas, true);

        if (!is_array($daftar) || $daftar === []) {
            return null;
        }

        $daftar = array_values(array_unique(array_map('intval', $daftar)));
        sort($daftar);

        return $daftar;
    }

    /**
     * Urutan: implementasi khusus semester → semester itu; selain itu semester
     * dari parameter; selain itu semester AKTIF pada tahun ajaran implementasi.
     *
     * @throws \DomainException
     */
    private function tentukanSemester(int $schoolId, object $implementasi, ?int $semesterId): object
    {
        if ($implementasi->semester_id !== null) {
            if ($semesterId !== null && $semesterId !== (int) $implementasi->semester_id) {
                throw new \DomainException(
                    'Implementasi kurikulum ini khusus satu semester; semester yang diminta berbeda.'
                );
            }

            $semesterId = (int) $implementasi->semester_id;
        }

        $dasar = DB::table('semesters')
            ->where('school_id', $schoolId)
            ->where('tahun_ajaran_id', $implementasi->tahun_ajaran_id)
            ->whereNull('deleted_at');

        $semester = $semesterId !== null
            ? $dasar->where('id', $semesterId)->first(['id', 'ulid', 'nama'])
            : $dasar->where('status', StatusSemester::ACTIVE->value)->orderBy('id')->first(['id', 'ulid', 'nama']);

        if (!$semester) {
            throw new \DomainException(
                $semesterId !== null
                    ? 'Semester tidak ditemukan pada tahun ajaran implementasi ini.'
                    : 'Tahun ajaran ini belum memiliki semester aktif. Pilih semester secara eksplisit (semester_ulid).'
            );
        }

        return $semester;
    }
}
