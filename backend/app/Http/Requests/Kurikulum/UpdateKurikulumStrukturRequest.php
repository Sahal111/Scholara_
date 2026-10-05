<?php

namespace App\Http\Requests\Kurikulum;

use App\Models\KurikulumStruktur;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Hanya atribut non-identitas yang boleh diubah.
 * mapel / tingkat / program menentukan identitas baris → hapus lalu tambah ulang.
 */
class UpdateKurikulumStrukturRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('master_data.kurikulum.manage');
    }

    public function rules(): array
    {
        return [
            'kelompok' => ['sometimes', 'nullable', 'string', 'max:50'],
            'alokasi_jp_minggu' => ['sometimes', 'required', 'integer', 'between:1,40'],
            'alokasi_jp_tahun' => ['sometimes', 'nullable', 'integer', 'between:1,2000'],
            'jenis_komponen' => ['sometimes', 'required', Rule::in(KurikulumStruktur::JENIS_KOMPONEN)],
            'is_wajib' => ['sometimes', 'required', 'boolean'],
            'urutan_rapor' => ['sometimes', 'nullable', 'integer', 'between:1,500'],
        ];
    }

    public function messages(): array
    {
        return [
            'alokasi_jp_minggu.between' => 'Alokasi JP per minggu harus antara 1 dan 40.',
            'jenis_komponen.in' => 'Jenis komponen tidak valid.',
        ];
    }
}
