import DetailSemesterBase from "../../../../shared/tahun-ajaran/DetailSemester";

export default function DetailSemester() {
  return (
    <DetailSemesterBase
      basePath="/operator/master/tahun-ajaran"
      apiBase="/operator/master-data/tahun-ajaran"
    />
  );
}
