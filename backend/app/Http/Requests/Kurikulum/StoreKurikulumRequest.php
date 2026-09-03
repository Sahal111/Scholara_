<?php

namespace App\Http\Requests\Kurikulum;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreKurikulumRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('master_data.kurikulum.manage');
    }

    public function rules(): array
    {
        $schoolId = app('current_school_id');

        return [
            'nama' => ['required', 'string', 'max:100'],
            'kode' => [
                'required',
                'string',
                'max:30',
                'alpha_dash',
                // Kode unik per sekolah — platform defaults punya kode global
                Rule::unique('kurikulums', 'kode')->where('school_id', $schoolId),
            ],
            'tahun_berlaku' => ['required', 'integer', 'min:1900', 'max:2100'],
            'tahun_berakhir' => ['nullable', 'integer', 'min:1900', 'max:2100', 'gte:tahun_berlaku'],
            'jenis' => ['required', Rule::in(['nasional', 'internasional', 'khusus', 'custom'])],
            'penerbit' => ['nullable', 'string', 'max:100'],
            'deskripsi' => ['nullable', 'string', 'max:1000'],
            'metadata' => ['nullable', 'array'],

            // Komponen nilai opsional saat create
            'komponen_nilais' => ['nullable', 'array', 'max:20'],
            'komponen_nilais.*.nama' => ['required', 'string', 'max:100'],
            'komponen_nilais.*.kode' => ['nullable', 'string', 'max:20'],
            'komponen_nilais.*.kategori' => ['required', Rule::in(['pengetahuan', 'keterampilan', 'sikap', 'projek', 'ekstrakurikuler', 'lainnya'])],
            'komponen_nilais.*.bobot_persen' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'komponen_nilais.*.urutan' => ['nullable', 'integer', 'min:1'],
            'komponen_nilais.*.is_wajib' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'kode.unique' => 'Kode kurikulum ini sudah digunakan sekolah Anda.',
            'kode.alpha_dash' => 'Kode hanya boleh berisi huruf, angka, dan tanda hubung.',
            'tahun_berakhir.gte' => 'Tahun berakhir harus sama atau setelah tahun berlaku.',
            'komponen_nilais.*.nama.required' => 'Nama komponen nilai wajib diisi.',
            'komponen_nilais.*.kategori.required' => 'Kategori komponen nilai wajib dipilih.',
        ];
    }
}