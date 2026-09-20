 /**
 * Operator — Recycle Bin Tahun Ajaran
 *
 * Wrapper tipis di atas implementasi shared di wakasek/.
 */
import RecycleBinBase from "../../../../wakasek/akademik/tahun-ajaran/components/RecycleBinTahunAjaran";

export default function RecycleBinTahunAjaran() {
  return <RecycleBinBase basePath="/operator/master/tahun-ajaran" />;
}