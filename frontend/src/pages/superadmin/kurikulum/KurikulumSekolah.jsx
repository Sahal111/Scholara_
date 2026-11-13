import { Link, useParams } from "react-router-dom";
import { KurikulumBaseProvider } from "@/hooks/api/useKurikulum";
import DaftarImplementasiKurikulum from "@/shared/kurikulum/DaftarImplementasiKurikulum";

export default function KurikulumSekolah() {
  const { schoolUlid } = useParams();

  return (
    <KurikulumBaseProvider
      value={`/superadmin/sekolah/${schoolUlid}/kurikulum`}
    >
      <div className="rounded-2xl bg-[#f8fafc] text-gray-800">
        <div className="px-6 pt-6">
          <Link
            to="/superadmin/kurikulum"
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            ← Semua sekolah
          </Link>
        </div>
        <DaftarImplementasiKurikulum
          judul="Kurikulum Sekolah"
          deskripsi="Mode pantau: superadmin tidak dapat mengubah status atau struktur."
          detailPath={`/superadmin/kurikulum/${schoolUlid}/implementasi`}
        />
      </div>
    </KurikulumBaseProvider>
  );
}
