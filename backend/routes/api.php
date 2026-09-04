<?php

/**
 * API Routes — Entry Point
 *
 * File ini hanya berisi include ke sub-file per domain.
 * JANGAN tambahkan route langsung di sini.
 *
 * Struktur:
 *   routes/api/auth.php         → login, logout, register
 *   routes/api/public.php       → galeri, pengumuman (tanpa auth)
 *   routes/api/operator.php     → manajemen akun, pengaturan sekolah
 *   routes/api/master-data.php  → master data guru, siswa, kelas, mapel, tahun ajaran
 *   routes/api/absensi.php      → input & rekap absensi
 *   routes/api/guru.php         → portal guru
 *   routes/api/kepsek.php       → portal kepala sekolah
 *   routes/api/wakasek.php      → portal wakasek kurikulum
 *   routes/api/ortu.php         → portal orang tua
 *   routes/api/keuangan.php     → modul keuangan & tagihan SPP
 *   routes/api/ppdb.php         → modul penerimaan peserta didik baru
 *   routes/api/lms.php          → modul pembelajaran (materi, tugas, ujian)
 *   routes/api/bk.php           → modul bimbingan konseling
 *   routes/api/perpustakaan.php → modul perpustakaan (buku & peminjaman)
 *   routes/api/tata-usaha.php   → modul tata usaha (surat & legalisir)
 */

require __DIR__ . '/api/auth.php';
require __DIR__ . '/api/public.php';
require __DIR__ . '/api/operator.php';
require __DIR__ . '/api/master-data.php';
require __DIR__ . '/api/absensi.php';
require __DIR__ . '/api/guru.php';
require __DIR__ . '/api/kepsek.php';
require __DIR__ . '/api/wakasek.php';
require __DIR__ . '/api/ortu.php';
require __DIR__ . '/api/keuangan.php';
require __DIR__ . '/api/ppdb.php';
require __DIR__ . '/api/lms.php';
require __DIR__ . '/api/bk.php';
require __DIR__ . '/api/perpustakaan.php';
require __DIR__ . '/api/tata-usaha.php';