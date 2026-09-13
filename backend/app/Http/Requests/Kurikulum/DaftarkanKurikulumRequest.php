<?php

namespace App\Http\Requests\Kurikulum;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * BUG 3 FIX: Ganti inline $request->validate() di daftarkanKeTahunAjaran.
 *
 * Perubahan utama dari versi lama:
 *   - kurikulum_id (integer)    → kurikulum_ulid (CHAR 26, exists by ulid)
 *   - tahun_ajaran_id (integer) → tahun_ajaran_ulid (CHAR 26, exists by ulid)
 *   - semester_id (integer)     → semester_ulid (CHAR 26, nullable)
 *
 * Resolusi ulid → id dilakukan di controller setelah validasi,
 * sebelum diteruskan ke service.
 */
class DaftarkanKurikulumRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('master_data.kurikulum.manage');
    }

    public function rules(): array
    {
        return [
            'kurikulum_ulid' => [
                'required',
                'string',
                'size:26',
                Rule::exists('kurikulums', 'ulid')->whereNull('deleted_at'),
            ],
            'tahun_ajaran_ulid' => [
                'required',
                'string',
                'size:26',
                Rule::exists('tahun_ajarans', 'ulid')->whereNull('deleted_at'),
            ],
            'semester_ulid' => [
                'nullable',
                'string',
                'size:26',
                Rule::exists('semesters', 'ulid'),
            ],
            'tingkat_kelas' => ['nullable', 'array'],
            'tingkat_kelas.*' => ['integer', 'min:1', 'max:12'],
            'catatan' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'kurikulum_ulid.required' => 'Kurikulum wajib dipilih.',
            'kurikulum_ulid.exists' => 'Kurikulum tidak ditemukan.',
            'tahun_ajaran_ulid.required' => 'Tahun ajaran wajib dipilih.',
            'tahun_ajaran_ulid.exists' => 'Tahun ajaran tidak ditemukan.',
            'semester_ulid.exists' => 'Semester tidak ditemukan.',
            'tingkat_kelas.*.min' => 'Tingkat kelas minimal 1.',
            'tingkat_kelas.*.max' => 'Tingkat kelas maksimal 12.',
        ];
    }
}