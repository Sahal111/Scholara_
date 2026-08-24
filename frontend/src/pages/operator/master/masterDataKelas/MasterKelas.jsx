import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../../lib/axios";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ── Helpers ─────────────────────────────────────────────────────────────────────
function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function kapasitasBarColor(siswa, kapasitas) {
  if (!kapasitas) return "bg-madrasah-green";
  const pct = siswa / kapasitas;
  if (pct >= 1) return "bg-danger";
  if (pct >= 0.8) return "bg-warning";
  return "bg-madrasah-green";
}

function statusBadge(siswa, kapasitas, wali) {
  if (!wali)
    return {
      text: "No Wali",
      cls: "bg-surface-container-high text-text-secondary border-border-light",
    };
  if (!kapasitas)
    return {
      text: "Aktif",
      cls: "bg-[#d3ffd5] text-[#006e2a] border-[#a8f0ae]",
    };
  const pct = siswa / kapasitas;
  if (pct >= 1)
    return { text: "Penuh", cls: "bg-danger/10 text-danger border-danger/20" };
  if (pct >= 0.8)
    return {
      text: "Hampir Penuh",
      cls: "bg-warning/10 text-warning border-warning/20",
    };
  return { text: "Aktif", cls: "bg-[#d3ffd5] text-[#006e2a] border-[#a8f0ae]" };
}

