import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sun,
  Umbrella,
  Star,
  Users,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Config ──────────────────────────────────────────────────────────────────
const JENIS_CONFIG = {
  jadwal_ujian: {
    label: "Jadwal Ujian",
    icon: BookOpen,
    color: "bg-purple-100 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
    light: "bg-purple-50",
  },
  libur_nasional: {
    label: "Libur Nasional",
    icon: Sun,
    color: "bg-green-100 text-green-700 border-green-200",
    dot: "bg-green-500",
    light: "bg-green-50",
  },
  libur_semester: {
    label: "Libur Semester",
    icon: Umbrella,
    color: "bg-sky-100 text-sky-700 border-sky-200",
    dot: "bg-sky-500",
    light: "bg-sky-50",
  },
  kegiatan: {
    label: "Kegiatan Sekolah",
    icon: Star,
    color: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    light: "bg-amber-50",
  },
  rapat: {
    label: "Rapat",
    icon: Users,
    color: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
    light: "bg-slate-50",
  },
};

const JENIS_OPTIONS = Object.entries(JENIS_CONFIG).map(([val, cfg]) => ({
  val,
  label: cfg.label,
}));

const BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const FORM_DEFAULT = {
  judul: "",
  deskripsi: "",
  jenis: "kegiatan",
  tanggal_mulai: "",
  tanggal_selesai: "",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, "0");

const formatTgl = (str) =>
  str
    ? new Date(str + "T00:00:00").toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const dateInRange = (date, mulai, selesai) => {
  const d = date.getTime();
  return (
    d >= new Date(mulai + "T00:00:00").getTime() &&
    d <= new Date(selesai + "T00:00:00").getTime()
  );
};

