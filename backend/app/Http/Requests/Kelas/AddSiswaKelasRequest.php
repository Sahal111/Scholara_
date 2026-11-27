<?php

namespace App\Http\Requests\Kelas;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AddSiswaKelasRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $schoolId = app()->bound('current_school_id') ? app('current_school_id') : null;
        $schoolId ??= $this->user()?->school_id;

        return [
            'siswa_id' => [
                'required',
                'integer',
                Rule::exists('siswas', 'id')
                    ->where('school_id', $schoolId)
                    ->whereNull('deleted_at'),
            ],
            'jenis_perubahan' => 'required|in:masuk_baru,naik_kelas,mutasi_masuk',
        ];
    }

    public function messages(): array
    {
        return [
            'siswa_id.required' => 'Siswa wajib dipilih.',
            'jenis_perubahan.required' => 'Jenis perubahan wajib dipilih.',
            'jenis_perubahan.in' => 'Jenis perubahan tidak valid.',
        ];
    }
}