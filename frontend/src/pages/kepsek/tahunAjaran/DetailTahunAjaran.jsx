/**
 * Kepsek — Detail Tahun Ajaran
 *
 * Wrapper tipis di atas implementasi shared di src/shared/tahun-ajaran/.
 * Kepsek hanya bisa view — tombol edit/hapus tersembunyi
 * otomatis karena permission-driven di komponen base.
 *
 * kelasPath sengaja tidak di-set (kepsek tidak punya halaman kelas sendiri).
 */
import DetailTahunAjaranBase from "../../../shared/tahun-ajaran/DetailTahunAjaran";

export default function DetailTahunAjaran() {
  return (
    <DetailTahunAjaranBase basePath="/kepsek/tahun-ajaran" kelasPath={null} />
  );
}
