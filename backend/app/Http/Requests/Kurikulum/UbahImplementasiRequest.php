<?php

namespace App\Http\Requests\Kurikulum;

use Illuminate\Foundation\Http\FormRequest;

class UbahImplementasiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasPermission('master_data.kurikulum.manage');
    }

    public function rules(): array
    {
        return [
            'tingkat_kelas' => ['nullable', 'array'],
            'tingkat_kelas.*' => ['integer', 'min:1', 'max:12'],
            'catatan' => ['nullable', 'string', 'max:500'],
        ];
    }
}