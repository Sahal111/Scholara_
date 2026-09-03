<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class KurikulumResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'ulid' => $this->ulid,
            'nama' => $this->nama,
            'kode' => $this->kode,
            'tahun_berlaku' => $this->tahun_berlaku,
            'tahun_berakhir' => $this->tahun_berakhir,
            'jenis' => $this->jenis,
            'jenis_label' => $this->jenis_label,
            'penerbit' => $this->penerbit,
            'deskripsi' => $this->deskripsi,
            'is_active' => (bool) $this->is_active,
            'is_platform' => $this->is_platform,
            'is_masih_berlaku' => $this->is_masih_berlaku,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}