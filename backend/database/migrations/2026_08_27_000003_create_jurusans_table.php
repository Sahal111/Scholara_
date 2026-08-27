<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('jurusans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')
                ->comment('FK ke schools.id — jurusan bersifat per-sekolah')
                ->constrained('schools')->cascadeOnDelete();

            $table->string('nama', 100)->comment('IPA, IPS, Bahasa, Agama, TKJ, RPL, Akuntansi, dll');
            $table->string('kode', 20)->nullable()->comment('Kode singkat: IPA, IPS, TKJ — untuk label kelas');
            $table->text('deskripsi')->nullable();

            // Jurusan hanya berlaku untuk tingkat tertentu (biasanya 10-12)
            // Disimpan sebagai CSV: "10,11,12" — konsisten dengan pola tingkat di mapels
            $table->string('tingkat_berlaku', 30)->nullable()
                ->comment('Tingkat yang pakai jurusan ini. NULL=semua. Biasanya "10,11,12"');

            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            // Kode unik per sekolah
            $table->unique(['school_id', 'kode'], 'uq_jurusans_school_kode');
            $table->index('school_id', 'idx_jurusans_school');
            $table->index('is_active', 'idx_jurusans_aktif');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jurusans');
    }
};