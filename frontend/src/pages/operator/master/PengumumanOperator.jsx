import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/axios";
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  X,
  Clock,
  CalendarDays,
  Users,
  Calendar,
  AlertTriangle,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";

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

const formatWaktu = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export default function PengumumanOperator() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const [formData, setFormData] = useState({
    judul: "",
    konten: "",
    kategori: "Informasi",
  });

  // Query Data
  const { data: pengumuman, isLoading } = useQuery({
    queryKey: ["pengumuman-list"],
    queryFn: () => api.get("/pengumuman").then((r) => r.data.data),
  });

  // Mutation Tambah
  const addMutation = useMutation({
    mutationFn: (data) => api.post("/operator/pengumuman", data),
    onSuccess: () => {
      toast.success("Pengumuman berhasil ditambahkan");
      queryClient.invalidateQueries(["pengumuman-list"]);
      closeModal();
    },
    onError: () => toast.error("Gagal menambahkan pengumuman"),
  });

  // Mutation Edit
  const editMutation = useMutation({
    mutationFn: (data) => api.put(`/operator/pengumuman/${editItem.id}`, data),
    onSuccess: () => {
      toast.success("Pengumuman berhasil diperbarui");
      queryClient.invalidateQueries(["pengumuman-list"]);
      closeModal();
    },
    onError: () => toast.error("Gagal memperbarui pengumuman"),
  });

  // Mutation Delete
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/operator/pengumuman/${id}`),
    onSuccess: () => {
      toast.success("Pengumuman berhasil dihapus");
      queryClient.invalidateQueries(["pengumuman-list"]);
    },
    onError: () => toast.error("Gagal menghapus pengumuman"),
  });

  const handleDelete = (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus pengumuman ini?")) {
      deleteMutation.mutate(id);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditItem(item);
      setFormData({
        judul: item.judul,
        konten: item.konten,
        kategori: item.kategori,
      });
    } else {
      setEditItem(null);
      setFormData({ judul: "", konten: "", kategori: "Informasi" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditItem(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.judul || !formData.konten) {
      toast.error("Judul dan konten harus diisi");
      return;
    }

    if (editItem) {
      editMutation.mutate(formData);
    } else {
      addMutation.mutate(formData);
    }
  };

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
            Buat dan atur informasi yang akan dilihat oleh seluruh guru dan
            staf.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Pengumuman Baru
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-400">Memuat data pengumuman...</p>
        </div>
      )}

      {/* Grid Pengumuman */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {pengumuman?.map((item) => {
            const cfg =
              KATEGORI_CONFIG[item.kategori] || KATEGORI_CONFIG["Informasi"];

            return (
              <div
                key={item.id}
                className="card p-6 flex flex-col h-full border border-gray-100 hover:border-indigo-100 transition-colors group"
              >
                <div className="flex justify-between items-start mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${cfg.color}`}
                  >
                    {item.kategori}
                  </span>

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openModal(item)}
                      className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                  {item.judul}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1 whitespace-pre-wrap">
                  {item.konten}
                </p>

                <div className="pt-4 mt-auto border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {formatWaktu(item.created_at)}
                  </span>
                  <span>Oleh: {item.penulis?.username}</span>
                </div>
              </div>
            );
          })}

          {!isLoading && pengumuman?.length === 0 && (
            <div className="col-span-full card p-16 text-center border-dashed">
              <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Belum ada pengumuman</p>
              <p className="text-sm text-gray-400 mt-1">
                Klik tombol 'Pengumuman Baru' untuk membuat.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal Tambah/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Judul Pengumuman
                </label>
                <input
                  type="text"
                  required
                  value={formData.judul}
                  onChange={(e) =>
                    setFormData({ ...formData, judul: e.target.value })
                  }
                  className="input-field"
                  placeholder="Contoh: Libur Hari Raya"
                />
              </div>

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
                  {KATEGORI_OPTIONS.map((kat) => (
                    <option key={kat} value={kat}>
                      {kat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Isi Pengumuman
                </label>
                <textarea
                  required
                  rows="5"
                  value={formData.konten}
                  onChange={(e) =>
                    setFormData({ ...formData, konten: e.target.value })
                  }
                  className="input-field resize-none"
                  placeholder="Tulis rincian pengumuman di sini..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending || editMutation.isPending}
                  className="btn-primary"
                >
                  {addMutation.isPending || editMutation.isPending
                    ? "Menyimpan..."
                    : "Simpan Pengumuman"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
