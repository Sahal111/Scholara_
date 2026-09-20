/**
 * Operator — Detail Tahun Ajaran
 *
 * Wrapper tipis di atas implementasi shared di wakasek/.
 * basePath dan kelasPath di-set ke route operator.
 */
import DetailTahunAjaranBase from "../../../wakasek/akademik/tahun-ajaran/DetailTahunAjaran";

export default function DetailTahunAjaran() {
  return (
    <DetailTahunAjaranBase
      basePath="/operator/master/tahun-ajaran"
      kelasPath="/operator/master/kelas"
    />
  );
}
