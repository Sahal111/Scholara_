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

function kapasitasColor(siswa, kapasitas) {
  if (!kapasitas) return "bg-secondary";
  const pct = siswa / kapasitas;
  if (pct >= 1) return "bg-error";
  if (pct >= 0.8) return "bg-on-tertiary-container";
  return "bg-secondary";
}

function statusLabel(siswa, kapasitas, wali) {
  if (!wali)
    return {
      text: "No Wali",
      cls: "bg-surface-container text-on-surface-variant border-outline-variant/30",
    };
  if (!kapasitas)
    return {
      text: "Aktif",
      cls: "bg-secondary-container/20 text-on-secondary-container border-secondary-container/30",
    };
  const pct = siswa / kapasitas;
  if (pct >= 1)
    return {
      text: "Penuh",
      cls: "bg-error-container/20 text-error border-error-container/30",
    };
  if (pct >= 0.8)
    return {
      text: "Hampir Penuh",
      cls: "bg-tertiary-fixed/20 text-on-tertiary-container border-tertiary-fixed/30",
    };
  return {
    text: "Aktif",
    cls: "bg-secondary-container/20 text-on-secondary-container border-secondary-container/30",
  };
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
    "w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm text-on-surface focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition-all placeholder:text-outline";
  const labelCls =
    "block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2";

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
        className="bg-surface-container-lowest rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-outline-variant/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/20 bg-surface-container-low/50">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20">
              <span className="material-symbols-outlined text-[22px]">
                {isEdit ? "edit_note" : "add_circle"}
              </span>
            </div>
            <div>
              <h3
                className="text-base font-bold text-on-surface"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {isEdit ? "Edit Kelas" : "Tambah Kelas Baru"}
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Kelola data kelas dan ruangan belajar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
          {/* Informasi Kelas */}
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-outline-variant/20">
              <span className="material-symbols-outlined text-secondary text-[18px]">
                meeting_room
              </span>
              <h4 className="text-xs font-black text-on-surface-variant uppercase tracking-wider">
                Informasi Kelas
              </h4>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>
                  Nama Kelas <span className="text-error lowercase">*</span>
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
                    Tingkat <span className="text-error lowercase">*</span>
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
                    Kurikulum <span className="text-error lowercase">*</span>
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

          {/* Detail Ruangan */}
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-outline-variant/20">
              <span className="material-symbols-outlined text-secondary text-[18px]">
                door_open
              </span>
              <h4 className="text-xs font-black text-on-surface-variant uppercase tracking-wider">
                Detail Ruangan
              </h4>
            </div>
            <div className="space-y-4">
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

          {/* Status (edit only) */}
          {isEdit && (
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-outline-variant/20">
                <span className="material-symbols-outlined text-secondary text-[18px]">
                  toggle_on
                </span>
                <h4 className="text-xs font-black text-on-surface-variant uppercase tracking-wider">
                  Status Kelas
                </h4>
              </div>
              <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20">
                <div>
                  <p className="text-sm font-semibold text-on-surface">
                    Kelas Aktif
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Kelas nonaktif tidak muncul di filter default
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => set("is_active", !form.is_active)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${form.is_active ? "bg-secondary" : "bg-surface-container-high"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Info Notice */}
          <div className="p-4 bg-on-tertiary-container/10 border border-on-tertiary-container/20 rounded-2xl flex items-start gap-3">
            <span className="material-symbols-outlined text-[18px] text-on-tertiary-container shrink-0 mt-0.5">
              info
            </span>
            <p className="text-xs leading-relaxed text-on-tertiary-container font-medium">
              Tahun ajaran dan semester otomatis mengikuti yang sedang aktif.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-outline-variant/20 bg-surface-container-lowest">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container text-sm font-semibold transition-colors"
          >
            Batal
          </button>
          <button
            onClick={() => mutation.mutate(buildPayload())}
            disabled={mutation.isPending}
            className="flex-1 py-3 rounded-2xl bg-secondary text-on-secondary text-sm font-semibold hover:bg-secondary/90 shadow-lg shadow-secondary/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
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
    <tr className="border-b border-outline-variant/10">
      {[4, 12, 16, 12, 20, 16, 12, 10].map((w, i) => (
        <td key={i} className="px-6 py-4">
          <div
            className="h-3.5 bg-surface-container rounded-full animate-pulse"
            style={{ width: `${w * 5}px` }}
          />
        </td>
      ))}
    </tr>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, badge, bar, barPct, barColor }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[1.5rem] p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
        <span className="material-symbols-outlined text-[80px] text-primary">
          {icon}
        </span>
      </div>
      <div className="relative z-10">
        <p className="font-black text-[10px] text-on-surface-variant mb-2 uppercase tracking-[0.15em]">
          {label}
        </p>
        <div className="flex items-baseline gap-2">
          <h3
            className="text-3xl font-black text-primary"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {value ?? "—"}
          </h3>
          {badge && (
            <span className="text-sm text-secondary flex items-center font-semibold">
              <span className="material-symbols-outlined text-[14px]">
                trending_up
              </span>{" "}
              {badge}
            </span>
          )}
        </div>
        {sub && <p className="text-xs text-on-surface-variant mt-1">{sub}</p>}
        {bar && (
          <div className="w-full bg-surface-variant h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`${barColor ?? "bg-secondary"} h-1.5 rounded-full transition-all duration-700`}
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
  const { text: stText, cls: stCls } = statusLabel(
    siswa,
    kap,
    kelas.wali?.nama ?? kelas.nama_wali,
  );
  const tabs = [
    { id: "info", label: "Informasi" },
    { id: "siswa", label: "Daftar Siswa" },
  ];

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-y-0 right-0 w-full md:w-[480px] bg-surface-container-lowest shadow-2xl border-l border-outline-variant/20 z-50 flex flex-col transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-outline-variant/20 bg-surface-container-low/50 shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h3
                className="font-bold text-on-surface text-lg"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {kelas.nama_kelas}
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Kode:{" "}
                <span className="font-mono font-semibold">{kelas.id}</span>
                {kelas.tahun_ajaran?.tahun
                  ? ` • TA ${kelas.tahun_ajaran.tahun}`
                  : ""}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl transition-colors ml-3"
            >
              <span className="material-symbols-outlined text-[20px]">
                close
              </span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-outline-variant/20 shrink-0 px-6 gap-5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`py-3.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${activeTab === t.id ? "border-secondary text-secondary" : "border-transparent text-on-surface-variant hover:text-on-surface"}`}
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
                <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20">
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-2">
                    Wali Kelas
                  </p>
                  {(kelas.wali?.nama ?? kelas.nama_wali) ? (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold shrink-0">
                        {initials(kelas.wali?.nama ?? kelas.nama_wali)}
                      </div>
                      <span className="text-sm font-semibold text-on-surface leading-tight">
                        {kelas.wali?.nama ?? kelas.nama_wali}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm italic text-on-surface-variant">
                      Belum ditugaskan
                    </p>
                  )}
                </div>
                <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20">
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-2">
                    Ruangan
                  </p>
                  <p className="text-sm font-semibold text-on-surface">
                    {kelas.ruangan || "-"}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Kapasitas: {kap} kursi
                  </p>
                </div>
              </div>

              {/* Capacity */}
              <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20">
                <h4
                  className="text-sm font-semibold text-on-surface mb-4"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Statistik Siswa
                </h4>
                <div className="flex items-center gap-5">
                  <div
                    className="relative w-20 h-20 rounded-full shrink-0 flex items-center justify-center"
                    style={{
                      background: kap
                        ? `conic-gradient(#006e2a 0% ${pct}%, #e1e3e2 ${pct}% 100%)`
                        : "#e1e3e2",
                    }}
                  >
                    <div className="w-14 h-14 bg-surface-container-low rounded-full flex items-center justify-center flex-col">
                      <span
                        className="font-bold text-base text-on-surface"
                        style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                      >
                        {siswa}
                      </span>
                      <span className="text-[9px] text-on-surface-variant uppercase tracking-wide">
                        Siswa
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2.5">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-on-surface-variant">Terisi</span>
                        <span className="font-semibold text-on-surface">
                          {siswa}/{kap} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${kapasitasColor(siswa, kap)}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${stCls}`}
                    >
                      {stText}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detail Akademik */}
              <div className="space-y-1">
                <h4
                  className="text-sm font-semibold text-on-surface pb-2 border-b border-outline-variant/20"
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
                  {
                    label: "Status",
                    value: null,
                    badge: stText,
                    badgeCls: stCls,
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-3 py-2.5 border-b border-outline-variant/10 border-dashed last:border-0 gap-2"
                  >
                    <span className="text-xs text-on-surface-variant col-span-1">
                      {row.label}
                    </span>
                    <span className="text-sm font-medium text-on-surface col-span-2">
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
            <div className="text-center py-10 text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px] text-outline-variant block mb-3">
                group
              </span>
              <p className="text-sm font-medium">
                Lihat detail lengkap daftar siswa
              </p>
              <button
                onClick={() => navigate(`/operator/master/kelas/${kelas.id}`)}
                className="mt-3 inline-flex items-center gap-1.5 px-5 py-2.5 bg-secondary text-on-secondary rounded-2xl text-sm font-semibold hover:bg-secondary/90 transition-colors"
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
        <div className="px-6 py-4 border-t border-outline-variant/20 bg-surface-container-lowest flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => {
              onDelete(kelas);
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-error border border-error/20 bg-error-container/10 hover:bg-error-container/20 text-sm font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">
              delete
            </span>
            Hapus
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 border border-outline-variant/30 text-on-surface-variant rounded-2xl text-sm font-semibold hover:bg-surface-container transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={() => {
                onEdit(kelas);
                onClose();
              }}
              className="px-4 py-2.5 bg-secondary text-on-secondary rounded-2xl text-sm font-semibold hover:bg-secondary/90 transition-colors flex items-center gap-1.5 shadow-lg shadow-secondary/20"
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

  // Computed stats
  const totalKelas = total;
  const kelasAktif = kelasList.filter((k) => k.is_active).length;
  const totalSiswa = kelasList.reduce((s, k) => s + (k.total_siswa ?? 0), 0);
  const totalWali = kelasList.filter((k) => k.wali || k.nama_wali).length;
  const totalKap = kelasList.reduce((s, k) => s + (k.kapasitas ?? 0), 0);
  const sisaPct = totalKap
    ? Math.round(((totalKap - totalSiswa) / totalKap) * 100)
    : 0;
  const waliPct =
    kelasList.length > 0 ? Math.round((totalWali / kelasList.length) * 100) : 0;

  const openDrawer = (k) => {
    setDrawerKelas(k);
    setDrawerOpen(true);
  };
  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (selected.size === kelasList.length) setSelected(new Set());
    else setSelected(new Set(kelasList.map((k) => k.id)));
  };

  const hasFilter = search || tingkat || semester || tahunAjaranFilter;

  return (
    <div className="w-full space-y-8 pb-10">
      {/* ── Header Section ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 relative">
        {/* Left: Breadcrumb + Heading */}
        <div className="flex-1">
          {/* Live Data badge */}
          <div className="flex items-center gap-3 mb-4">
            <div className="px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="font-black text-[10px] text-secondary tracking-[0.2em] uppercase">
                LIVE DATA
              </span>
            </div>
            <div className="h-px w-24 bg-gradient-to-r from-secondary/20 to-transparent hidden sm:block"></div>
          </div>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-3">
            <span>Dashboard</span>
            <span className="material-symbols-outlined text-[14px]">
              chevron_right
            </span>
            <span>Master Data</span>
            <span className="material-symbols-outlined text-[14px]">
              chevron_right
            </span>
            <span className="text-secondary font-semibold">Kelas</span>
          </nav>

          <h1
            className="text-3xl sm:text-4xl font-black text-primary leading-tight tracking-tighter mb-2"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Data Kelas{" "}
            <span
              className="font-serif italic text-secondary"
              style={{ fontFamily: "'EB Garamond', serif" }}
            >
              &amp; Rombongan Belajar
            </span>
          </h1>
          <p className="text-sm text-on-surface-variant leading-relaxed max-w-xl opacity-80">
            Kelola data kelas, kapasitas, dan penempatan wali kelas tahun ajaran
            aktif dengan sistem manajemen terpadu.
          </p>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => queryClient.invalidateQueries(["master-kelas"])}
            className="px-5 py-2.5 rounded-full border border-outline-variant/30 text-on-surface hover:bg-surface-variant/50 transition-all flex items-center gap-2 font-semibold text-sm bg-white/50 backdrop-blur-sm"
          >
            <span className="material-symbols-outlined text-[18px]">
              refresh
            </span>
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button className="px-5 py-2.5 rounded-full border border-outline-variant/30 text-on-surface hover:bg-surface-variant/50 transition-all flex items-center gap-2 font-semibold text-sm bg-white/50 backdrop-blur-sm">
            <span className="material-symbols-outlined text-[18px]">
              upload
            </span>
            Import
          </button>
          <button className="px-5 py-2.5 rounded-full border border-outline-variant/30 text-on-surface hover:bg-surface-variant/50 transition-all flex items-center gap-2 font-semibold text-sm bg-white/50 backdrop-blur-sm">
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
            className="bg-secondary text-on-secondary px-6 py-3 rounded-full font-black text-xs flex items-center gap-2.5 shadow-[0_8px_16px_rgba(0,110,42,0.15)] hover:shadow-secondary/40 hover:-translate-y-0.5 hover:scale-[1.03] transition-all duration-300 border border-white/20 uppercase tracking-widest"
          >
            <div className="bg-white/20 rounded-full p-0.5">
              <span className="material-symbols-outlined text-[18px] block">
                add
              </span>
            </div>
            Tambah Kelas
          </button>
        </div>
      </div>

      {/* ── Stats Bento ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          icon="meeting_room"
          label="Total Kelas"
          value={isLoading ? "—" : totalKelas}
          badge="+2"
        />
        <StatCard
          icon="layers"
          label="Tingkat MI"
          value={6}
          sub="Kelas 1 – 6"
        />
        <StatCard
          icon="person_check"
          label="Wali Kelas Terplot"
          value={isLoading ? "—" : `${totalWali} / ${kelasList.length}`}
          bar
          barPct={waliPct}
          barColor="bg-secondary"
        />
        <StatCard
          icon="groups"
          label="Rata-rata Siswa"
          value={
            isLoading || !kelasList.length
              ? "—"
              : Math.round(totalSiswa / kelasList.length)
          }
          sub="/ kelas"
        />
        <StatCard
          icon="inventory_2"
          label="Total Kapasitas"
          value={isLoading ? "—" : totalKap}
          sub={`Tersedia: ${Math.max(0, totalKap - totalSiswa)} slot`}
        />
      </div>

      {/* ── Table Card ── */}
      <div className="bg-surface-container-lowest rounded-[2rem] shadow-[0_8px_30px_rgba(0,52,43,0.04)] border border-outline-variant/20 overflow-hidden">
        {/* Toolbar */}
        <div className="bg-surface-container-lowest border-b border-outline-variant/20 p-4 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          {/* Search */}
          <div className="relative flex-1 group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-secondary transition-colors text-[20px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-surface-container-low/50 border border-outline-variant/20 rounded-2xl py-3.5 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all font-medium text-sm outline-none"
              placeholder="Cari nama kelas, kode, atau wali kelas..."
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-3">
            {/* Tingkat */}
            <div className="relative flex-1 min-w-[140px] lg:flex-none">
              <select
                value={tingkat}
                onChange={(e) => {
                  setTingkat(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-surface-container-low/50 border border-outline-variant/20 rounded-2xl py-3.5 pl-4 pr-9 text-on-surface font-bold text-xs uppercase tracking-wider focus:ring-2 focus:ring-secondary/20 focus:border-secondary appearance-none cursor-pointer transition-all outline-none"
              >
                <option value="">Tingkat: Semua</option>
                {[1, 2, 3, 4, 5, 6].map((t) => (
                  <option key={t} value={t}>
                    Tingkat {t}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-[20px]">
                expand_more
              </span>
            </div>

            {/* Semester */}
            <div className="relative flex-1 min-w-[140px] lg:flex-none">
              <select
                value={semester}
                onChange={(e) => {
                  setSemester(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-surface-container-low/50 border border-outline-variant/20 rounded-2xl py-3.5 pl-4 pr-9 text-on-surface font-bold text-xs uppercase tracking-wider focus:ring-2 focus:ring-secondary/20 focus:border-secondary appearance-none cursor-pointer transition-all outline-none"
              >
                <option value="">Status: Semua</option>
                <option value="Ganjil">Semester Ganjil</option>
                <option value="Genap">Semester Genap</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-[20px]">
                expand_more
              </span>
            </div>

            {/* Tahun Ajaran */}
            <div className="relative flex-1 min-w-[160px] lg:flex-none">
              <select
                value={tahunAjaranFilter}
                onChange={(e) => {
                  setTahunAjaranFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-surface-container-low/50 border border-outline-variant/20 rounded-2xl py-3.5 pl-4 pr-9 text-on-surface font-bold text-xs uppercase tracking-wider focus:ring-2 focus:ring-secondary/20 focus:border-secondary appearance-none cursor-pointer transition-all outline-none"
              >
                <option value="">Tahun Ajaran: Semua</option>
                {(tahunAjaranList ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tahun}
                    {t.is_active ? " ★" : ""}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-[20px]">
                expand_more
              </span>
            </div>

            <div className="h-10 w-px bg-outline-variant/20 hidden lg:block mx-1"></div>

            {/* Reset */}
            <button
              onClick={() => {
                setSearch("");
                setTingkat("");
                setSemester("");
                setTahunAjaranFilter("");
                setPage(1);
              }}
              className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl border transition-all font-black text-xs uppercase tracking-widest bg-white/50 shrink-0 ${hasFilter ? "border-error/30 text-error hover:bg-error-container/10" : "border-outline-variant/20 text-on-surface-variant hover:bg-error-container/10 hover:text-error hover:border-error/30"}`}
              title="Reset Filter"
            >
              <span className="material-symbols-outlined text-[18px]">
                refresh
              </span>
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-on-surface-variant">
            <thead className="bg-surface-container-low border-b border-outline-variant/30 text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
              <tr>
                <th className="p-4 w-10" scope="col">
                  <input
                    type="checkbox"
                    checked={
                      kelasList.length > 0 && selected.size === kelasList.length
                    }
                    onChange={toggleAll}
                    className="w-4 h-4 text-secondary bg-surface border-outline-variant rounded focus:ring-secondary focus:ring-2"
                  />
                </th>
                <th className="px-6 py-4 font-bold tracking-wider" scope="col">
                  Kode
                </th>
                <th className="px-6 py-4 font-bold tracking-wider" scope="col">
                  Nama Kelas
                </th>
                <th
                  className="px-6 py-4 font-bold tracking-wider hidden md:table-cell"
                  scope="col"
                >
                  Tingkat
                </th>
                <th
                  className="px-6 py-4 font-bold tracking-wider hidden lg:table-cell"
                  scope="col"
                >
                  Wali Kelas
                </th>
                <th
                  className="px-6 py-4 font-bold tracking-wider hidden lg:table-cell"
                  scope="col"
                >
                  Kapasitas
                </th>
                <th className="px-6 py-4 font-bold tracking-wider" scope="col">
                  Status
                </th>
                <th
                  className="px-6 py-4 font-bold tracking-wider text-right"
                  scope="col"
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {isLoading ? (
                [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
              ) : kelasList.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-20 text-on-surface-variant"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <span className="material-symbols-outlined text-[56px] text-outline-variant">
                        meeting_room
                      </span>
                      <p className="font-semibold text-base">
                        Belum ada data kelas
                      </p>
                      <p className="text-sm opacity-70">
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
                          className="mt-1 inline-flex items-center gap-2 px-5 py-2.5 bg-secondary text-on-secondary rounded-full text-sm font-semibold hover:bg-secondary/90 transition-colors shadow-lg shadow-secondary/20"
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
                  const { text: stText, cls: stCls } = statusLabel(
                    s,
                    kap,
                    k.wali?.nama ?? k.nama_wali,
                  );
                  const waliName = k.wali?.nama ?? k.nama_wali;

                  return (
                    <tr
                      key={k.id}
                      className={`group cursor-pointer transition-all duration-200 hover:bg-surface-card hover:-translate-y-px hover:shadow-sm ${selected.has(k.id) ? "bg-secondary/5" : "bg-surface-container-lowest"}`}
                      onClick={() => openDrawer(k)}
                    >
                      {/* Checkbox */}
                      <td
                        className="p-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(k.id);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(k.id)}
                          readOnly
                          className="w-4 h-4 text-secondary bg-surface border-outline-variant rounded focus:ring-secondary focus:ring-2"
                        />
                      </td>

                      {/* Kode */}
                      <td className="px-6 py-4">
                        <span className="font-mono font-black text-secondary text-sm">
                          {k.id}
                        </span>
                      </td>

                      {/* Nama Kelas */}
                      <td className="px-6 py-4">
                        <p
                          className="font-semibold text-primary"
                          style={{
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                          }}
                        >
                          {k.nama_kelas}
                        </p>
                        {k.kurikulum && (
                          <p className="text-[10px] text-on-surface-variant mt-0.5">
                            {k.kurikulum}
                          </p>
                        )}
                      </td>

                      {/* Tingkat */}
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="bg-surface-container px-2.5 py-1 rounded-lg text-xs font-semibold text-on-surface-variant">
                          Tingkat {k.tingkat}
                        </span>
                      </td>

                      {/* Wali Kelas */}
                      <td className="px-6 py-4 hidden lg:table-cell">
                        {waliName ? (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold shrink-0 border border-primary/10">
                              {initials(waliName)}
                            </div>
                            <span className="text-sm font-medium text-on-surface-variant truncate max-w-[140px]">
                              {waliName}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-surface-variant flex items-center justify-center text-xs font-bold text-outline border border-dashed border-outline-variant">
                              ?
                            </div>
                            <span className="italic text-xs text-outline">
                              Belum diplot
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Kapasitas */}
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-primary">
                            {s}
                          </span>
                          <span className="text-outline text-xs">
                            / {kap || "—"}
                          </span>
                        </div>
                        {kap > 0 && (
                          <div className="w-24 bg-surface-variant h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${kapasitasColor(s, kap)}`}
                              style={{
                                width: `${Math.min((s / kap) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-wider border ${stCls}`}
                        >
                          {stText}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td
                        className="px-6 py-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              navigate(`/operator/master/kelas/${k.id}`)
                            }
                            title="Detail"
                            className="text-outline hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-primary/10"
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
                            className="text-outline hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-primary/10"
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
                            className="text-outline hover:text-error transition-colors p-1.5 rounded-lg hover:bg-error-container/20 ml-1"
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
        <div className="p-5 border-t border-outline-variant/20 bg-surface-container-low/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <p className="text-sm font-medium text-on-surface-variant">
              Menampilkan{" "}
              <span className="text-primary font-bold">
                {total === 0 ? 0 : (page - 1) * 10 + 1}
              </span>{" "}
              sampai{" "}
              <span className="text-primary font-bold">
                {Math.min(page * 10, total)}
              </span>{" "}
              dari <span className="text-primary font-bold">{total}</span> entri
            </p>
            <div className="h-4 w-px bg-outline-variant/30 hidden md:block"></div>
            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs font-medium text-on-surface-variant">
                Baris per halaman:
              </span>
              <div className="relative">
                <select className="appearance-none bg-white border border-outline-variant/30 rounded-xl py-1 pl-3 pr-7 text-xs font-bold text-primary focus:ring-2 focus:ring-secondary/20 focus:border-secondary cursor-pointer transition-all outline-none">
                  <option selected>10</option>
                  <option>20</option>
                  <option>50</option>
                </select>
                <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[16px] text-outline">
                  expand_more
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-outline-variant/30 text-outline hover:bg-white hover:text-secondary hover:border-secondary/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[20px]">
                chevron_left
              </span>
            </button>
            <div className="flex items-center gap-1">
              {[...Array(Math.min(lastPage, 5))].map((_, i) => {
                const pg = i + 1;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold transition-all border ${
                      page === pg
                        ? "bg-secondary text-on-secondary border-secondary shadow-sm shadow-secondary/20"
                        : "border-transparent text-on-surface-variant hover:bg-white hover:border-outline-variant/30"
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}
              {lastPage > 5 && (
                <span className="text-on-surface-variant text-xs px-1">
                  …{lastPage}
                </span>
              )}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-outline-variant/30 text-primary bg-white hover:bg-secondary hover:text-on-secondary hover:border-secondary transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
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
