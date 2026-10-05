<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Hanya ULID yang diekspos — integer ID tidak pernah keluar lewat API.
 */
class KurikulumStrukturResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'ulid' => $this->ulid,
            'tingkat' => $this->tingkat,
            'mapel' => $this->whenLoaded('mapel', fn() => $this->mapel ? [
                'ulid' => $this->mapel->ulid,
                'kode' => $this->mapel->kode,
                'nama' => $this->mapel->nama_mapel,
            ] : null),
            'program' => $this->whenLoaded('program', fn() => $this->program ? [
                'ulid' => $this->program->ulid,
                'nama' => $this->program->nama,
            ] : null),
            'kelompok' => $this->kelompok,
            'alokasi_jp_minggu' => $this->alokasi_jp_minggu,
            'alokasi_jp_tahun' => $this->alokasi_jp_tahun,
            'jenis_komponen' => $this->jenis_komponen,
            'is_wajib' => (bool) $this->is_wajib,
            'urutan_rapor' => $this->urutan_rapor,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
