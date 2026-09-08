<?php

namespace App\Http\Requests\Wakasek;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfilWakasekRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($this->user()->id),
            ],
            'no_hp' => 'nullable|string|max:20',
            'foto' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'password_lama' => 'nullable|string',
            'password_baru' => 'nullable|string|min:8|confirmed',
            'password_baru_confirmation' => 'nullable|string',

            // Bidang struktural Wakasek — opsional, boleh tidak diisi
            'bidang_wakasek' => [
                'nullable',
                Rule::in(['Kurikulum', 'Kesiswaan', 'Sarpras', 'Humas']),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'email.email' => 'Format email tidak valid.',
            'foto.image' => 'File harus berupa gambar.',
            'foto.mimes' => 'Format gambar harus jpg, jpeg, png, atau webp.',
            'foto.max' => 'Ukuran foto maksimal 2MB.',
            'password_baru.min' => 'Password baru minimal 8 karakter.',
            'password_baru.confirmed' => 'Konfirmasi password baru tidak cocok.',
            'bidang_wakasek.in' => 'Bidang wakasek harus salah satu dari: Kurikulum, Kesiswaan, Sarpras, atau Humas.',
        ];
    }
}