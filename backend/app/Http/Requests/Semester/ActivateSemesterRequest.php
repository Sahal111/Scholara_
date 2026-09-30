<?php

namespace App\Http\Requests\Semester;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Request untuk SET semester aktif (UPCOMING → ACTIVE).
 * Wakasek mengatur pergantian semester. TA harus berstatus ACTIVE.
 */
class ActivateSemesterRequest extends FormRequest
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