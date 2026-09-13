<?php

namespace App\Http\Requests\TahunAjaran;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTahunAjaranRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('id') ?? $this->route('tahun_ajaran');
        $schoolId = auth()->user()?->school_id;

        return [
            'tahun' => [
                'required',
                'string',
                'max:9',
                'regex:/^\d{4}\/\d{4}$/',
                Rule::unique('tahun_ajarans', 'tahun')->where('school_id', $schoolId)->ignore($id),
            ],
            'is_active' => 'nullable|boolean',
            'buat_semester' => 'nullable|boolean',
            'semester_ganjil_mulai' => 'nullable|date',
            'semester_ganjil_selesai' => 'nullable|date|after_or_equal:semester_ganjil_mulai',
            'semester_genap_mulai' => [
                'nullable',
                'date',
                function ($attribute, $value, $fail) {
                    if (!$value)
                        return;
                    $ganjilSelesai = $this->input('semester_ganjil_selesai');
                    if ($ganjilSelesai && strtotime($value) <= strtotime($ganjilSelesai)) {
                        $fail('Tanggal mulai Semester Genap harus setelah Semester Ganjil selesai.');
                    }
                },
            ],
            'semester_genap_selesai' => 'nullable|date|after_or_equal:semester_genap_mulai',
            'semester_aktif' => 'nullable|string|in:Ganjil,Genap',
            // 'tgl_mulai_ta' => 'nullable|date',
            // 'tgl_selesai_ta' => 'nullable|date|after_or_equal:tgl_mulai_ta',
        ];
    }

    public function messages(): array
    {
        return [
            'tahun.required' => 'Tahun ajaran wajib diisi.',
            'tahun.regex' => 'Format tahun ajaran harus YYYY/YYYY, contoh: 2024/2025.',
            'tahun.unique' => 'Tahun ajaran ini sudah ada.',
            'semester_ganjil_selesai.after_or_equal' => 'Tanggal selesai Semester Ganjil tidak boleh sebelum tanggal mulai.',
            'semester_genap_mulai.after' => 'Tanggal mulai Semester Genap harus setelah Semester Ganjil selesai.',
            'semester_genap_selesai.after_or_equal' => 'Tanggal selesai Semester Genap tidak boleh sebelum tanggal mulai.',
            // 'tgl_selesai_ta.after_or_equal' => 'Tanggal selesai periode tidak boleh sebelum tanggal mulai.',
        ];
    }
}