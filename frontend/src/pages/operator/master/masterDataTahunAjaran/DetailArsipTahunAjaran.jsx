/**
 * Operator — Detail Arsip Tahun Ajaran
 *
 * Wrapper tipis di atas implementasi shared di wakasek/.
 * basePath dan apiBase di-set ke route/endpoint operator.
 */
import DetailArsipBase from "../../../wakasek/akademik/tahun-ajaran/DetailArsipTahunAjaran";

export default function DetailArsipTahunAjaran() {
  return (
    <DetailArsipBase
      basePath="/operator/master/tahun-ajaran"
      apiBase="/operator/master-data/tahun-ajaran"
    />
  );
}
