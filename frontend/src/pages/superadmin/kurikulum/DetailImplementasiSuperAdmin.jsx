import { useParams } from "react-router-dom";
import { KurikulumBaseProvider } from "@/hooks/api/useKurikulum";
import DetailImplementasiKurikulum from "@/shared/kurikulum/DetailImplementasiKurikulum";

export default function DetailImplementasiSuperAdmin() {
  const { schoolUlid } = useParams();

  return (
    <KurikulumBaseProvider
      value={`/superadmin/sekolah/${schoolUlid}/kurikulum`}
    >
      <div className="rounded-2xl bg-[#f8fafc] text-gray-800">
        <DetailImplementasiKurikulum />
      </div>
    </KurikulumBaseProvider>
  );
}
