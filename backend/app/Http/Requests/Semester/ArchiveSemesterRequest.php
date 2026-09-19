<?php

namespace App\Http\Requests\Semester;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Request untuk arsipkan semester (CLOSED → ARCHIVED).
 * Operator mengarsipkan setelah proses rapor selesai.
 */
class ArchiveSemesterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'catatan' => 'nullable|string|max:500',
        ];
    }
}