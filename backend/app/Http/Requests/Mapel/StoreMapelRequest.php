<?php

namespace App\Http\Requests\Mapel;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Services\KurikulumPilihan;

class StoreMapelRequest extends FormRequest
{
    public const KELOMPOK_VALID = ['A - Wajib', 'B - Wajib', 'C - Muatan Lokal', 'Pengembangan Diri', 'Ekstrakurikuler', 'Lainnya'];
    public const KURIKULUM_VALID = ['Kurikulum 2013', 'Kurikulum Merdeka', 'Keduanya'];

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->kelompok)) {
            $this->merge([
                'kelompok' => trim(preg_replace('/\s+/u', ' ', $this->kelompok) ?? ''),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'kode' => [
                'required',
                'string',
                'max:20',
                Rule::unique('mapels', 'kode')
                    ->where('school_id', app('current_school_id'))
                    ->whereNull('deleted_at'),
            ],
            'nama_mapel' => 'required|string|max:150',
            'kelompok' => ['required', 'string', 'max:80'],
            'tingkat' => 'nullable|array',
            'tingkat.*' => 'in:1,2,3,4,5,6,7,8,9,10,11,12',
            'program_pendidikan_id' => [
                'nullable',
                'integer',
                Rule::exists('program_pendidikans', 'id')
                    ->where('school_id', app()->bound('current_school_id') ? app('current_school_id') : $this->user()?->school_id)
                    ->whereNull('deleted_at'),
            ],
            'jam_per_minggu' => 'required|integer|min:1|max:40',
            // Jalur lama (string) tetap diterima; jalur baru: kurikulum_ulid (null = berlaku semua kurikulum)
            'kurikulum' => ['nullable', 'in:' . implode(',', self::KURIKULUM_VALID)],
            'kurikulum_ulid' => array_merge(
                $this->filled('kurikulum') ? [] : ['present'],
                ['nullable', 'string', KurikulumPilihan::rule()]
            ),
        ];
    }

    public function messages(): array
    {
        return [
            'kode.required' => 'Kode mata pelajaran wajib diisi.',
            'kode.unique' => 'Kode mata pelajaran sudah digunakan.',
            'nama_mapel.required' => 'Nama mata pelajaran wajib diisi.',
            'kelompok.required' => 'Kelompok mata pelajaran wajib dipilih.',
            'kelompok.max' => 'Kelompok mata pelajaran maksimal 80 karakter.',
            'kelompok.string' => 'Kelompok mata pelajaran harus berupa teks.',
            'jam_per_minggu.required' => 'Jam per minggu wajib diisi.',
            'kurikulum_ulid.present' => 'Kurikulum wajib dipilih (kosongkan pilihan untuk berlaku di semua kurikulum).',
            'kurikulum_ulid.exists' => 'Kurikulum tidak ditemukan atau tidak aktif.',
            'kurikulum.in' => 'Kurikulum tidak valid.',
            'program_pendidikan_id.exists' => 'Program pendidikan tidak ditemukan.',
        ];
    }
}