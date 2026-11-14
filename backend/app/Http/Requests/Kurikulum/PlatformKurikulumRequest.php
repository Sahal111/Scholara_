<?php

namespace App\Http\Requests\Kurikulum;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Dipakai untuk POST (buat) dan PUT (ubah) kurikulum platform. Hanya super admin. */
class PlatformKurikulumRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // dijaga middleware role:super_admin di route
    }

    public function rules(): array
    {
        $wajib = $this->isMethod('POST') ? 'required' : 'sometimes';
        $currentId = \App\Models\Kurikulum::where('ulid', $this->route('ulid'))->value('id');

        return [
            'nama' => [$wajib, 'string', 'max:100'],
            'kode' => [
                $wajib,
                'string',
                'max:30',
                'alpha_dash',
                Rule::unique('kurikulums', 'kode')->whereNull('school_id')->ignore($currentId),
            ],
            'tahun_berlaku' => [$wajib, 'integer', 'min:1900', 'max:2100'],
            'tahun_berakhir' => ['nullable', 'integer', 'min:1900', 'max:2100', 'gte:tahun_berlaku'],
            'jenis' => [$wajib, Rule::in(['nasional', 'internasional', 'khusus', 'custom'])],
            'penerbit' => ['nullable', 'string', 'max:100'],
            'deskripsi' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
            'is_platform_default' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'kode.unique' => 'Kode ini sudah dipakai kurikulum platform lain.',
            'kode.alpha_dash' => 'Kode hanya boleh berisi huruf, angka, dan tanda hubung.',
            'tahun_berakhir.gte' => 'Tahun berakhir harus sama atau setelah tahun berlaku.',
        ];
    }
}