// ─── Badge ───────────────────────────────────────────────────────────────────
function JenisBadge({ jenis }) {
  const cfg = JENIS_CONFIG[jenis];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}
    >
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
// Bug #9 fix: terima apiBase prop agar komponen bisa dipakai kepsek (/kepsek/kalender)
// maupun wakasek (/wakasek/kalender) tanpa duplikasi komponen.
export default function KalenderAkademik({ apiBase = "/kepsek/kalender" }) {
  const queryClient = useQueryClient();
  const now = new Date();

  // State navigasi kalender
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-indexed
  const [filterJenis, setFilterJenis] = useState("semua");

  // State modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formData, setFormData] = useState(FORM_DEFAULT);

  // State detail popup (klik tanggal di kalender)
  const [selectedDate, setSelectedDate] = useState(null);

  // ── Query ───────────────────────────────────────────────────────────────
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["kalender", viewYear],
    queryFn: () =>
      api
        .get(apiBase, { params: { tahun: viewYear } })
        .then((r) => r.data.data),
  });

  // ── Mutations ────────────────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: (data) => api.post(apiBase, data),
    onSuccess: () => {
      toast.success("Kegiatan berhasil ditambahkan");
      queryClient.invalidateQueries(["kalender", viewYear]);
      closeModal();
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message ?? "Gagal menambahkan"),
  });

  const editMutation = useMutation({
    mutationFn: (data) => api.put(`${apiBase}/${editItem.id}`, data),
    onSuccess: () => {
      toast.success("Kegiatan berhasil diperbarui");
      queryClient.invalidateQueries(["kalender", viewYear]);
      closeModal();
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message ?? "Gagal memperbarui"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`${apiBase}/${id}`),
    onSuccess: () => {
      toast.success("Kegiatan berhasil dihapus");
      queryClient.invalidateQueries(["kalender", viewYear]);
      setConfirmDelete(null);
    },
    onError: () => toast.error("Gagal menghapus kegiatan"),
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  const openModal = (item = null) => {
    if (item) {
      setEditItem(item);
      setFormData({
        judul: item.judul,
        deskripsi: item.deskripsi ?? "",
        jenis: item.jenis,
        tanggal_mulai: item.tanggal_mulai,
        tanggal_selesai: item.tanggal_selesai,
      });
    } else {
      setEditItem(null);
      setFormData({
        ...FORM_DEFAULT,
        // kalau ada tanggal terpilih, pre-fill
        tanggal_mulai: selectedDate
          ? `${viewYear}-${pad(viewMonth + 1)}-${pad(selectedDate)}`
          : "",
        tanggal_selesai: selectedDate
          ? `${viewYear}-${pad(viewMonth + 1)}-${pad(selectedDate)}`
          : "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditItem(null);
    setFormData(FORM_DEFAULT);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !formData.judul.trim() ||
      !formData.tanggal_mulai ||
      !formData.tanggal_selesai
    ) {
      toast.error("Judul dan tanggal harus diisi");
      return;
    }
    const payload = {
      judul: formData.judul.trim(),
      deskripsi: formData.deskripsi.trim() || null,
      jenis: formData.jenis,
      tanggal_mulai: formData.tanggal_mulai,
      tanggal_selesai: formData.tanggal_selesai,
    };
    editItem ? editMutation.mutate(payload) : addMutation.mutate(payload);
  };

  // ── Navigasi bulan ────────────────────────────────────────────────────────
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
    setSelectedDate(null);
  };

  // ── Derived: grid kalender ────────────────────────────────────────────────
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const days = [];
    // padding sebelum hari pertama
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [viewYear, viewMonth]);

  // ── Derived: events bulan ini ─────────────────────────────────────────────
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const inJenis = filterJenis === "semua" || e.jenis === filterJenis;
      return inJenis;
    });
  }, [events, filterJenis]);

  // Events yang jatuh di bulan yang ditampilkan
  const eventsThisMonth = useMemo(() => {
    const start = new Date(viewYear, viewMonth, 1);
    const end = new Date(viewYear, viewMonth + 1, 0);
    return filteredEvents.filter((e) => {
      const mulai = new Date(e.tanggal_mulai + "T00:00:00");
      const selesai = new Date(e.tanggal_selesai + "T00:00:00");
      return mulai <= end && selesai >= start;
    });
  }, [filteredEvents, viewYear, viewMonth]);

  // Events per tanggal (untuk dot di kalender)
  const getEventsForDay = (day) => {
    if (!day) return [];
    const d = new Date(viewYear, viewMonth, day);
    return eventsThisMonth.filter((e) =>
      dateInRange(d, e.tanggal_mulai, e.tanggal_selesai),
    );
  };

  // Events untuk tanggal terpilih (panel kanan)
  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    const d = new Date(viewYear, viewMonth, selectedDate);
    return filteredEvents.filter((e) =>
      dateInRange(d, e.tanggal_mulai, e.tanggal_selesai),
    );
  }, [selectedDate, filteredEvents, viewYear, viewMonth]);

  // Upcoming events (event yang belum selesai, urut tanggal mulai)
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return filteredEvents
      .filter((e) => new Date(e.tanggal_selesai + "T00:00:00") >= today)
      .slice(0, 8);
  }, [filteredEvents]);

  const isPending = addMutation.isPending || editMutation.isPending;
  const todayDate = now.getDate();
  const isCurrentMonth =
    viewMonth === now.getMonth() && viewYear === now.getFullYear();

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            Kalender Akademik
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Kelola jadwal dan kegiatan sekolah tahun {viewYear}
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" /> Tambah Kegiatan
        </button>
      </div>

      {/* Filter jenis */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterJenis("semua")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            filterJenis === "semua"
              ? "bg-gray-800 text-white border-gray-800"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
          }`}
        >
          Semua
        </button>
        {JENIS_OPTIONS.map(({ val, label }) => {
          const cfg = JENIS_CONFIG[val];
          return (
            <button
              key={val}
              onClick={() => setFilterJenis(val)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                filterJenis === val
                  ? cfg.color
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* ── Kalender ───────────────────────────────────────────────────── */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Nav bulan */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="text-center">
              <p className="font-bold text-gray-800 text-lg">
                {BULAN[viewMonth]} {viewYear}
              </p>
              <p className="text-xs text-gray-400">
                {eventsThisMonth.length} kegiatan bulan ini
              </p>
            </div>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Grid hari */}
          <div className="p-4">
            {/* Header hari */}
            <div className="grid grid-cols-7 mb-2">
              {HARI.map((h) => (
                <div
                  key={h}
                  className={`text-center text-xs font-semibold py-1 ${h === "Min" ? "text-red-400" : "text-gray-400"}`}
                >
                  {h}
                </div>
              ))}
            </div>

            {/* Tanggal */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} />;

                const dayEvents = getEventsForDay(day);
                const isToday = isCurrentMonth && day === todayDate;
                const isSelected = selectedDate === day;
                const isSunday =
                  new Date(viewYear, viewMonth, day).getDay() === 0;
                const hasEvents = dayEvents.length > 0;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(isSelected ? null : day)}
                    className={`relative flex flex-col items-center justify-start pt-1.5 pb-1 rounded-xl min-h-[52px] transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-md"
                        : isToday
                          ? "bg-indigo-50 text-indigo-700 ring-2 ring-indigo-400"
                          : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span
                      className={`text-sm font-semibold ${isSunday && !isSelected ? "text-red-400" : ""}`}
                    >
                      {day}
                    </span>

                    {/* Dots event */}
                    {hasEvents && (
                      <div className="flex gap-0.5 mt-1 flex-wrap justify-center px-1 max-w-full">
                        {dayEvents.slice(0, 3).map((e, i) => (
                          <span
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white/80" : (JENIS_CONFIG[e.jenis]?.dot ?? "bg-gray-400")}`}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span
                            className={`text-[9px] font-bold ${isSelected ? "text-white/80" : "text-gray-400"}`}
                          >
                            +{dayEvents.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="px-5 py-3 border-t border-gray-100 flex flex-wrap gap-3">
            {JENIS_OPTIONS.map(({ val, label }) => (
              <div
                key={val}
                className="flex items-center gap-1.5 text-xs text-gray-500"
              >
                <span
                  className={`w-2 h-2 rounded-full ${JENIS_CONFIG[val].dot}`}
                />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Panel kanan ────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Detail tanggal terpilih */}
          {selectedDate && (
            <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-indigo-600 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">
                  {selectedDate} {BULAN[viewMonth]} {viewYear}
                </p>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-white/70 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {selectedEvents.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-gray-400">Tidak ada kegiatan</p>
                  <button
                    onClick={() => openModal()}
                    className="mt-2 text-xs text-indigo-600 hover:underline font-medium"
                  >
                    + Tambah kegiatan
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {selectedEvents.map((e) => {
                    const cfg = JENIS_CONFIG[e.jenis];
                    const Icon = cfg?.icon;
                    return (
                      <div key={e.id} className={`px-4 py-3 ${cfg?.light}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0">
                            {Icon && (
                              <Icon className="w-4 h-4 mt-0.5 shrink-0 text-gray-500" />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">
                                {e.judul}
                              </p>
                              {e.deskripsi && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                  {e.deskripsi}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                {formatTgl(e.tanggal_mulai)}
                                {e.tanggal_mulai !== e.tanggal_selesai &&
                                  ` – ${formatTgl(e.tanggal_selesai)}`}
                                {e.durasi_hari > 1 &&
                                  ` (${e.durasi_hari} hari)`}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => openModal(e)}
                              className="p-1 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(e.id)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Upcoming events */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">
                Kegiatan Mendatang
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{viewYear}</p>
            </div>

            {isLoading ? (
              <div className="py-8 text-center">
                <div className="animate-spin w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="py-8 text-center">
                <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Belum ada kegiatan</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {upcomingEvents.map((e) => {
                  const cfg = JENIS_CONFIG[e.jenis];
                  const Icon = cfg?.icon;
                  return (
                    <div
                      key={e.id}
                      className="px-4 py-3 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          {/* Tanggal pill */}
                          <div
                            className={`shrink-0 w-10 text-center rounded-lg py-1 ${cfg?.light}`}
                          >
                            <p
                              className={`text-xs font-bold ${cfg?.color.split(" ")[1]}`}
                            >
                              {new Date(
                                e.tanggal_mulai + "T00:00:00",
                              ).toLocaleDateString("id-ID", { month: "short" })}
                            </p>
                            <p
                              className={`text-base font-extrabold leading-none ${cfg?.color.split(" ")[1]}`}
                            >
                              {new Date(
                                e.tanggal_mulai + "T00:00:00",
                              ).getDate()}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 leading-tight truncate">
                              {e.judul}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <JenisBadge jenis={e.jenis} />
                              {e.durasi_hari > 1 && (
                                <span className="text-xs text-gray-400">
                                  {e.durasi_hari} hari
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => openModal(e)}
                            className="p-1 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(e.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ MODAL FORM ══════════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {editItem ? (
                  <>
                    <Edit2 className="w-5 h-5 text-blue-600" /> Edit Kegiatan
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-indigo-600" /> Tambah Kegiatan
                  </>
                )}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Jenis — tampil sebagai pilihan visual */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Jenis Kegiatan <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {JENIS_OPTIONS.map(({ val, label }) => {
                    const cfg = JENIS_CONFIG[val];
                    const Icon = cfg.icon;
                    return (
                      <label
                        key={val}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                          formData.jenis === val
                            ? `border-current ${cfg.color}`
                            : "border-gray-200 hover:border-gray-300 text-gray-600"
                        }`}
                      >
                        <input
                          type="radio"
                          name="jenis"
                          value={val}
                          checked={formData.jenis === val}
                          onChange={(e) =>
                            setFormData({ ...formData, jenis: e.target.value })
                          }
                          className="sr-only"
                        />
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-semibold">{label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Judul */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Judul <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.judul}
                  onChange={(e) =>
                    setFormData({ ...formData, judul: e.target.value })
                  }
                  className="input-field"
                  placeholder="Contoh: UTS Semester Ganjil"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Deskripsi{" "}
                  <span className="text-gray-400 font-normal">(opsional)</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.deskripsi}
                  onChange={(e) =>
                    setFormData({ ...formData, deskripsi: e.target.value })
                  }
                  className="input-field resize-none"
                  placeholder="Keterangan tambahan..."
                />
              </div>

              {/* Tanggal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Tanggal Mulai <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal_mulai}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        tanggal_mulai: val,
                        // auto-isi tanggal selesai jika belum diisi / lebih kecil
                        tanggal_selesai:
                          !formData.tanggal_selesai ||
                          formData.tanggal_selesai < val
                            ? val
                            : formData.tanggal_selesai,
                      });
                    }}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Tanggal Selesai <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={formData.tanggal_mulai}
                    value={formData.tanggal_selesai}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tanggal_selesai: e.target.value,
                      })
                    }
                    className="input-field"
                  />
                </div>
              </div>

              {/* Preview durasi */}
              {formData.tanggal_mulai && formData.tanggal_selesai && (
                <p className="text-xs text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">
                  {formData.tanggal_mulai === formData.tanggal_selesai
                    ? `📅 ${formatTgl(formData.tanggal_mulai)} (1 hari)`
                    : `📅 ${formatTgl(formData.tanggal_mulai)} – ${formatTgl(formData.tanggal_selesai)} (${
                        new Date(
                          formData.tanggal_mulai + "T00:00:00",
                        ).getTime() <=
                        new Date(
                          formData.tanggal_selesai + "T00:00:00",
                        ).getTime()
                          ? Math.round(
                              (new Date(
                                formData.tanggal_selesai + "T00:00:00",
                              ) -
                                new Date(
                                  formData.tanggal_mulai + "T00:00:00",
                                )) /
                                86400000,
                            ) + 1
                          : 0
                      } hari)`}
                </p>
              )}

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
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{" "}
                      Menyimpan...
                    </>
                  ) : editItem ? (
                    "Simpan Perubahan"
                  ) : (
                    "Tambah Kegiatan"
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
              Hapus Kegiatan?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Kegiatan ini akan dihapus permanen.
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
