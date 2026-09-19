<?php

namespace App\Http\Requests\Semester;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSemesterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization via Policy di controller
    }

    public function rules(): array
    {
        return [
            'nama'         => 'sometimes|string|max:50',
            'tgl_mulai'    => 'sometimes|nullable|date',
            'tgl_selesai'  => 'sometimes|nullable|date|after_or_equal:tgl_mulai',
        ];
    }

    public function messages(): array
    {
        return [
            'tgl_selesai.after_or_equal' => 'Tanggal selesai tidak boleh sebelum tanggal mulai.',
        ];
    }
}
