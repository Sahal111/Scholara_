<?php

namespace App\Http\Requests\Kurikulum;

use App\Models\KurikulumStruktur;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreKurikulumStrukturRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('master_data.kurikulum.manage');
    }

    public function rules(): array
    {
        $schoolId = app()->bound('current_school_id') ? app('current_school_id') : null;

        return [
            'mapel_ulid' => [
                'required',
                'string',
                Rule::exists('mapels', 'ulid')
                    ->where('school_id', $schoolId)
                    ->whereNull('deleted_at'),
            ],
            'tingkat' => ['required', 'integer', 'between:1,13'],
            'program_ulid' => [
                'nullable',
                'string',
                Rule::exists('program_pendidikans', 'ulid')
                    ->where('school_id', $schoolId)
                    ->whereNull('deleted_at'),
            ],
            'kelompok' => ['nullable', 'string', 'max:50'],
            'alokasi_jp_minggu' => ['required', 'integer', 'between:1,40'],
            'alokasi_jp_tahun' => ['nullable', 'integer', 'between:1,2000'],
            'jenis_komponen' => ['nullable', Rule::in(KurikulumStruktur::JENIS_KOMPONEN)],
            'is_wajib' => ['nullable', 'boolean'],
            'urutan_rapor' => ['nullable', 'integer', 'between:1,500'],
        ];
    }

    public function messages(): array
    {
        return [
            'mapel_ulid.required' => 'Mata pelajaran wajib dipilih.',
            'mapel_ulid.exists' => 'Mata pelajaran tidak ditemukan di sekolah ini.',
            'program_ulid.exists' => 'Program pendidikan tidak ditemukan di sekolah ini.',
            'tingkat.required' => 'Tingkat kelas wajib diisi.',
            'tingkat.between' => 'Tingkat kelas harus antara 1 dan 13.',
            'alokasi_jp_minggu.required' => 'Alokasi JP per minggu wajib diisi.',
            'alokasi_jp_minggu.between' => 'Alokasi JP per minggu harus antara 1 dan 40.',
            'jenis_komponen.in' => 'Jenis komponen tidak valid.',
        ];
    }
}
