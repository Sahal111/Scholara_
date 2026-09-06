import { useState, useRef } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/axios";
import {
  Images,
  Plus,
  Trash2,
  X,
  Upload,
  ImageOff,
  Tag,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";

const KATEGORI_OPTIONS = [
  { value: "kegiatan", label: "Kegiatan" },
  { value: "prestasi", label: "Prestasi" },
  { value: "ekstrakurikuler", label: "Ekstrakurikuler" },
  { value: "fasilitas", label: "Fasilitas" },
  { value: "acara", label: "Acara" },
];

const KATEGORI_COLOR = {
  kegiatan: "bg-blue-100 text-blue-700 border-blue-200",
  prestasi: "bg-yellow-100 text-yellow-700 border-yellow-200",
  ekstrakurikuler: "bg-purple-100 text-purple-700 border-purple-200",
  fasilitas: "bg-green-100 text-green-700 border-green-200",
  acara: "bg-red-100 text-red-700 border-red-200",
};

export default function GaleriOperator() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("dms.create");
  const canUpdate = hasPermission("dms.update");
  const canDelete = hasPermission("dms.delete");
  const canImport = hasPermission("dms.import");
  const canExport = hasPermission("dms.export");
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [formData, setFormData] = useState({
    judul: "",
    deskripsi: "",
    kategori: "kegiatan",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  // ── Fetch galeri ──────────────────────────────────────────────────
  const { data: galeri = [], isLoading } = useQuery({
    queryKey: ["galeri-list"],
    queryFn: () => api.get("/galeri").then((r) => r.data.data),
  });

  // ── Upload foto ───────────────────────────────────────────────────
  const uploadMutation = useMutation({
    mutationFn: (payload) => {
      const fd = new FormData();
      fd.append("foto", payload.file);
      fd.append("judul", payload.judul);
      fd.append("deskripsi", payload.deskripsi);
      fd.append("kategori", payload.kategori);
      return api.post("/operator/galeri", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast.success("Foto berhasil diupload ke galeri");
      queryClient.invalidateQueries(["galeri-list"]);
      closeModal();
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || "Gagal mengupload foto";
      toast.error(msg);
    },
  });

  // ── Hapus foto ────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/operator/galeri/${id}`),
    onSuccess: () => {
      toast.success("Foto berhasil dihapus dari galeri");
      queryClient.invalidateQueries(["galeri-list"]);
      setPreviewItem(null);
    },
    onError: () => toast.error("Gagal menghapus foto"),
  });

  // ── Handlers ──────────────────────────────────────────────────────
  const openModal = () => {
    setFormData({ judul: "", deskripsi: "", kategori: "kegiatan" });
    setSelectedFile(null);
    setFilePreview(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      toast.error("Format file harus JPG atau PNG");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 2MB");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setFilePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Pilih foto terlebih dahulu");
      return;
    }
    if (!formData.judul.trim()) {
      toast.error("Judul foto harus diisi");
      return;
    }
    uploadMutation.mutate({ file: selectedFile, ...formData });
  };

  const handleDelete = (id) => {
    if (window.confirm("Yakin ingin menghapus foto ini dari galeri?")) {
      deleteMutation.mutate(id);
    }
  };

  const filtered =
    activeFilter === "all"
      ? galeri
      : galeri.filter((g) => g.kategori === activeFilter);

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Images className="w-6 h-6 text-indigo-600" />
            Kelola Galeri Foto
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload dan atur foto yang ditampilkan di halaman Galeri publik.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={openModal}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Upload Foto
          </button>
        )}
      </div>

      {/* ── Filter Kategori ───────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeFilter === "all"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Semua ({galeri.length})
          </button>
          {KATEGORI_OPTIONS.map(({ value, label }) => {
            const count = galeri.filter((g) => g.kategori === value).length;
            return (
              <button
                key={value}
                onClick={() => setActiveFilter(value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === value
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Loading ───────────────────────────────────────────────── */}
      {isLoading && (
        <div className="card p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-400">Memuat data galeri...</p>
        </div>
      )}

      {/* ── Grid Foto ─────────────────────────────────────────────── */}
      {!isLoading && (
        <>
          {filtered.length === 0 ? (
            <div className="card p-16 text-center border-dashed border-2 border-gray-200">
              <ImageOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                {activeFilter === "all"
                  ? "Belum ada foto di galeri"
                  : `Belum ada foto kategori ini`}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Klik tombol 'Upload Foto' untuk menambahkan.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((item) => {
                const catCfg =
                  KATEGORI_COLOR[item.kategori] || KATEGORI_COLOR.kegiatan;
                return (
                  <div
                    key={item.id}
                    className="group relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setPreviewItem(item)}
                  >
                    {/* Gambar */}
                    <div className="aspect-square overflow-hidden bg-gray-100">
                      <img
                        src={item.foto_url}
                        alt={item.judul}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>

                    {/* Overlay action buttons */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewItem(item);
                        }}
                        className="p-1.5 bg-white/90 text-indigo-600 rounded-lg shadow hover:bg-white transition-colors"
                        title="Lihat detail"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {canDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                          className="p-1.5 bg-white/90 text-red-600 rounded-lg shadow hover:bg-white transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border mb-1 ${catCfg}`}
                      >
                        {item.kategori}
                      </span>
                      <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                        {item.judul}
                      </p>
                      {item.deskripsi && (
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                          {item.deskripsi}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Modal Upload ──────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                Upload Foto ke Galeri
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Area Upload Foto */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Foto <span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl cursor-pointer transition-colors overflow-hidden ${
                    filePreview
                      ? "border-indigo-300"
                      : "border-gray-300 hover:border-indigo-400"
                  }`}
                >
                  {filePreview ? (
                    <div className="relative">
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white text-sm font-medium">
                          Klik untuk ganti foto
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                      <Upload className="w-10 h-10 text-gray-300 mb-2" />
                      <p className="text-sm font-medium text-gray-600">
                        Klik untuk pilih foto
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        JPG, PNG • Maks. 2MB
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpg,image/jpeg,image/png"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Judul */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Judul Foto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.judul}
                  onChange={(e) =>
                    setFormData({ ...formData, judul: e.target.value })
                  }
                  className="input-field"
                  placeholder="Contoh: Upacara Hari Kemerdekaan"
                />
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  Kategori
                </label>
                <select
                  value={formData.kategori}
                  onChange={(e) =>
                    setFormData({ ...formData, kategori: e.target.value })
                  }
                  className="input-field"
                >
                  {KATEGORI_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Deskripsi{" "}
                  <span className="text-gray-400 font-normal">(opsional)</span>
                </label>
                <textarea
                  rows="2"
                  value={formData.deskripsi}
                  onChange={(e) =>
                    setFormData({ ...formData, deskripsi: e.target.value })
                  }
                  className="input-field resize-none"
                  placeholder="Keterangan singkat tentang foto ini..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploadMutation.isPending}
                  className="btn-primary flex items-center gap-2"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Mengupload...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Foto
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Preview ─────────────────────────────────────────── */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gambar besar */}
            <div className="relative bg-gray-900">
              <img
                src={previewItem.foto_url}
                alt={previewItem.judul}
                className="w-full max-h-[60vh] object-contain"
              />
              <button
                onClick={() => setPreviewItem(null)}
                className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-xl hover:bg-black/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info detail */}
            <div className="p-5 flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border mb-2 ${
                    KATEGORI_COLOR[previewItem.kategori] ||
                    KATEGORI_COLOR.kegiatan
                  }`}
                >
                  {previewItem.kategori}
                </span>
                <h3 className="text-lg font-bold text-gray-800">
                  {previewItem.judul}
                </h3>
                {previewItem.deskripsi && (
                  <p className="text-sm text-gray-500 mt-1">
                    {previewItem.deskripsi}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Diupload:{" "}
                  {new Date(previewItem.created_at).toLocaleDateString(
                    "id-ID",
                    {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    },
                  )}
                </p>
              </div>
              {canDelete && (
                <button
                  onClick={() => handleDelete(previewItem.id)}
                  disabled={deleteMutation.isPending}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
