import { useState, useEffect } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../../lib/axios";
import toast from "react-hot-toast";
import {
  Calendar,
  Clock,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Filter,
} from "lucide-react";

// --- KONSTANTA HARI ---
const HARI_OPTIONS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function formatTime(timeStr) {
  if (!timeStr) return "";
  // timeStr dari backend biasanya "HH:mm:ss"
  const [h, m] = timeStr.split(":");
  return `${h}:${m}`;
}

// ─── Modal Form Jadwal ───────────────────────────────────────────
function ModalJadwal({ open, onClose, editData, queryClient, filterState }) {
  const isEdit = !!editData;

  const [form, setForm] = useState({
    id_mapel: "",
    nuptk: "",
    hari: "Senin",
    jam_mulai: "",
    jam_selesai: "",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (open) {
      setForm(
        editData
          ? {
              id_mapel: editData.id_mapel,
              nuptk: editData.nuptk,
              hari: editData.hari,
              jam_mulai: formatTime(editData.jam_mulai),
              jam_selesai: formatTime(editData.jam_selesai),
            }
          : {
              id_mapel: "",
              nuptk: "",
              hari: "Senin",
              jam_mulai: "",
              jam_selesai: "",
            }
      );
    }
  }, [open, editData]);

  // Load Data Master (Mapel & Guru)
  const { data: listMapel = [] } = useQuery({
    queryKey: ["mapel-dropdown"],
    queryFn: () => api.get("/operator/master-data/mapel/dropdown").then((r) => r.data.data),
  });

  const { data: listGuru = [] } = useQuery({
    queryKey: ["guru-dropdown-jadwal"],
    queryFn: () => api.get("/operator/master-data/guru").then((r) => r.data.data.data),
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        id_kelas: filterState.kelas,
        tahun_ajaran: filterState.tahun_ajaran,
        semester: filterState.semester,
      };
      return isEdit
        ? api.put(`/operator/master-data/jadwal-pelajaran/${editData.id}`, payload)
        : api.post("/operator/master-data/jadwal-pelajaran", payload);
    },
    onSuccess: () => {
      toast.success(`Jadwal berhasil ${isEdit ? "diperbarui" : "ditambahkan"}.`);
      queryClient.invalidateQueries(["jadwal-pelajaran"]);
      onClose();
    },
    onError: (err) => {
      const message = err.response?.data?.message || "Terjadi kesalahan.";
      toast.error(message, { duration: 4000 });
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-blue-600" />
            <h3 className="font-semibold text-gray-800">
              {isEdit ? "Edit Jadwal" : "Tambah Jadwal"}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 transition">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran <span className="text-red-500">*</span></label>
            <select
              value={form.id_mapel}
              onChange={(e) => set("id_mapel", e.target.value)}
              className="input-field"
            >
              <option value="">-- Pilih Mata Pelajaran --</option>
              {listMapel.map((m) => (
                <option key={m.id} value={m.id}>{m.nama_mapel} ({m.kode_mapel})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Guru Pengajar <span className="text-red-500">*</span></label>
            <select
              value={form.nuptk}
              onChange={(e) => set("nuptk", e.target.value)}
              className="input-field"
            >
              <option value="">-- Pilih Guru --</option>
              {listGuru.map((g) => (
                <option key={g.nuptk} value={g.nuptk}>{g.nama_lengkap}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hari <span className="text-red-500">*</span></label>
            <select
              value={form.hari}
              onChange={(e) => set("hari", e.target.value)}
              className="input-field"
            >
              {HARI_OPTIONS.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jam Mulai <span className="text-red-500">*</span></label>
              <input
                type="time"
                value={form.jam_mulai}
                onChange={(e) => set("jam_mulai", e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jam Selesai <span className="text-red-500">*</span></label>
              <input
                type="time"
                value={form.jam_selesai}
                onChange={(e) => set("jam_selesai", e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button onClick={onClose} className="btn-secondary flex-1">Batal</button>
          <button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending}
            className="btn-primary flex-1"
          >
            {mutation.isPending ? "Menyimpan..." : (isEdit ? "Perbarui" : "Simpan")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Halaman Utama ────────────────────────────────────────────────
export default function MasterJadwal() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("akademik.jadwal.manage");
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const [filter, setFilter] = useState({
    tahun_ajaran: "",
    semester: "1",
    kelas: "",
  });

  // Load Data Filter (Tahun Ajaran & Kelas)
  const { data: listTA = [] } = useQuery({
    queryKey: ["tahun-ajaran-dropdown"],
    queryFn: () => api.get("/operator/master-data/tahun-ajaran").then((r) => r.data.data),
  });

  const { data: listKelas = [] } = useQuery({
    queryKey: ["kelas-dropdown"],
    queryFn: () => api.get("/operator/master-data/kelas/dropdown").then((r) => r.data.data),
  });

  // Set default TA to active
  useEffect(() => {
    if (listTA.length > 0 && !filter.tahun_ajaran) {
      const activeTA = listTA.find((t) => t.is_active);
      if (activeTA) {
        setFilter((f) => ({ ...f, tahun_ajaran: activeTA.nama }));
      }
    }
  }, [listTA, filter.tahun_ajaran]);

  const setF = (k, v) => setFilter((f) => ({ ...f, [k]: v }));
  const canFetch = filter.tahun_ajaran && filter.semester && filter.kelas;

  // Fetch Jadwal
  const { data: listJadwal = [], isLoading } = useQuery({
    queryKey: ["jadwal-pelajaran", filter],
    queryFn: () =>
      api
        .get("/operator/master-data/jadwal-pelajaran", {
          params: {
            tahun_ajaran: filter.tahun_ajaran,
            semester: filter.semester,
            id_kelas: filter.kelas,
          },
        })
        .then((r) => r.data.data),
    enabled: !!canFetch,
  });

  const hapus = useMutation({
    mutationFn: (id) => api.delete(`/operator/master-data/jadwal-pelajaran/${id}`),
    onSuccess: () => {
      toast.success("Jadwal dihapus.");
      queryClient.invalidateQueries(["jadwal-pelajaran"]);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Gagal menghapus."),
  });

  // Kelompokkan jadwal berdasarkan hari
  const jadwalByHari = HARI_OPTIONS.reduce((acc, hari) => {
    acc[hari] = listJadwal.filter((j) => j.hari === hari);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="text-blue-600" size={26} />
            Jadwal Pelajaran
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Kelola jadwal pelajaran (anti bentrok guru & kelas)
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Tahun Ajaran
            </label>
            <select
              value={filter.tahun_ajaran}
              onChange={(e) => setF("tahun_ajaran", e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Tahun Ajaran</option>
              {listTA.map((t) => (
                <option key={t.id} value={t.nama}>{t.nama}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Semester
            </label>
            <select
              value={filter.semester}
              onChange={(e) => setF("semester", e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">Ganjil (1)</option>
              <option value="2">Genap (2)</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Kelas
            </label>
            <select
              value={filter.kelas}
              onChange={(e) => setF("kelas", e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Kelas...</option>
              {listKelas.map((k) => (
                <option key={k.id} value={k.id}>{k.nama_kelas} (Tingkat {k.tingkat})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Konten Jadwal */}
      {!canFetch ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          <Filter size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Pilih Tahun Ajaran, Semester, dan Kelas terlebih dahulu.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end mb-4">
            {canManage && 
            <button
              onClick={() => { setEditData(null); setModalOpen(true); }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={16} /> Tambah Jadwal
            </button>}
          </div>

          {isLoading ? (
            <div className="text-center py-10 text-gray-500">Memuat jadwal...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {HARI_OPTIONS.map((hari) => (
                <div key={hari} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 font-semibold text-gray-700 flex justify-between items-center">
                    {hari}
                    <span className="text-xs font-medium text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-200">
                      {jadwalByHari[hari].length} Sesi
                    </span>
                  </div>
                  <div className="p-0">
                    {jadwalByHari[hari].length === 0 ? (
                      <p className="text-sm text-gray-400 italic text-center py-6">Tidak ada jadwal.</p>
                    ) : (
                      <ul className="divide-y divide-gray-50">
                        {jadwalByHari[hari].map((j) => (
                          <li key={j.id} className="p-4 hover:bg-blue-50/50 transition-colors group">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 mb-1">
                                  <Clock size={12} />
                                  {formatTime(j.jam_mulai)} - {formatTime(j.jam_selesai)}
                                </div>
                                <h4 className="font-bold text-gray-800 leading-tight">
                                  {j.mata_pelajaran?.nama_mapel}
                                </h4>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {j.guru?.nama_lengkap}
                                </p>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                {canManage && <button
                                  onClick={() => { setEditData(j); setModalOpen(true); }}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition"
                                >
                                  <Pencil size={14} />
                                </button>}
                                {canManage && <button
                                  onClick={() => {
                                    if (window.confirm("Hapus jadwal ini?")) hapus.mutate(j.id);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition"
                                >
                                  <Trash2 size={14} />
                                </button>}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ModalJadwal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null); }}
        editData={editData}
        queryClient={queryClient}
        filterState={filter}
      />
    </div>
  );
}