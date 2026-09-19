<?php

namespace App\Http\Requests\Semester;

use App\Models\Semester;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateSemesterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization via Policy di controller
    }

    public function rules(): array
    {
        return [
            'nama' => 'sometimes|string|max:50',
            'tgl_mulai' => 'sometimes|nullable|date',
            'tgl_selesai' => 'sometimes|nullable|date|after_or_equal:tgl_mulai',
        ];
    }

    /**
     * Validasi tambahan: pastikan rentang tanggal tidak overlap
     * dengan semester lain di tahun ajaran yang sama.
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->isNotEmpty()) {
                    return; // Kalau validasi dasar sudah gagal, skip
                }

                $semester = Semester::where('ulid', $this->route('ulid'))->first();
                if (!$semester) {
                    return;
                }

                $tglMulai = $this->input('tgl_mulai', $semester->tgl_mulai);
                $tglSelesai = $this->input('tgl_selesai', $semester->tgl_selesai);

                if (!$tglMulai || !$tglSelesai) {
                    return; // Salah satu null — tidak perlu cek overlap
                }

                $overlap = Semester::where('tahun_ajaran_id', $semester->tahun_ajaran_id)
                    ->where('id', '!=', $semester->id)
                    ->where(function ($q) use ($tglMulai, $tglSelesai) {
                        // Overlap jika: mulai_lain <= selesai_baru AND selesai_lain >= mulai_baru
                        $q->where('tgl_mulai', '<=', $tglSelesai)
                            ->where('tgl_selesai', '>=', $tglMulai);
                    })
                    ->whereNotNull('tgl_mulai')
                    ->whereNotNull('tgl_selesai')
                    ->first();

                if ($overlap) {
                    $validator->errors()->add(
                        'tgl_mulai',
                        "Rentang tanggal ini bertabrakan dengan Semester {$overlap->nama} "
                        . "({$overlap->tgl_mulai} – {$overlap->tgl_selesai})."
                    );
                }
            },
        ];
    }

    public function messages(): array
    {
        return [
            'tgl_selesai.after_or_equal' => 'Tanggal selesai tidak boleh sebelum tanggal mulai.',
        ];
    }
}