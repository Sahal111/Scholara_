import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import api from "@/lib/axios";

export default function KurikulumSekolahList() {
  const {
    data: res,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["superadmin", "sekolah"],
    queryFn: async () => (await api.get("/superadmin/sekolah")).data,
  });
  const sekolah = res?.data ?? [];

  return (
    <div className="max-w-4xl space-y-4">
      <h1 className="text-xl font-semibold text-white">Kurikulum Sekolah</h1>
      <p className="text-sm text-slate-400">
        Pilih sekolah untuk melihat implementasi kurikulumnya (hanya lihat).
      </p>

      {isLoading && <p className="text-sm text-slate-400">Memuat...</p>}
      {isError && (
        <p className="text-sm text-red-400">Gagal memuat daftar sekolah.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {sekolah.map((s) => (
          <Link
            key={s.ulid}
            to={`/superadmin/kurikulum/${s.ulid}`}
            className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 hover:bg-slate-800 transition-colors"
          >
            <Building2 className="w-5 h-5 text-purple-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {s.nama}
              </p>
              <p className="text-xs text-slate-400">
                {[s.npsn, s.jenjang, s.status].filter(Boolean).join(" · ")}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
