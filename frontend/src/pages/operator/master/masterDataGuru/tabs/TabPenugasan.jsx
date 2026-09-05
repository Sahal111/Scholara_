import { useState } from "react";
import { useAuth } from "../../../../../contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../../../lib/axios";
import toast from "react-hot-toast";

/**
 * TabPenugasan — Tab 2: Penugasan Mengajar & Kompetensi Guru
 */
export default function TabPenugasan({ guru, nuptk }) {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("master_data.guru.create");
  const canUpdate = hasPermission("master_data.guru.update");
  const canDelete = hasPermission("master_data.guru.delete");
  const queryClient = useQueryClient();

  // ── State Modal Penugasan ──
  const [showModalPenugasan, setShowModalPenugasan] = useState(false);
  const [formPenugasan, setFormPenugasan] = useState({
    mapel_id: "",
    kelas_id: "",
    tahun_ajaran_id: "",
    semester_id: "",
    beban_jam: "",
  });
  const [filterSemester, setFilterSemester] = useState("semua");

  // ── State Modal Kompetensi ──
  const [showModalKomp, setShowModalKomp] = useState(false);
  const [editKomp, setEditKomp] = useState(null);
  const [formKomp, setFormKomp] = useState({
    jenis: "bidang_keahlian",
    nama: "",
    tingkat: "Menengah",
    keterangan: "",
  });

  // ── Queries ──
  const { data: penugasanList = [], isLoading: loadingPenugasan } = useQuery({
    queryKey: ["guru-penugasan", nuptk],
    queryFn: () =>
      api
        .get(`/operator/master-data/guru/${nuptk}/penugasan`)
        .then((r) => r.data.data),
    initialData: guru.plot_guru_mapels ?? [],
  });
  const { data: kompetensiList = [], isLoading: loadingKomp } = useQuery({
    queryKey: ["guru-kompetensi", nuptk],
    queryFn: () =>
      api
        .get(`/operator/master-data/guru/${nuptk}/kompetensi`)
        .then((r) => r.data.data),
    initialData: guru.kompetensi ?? [],
  });
  const { data: mapelList = [] } = useQuery({
    queryKey: ["mapel-dropdown"],
    queryFn: () =>
      api.get("/operator/master-data/mapel/dropdown").then((r) => r.data.data),
  });
  const { data: kelasList = [] } = useQuery({
    queryKey: ["kelas-dropdown"],
    queryFn: () =>
      api.get("/operator/master-data/kelas/dropdown").then((r) => r.data.data),
  });
  const { data: tahunAjaranList = [] } = useQuery({
    queryKey: ["tahun-ajaran-list"],
    queryFn: () =>
      api.get("/operator/master-data/tahun-ajaran").then((r) => r.data.data),
  });

  const selectedTA = tahunAjaranList.find(
    (t) => String(t.id) === String(formPenugasan.tahun_ajaran_id),
  );
  const semesterOpts = selectedTA?.semesters ?? [];

  // ── Mutations ──
  const addPenugasan = useMutation({
    mutationFn: (data) =>
      api.post(`/operator/master-data/guru/${nuptk}/penugasan`, data),
    onSuccess: () => {
      toast.success("Penugasan ditambahkan.");
      queryClient.invalidateQueries(["guru-penugasan", nuptk]);
      setShowModalPenugasan(false);
      setFormPenugasan({
        mapel_id: "",
        kelas_id: "",
        tahun_ajaran_id: "",
        semester_id: "",
        beban_jam: "",
      });
    },
    onError: (e) =>
      toast.error(e.response?.data?.message ?? "Gagal menambah penugasan."),
  });
  const deletePenugasan = useMutation({
    mutationFn: (id) =>
      api.delete(`/operator/master-data/guru/${nuptk}/penugasan/${id}`),
    onSuccess: () => {
      toast.success("Penugasan dihapus.");
      queryClient.invalidateQueries(["guru-penugasan", nuptk]);
    },
    onError: (e) =>
      toast.error(e.response?.data?.message ?? "Gagal menghapus."),
  });
  const saveKomp = useMutation({
    mutationFn: ({ data, id }) =>
      id
        ? api.put(`/operator/master-data/guru/${nuptk}/kompetensi/${id}`, data)
        : api.post(`/operator/master-data/guru/${nuptk}/kompetensi`, data),
    onSuccess: () => {
      toast.success(
        editKomp ? "Kompetensi diperbarui." : "Kompetensi ditambahkan.",
      );
      queryClient.invalidateQueries(["guru-kompetensi", nuptk]);
      setShowModalKomp(false);
      setEditKomp(null);
      setFormKomp({
        jenis: "bidang_keahlian",
        nama: "",
        tingkat: "Menengah",
        keterangan: "",
      });
    },
    onError: (e) =>
      toast.error(e.response?.data?.message ?? "Gagal menyimpan."),
  });
  const deleteKomp = useMutation({
    mutationFn: (id) =>
      api.delete(`/operator/master-data/guru/${nuptk}/kompetensi/${id}`),
    onSuccess: () => {
      toast.success("Kompetensi dihapus.");
      queryClient.invalidateQueries(["guru-kompetensi", nuptk]);
    },
    onError: (e) =>
      toast.error(e.response?.data?.message ?? "Gagal menghapus."),
  });

  const jenisLabel = {
    bahasa: "Bahasa",
    it: "Teknologi/IT",
    bidang_keahlian: "Bidang Keahlian",
    lainnya: "Lainnya",
  };
  const tingkatColor = {
    Dasar: "bg-blue-50 text-blue-700",
    Menengah: "bg-amber-50 text-amber-700",
    Mahir: "bg-green-50 text-green-700",
    Ahli: "bg-purple-50 text-purple-700",
  };

  const filteredPenugasan =
    filterSemester === "semua"
      ? penugasanList
      : penugasanList.filter((p) => String(p.semester_id) === filterSemester);

  const semesterFilter = Array.from(
    new Map(penugasanList.map((p) => [p.semester_id, p.semester])).entries(),
  ).map(([id, sem]) => ({ id, nama: sem?.nama ?? "-" }));

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-border-light bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm";

  return (
    <div className="space-y-6">
      {/* ── SEKSI PENUGASAN ── */}
      <div className="bg-white rounded-[16px] border border-outline-variant/30 shadow-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-3xl">
                menu_book
              </span>
            </div>
            <div>
              <h3 className="font-section-title text-section-title text-text-primary">
                Penugasan Mengajar
              </h3>
              <p className="text-sm text-text-secondary">
                Plot mata pelajaran yang diajarkan guru ini
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowModalPenugasan(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Tambah Penugasan
          </button>
        </div>

        {semesterFilter.length > 0 && (
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setFilterSemester("semua")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterSemester === "semua" ? "bg-primary text-white" : "bg-surface-container text-text-secondary hover:bg-surface-container-high"}`}
            >
              Semua
            </button>
            {semesterFilter.map((s) => (
              <button
                key={s.id}
                onClick={() => setFilterSemester(String(s.id))}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterSemester === String(s.id) ? "bg-primary text-white" : "bg-surface-container text-text-secondary hover:bg-surface-container-high"}`}
              >
                {s.nama}
              </button>
            ))}
          </div>
        )}

        {loadingPenugasan ? (
          <p className="text-sm text-text-secondary text-center py-8">
            Memuat data...
          </p>
        ) : filteredPenugasan.length === 0 ? (
          <div className="text-center py-10">
            <span className="material-symbols-outlined text-4xl text-text-secondary/40 mb-2 block">
              assignment
            </span>
            <p className="text-sm text-text-secondary">
              Belum ada data penugasan mengajar.
            </p>
            <p className="text-xs text-text-secondary/70 mt-1">
              Klik "Tambah Penugasan" untuk memulai.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light">
                  {[
                    "Mata Pelajaran",
                    "Kelas",
                    "Tahun Ajaran",
                    "Semester",
                    "Beban Jam",
                    "Aksi",
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={`pb-3 text-text-secondary font-medium pr-4 ${i === 5 ? "text-right pr-0" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filteredPenugasan.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-surface-container-low/30 transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <p className="font-medium text-text-primary">
                        {p.mapel?.nama_mapel ?? "-"}
                      </p>
                      {p.mapel?.kelompok && (
                        <p className="text-xs text-text-secondary mt-0.5">
                          {p.mapel.kelompok}
                        </p>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-text-primary">
                      {p.kelas?.nama_kelas ?? "-"}
                    </td>
                    <td className="py-3 pr-4 text-text-secondary">
                      {p.tahun_ajaran?.tahun ?? "-"}
                    </td>
                    <td className="py-3 pr-4 text-text-secondary">
                      {p.semester?.nama ?? "-"}
                    </td>
                    <td className="py-3 pr-4 text-text-secondary">
                      {p.beban_jam ? `${p.beban_jam} jam` : "-"}
                    </td>
                    <td className="py-3 text-right">
                      {canDelete && (
                        <button
                          onClick={() => {
                            if (
                              !confirm(
                                "Hapus penugasan ini? Jadwal terkait juga akan dihapus.",
                              )
                            )
                              return;
                            deletePenugasan.mutate(p.id);
                          }}
                          className="p-1.5 rounded-lg text-danger hover:bg-danger/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            delete
                          </span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── SEKSI KOMPETENSI ── */}
      <div className="bg-white rounded-[16px] border border-outline-variant/30 shadow-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center text-success">
              <span className="material-symbols-outlined text-3xl">
                psychology
              </span>
            </div>
            <div>
              <h3 className="font-section-title text-section-title text-text-primary">
                Kompetensi Guru
              </h3>
              <p className="text-sm text-text-secondary">
                Kemampuan bahasa, teknologi, dan bidang keahlian
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditKomp(null);
              setFormKomp({
                jenis: "bidang_keahlian",
                nama: "",
                tingkat: "Menengah",
                keterangan: "",
              });
              setShowModalKomp(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-xl text-sm font-medium hover:bg-success/90 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Tambah Kompetensi
          </button>
        </div>

        {loadingKomp ? (
          <p className="text-sm text-text-secondary text-center py-8">
            Memuat data...
          </p>
        ) : kompetensiList.length === 0 ? (
          <div className="text-center py-10">
            <span className="material-symbols-outlined text-4xl text-text-secondary/40 mb-2 block">
              emoji_objects
            </span>
            <p className="text-sm text-text-secondary">
              Belum ada data kompetensi.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {kompetensiList.map((k) => (
              <div
                key={k.id}
                className="flex items-start justify-between p-4 rounded-xl border border-border-light bg-surface-container-low/30 hover:bg-surface-container-low transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-surface-container-high text-text-secondary">
                      {jenisLabel[k.jenis] ?? k.jenis}
                    </span>
                    {k.tingkat && (
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${tingkatColor[k.tingkat] ?? "bg-surface-container text-text-secondary"}`}
                      >
                        {k.tingkat}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {k.nama}
                  </p>
                  {k.keterangan && (
                    <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                      {k.keterangan}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 ml-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      setEditKomp(k);
                      setFormKomp({
                        jenis: k.jenis,
                        nama: k.nama,
                        tingkat: k.tingkat ?? "Menengah",
                        keterangan: k.keterangan ?? "",
                      });
                      setShowModalKomp(true);
                    }}
                    className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      edit
                    </span>
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => {
                        if (!confirm("Hapus kompetensi ini?")) return;
                        deleteKomp.mutate(k.id);
                      }}
                      className="p-1.5 rounded-lg text-danger hover:bg-danger/10 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        delete
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL TAMBAH PENUGASAN ── */}
      {showModalPenugasan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg border border-border-light max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-light flex-shrink-0">
              <h3 className="font-bold text-text-primary">
                Tambah Penugasan Mengajar
              </h3>
              <button
                onClick={() => setShowModalPenugasan(false)}
                className="p-1.5 rounded-lg text-text-secondary hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Mata Pelajaran <span className="text-danger">*</span>
                </label>
                <select
                  value={formPenugasan.mapel_id}
                  onChange={(e) =>
                    setFormPenugasan((f) => ({
                      ...f,
                      mapel_id: e.target.value,
                    }))
                  }
                  className={inputClass}
                >
                  <option value="">-- Pilih Mata Pelajaran --</option>
                  {mapelList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama_mapel} {m.kelompok ? `(${m.kelompok})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Kelas <span className="text-danger">*</span>
                </label>
                <select
                  value={formPenugasan.kelas_id}
                  onChange={(e) =>
                    setFormPenugasan((f) => ({
                      ...f,
                      kelas_id: e.target.value,
                    }))
                  }
                  className={inputClass}
                >
                  <option value="">-- Pilih Kelas --</option>
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama_kelas}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Tahun Ajaran <span className="text-danger">*</span>
                </label>
                <select
                  value={formPenugasan.tahun_ajaran_id}
                  onChange={(e) =>
                    setFormPenugasan((f) => ({
                      ...f,
                      tahun_ajaran_id: e.target.value,
                      semester_id: "",
                    }))
                  }
                  className={inputClass}
                >
                  <option value="">-- Pilih Tahun Ajaran --</option>
                  {tahunAjaranList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.tahun}
                      {t.is_active ? " (Aktif)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Semester <span className="text-danger">*</span>
                </label>
                <select
                  value={formPenugasan.semester_id}
                  onChange={(e) =>
                    setFormPenugasan((f) => ({
                      ...f,
                      semester_id: e.target.value,
                    }))
                  }
                  disabled={semesterOpts.length === 0}
                  className={`${inputClass} disabled:opacity-50`}
                >
                  <option value="">-- Pilih Semester --</option>
                  {semesterOpts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama}
                    </option>
                  ))}
                </select>
                {formPenugasan.tahun_ajaran_id && semesterOpts.length === 0 && (
                  <p className="text-xs text-warning mt-1">
                    Tahun ajaran ini belum memiliki semester.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Beban Jam / Minggu
                </label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={formPenugasan.beban_jam}
                  onChange={(e) =>
                    setFormPenugasan((f) => ({
                      ...f,
                      beban_jam: e.target.value,
                    }))
                  }
                  className={inputClass}
                  placeholder="Contoh: 4"
                />
              </div>
            </div>
            <div className="flex gap-2 px-6 py-4 border-t border-border-light flex-shrink-0">
              <button
                onClick={() => setShowModalPenugasan(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border-light text-text-secondary hover:bg-surface-container text-sm font-medium transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (
                    !formPenugasan.mapel_id ||
                    !formPenugasan.kelas_id ||
                    !formPenugasan.tahun_ajaran_id ||
                    !formPenugasan.semester_id
                  ) {
                    toast.error(
                      "Mata pelajaran, kelas, tahun ajaran, dan semester wajib dipilih.",
                    );
                    return;
                  }
                  addPenugasan.mutate(formPenugasan);
                }}
                disabled={addPenugasan.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {addPenugasan.isPending ? "Menyimpan..." : "Simpan Penugasan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL TAMBAH/EDIT KOMPETENSI ── */}
      {showModalKomp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md border border-border-light">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
              <h3 className="font-bold text-text-primary">
                {editKomp ? "Edit Kompetensi" : "Tambah Kompetensi"}
              </h3>
              <button
                onClick={() => setShowModalKomp(false)}
                className="p-1.5 rounded-lg text-text-secondary hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Jenis Kompetensi <span className="text-danger">*</span>
                </label>
                <select
                  value={formKomp.jenis}
                  onChange={(e) =>
                    setFormKomp((f) => ({ ...f, jenis: e.target.value }))
                  }
                  className={inputClass}
                >
                  <option value="bahasa">Bahasa</option>
                  <option value="it">Teknologi / IT</option>
                  <option value="bidang_keahlian">Bidang Keahlian</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Nama Kompetensi <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={formKomp.nama}
                  onChange={(e) =>
                    setFormKomp((f) => ({ ...f, nama: e.target.value }))
                  }
                  maxLength={150}
                  className={inputClass}
                  placeholder="Contoh: Microsoft Office, Bahasa Inggris, dst."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Tingkat
                </label>
                <select
                  value={formKomp.tingkat}
                  onChange={(e) =>
                    setFormKomp((f) => ({ ...f, tingkat: e.target.value }))
                  }
                  className={inputClass}
                >
                  {["Dasar", "Menengah", "Mahir", "Ahli"].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Keterangan
                </label>
                <textarea
                  rows={2}
                  value={formKomp.keterangan}
                  onChange={(e) =>
                    setFormKomp((f) => ({ ...f, keterangan: e.target.value }))
                  }
                  maxLength={255}
                  className={`${inputClass} resize-none`}
                  placeholder="Opsional — tambahkan keterangan singkat"
                />
              </div>
            </div>
            <div className="flex gap-2 px-6 py-4 border-t border-border-light">
              <button
                onClick={() => setShowModalKomp(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border-light text-text-secondary hover:bg-surface-container text-sm font-medium transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (!formKomp.nama.trim()) {
                    toast.error("Nama kompetensi wajib diisi.");
                    return;
                  }
                  saveKomp.mutate({ data: formKomp, id: editKomp?.id });
                }}
                disabled={saveKomp.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {saveKomp.isPending ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
