/**
 * Kepsek — Detail Semester
 *
 * Wrapper tipis di atas implementasi shared.
 * Import langsung dari shared base — BUKAN dari wakasek wrapper
 * (wakasek wrapper hardcode basePath/apiBase sendiri dan tidak forward props).
 */
import DetailSemesterBase from "../../../shared/tahun-ajaran/DetailSemester";

export default function DetailSemester() {
  return (
    <DetailSemesterBase
      basePath="/kepsek/tahun-ajaran"
      apiBase="/operator/master-data/tahun-ajaran"
    />
  );
}
