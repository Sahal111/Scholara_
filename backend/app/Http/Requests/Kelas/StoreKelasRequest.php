<?php

namespace App\Http\Requests\Kelas;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\Semester;
use App\Models\TahunAjaran;

class StoreKelasRequest extends FormRequest
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
            'tahun_ajaran_id' => [
                'nullable',
                'integer',
                Rule::exists('tahun_ajarans', 'id')
                    ->where('school_id', $schoolId)
                    ->whereNull('deleted_at'),
            ],
            'semester_id' => [
                'nullable',
                'integer',
                Rule::exists('semesters', 'id')
                    ->where('school_id', $schoolId)
                    ->whereNull('deleted_at'),
            ],
            'nama_kelas' => 'required|string|max:20',
            'tingkat' => 'required|integer|in:1,2,3,4,5,6,7,8,9,10,11,12',
            'program_pendidikan_id' => [
                'nullable',
                'integer',
                Rule::exists('program_pendidikans', 'id')
                    ->where('school_id', $schoolId)
                    ->whereNull('deleted_at'),
            ],
            'kurikulum' => 'required|string|max:50',
            'wali_kelas_id' => [
                'nullable',
                'integer',
                Rule::exists('gurus', 'id')
                    ->where('school_id', $schoolId)
                    ->whereNull('deleted_at'),
            ],
            'kapasitas' => 'required|integer|min:1|max:60',
            'ruangan' => 'nullable|string|max:50',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($v) {
            if ($v->errors()->isNotEmpty() || !$this->filled('semester_id')) {
                return;
            }

            $taId = $this->input('tahun_ajaran_id')
                ?? TahunAjaran::where('is_active', true)->value('id');

            if (!$taId) {
                return;
            }

            $cocok = Semester::where('id', $this->input('semester_id'))
                ->where('tahun_ajaran_id', $taId)
                ->exists();

            if (!$cocok) {
                $v->errors()->add('semester_id', 'Semester tidak termasuk dalam Tahun Ajaran yang dipilih.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'nama_kelas.required' => 'Nama kelas wajib diisi.',
            'tingkat.required' => 'Tingkat kelas wajib dipilih.',
            'tingkat.in' => 'Tingkat kelas harus antara 1–12.',
            'program_pendidikan_id.exists' => 'Program pendidikan tidak ditemukan.',
            'kapasitas.required' => 'Kapasitas kelas wajib diisi.',
            'kapasitas.max' => 'Kapasitas kelas maksimal 60 siswa.',
        ];
    }
}