/**
 * Operator — Arsip Tahun Ajaran
 *
 * Wrapper tipis di atas implementasi shared di wakasek/.
 */
import ArsipBase from "../../../../wakasek/akademik/tahun-ajaran/components/ArsipTahunAjaran";

export default function ArsipTahunAjaran() {
  return <ArsipBase basePath="/operator/master/tahun-ajaran" />;
}
