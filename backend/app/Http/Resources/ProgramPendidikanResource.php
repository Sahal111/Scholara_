<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource untuk ProgramPendidikan.
 *
 * - Tidak mengekspos integer `id` maupun `parent_id` (FK integer).
 * - `parent_ulid` menggantikan `parent_id` untuk referensi relasi di frontend.
 * - `jenis_label` dikalkulasi langsung dari konstanta — tidak perlu append() manual.
 */
class ProgramPendidikanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'ulid' => $this->ulid,
            'parent_ulid' => $this->whenLoaded('parent', fn() => $this->parent?->ulid, $this->getParentUlid()),
            'nama' => $this->nama,
            'kode' => $this->kode,
            'jenis' => $this->jenis,
            'jenis_label' => $this->jenis_label,
            'jenjang_sasaran' => $this->jenjang_sasaran,
            'deskripsi' => $this->deskripsi,
            'is_active' => (bool) $this->is_active,

            // Counts — hanya ada jika di-withCount()
            'kelas_count' => $this->whenCounted('kelas'),
            'children_count' => $this->whenCounted('children'),
            'mapels_count' => $this->whenCounted('mapels'),
            'siswa_count' => $this->whenCounted('siswas'),

            // Relasi — hanya ada jika di-with()
            'parent' => $this->whenLoaded('parent', fn() => [
                'ulid' => $this->parent->ulid,
                'nama' => $this->parent->nama,
                'kode' => $this->parent->kode,
                'jenis' => $this->parent->jenis,
            ]),
            'children' => $this->whenLoaded(
                'children',
                fn() => ProgramPendidikanResource::collection($this->children)
            ),

            // Alias untuk tree endpoint — controller load relasi 'descendantsTree'
            // (recursive children). Frontend baca node.descendantsTree untuk render pohon.
            'descendantsTree' => $this->whenLoaded(
                'descendantsTree',
                fn() => ProgramPendidikanResource::collection($this->descendantsTree)
            ),

            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'deleted_at' => $this->deleted_at?->toIso8601String(),
        ];
    }

    /**
     * Resolve parent_ulid tanpa eager load — fallback untuk index/list
     * yang tidak load relasi parent secara penuh.
     * SchoolScope tetap aktif — tidak ada cross-tenant risk.
     */
    private function getParentUlid(): ?string
    {
        if (is_null($this->parent_id)) {
            return null;
        }

        // Gunakan relasi jika sudah loaded, hindari extra query
        if ($this->relationLoaded('parent')) {
            return $this->parent?->ulid;
        }

        // Fallback: single query, hanya ambil ulid
        return \App\Models\ProgramPendidikan::where('id', $this->parent_id)->value('ulid');
    }
}