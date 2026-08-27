<?php

namespace App\Http\Requests\Jurusan;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreJurusanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nama' => 'required|string|max:100',
            'kode' => [
                'required',
                'string',
                'max:20',
                Rule::unique('jurusans', 'kode')
                    ->where('school_id', app('current_school_id'))
                    ->whereNull('deleted_at'),
            ],
            'deskripsi' => 'nullable|string|max:500',
            'tingkat_berlaku' => 'nullable|array',
            'tingkat_berlaku.*' => 'in:1,2,3,4,5,6,7,8,9,10,11,12',
        ];
    }

    public function messages(): array
    {
        return [
            'nama.required' => 'Nama jurusan wajib diisi.',
            'kode.required' => 'Kode jurusan wajib diisi.',
            'kode.unique' => 'Kode jurusan sudah digunakan di sekolah ini.',
            'tingkat_berlaku.*.in' => 'Tingkat tidak valid. Pilih antara 1-12.',
        ];
    }
}