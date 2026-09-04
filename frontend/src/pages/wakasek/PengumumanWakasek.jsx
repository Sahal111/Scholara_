import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  X,
  Clock,
  CalendarDays,
  Send,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Config ─────────────────────────────────────────────────────────────────
const KATEGORI_CONFIG = {
  Libur: { color: "bg-green-100 text-green-700 border-green-200" },
  Rapat: { color: "bg-blue-100 text-blue-700 border-blue-200" },
  "Jadwal Ujian": { color: "bg-purple-100 text-purple-700 border-purple-200" },
  Penting: { color: "bg-red-100 text-red-700 border-red-200" },
  Informasi: { color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
};
const KATEGORI_OPTIONS = [
  "Informasi",
  "Penting",
  "Libur",
  "Rapat",
  "Jadwal Ujian",
];

const TARGET_OPTIONS = [
  {
    val: "semua",
    label: "Semua (Guru & Ortu)",
    desc: "Tampil untuk semua pengguna",
  },
  {
    val: "internal",
    label: "Internal (Guru saja)",
    desc: "Hanya guru & staf yang lihat",
  },
  {
    val: "ortu",
    label: "Orang Tua saja",
    desc: "Hanya tampil di dashboard ortu",
  },
];

const TARGET_BADGE = {
  semua: "bg-indigo-100 text-indigo-700",
  internal: "bg-slate-100 text-slate-700",
  ortu: "bg-pink-100 text-pink-700",
};

const TARGET_LABEL = {
  semua: "Semua",
  internal: "Internal",
  ortu: "Orang Tua",
};

const FORM_DEFAULT = {
  judul: "",
  konten: "",
  kategori: "Informasi",
  target: "semua",
  publish_at: "",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatTanggal = (str) =>
  str
    ? new Date(str).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

const formatDatetimeLocal = (str) => {
  if (!str) return "";
  // Konversi ISO string ke format datetime-local (YYYY-MM-DDTHH:mm)
  return new Date(str).toISOString().slice(0, 16);
};

const isScheduled = (publish_at) => {
  if (!publish_at) return false;
  return new Date(publish_at) > new Date();
};

// ─── Status Badge ────────────────────────────────────────────────────────────
function StatusBadge({ publish_at }) {
  if (!publish_at) {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
        <Eye className="w-3 h-3" /> Tayang
      </span>
    );
  }
  if (isScheduled(publish_at)) {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
        <Clock className="w-3 h-3" /> Terjadwal
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
      <Eye className="w-3 h-3" /> Tayang
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function PengumumanWakasek() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filterStatus, setFilterStatus] = useState("semua"); // semua | tayang | terjadwal
  const [formData, setFormData] = useState(FORM_DEFAULT);
  const [useSchedule, setUseSchedule] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // id yang mau dihapus

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: list = [], isLoading } = useQuery({
    queryKey: ["wakasek-pengumuman"],
    queryFn: () => api.get("/pengumuman").then((r) => r.data.data),
  });

  // ── Mutations ────────────────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: (data) => api.post("/wakasek/pengumuman", data),
    onSuccess: () => {
      toast.success("Pengumuman berhasil dibuat");
      queryClient.invalidateQueries(["wakasek-pengumuman"]);
      closeModal();
    },
    onError: (err) => {
      const msg = err?.response?.data?.message ?? "Gagal membuat pengumuman";
      toast.error(msg);
    },
  });

  const editMutation = useMutation({
    mutationFn: (data) => api.put(`/wakasek/pengumuman/${editItem.id}`, data),
    onSuccess: () => {
      toast.success("Pengumuman berhasil diperbarui");
      queryClient.invalidateQueries(["wakasek-pengumuman"]);
      closeModal();
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ?? "Gagal memperbarui pengumuman";
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/wakasek/pengumuman/${id}`),
    onSuccess: () => {
      toast.success("Pengumuman berhasil dihapus");
      queryClient.invalidateQueries(["wakasek-pengumuman"]);
      setConfirmDelete(null);
    },
    onError: () => toast.error("Gagal menghapus pengumuman"),
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  const openModal = (item = null) => {
    if (item) {
      setEditItem(item);
      const hasSchedule = !!item.publish_at;
      setUseSchedule(hasSchedule);
      setFormData({
        judul: item.judul,
        konten: item.konten,
        kategori: item.kategori,
        target: item.target || "semua",
        publish_at: hasSchedule ? formatDatetimeLocal(item.publish_at) : "",
      });
    } else {
      setEditItem(null);
      setUseSchedule(false);
      setFormData(FORM_DEFAULT);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditItem(null);
    setUseSchedule(false);
    setFormData(FORM_DEFAULT);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.judul.trim() || !formData.konten.trim()) {
      toast.error("Judul dan konten harus diisi");
      return;
    }
    if (useSchedule && !formData.publish_at) {
      toast.error("Pilih waktu publikasi");
      return;
    }
    if (useSchedule && new Date(formData.publish_at) <= new Date()) {
      toast.error("Waktu jadwal harus lebih dari sekarang");
      return;
    }

    const payload = {
      judul: formData.judul.trim(),
      konten: formData.konten.trim(),
      kategori: formData.kategori,
      target: formData.target,
      publish_at: useSchedule ? formData.publish_at : null,
    };

    editItem ? editMutation.mutate(payload) : addMutation.mutate(payload);
  };

  // ── Filter ───────────────────────────────────────────────────────────────
  const filtered = list.filter((item) => {
    if (filterStatus === "terjadwal") return isScheduled(item.publish_at);
    if (filterStatus === "tayang") return !isScheduled(item.publish_at);
    return true;
  });

  const countScheduled = list.filter((i) => isScheduled(i.publish_at)).length;
  const isPending = addMutation.isPending || editMutation.isPending;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-indigo-600" />
            Kelola Pengumuman
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Buat, edit, dan jadwalkan pengumuman untuk seluruh warga sekolah.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" /> Buat Pengumuman
        </button>
      </div>

      {/* Summary bar */}
      {!isLoading && (
        <div className="flex flex-wrap gap-3 items-center">
          {[
            { val: "semua", label: `Semua (${list.length})` },
            {
              val: "tayang",
              label: `Tayang (${list.length - countScheduled})`,
            },
            { val: "terjadwal", label: `Terjadwal (${countScheduled})` },
          ].map(({ val, label }) => (
            <button
              key={val}
              onClick={() => setFilterStatus(val)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                filterStatus === val
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
              }`}
            >
              {label}
            </button>
          ))}
          {countScheduled > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full ml-auto">
              <Clock className="w-3.5 h-3.5" />
              {countScheduled} pengumuman menunggu tayang
            </span>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-400">Memuat data...</p>
        </div>
      )}

      {/* Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((item) => {
            const cfg =
              KATEGORI_CONFIG[item.kategori] ?? KATEGORI_CONFIG["Informasi"];
            const scheduled = isScheduled(item.publish_at);
            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-6 flex flex-col h-full transition-colors group hover:border-indigo-100 shadow-sm ${
                  scheduled
                    ? "border-amber-200 bg-amber-50/20"
                    : "border-gray-100"
                }`}
              >
                {/* Top row */}
                <div className="flex justify-between items-start mb-3 gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${cfg.color}`}
                    >
                      {item.kategori}
                    </span>
                    <StatusBadge publish_at={item.publish_at} />
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TARGET_BADGE[item.target ?? "semua"]}`}
                    >
                      {TARGET_LABEL[item.target ?? "semua"]}
                    </span>
                  </div>
                  {/* Action buttons — selalu visible */}
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => openModal(item)}
                      className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(item.id)}
                      className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Judul & konten */}
                <h3 className="text-base font-bold text-gray-800 mb-2 line-clamp-2">
                  {item.judul}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-3 flex-1 whitespace-pre-wrap">
                  {item.konten}
                </p>

                {/* Footer */}
                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTanggal(item.created_at)}
                  </span>
                  {scheduled && (
                    <span className="flex items-center gap-1 text-amber-600 font-medium">
                      <CalendarDays className="w-3.5 h-3.5" />
                      Tayang: {formatTanggal(item.publish_at)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full bg-white rounded-2xl p-16 text-center border border-dashed border-gray-200">
              <Megaphone className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Belum ada pengumuman</p>
              <p className="text-sm text-gray-400 mt-1">
                {filterStatus !== "semua"
                  ? "Coba ganti filter di atas."
                  : "Klik 'Buat Pengumuman' untuk memulai."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ══ MODAL FORM ══════════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {editItem ? (
                  <>
                    <Edit2 className="w-5 h-5 text-blue-600" /> Edit Pengumuman
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-indigo-600" /> Buat Pengumuman
                    Baru
                  </>
                )}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Judul */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Judul Pengumuman <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.judul}
                  onChange={(e) =>
                    setFormData({ ...formData, judul: e.target.value })
                  }
                  className="input-field"
                  placeholder="Contoh: Libur Hari Raya Idul Adha"
                />
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Kategori
                </label>
                <select
                  value={formData.kategori}
                  onChange={(e) =>
                    setFormData({ ...formData, kategori: e.target.value })
                  }
                  className="input-field"
                >
                  {KATEGORI_OPTIONS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Target Penerima
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TARGET_OPTIONS.map(({ val, label, desc }) => (
                    <label
                      key={val}
                      className={`flex flex-col gap-0.5 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                        formData.target === val
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="target"
                        value={val}
                        checked={formData.target === val}
                        onChange={(e) =>
                          setFormData({ ...formData, target: e.target.value })
                        }
                        className="sr-only"
                      />
                      <span className="text-sm font-semibold text-gray-800">
                        {label}
                      </span>
                      <span className="text-xs text-gray-400">{desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Konten */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Isi Pengumuman <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.konten}
                  onChange={(e) =>
                    setFormData({ ...formData, konten: e.target.value })
                  }
                  className="input-field resize-none"
                  placeholder="Tulis rincian pengumuman di sini..."
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {formData.konten.length} karakter
                </p>
              </div>

              {/* Toggle jadwal */}
              <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div
                    onClick={() => {
                      setUseSchedule(!useSchedule);
                      if (useSchedule)
                        setFormData({ ...formData, publish_at: "" });
                    }}
                    className={`relative w-11 h-6 rounded-full transition-colors ${useSchedule ? "bg-indigo-600" : "bg-gray-200"}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${useSchedule ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      Jadwalkan Publikasi
                    </p>
                    <p className="text-xs text-gray-400">
                      {useSchedule
                        ? "Pengumuman akan tayang otomatis sesuai jadwal"
                        : "Pengumuman akan langsung tayang"}
                    </p>
                  </div>
                </label>

                {useSchedule && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Tanggal & Waktu Tayang
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.publish_at}
                      min={new Date(Date.now() + 60_000)
                        .toISOString()
                        .slice(0, 16)}
                      onChange={(e) =>
                        setFormData({ ...formData, publish_at: e.target.value })
                      }
                      className="input-field text-sm"
                    />
                    {formData.publish_at && (
                      <p className="text-xs text-indigo-600 mt-1.5 flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        Akan tayang: {formatTanggal(formData.publish_at)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary flex items-center gap-2"
                >
                  {isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Menyimpan...
                    </>
                  ) : useSchedule ? (
                    <>
                      <CalendarDays className="w-4 h-4" /> Jadwalkan
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />{" "}
                      {editItem ? "Simpan Perubahan" : "Publikasikan"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL KONFIRMASI HAPUS ══════════════════════════════════════════ */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Hapus Pengumuman?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Pengumuman ini akan dihapus permanen dan tidak bisa dikembalikan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => deleteMutation.mutate(confirmDelete)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-60"
              >
                {deleteMutation.isPending ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
