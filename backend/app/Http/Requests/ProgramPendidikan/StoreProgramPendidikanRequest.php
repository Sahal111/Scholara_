<?php

namespace App\Http\Requests\ProgramPendidikan;

use App\Models\ProgramPendidikan;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProgramPendidikanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $schoolId = app('current_school_id');

        return [
            'parent_id' => [
                'nullable',
                'integer',
                // Parent harus milik sekolah yang sama
                Rule::exists('program_pendidikans', 'id')
                    ->where('school_id', $schoolId)
                    ->whereNull('deleted_at'),
            ],
            'nama' => 'required|string|max:150',
            'kode' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('program_pendidikans', 'kode')
                    ->where('school_id', $schoolId)
                    ->whereNull('deleted_at'),
            ],
            'jenis' => ['required', Rule::in(ProgramPendidikan::JENIS)],
            'jenjang_sasaran' => ['required', Rule::in(ProgramPendidikan::JENJANG)],
            'deskripsi' => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'nama.required' => 'Nama program wajib diisi.',
            'jenis.required' => 'Jenis program wajib dipilih.',
            'jenis.in' => 'Jenis program tidak valid.',
            'jenjang_sasaran.required' => 'Jenjang sasaran wajib dipilih.',
            'jenjang_sasaran.in' => 'Jenjang sasaran tidak valid.',
            'kode.unique' => 'Kode program sudah digunakan di sekolah ini.',
            'parent_id.exists' => 'Program induk tidak ditemukan atau bukan milik sekolah ini.',
        ];
    }
}