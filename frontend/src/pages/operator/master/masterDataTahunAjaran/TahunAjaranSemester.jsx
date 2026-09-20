/**
 * Operator — Tahun Ajaran & Semester (List)
 *
 * Wrapper tipis di atas implementasi shared di wakasek/.
 * Semua logika ada di sana; file ini hanya mengeset basePath
 * yang benar untuk portal operator.
 *
 * Jika ke depan operator butuh tampilan berbeda dari wakasek,
 * ganti isi file ini dengan implementasi mandiri — tanpa
 * menyentuh file wakasek.
 */
import TahunAjaranSemesterBase from "../../../wakasek/akademik/tahun-ajaran/TahunAjaranSemester";

export default function TahunAjaranSemester() {
  return <TahunAjaranSemesterBase basePath="/operator/master/tahun-ajaran" />;
}
