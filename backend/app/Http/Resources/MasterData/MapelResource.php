<?php

namespace App\Http\Resources\MasterData;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * MapelResource — transformasi output API mata pelajaran.
 *
 * Perubahan dari raw model:
 *  - tingkat: string CSV "1,3,5" → array ["1","3","5"] (null → [])
 *  - program_pendidikan: relasi dimuat jika ada (id + nama)
 *  - Integer ID internal tidak di-expose (hanya id untuk sementara,
 *    ganti dengan ulid jika model sudah punya kolom ulid)
 */
class MapelResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Parse tingkat CSV → array; null atau "Semua" → array kosong (= semua tingkat)
        $tingkatRaw = $this->tingkat;
        $tingkatArray = ($tingkatRaw && strtolower(trim($tingkatRaw)) !== 'semua')
            ? array_values(array_filter(
                array_map('trim', explode(',', $tingkatRaw)),
                fn($t) => $t !== ''
            ))
            : [];

        return [
            'id' => $this->id,
            'kode' => $this->kode,
            'nama_mapel' => $this->nama_mapel,
            'kelompok' => $this->kelompok,
            'tingkat' => $tingkatArray,           // selalu array
            'tingkat_label' => $tingkatArray
                ? implode(', ', $tingkatArray)
                : 'Semua Tingkat',
            'kurikulum' => $this->kurikulum,
            'jam_per_minggu' => $this->jam_per_minggu,
            'urutan_rapor' => $this->urutan_rapor,
            'is_active' => $this->is_active,
            'program_pendidikan' => $this->whenLoaded('programPendidikan', fn() => [
                'id' => $this->programPendidikan?->id,
                'nama' => $this->programPendidikan?->nama,
            ]),
            'program_pendidikan_id' => $this->program_pendidikan_id,
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}