// ── Modal Tambah / Edit Kelas ──────────────────────────────────────────────────
function ModalKelas({ open, onClose, editData, queryClient }) {
  const isEdit = !!editData;
  const emptyForm = {
    nama_kelas: "",
    tingkat: "1",
    kurikulum: "Merdeka",
    ruangan: "",
    kapasitas: "30",
    is_active: true,
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open)
      setForm(
        editData
          ? {
              nama_kelas: editData.nama_kelas ?? "",
              tingkat: editData.tingkat ?? "1",
              kurikulum: editData.kurikulum ?? "Merdeka",
              ruangan: editData.ruangan ?? "",
              kapasitas: editData.kapasitas ?? "30",
              is_active: editData.is_active ?? true,
            }
          : emptyForm,
      );
  }, [open, editData]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit
        ? api.put(`/operator/master-data/kelas/${editData.id}`, data)
        : api.post("/operator/master-data/kelas", data),
    onSuccess: () => {
      toast.success(
        `Data kelas berhasil ${isEdit ? "diperbarui" : "ditambahkan"}.`,
      );
      queryClient.invalidateQueries(["master-kelas"]);
      onClose();
    },
    onError: (err) => {
      const errors = err.response?.data?.errors;
      if (errors) Object.values(errors).forEach((e) => toast.error(e[0]));
      else toast.error(err.response?.data?.message ?? "Gagal menyimpan.");
    },
  });

  if (!open) return null;

  const inputCls =
    "w-full px-3.5 py-2.5 bg-surface-container-low border border-border-light rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-text-secondary/50";
  const labelCls = "block text-xs font-semibold text-text-secondary mb-1.5";

  const buildPayload = () => {
    const payload = {
      nama_kelas: form.nama_kelas,
      tingkat: form.tingkat,
      kurikulum: form.kurikulum,
      ruangan: form.ruangan || null,
      kapasitas: form.kapasitas,
    };
    if (isEdit) payload.is_active = form.is_active;
    return payload;
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-border-light/80"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light bg-surface-container-lowest">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-madrasah-green/10 flex items-center justify-center text-madrasah-green border border-madrasah-green/10">
              <span className="material-symbols-outlined text-[22px]">
                {isEdit ? "edit_note" : "add_circle"}
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">
                {isEdit ? "Edit Kelas" : "Tambah Kelas Baru"}
              </h3>
              <p className="text-xs text-text-secondary">
                Kelola data kelas dan ruangan belajar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-surface-container hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
          <div>
            <div className="flex items-center gap-2 mb-3 border-b border-border-light pb-2">
              <span className="material-symbols-outlined text-madrasah-green text-[18px]">
                meeting_room
              </span>
              <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Informasi Kelas
              </h4>
            </div>
            <div className="space-y-3.5">
              <div>
                <label className={labelCls}>
                  Nama Kelas <span className="text-danger">*</span>
                </label>
                <input
                  value={form.nama_kelas}
                  onChange={(e) => set("nama_kelas", e.target.value)}
                  className={inputCls}
                  placeholder="Contoh: 1A / Abu Bakar"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>
                    Tingkat <span className="text-danger">*</span>
                  </label>
                  <select
                    value={form.tingkat}
                    onChange={(e) => set("tingkat", e.target.value)}
                    className={inputCls}
                  >
                    {[1, 2, 3, 4, 5, 6].map((t) => (
                      <option key={t} value={t}>
                        Kelas {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>
                    Kurikulum <span className="text-danger">*</span>
                  </label>
                  <select
                    value={form.kurikulum}
                    onChange={(e) => set("kurikulum", e.target.value)}
                    className={inputCls}
                  >
                    <option value="Merdeka">Kurikulum Merdeka</option>
                    <option value="K13">Kurikulum 2013</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3 border-b border-border-light pb-2">
              <span className="material-symbols-outlined text-madrasah-green text-[18px]">
                door_open
              </span>
              <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Detail Ruangan
              </h4>
            </div>
            <div className="space-y-3.5">
              <div>
                <label className={labelCls}>Ruangan</label>
                <input
                  value={form.ruangan}
                  onChange={(e) => set("ruangan", e.target.value)}
                  className={inputCls}
                  placeholder="Contoh: R-101"
                />
              </div>
              <div>
                <label className={labelCls}>Kapasitas Siswa</label>
                <input
                  type="number"
                  value={form.kapasitas}
                  onChange={(e) => set("kapasitas", e.target.value)}
                  className={inputCls}
                  placeholder="30"
                />
              </div>
            </div>
          </div>

          {isEdit && (
            <div>
              <div className="flex items-center gap-2 mb-3 border-b border-border-light pb-2">
                <span className="material-symbols-outlined text-madrasah-green text-[18px]">
                  toggle_on
                </span>
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Status Kelas
                </h4>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-border-light">
                <div>
                  <p className="text-sm font-semibold text-on-surface">
                    Kelas Aktif
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Kelas nonaktif tidak muncul di filter default
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => set("is_active", !form.is_active)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_active ? "bg-success" : "bg-surface-container-high"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>
            </div>
          )}

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0 mt-0.5">
              info
            </span>
            <p className="text-xs leading-relaxed text-amber-800 font-medium">
              Tahun ajaran dan semester otomatis mengikuti yang sedang aktif.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-border-light bg-surface-container-lowest">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border-light text-text-secondary hover:bg-surface-container text-sm font-semibold transition-colors"
          >
            Batal
          </button>
          <button
            onClick={() => mutation.mutate(buildPayload())}
            disabled={mutation.isPending}
            className="flex-1 py-2.5 rounded-xl bg-primary-container text-on-primary text-sm font-semibold hover:bg-on-primary-fixed-variant shadow-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
                Menyimpan...
              </>
            ) : isEdit ? (
              "Perbarui Data"
            ) : (
              "Simpan Data"
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Skeleton Row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-border-light">
      {[4, 14, 18, 14, 22, 16, 14, 10].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div
            className="h-3 bg-surface-container rounded-full animate-pulse"
            style={{ width: `${w * 5}px` }}
          />
        </td>
      ))}
    </tr>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon,
  iconColor = "text-on-surface-variant",
  label,
  value,
  badge,
  sub,
  bar,
  barPct,
  barColor = "bg-madrasah-green",
}) {
  return (
    <div className="bg-white border border-border-light rounded-2xl p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 group relative overflow-hidden">
      {/* Ghost icon */}
      <div className="absolute top-2 right-3 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity pointer-events-none select-none">
        <span className={`material-symbols-outlined text-[72px] ${iconColor}`}>
          {icon}
        </span>
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.18em] mb-2">
          {label}
        </p>
        <div className="flex items-baseline gap-2">
          <span
            className="text-3xl font-black text-text-primary"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {value ?? "—"}
          </span>
          {badge && (
            <span className="text-xs text-success font-semibold flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[13px]">
                trending_up
              </span>
              {badge}
            </span>
          )}
        </div>
        {sub && <p className="text-xs text-text-secondary mt-1">{sub}</p>}
        {bar && (
          <div className="w-full bg-surface-container h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${Math.min(barPct ?? 0, 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Side Drawer ───────────────────────────────────────────────────────────────
function DrawerDetail({ kelas, open, onClose, onEdit, onDelete }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("info");

  useEffect(() => {
    if (open) setActiveTab("info");
  }, [open, kelas?.id]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!kelas) return null;

  const siswa = kelas.total_siswa ?? 0;
  const kap = kelas.kapasitas ?? 0;
  const pct = kap ? Math.round((siswa / kap) * 100) : 0;
  const { text: stText, cls: stCls } = statusBadge(
    siswa,
    kap,
    kelas.wali?.nama ?? kelas.nama_wali,
  );

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-y-0 right-0 w-full md:w-[460px] bg-white shadow-2xl border-l border-border-light z-50 flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-light bg-surface-container-low/40 shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h3
                className="font-bold text-text-primary text-base"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {kelas.nama_kelas}
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Kode:{" "}
                <span className="font-mono font-semibold">{kelas.id}</span>
                {kelas.tahun_ajaran?.tahun
                  ? ` • TA ${kelas.tahun_ajaran.tahun}`
                  : ""}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-container rounded-lg transition-colors ml-3"
            >
              <span className="material-symbols-outlined text-[20px]">
                close
              </span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-light shrink-0 px-6 gap-5">
          {[
            { id: "info", label: "Informasi" },
            { id: "siswa", label: "Daftar Siswa" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${activeTab === t.id ? "border-madrasah-green text-madrasah-green" : "border-transparent text-text-secondary hover:text-text-primary"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === "info" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface p-4 rounded-xl border border-border-light">
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                    Wali Kelas
                  </p>
                  {(kelas.wali?.nama ?? kelas.nama_wali) ? (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-madrasah-green/10 text-madrasah-green flex items-center justify-center text-[11px] font-bold shrink-0">
                        {initials(kelas.wali?.nama ?? kelas.nama_wali)}
                      </div>
                      <span className="text-sm font-medium text-text-primary leading-tight">
                        {kelas.wali?.nama ?? kelas.nama_wali}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm italic text-text-secondary">
                      Belum ditugaskan
                    </p>
                  )}
                </div>
                <div className="bg-surface p-4 rounded-xl border border-border-light">
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                    Ruangan
                  </p>
                  <p className="text-sm font-semibold text-text-primary">
                    {kelas.ruangan || "-"}
                  </p>
                  <p className="text-[10px] text-text-secondary mt-1">
                    Kapasitas: {kap} kursi
                  </p>
                </div>
              </div>

              <div className="bg-surface-container-low p-4 rounded-xl border border-border-light">
                <h4
                  className="text-sm font-semibold text-text-primary mb-4"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Statistik Siswa
                </h4>
                <div className="flex items-center gap-5">
                  <div
                    className="relative w-20 h-20 rounded-full shrink-0 flex items-center justify-center"
                    style={{
                      background: kap
                        ? `conic-gradient(#004d40 0% ${pct}%, #eaefe6 ${pct}% 100%)`
                        : "#eaefe6",
                    }}
                  >
                    <div className="w-14 h-14 bg-surface-container-low rounded-full flex items-center justify-center flex-col">
                      <span
                        className="font-bold text-base text-text-primary"
                        style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                      >
                        {siswa}
                      </span>
                      <span className="text-[9px] text-text-secondary uppercase tracking-wide">
                        Siswa
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2.5">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-secondary">Terisi</span>
                        <span className="font-semibold text-text-primary">
                          {siswa}/{kap} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${kapasitasBarColor(siswa, kap)}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${stCls}`}
                    >
                      {stText}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h4
                  className="text-sm font-semibold text-text-primary pb-2 border-b border-border-light"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Detail Akademik
                </h4>
                {[
                  { label: "Tingkat", value: `Kelas ${kelas.tingkat}` },
                  {
                    label: "Semester",
                    value: kelas.semester?.nama
                      ? `Semester ${kelas.semester.nama}`
                      : "-",
                  },
                  { label: "Kurikulum", value: kelas.kurikulum || "-" },
                  {
                    label: "Tahun Ajaran",
                    value: kelas.tahun_ajaran?.tahun || "-",
                  },
                  { label: "Status", badge: stText, badgeCls: stCls },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-3 py-2.5 border-b border-border-light border-dashed last:border-0 gap-2"
                  >
                    <span className="text-xs text-text-secondary col-span-1">
                      {row.label}
                    </span>
                    <span className="text-sm font-medium text-text-primary col-span-2">
                      {row.badge ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${row.badgeCls}`}
                        >
                          {row.badge}
                        </span>
                      ) : (
                        row.value
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === "siswa" && (
            <div className="text-center py-10 text-text-secondary">
              <span className="material-symbols-outlined text-[48px] text-border-light block mb-3">
                group
              </span>
              <p className="text-sm font-medium">
                Lihat detail lengkap daftar siswa
              </p>
              <button
                onClick={() => navigate(`/operator/master/kelas/${kelas.id}`)}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-primary-container text-on-primary rounded-xl text-sm font-semibold hover:bg-on-primary-fixed-variant transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">
                  open_in_new
                </span>
                Buka Halaman Detail
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-light bg-surface flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => {
              onDelete(kelas);
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-danger border border-danger/20 bg-danger/5 hover:bg-danger/10 text-sm font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">
              delete
            </span>
            Hapus
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border-light text-text-secondary rounded-xl text-sm font-medium hover:bg-surface-container transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={() => {
                onEdit(kelas);
                onClose();
              }}
              className="px-4 py-2 bg-primary-container text-on-primary rounded-xl text-sm font-semibold hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">
                edit
              </span>
              Edit Kelas
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function MasterKelas() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [tingkat, setTingkat] = useState("");
  const [semester, setSemester] = useState("");
  const [tahunAjaranFilter, setTahunAjaranFilter] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [drawerKelas, setDrawerKelas] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState(new Set());

  const { data, isLoading } = useQuery({
    queryKey: [
      "master-kelas",
      search,
      tingkat,
      semester,
      tahunAjaranFilter,
      page,
    ],
    queryFn: () =>
      api
        .get("/operator/master-data/kelas", {
          params: {
            search,
            tingkat,
            semester,
            tahun_ajaran_id: tahunAjaranFilter || undefined,
            page,
            per_page: 10,
          },
        })
        .then((r) => r.data.data),
    keepPreviousData: true,
  });

  const { data: tahunAjaranList } = useQuery({
    queryKey: ["tahun-ajaran-dropdown"],
    queryFn: () =>
      api.get("/operator/master-data/tahun-ajaran").then((r) => r.data.data),
  });

  const hapus = useMutation({
    mutationFn: (id) => api.delete(`/operator/master-data/kelas/${id}`),
    onSuccess: () => {
      toast.success("Data kelas dihapus.");
      queryClient.invalidateQueries(["master-kelas"]);
      setDrawerOpen(false);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message ?? "Gagal menghapus."),
  });

  const kelasList = data?.data ?? [];
  const total = data?.total ?? 0;
  const lastPage = data?.last_page ?? 1;

  const totalKelas = total;
  const totalSiswa = kelasList.reduce((s, k) => s + (k.total_siswa ?? 0), 0);
  const totalWali = kelasList.filter((k) => k.wali || k.nama_wali).length;
  const totalKap = kelasList.reduce((s, k) => s + (k.kapasitas ?? 0), 0);
  const waliPct =
    kelasList.length > 0 ? Math.round((totalWali / kelasList.length) * 100) : 0;
  const rataSiswa =
    kelasList.length > 0 ? Math.round(totalSiswa / kelasList.length) : 0;

  const openDrawer = (k) => {
    setDrawerKelas(k);
    setDrawerOpen(true);
  };
  const toggleSelect = (id) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const toggleAll = () => {
    if (selected.size === kelasList.length) setSelected(new Set());
    else setSelected(new Set(kelasList.map((k) => k.id)));
  };
  const hasFilter = search || tingkat || semester || tahunAjaranFilter;

  // Select styling shared
  const selectCls =
    "w-full bg-white border border-border-light rounded-xl py-3 pl-4 pr-9 text-text-primary font-bold text-xs uppercase tracking-wider focus:ring-2 focus:ring-madrasah-green/20 focus:border-madrasah-green appearance-none cursor-pointer transition-all outline-none";

  return (
    <div className="w-full space-y-6 pb-10">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-5">
        {/* Left */}
        <div className="flex-1 min-w-0">
          {/* LIVE DATA badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-border-light shadow-sm mb-4">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0"></span>
            <span className="text-[10px] font-black text-success uppercase tracking-[0.2em]">
              LIVE DATA
            </span>
          </div>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-text-secondary mb-2">
            <span>Dashboard</span>
            <span className="material-symbols-outlined text-[13px]">
              chevron_right
            </span>
            <span>Master Data</span>
            <span className="material-symbols-outlined text-[13px]">
              chevron_right
            </span>
            <span className="text-madrasah-green font-semibold">Kelas</span>
          </nav>

          <h1
            className="text-[28px] sm:text-[34px] font-black text-text-primary leading-tight tracking-tight mb-2"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Data Kelas{" "}
            <em
              className="font-normal not-italic text-madrasah-green"
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontStyle: "italic",
              }}
            >
              &amp; Rombongan Belajar
            </em>
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed max-w-lg">
            Kelola data kelas, kapasitas, dan penempatan wali kelas tahun ajaran
            aktif dengan sistem manajemen terpadu.
          </p>
        </div>

        {/* Right: Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => queryClient.invalidateQueries(["master-kelas"])}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-light text-text-secondary bg-white hover:bg-surface-container text-sm font-semibold transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">
              refresh
            </span>
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-light text-text-secondary bg-white hover:bg-surface-container text-sm font-semibold transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">
              upload
            </span>
            Import
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-light text-text-secondary bg-white hover:bg-surface-container text-sm font-semibold transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">
              download
            </span>
            Export
          </button>
          <button
            onClick={() => {
              setEditData(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-container text-on-primary text-sm font-black hover:bg-on-primary-fixed-variant transition-colors shadow-md shadow-madrasah-green/20 uppercase tracking-wider"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Tambah Kelas
          </button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          icon="meeting_room"
          iconColor="text-madrasah-green"
          label="Total Kelas"
          value={isLoading ? "—" : totalKelas}
          badge="+2"
        />
        <StatCard
          icon="layers"
          iconColor="text-amber-500"
          label="Tingkat MI"
          value={6}
          sub="Kelas 1 – 6"
        />
        <StatCard
          icon="person_check"
          iconColor="text-madrasah-green"
          label="Wali Kelas Terplot"
          value={isLoading ? "—" : `${totalWali} / ${kelasList.length}`}
          bar
          barPct={waliPct}
          barColor="bg-madrasah-green"
        />
        <StatCard
          icon="groups"
          iconColor="text-madrasah-green"
          label="Rata-rata Siswa"
          value={isLoading ? "—" : rataSiswa}
          sub="/ kelas"
        />
        <StatCard
          icon="inventory_2"
          iconColor="text-madrasah-green"
          label="Total Kapasitas"
          value={isLoading ? "—" : totalKap}
          sub={`Tersedia: ${Math.max(0, totalKap - totalSiswa)} slot`}
        />
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-border-light overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-border-light p-4 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center bg-white">
          {/* Search */}
          <div className="relative flex-1 group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-madrasah-green transition-colors text-[20px] pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-surface-container-low border border-border-light rounded-xl py-3 pl-12 pr-4 text-text-primary placeholder:text-text-secondary/60 focus:ring-2 focus:ring-madrasah-green/20 focus:border-madrasah-green transition-all text-sm font-medium outline-none"
              placeholder="Cari nama kelas, kode, atau wali kelas..."
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-2.5">
            {/* Tingkat */}
            <div className="relative flex-1 min-w-[130px] lg:flex-none lg:w-[148px]">
              <select
                value={tingkat}
                onChange={(e) => {
                  setTingkat(e.target.value);
                  setPage(1);
                }}
                className={selectCls}
              >
                <option value="">Tingkat: Semua</option>
                {[1, 2, 3, 4, 5, 6].map((t) => (
                  <option key={t} value={t}>
                    Tingkat {t}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[18px]">
                expand_more
              </span>
            </div>

            {/* Status/Semester */}
            <div className="relative flex-1 min-w-[130px] lg:flex-none lg:w-[148px]">
              <select
                value={semester}
                onChange={(e) => {
                  setSemester(e.target.value);
                  setPage(1);
                }}
                className={selectCls}
              >
                <option value="">Status: Semua</option>
                <option value="Ganjil">Semester Ganjil</option>
                <option value="Genap">Semester Genap</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[18px]">
                expand_more
              </span>
            </div>

            {/* Tahun Ajaran */}
            <div className="relative flex-1 min-w-[150px] lg:flex-none lg:w-[168px]">
              <select
                value={tahunAjaranFilter}
                onChange={(e) => {
                  setTahunAjaranFilter(e.target.value);
                  setPage(1);
                }}
                className={selectCls}
              >
                <option value="">Tahun Ajaran: Semua</option>
                {(tahunAjaranList ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tahun}
                    {t.is_active ? " ★" : ""}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[18px]">
                expand_more
              </span>
            </div>

            {/* Divider */}
            <div className="h-9 w-px bg-border-light hidden lg:block" />

            {/* Reset */}
            <button
              onClick={() => {
                setSearch("");
                setTingkat("");
                setSemester("");
                setTahunAjaranFilter("");
                setPage(1);
              }}
              className={`flex items-center gap-1.5 px-4 py-3 rounded-xl border text-sm font-bold uppercase tracking-wider transition-all shrink-0 ${hasFilter ? "border-danger/30 text-danger bg-danger/5 hover:bg-danger/10" : "border-border-light text-text-secondary bg-white hover:bg-danger/5 hover:text-danger hover:border-danger/30"}`}
            >
              <span className="material-symbols-outlined text-[18px]">
                refresh
              </span>
              Reset
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-low border-b border-border-light text-[11px] uppercase tracking-wider text-text-secondary font-bold">
              <tr>
                <th className="px-5 py-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={
                      kelasList.length > 0 && selected.size === kelasList.length
                    }
                    onChange={toggleAll}
                    className="w-4 h-4 text-madrasah-green border-border-light rounded focus:ring-madrasah-green focus:ring-2"
                  />
                </th>
                <th className="px-5 py-3.5">Kode</th>
                <th className="px-5 py-3.5">Nama Kelas</th>
                <th className="px-5 py-3.5 hidden md:table-cell">Tingkat</th>
                <th className="px-5 py-3.5 hidden lg:table-cell">Wali Kelas</th>
                <th className="px-5 py-3.5 hidden lg:table-cell">Kapasitas</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {isLoading ? (
                [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
              ) : kelasList.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-20 text-center text-text-secondary"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined text-[52px] text-border-light">
                        meeting_room
                      </span>
                      <p className="font-semibold text-text-primary">
                        Belum ada data kelas
                      </p>
                      <p className="text-xs opacity-70">
                        {hasFilter
                          ? "Coba ubah filter pencarian"
                          : "Mulai dengan menambahkan kelas pertama"}
                      </p>
                      {!hasFilter && (
                        <button
                          onClick={() => {
                            setEditData(null);
                            setModalOpen(true);
                          }}
                          className="mt-1 inline-flex items-center gap-2 px-5 py-2.5 bg-primary-container text-on-primary rounded-xl text-sm font-bold hover:bg-on-primary-fixed-variant transition-colors shadow-sm"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            add
                          </span>
                          Tambah Kelas Sekarang
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                kelasList.map((k) => {
                  const s = k.total_siswa ?? 0;
                  const kap = k.kapasitas ?? 0;
                  const { text: stText, cls: stCls } = statusBadge(
                    s,
                    kap,
                    k.wali?.nama ?? k.nama_wali,
                  );
                  const waliName = k.wali?.nama ?? k.nama_wali;
                  const isSelected = selected.has(k.id);

                  return (
                    <tr
                      key={k.id}
                      className={`group cursor-pointer transition-colors duration-150 ${isSelected ? "bg-madrasah-green/5" : "bg-white hover:bg-surface-container-low"}`}
                      onClick={() => openDrawer(k)}
                    >
                      {/* Checkbox */}
                      <td
                        className="px-5 py-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(k.id);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="w-4 h-4 text-madrasah-green border-border-light rounded focus:ring-madrasah-green focus:ring-2"
                        />
                      </td>

                      {/* Kode */}
                      <td className="px-5 py-4">
                        <span className="font-mono font-black text-madrasah-green text-sm">
                          {k.id}
                        </span>
                      </td>

                      {/* Nama Kelas */}
                      <td className="px-5 py-4">
                        <p
                          className="font-semibold text-text-primary"
                          style={{
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                          }}
                        >
                          {k.nama_kelas}
                        </p>
                        {k.kurikulum && (
                          <p className="text-[10px] text-text-secondary mt-0.5">
                            {k.kurikulum}
                          </p>
                        )}
                      </td>

                      {/* Tingkat */}
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="bg-surface-container-high px-2.5 py-1 rounded-lg text-xs font-semibold text-text-secondary">
                          Tingkat {k.tingkat}
                        </span>
                      </td>

                      {/* Wali Kelas */}
                      <td className="px-5 py-4 hidden lg:table-cell">
                        {waliName ? (
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-border-light bg-surface-container-high flex items-center justify-center shrink-0 text-xs font-bold text-madrasah-green">
                              {initials(waliName)}
                            </div>
                            <span className="text-sm text-text-secondary truncate max-w-[140px]">
                              {waliName}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-bold text-text-secondary border border-dashed border-border-light shrink-0">
                              ?
                            </div>
                            <span className="italic text-xs text-text-secondary">
                              Belum diplot
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Kapasitas */}
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-text-primary">
                            {s}
                          </span>
                          <span className="text-text-secondary text-xs">
                            / {kap || "—"}
                          </span>
                        </div>
                        {kap > 0 && (
                          <div className="w-20 bg-surface-container h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${kapasitasBarColor(s, kap)}`}
                              style={{
                                width: `${Math.min((s / kap) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-wider border ${stCls}`}
                        >
                          {stText}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td
                        className="px-5 py-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            onClick={() =>
                              navigate(`/operator/master/kelas/${k.id}`)
                            }
                            title="Detail"
                            className="p-2 rounded-lg text-text-secondary hover:text-madrasah-green hover:bg-madrasah-green/5 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              visibility
                            </span>
                          </button>
                          <button
                            onClick={() => {
                              setEditData(k);
                              setModalOpen(true);
                            }}
                            title="Edit"
                            className="p-2 rounded-lg text-text-secondary hover:text-madrasah-green hover:bg-madrasah-green/5 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              edit
                            </span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus kelas ${k.nama_kelas}?`))
                                hapus.mutate(k.id);
                            }}
                            title="Hapus"
                            className="p-2 rounded-lg text-text-secondary hover:text-danger hover:bg-danger/5 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-4 border-t border-border-light bg-surface-container-low/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <p className="text-sm text-text-secondary">
              Menampilkan{" "}
              <span className="text-madrasah-green font-bold">
                {total === 0 ? 0 : (page - 1) * 10 + 1}
              </span>{" "}
              sampai{" "}
              <span className="text-madrasah-green font-bold">
                {Math.min(page * 10, total)}
              </span>{" "}
              dari{" "}
              <span className="text-madrasah-green font-bold">{total}</span>{" "}
              entri
            </p>
            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs text-text-secondary">
                Baris per halaman:
              </span>
              <div className="relative">
                <select className="appearance-none bg-white border border-border-light rounded-lg py-1 pl-3 pr-7 text-xs font-bold text-madrasah-green focus:ring-2 focus:ring-madrasah-green/20 focus:border-madrasah-green cursor-pointer outline-none">
                  <option>10</option>
                  <option>20</option>
                  <option>50</option>
                </select>
                <span className="material-symbols-outlined absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-[15px] text-text-secondary">
                  expand_more
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-border-light text-text-secondary bg-white hover:text-madrasah-green hover:border-madrasah-green/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[20px]">
                chevron_left
              </span>
            </button>

            {[...Array(Math.min(lastPage, 5))].map((_, i) => {
              const pg = i + 1;
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold transition-all border ${
                    page === pg
                      ? "bg-primary-container text-on-primary border-primary-container shadow-sm shadow-madrasah-green/20"
                      : "border-transparent text-text-secondary hover:bg-white hover:border-border-light"
                  }`}
                >
                  {pg}
                </button>
              );
            })}

            {lastPage > 5 && (
              <span className="text-text-secondary text-xs px-1">
                …{lastPage}
              </span>
            )}

            <button
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-border-light text-madrasah-green bg-white hover:bg-primary-container hover:text-on-primary hover:border-primary-container transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[20px]">
                chevron_right
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Side Drawer ── */}
      <DrawerDetail
        kelas={drawerKelas}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onEdit={(k) => {
          setEditData(k);
          setModalOpen(true);
        }}
        onDelete={(k) => {
          if (confirm(`Hapus kelas ${k.nama_kelas}?`)) hapus.mutate(k.id);
        }}
      />

      {/* ── Modal Tambah/Edit ── */}
      <ModalKelas
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditData(null);
        }}
        editData={editData}
        queryClient={queryClient}
      />
    </div>
  );
}
