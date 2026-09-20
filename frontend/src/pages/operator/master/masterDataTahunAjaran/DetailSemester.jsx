/**
 * Operator — Detail Semester
 *
 * Wrapper tipis di atas implementasi shared di wakasek/.
 * basePath dan apiBase di-set ke route/endpoint operator.
 */
import DetailSemesterBase from "../../../wakasek/akademik/tahun-ajaran/DetailSemester";

export default function DetailSemester() {
  return (
    <DetailSemesterBase
      basePath="/operator/master/tahun-ajaran"
      apiBase="/operator/master-data/tahun-ajaran"
    />
  );
}
