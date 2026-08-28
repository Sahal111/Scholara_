<?php

namespace App\Http\Requests\Mapel;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMapelRequest extends FormRequest
{
    public const KELOMPOK_VALID = ['A - Wajib', 'B - Wajib', 'C - Muatan Lokal', 'Pengembangan Diri', 'Ekstrakurikuler', 'Lainnya'];
    public const KURIKULUM_VALID = ['Kurikulum 2013', 'Kurikulum Merdeka', 'Keduanya'];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'kode' => [
                'required',
                'string',
                'max:20',
                Rule::unique('mapels', 'kode')
                    ->where('school_id', app('current_school_id')),
            ],
            'nama_mapel' => 'required|string|max:150',
            'kelompok' => 'required|in:' . implode(',', self::KELOMPOK_VALID),
            'tingkat' => 'nullable|array',
            'tingkat.*' => 'in:1,2,3,4,5,6,7,8,9,10,11,12',
            'program_pendidikan_id' => 'nullable|integer|exists:program_pendidikans,id',
            'jam_per_minggu' => 'required|integer|min:1|max:40',
            'kurikulum' => 'required|in:' . implode(',', self::KURIKULUM_VALID),
        ];
    }

    public function messages(): array
    {
        return [
            'kode.required' => 'Kode mata pelajaran wajib diisi.',
            'kode.unique' => 'Kode mata pelajaran sudah digunakan.',
            'nama_mapel.required' => 'Nama mata pelajaran wajib diisi.',
            'kelompok.required' => 'Kelompok mata pelajaran wajib dipilih.',
            'kelompok.in' => 'Kelompok mata pelajaran tidak valid.',
            'jam_per_minggu.required' => 'Jam per minggu wajib diisi.',
            'kurikulum.required' => 'Kurikulum wajib dipilih.',
            'kurikulum.in' => 'Kurikulum tidak valid.',
            'program_pendidikan_id.exists' => 'Program pendidikan tidak ditemukan.',
        ];
    }
}