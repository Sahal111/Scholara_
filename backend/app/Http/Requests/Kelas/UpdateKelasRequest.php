<?php

namespace App\Http\Requests\Kelas;

use Illuminate\Foundation\Http\FormRequest;

class UpdateKelasRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tahun_ajaran_id' => 'nullable|integer|exists:tahun_ajarans,id',
            'semester_id' => 'nullable|integer|exists:semesters,id',
            'nama_kelas' => 'required|string|max:20',
            'tingkat' => 'required|integer|in:1,2,3,4,5,6,7,8,9,10,11,12',
            'jurusan_id' => 'nullable|integer|exists:jurusans,id',
            'kurikulum' => 'required|string|max:50',
            'wali_kelas_id' => 'nullable|integer|exists:gurus,id',
            'kapasitas' => 'required|integer|min:1|max:60',
            'ruangan' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'nama_kelas.required' => 'Nama kelas wajib diisi.',
            'tingkat.required' => 'Tingkat kelas wajib dipilih.',
            'tingkat.in' => 'Tingkat kelas harus antara 1–12.',
            'jurusan_id.exists' => 'Jurusan tidak ditemukan.',
            'kapasitas.required' => 'Kapasitas kelas wajib diisi.',
            'kapasitas.max' => 'Kapasitas kelas maksimal 60 siswa.',
        ];
    }
}