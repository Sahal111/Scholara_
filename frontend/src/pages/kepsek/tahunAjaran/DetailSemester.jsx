/**
 * Kepsek — Detail Semester
 *
 * Wrapper tipis di atas implementasi shared di wakasek/.
 * Kepsek hanya bisa view — aksi manage tersembunyi otomatis
 * karena permission-driven di komponen base.
 */
import DetailSemesterBase from "../../wakasek/akademik/tahun-ajaran/DetailSemester";

export default function DetailSemester() {
  return (
    <DetailSemesterBase
      basePath="/kepsek/tahun-ajaran"
      apiBase="/operator/master-data/tahun-ajaran"
    />
  );
}
