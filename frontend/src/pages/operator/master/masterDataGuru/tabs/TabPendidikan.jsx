import { useState } from "react";
import { useAuth } from "../../../../../contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../../../lib/axios";
import toast from "react-hot-toast";
import {
  SectionTitle,
  fmtDate,
  useFileDownload,
  InlineModal as Modal,
  Field,
  BASE_URL,
} from "./helpers";

const inputCls =
  "w-full px-4 py-2.5 rounded-xl border border-border-light bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm";

export default function TabPendidikan({ nuptk, guru }) {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("master_data.guru.create");
  const canUpdate = hasPermission("master_data.guru.update");
  const canDelete = hasPermission("master_data.guru.delete");
  const downloadFile = useFileDownload(nuptk);
  const queryClient = useQueryClient();

  const [modalPend, setModalPend] = useState(null);
  const [modalSert, setModalSert] = useState(null);
  const [modalInp, setModalInp] = useState(null);

  const { data: pendidikans = [] } = useQuery({
    queryKey: ["guru-pendidikan", nuptk],
    queryFn: () =>
      api
        .get(`/operator/master-data/guru/${nuptk}/pendidikan`)
        .then((r) => r.data.data),
    initialData: guru.pendidikans ?? [],
  });
  const { data: sertifikasis = [] } = useQuery({
    queryKey: ["guru-sertifikasi", nuptk],
    queryFn: () =>
      api
        .get(`/operator/master-data/guru/${nuptk}/sertifikasi`)
        .then((r) => r.data.data),
    initialData: guru.sertifikasis ?? [],
  });
  const { data: inpassings = [] } = useQuery({
    queryKey: ["guru-inpassing", nuptk],
    queryFn: () =>
      api
        .get(`/operator/master-data/guru/${nuptk}/inpassing`)
        .then((r) => r.data.data),
  });

  const savePendidikan = useMutation({
    mutationFn: ({ data, id }) => {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => v != null && fd.append(k, v));
      return id
        ? api.post(
            `/operator/master-data/guru/${nuptk}/pendidikan/${id}?_method=PUT`,
            fd,
            { headers: { "Content-Type": "multipart/form-data" } },
          )
        : api.post(`/operator/master-data/guru/${nuptk}/pendidikan`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
    },
    onSuccess: () => {
      toast.success("Pendidikan disimpan.");
      queryClient.invalidateQueries(["guru-pendidikan", nuptk]);
      setModalPend(null);
    },
    onError: (e) =>
      toast.error(e.response?.data?.message ?? "Gagal menyimpan."),
  });
  const deletePendidikan = useMutation({
    mutationFn: (id) =>
      api.delete(`/operator/master-data/guru/${nuptk}/pendidikan/${id}`),
    onSuccess: () => {
      toast.success("Pendidikan dihapus.");
      queryClient.invalidateQueries(["guru-pendidikan", nuptk]);
    },
    onError: (e) =>
      toast.error(e.response?.data?.message ?? "Gagal menghapus."),
  });

  const saveSertifikasi = useMutation({
    mutationFn: ({ data, id }) => {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => v != null && fd.append(k, v));
      return id
        ? api.post(
            `/operator/master-data/guru/${nuptk}/sertifikasi/${id}?_method=PUT`,
            fd,
            { headers: { "Content-Type": "multipart/form-data" } },
          )
        : api.post(`/operator/master-data/guru/${nuptk}/sertifikasi`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
    },
    onSuccess: () => {
      toast.success("Sertifikasi disimpan.");
      queryClient.invalidateQueries(["guru-sertifikasi", nuptk]);
      setModalSert(null);
    },
    onError: (e) =>
      toast.error(e.response?.data?.message ?? "Gagal menyimpan."),
  });
  const deleteSertifikasi = useMutation({
    mutationFn: (id) =>
      api.delete(`/operator/master-data/guru/${nuptk}/sertifikasi/${id}`),
    onSuccess: () => {
      toast.success("Sertifikasi dihapus.");
      queryClient.invalidateQueries(["guru-sertifikasi", nuptk]);
    },
    onError: (e) =>
      toast.error(e.response?.data?.message ?? "Gagal menghapus."),
  });

  const saveInpassing = useMutation({
    mutationFn: ({ data, id }) => {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => v != null && fd.append(k, v));
      return id
        ? api.post(
            `/operator/master-data/guru/${nuptk}/inpassing/${id}?_method=PUT`,
            fd,
            { headers: { "Content-Type": "multipart/form-data" } },
          )
        : api.post(`/operator/master-data/guru/${nuptk}/inpassing`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
    },
    onSuccess: () => {
      toast.success("Inpassing disimpan.");
      queryClient.invalidateQueries(["guru-inpassing", nuptk]);
      setModalInp(null);
    },
    onError: (e) =>
      toast.error(e.response?.data?.message ?? "Gagal menyimpan."),
  });
  const deleteInpassing = useMutation({
    mutationFn: (id) =>
      api.delete(`/operator/master-data/guru/${nuptk}/inpassing/${id}`),
    onSuccess: () => {
      toast.success("Inpassing dihapus.");
      queryClient.invalidateQueries(["guru-inpassing", nuptk]);
    },
    onError: (e) =>
      toast.error(e.response?.data?.message ?? "Gagal menghapus."),
  });

  const handlePendidikanSubmit = (e) => {
    e.preventDefault();
    const f = e.target;
    savePendidikan.mutate({
      id: modalPend?.id,
      data: {
        jenjang: f.jenjang.value,
        nama_sekolah: f.nama_sekolah.value,
        jurusan: f.jurusan.value,
        prodi: f.prodi.value,
        tahun_masuk: f.tahun_masuk.value,
        tahun_lulus: f.tahun_lulus.value,
        no_ijazah: f.no_ijazah.value,
        file_ijazah: f.file_ijazah.files[0] ?? null,
      },
    });
  };

  const handleSertifikasiSubmit = (e) => {
    e.preventDefault();
    const f = e.target;
    saveSertifikasi.mutate({
      id: modalSert?.id,
      data: {
        jenis_sertifikasi: f.jenis_sertifikasi.value,
        no_sertifikat: f.no_sertifikat.value,
        nrg: f.nrg.value,
        tahun_sertifikasi: f.tahun_sertifikasi.value,
        lptk: f.lptk.value,
        bidang_studi: f.bidang_studi.value,
        tanggal_terbit: f.tanggal_terbit.value,
        expired_at: f.expired_at.value,
        file_sertifikat: f.file_sertifikat.files[0] ?? null,
      },
    });
  };

  const handleInpassingSubmit = (e) => {
    e.preventDefault();
    const f = e.target;
    saveInpassing.mutate({
      id: modalInp?.id,
      data: {
        no_sk: f.no_sk.value,
        tanggal_sk: f.tanggal_sk.value,
        tmt_inpassing: f.tmt_inpassing.value,
        golongan_sesudah: f.golongan_sesudah.value,
        jabatan_fungsional: f.jabatan_fungsional.value,
        angka_kredit: f.angka_kredit.value,
        file_sk: f.file_sk.files[0] ?? null,
      },
    });
  };

  const JENJANG_OPTS = [
    "SD",
    "SMP",
    "SMA/SMK",
    "D1",
    "D2",
    "D3",
    "D4",
    "S1",
    "S2",
    "S3",
  ];
  const GOLONGAN_OPTS = [
    "III/a",
    "III/b",
    "III/c",
    "III/d",
    "IV/a",
    "IV/b",
    "IV/c",
    "IV/d",
    "IV/e",
  ];

  return (
    <div className="space-y-6">
      {/* ── SECTION 1: PENDIDIKAN ── */}
      <div className="bg-white rounded-[16px] border border-outline-variant/30 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <SectionTitle
            icon="school"
            label="Riwayat Pendidikan"
            desc={`${pendidikans.length} data tercatat`}
          />
          <button
            onClick={() => setModalPend("add")}
            className="px-3 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold flex items-center gap-1.5 hover:bg-primary/90 transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>{" "}
            Tambah
          </button>
        </div>
        {pendidikans.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-8">
            Belum ada riwayat pendidikan.
          </p>
        ) : (
          <div className="space-y-3">
            {pendidikans.map((p) => (
              <div
                key={p.id}
                className="p-4 bg-surface-container-low rounded-xl border border-border-light"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary">
                      {p.jenjang} — {p.nama_sekolah}
                    </p>
                    <p className="text-sm text-text-secondary mt-0.5">
                      {[p.prodi, p.jurusan].filter(Boolean).join(" / ")}
                      {(p.tahun_masuk || p.tahun_lulus) &&
                        ` · ${p.tahun_masuk ?? "?"} – ${p.tahun_lulus ?? "?"}`}
                    </p>
                    {p.no_ijazah && (
                      <p className="text-xs text-text-secondary mt-0.5 font-mono">
                        No. Ijazah: {p.no_ijazah}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {p.file_ijazah && (
                      <button
                        onClick={() =>
                          downloadFile(
                            p.file_ijazah,
                            `Ijazah_${p.nama_sekolah}`,
                          )
                        }
                        className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                        title="Download ijazah"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          download
                        </span>
                      </button>
                    )}
                    <button
                      onClick={() => setModalPend(p)}
                      className="p-1.5 rounded-lg hover:bg-surface-container text-text-secondary transition-colors"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        edit
                      </span>
                    </button>
                    {canDelete && (
                      <button
                        onClick={() =>
                          confirm("Hapus data pendidikan ini?") &&
                          deletePendidikan.mutate(p.id)
                        }
                        className="p-1.5 rounded-lg hover:bg-error/10 text-error transition-colors"
                        title="Hapus"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          delete
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION 2: SERTIFIKASI ── */}
      <div className="bg-white rounded-[16px] border border-outline-variant/30 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <SectionTitle
            icon="workspace_premium"
            label="Sertifikasi"
            desc={`${sertifikasis.length} data tercatat`}
          />
          <button
            onClick={() => setModalSert("add")}
            className="px-3 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold flex items-center gap-1.5 hover:bg-primary/90 transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>{" "}
            Tambah
          </button>
        </div>
        {sertifikasis.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-8">
            Belum ada data sertifikasi.
          </p>
        ) : (
          <div className="space-y-3">
            {sertifikasis.map((s) => (
              <div
                key={s.id}
                className="p-4 bg-surface-container-low rounded-xl border border-border-light"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary">
                      {s.jenis_sertifikasi}
                    </p>
                    <p className="text-sm text-text-secondary mt-0.5">
                      {s.bidang_studi && `${s.bidang_studi} · `}
                      {s.lptk}
                      {s.tahun_sertifikasi && ` · ${s.tahun_sertifikasi}`}
                    </p>
                    {s.nrg && (
                      <p className="text-xs text-text-secondary mt-0.5 font-mono">
                        NRG: {s.nrg}
                      </p>
                    )}
                    {s.no_sertifikat && (
                      <p className="text-xs text-text-secondary font-mono">
                        No: {s.no_sertifikat}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {s.file_sertifikat && (
                      <button
                        onClick={() =>
                          downloadFile(
                            s.file_sertifikat,
                            `Sertifikasi_${s.jenis_sertifikasi}`,
                          )
                        }
                        className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                        title="Download sertifikat"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          download
                        </span>
                      </button>
                    )}
                    <button
                      onClick={() => setModalSert(s)}
                      className="p-1.5 rounded-lg hover:bg-surface-container text-text-secondary transition-colors"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        edit
                      </span>
                    </button>
                    {canDelete && (
                      <button
                        onClick={() =>
                          confirm("Hapus sertifikasi ini?") &&
                          deleteSertifikasi.mutate(s.id)
                        }
                        className="p-1.5 rounded-lg hover:bg-error/10 text-error transition-colors"
                        title="Hapus"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          delete
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION 3: INPASSING ── */}
      <div className="bg-white rounded-[16px] border border-outline-variant/30 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <SectionTitle
            icon="military_tech"
            label="Inpassing"
            desc="SK penetapan inpassing guru non-PNS"
          />
          <button
            onClick={() => setModalInp("add")}
            className="px-3 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold flex items-center gap-1.5 hover:bg-primary/90 transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>{" "}
            Tambah
          </button>
        </div>
        {inpassings.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-8">
            Belum ada data inpassing.
          </p>
        ) : (
          <div className="space-y-3">
            {inpassings.map((inp) => (
              <div
                key={inp.id}
                className="p-4 bg-surface-container-low rounded-xl border border-border-light"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary">
                      SK {inp.no_sk}
                    </p>
                    <p className="text-sm text-text-secondary mt-0.5">
                      {inp.jabatan_fungsional && `${inp.jabatan_fungsional} · `}
                      Gol. {inp.golongan_sesudah ?? "-"}
                      {inp.angka_kredit && ` · AK: ${inp.angka_kredit}`}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Tanggal SK: {fmtDate(inp.tanggal_sk)} · TMT:{" "}
                      {fmtDate(inp.tmt_inpassing)}
                    </p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {inp.file_sk && (
                      <button
                        onClick={() =>
                          downloadFile(inp.file_sk, `SK_Inpassing_${inp.no_sk}`)
                        }
                        className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                        title="Download SK Inpassing"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          download
                        </span>
                      </button>
                    )}
                    <button
                      onClick={() => setModalInp(inp)}
                      className="p-1.5 rounded-lg hover:bg-surface-container text-text-secondary transition-colors"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        edit
                      </span>
                    </button>
                    {canDelete && (
                      <button
                        onClick={() =>
                          confirm("Hapus data inpassing ini?") &&
                          deleteInpassing.mutate(inp.id)
                        }
                        className="p-1.5 rounded-lg hover:bg-error/10 text-error transition-colors"
                        title="Hapus"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          delete
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ MODAL: PENDIDIKAN ══ */}
      {modalPend && (
        <Modal
          title={
            modalPend === "add"
              ? "Tambah Riwayat Pendidikan"
              : "Edit Riwayat Pendidikan"
          }
          onClose={() => setModalPend(null)}
        >
          <form onSubmit={handlePendidikanSubmit} className="space-y-4">
            <Field label="Jenjang" required>
              <select
                name="jenjang"
                defaultValue={modalPend?.jenjang ?? ""}
                required
                className={inputCls}
              >
                <option value="" disabled>
                  Pilih jenjang
                </option>
                {JENJANG_OPTS.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nama Sekolah / Institusi" required>
              <input
                name="nama_sekolah"
                defaultValue={modalPend?.nama_sekolah ?? ""}
                required
                className={inputCls}
                placeholder="Contoh: Universitas Negeri Malang"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Jurusan">
                <input
                  name="jurusan"
                  defaultValue={modalPend?.jurusan ?? ""}
                  className={inputCls}
                  placeholder="Pendidikan..."
                />
              </Field>
              <Field label="Program Studi">
                <input
                  name="prodi"
                  defaultValue={modalPend?.prodi ?? ""}
                  className={inputCls}
                  placeholder="Pendidikan Matematika"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tahun Masuk">
                <input
                  name="tahun_masuk"
                  type="number"
                  defaultValue={modalPend?.tahun_masuk ?? ""}
                  className={inputCls}
                  placeholder="2015"
                />
              </Field>
              <Field label="Tahun Lulus">
                <input
                  name="tahun_lulus"
                  type="number"
                  defaultValue={modalPend?.tahun_lulus ?? ""}
                  className={inputCls}
                  placeholder="2019"
                />
              </Field>
            </div>
            <Field label="Nomor Ijazah">
              <input
                name="no_ijazah"
                defaultValue={modalPend?.no_ijazah ?? ""}
                className={inputCls}
                placeholder="No. ijazah resmi"
              />
            </Field>
            <Field label="Upload Ijazah (PDF/JPG, maks 5MB)">
              <input
                name="file_ijazah"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full text-sm text-text-secondary file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
              />
            </Field>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalPend(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border-light text-text-secondary hover:bg-surface-container text-sm font-medium transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savePendidikan.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {savePendidikan.isPending ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ══ MODAL: SERTIFIKASI ══ */}
      {modalSert && (
        <Modal
          title={
            modalSert === "add" ? "Tambah Sertifikasi" : "Edit Sertifikasi"
          }
          onClose={() => setModalSert(null)}
        >
          <form onSubmit={handleSertifikasiSubmit} className="space-y-4">
            <Field label="Jenis Sertifikasi" required>
              <input
                name="jenis_sertifikasi"
                defaultValue={modalSert?.jenis_sertifikasi ?? ""}
                required
                className={inputCls}
                placeholder="Sertifikat Pendidik / PPG / dll"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nomor Sertifikat">
                <input
                  name="no_sertifikat"
                  defaultValue={modalSert?.no_sertifikat ?? ""}
                  className={inputCls}
                />
              </Field>
              <Field label="NRG (Nomor Registrasi Guru)">
                <input
                  name="nrg"
                  defaultValue={modalSert?.nrg ?? ""}
                  className={inputCls}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Bidang Studi">
                <input
                  name="bidang_studi"
                  defaultValue={modalSert?.bidang_studi ?? ""}
                  className={inputCls}
                  placeholder="Matematika"
                />
              </Field>
              <Field label="Tahun Sertifikasi">
                <input
                  name="tahun_sertifikasi"
                  type="number"
                  defaultValue={modalSert?.tahun_sertifikasi ?? ""}
                  className={inputCls}
                  placeholder="2021"
                />
              </Field>
            </div>
            <Field label="LPTK / Penyelenggara">
              <input
                name="lptk"
                defaultValue={modalSert?.lptk ?? ""}
                className={inputCls}
                placeholder="Universitas..."
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tanggal Terbit">
                <input
                  name="tanggal_terbit"
                  type="date"
                  defaultValue={modalSert?.tanggal_terbit ?? ""}
                  className={inputCls}
                />
              </Field>
              <Field label="Berlaku Sampai (Expired)">
                <input
                  name="expired_at"
                  type="date"
                  defaultValue={modalSert?.expired_at ?? ""}
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Upload Sertifikat (PDF/JPG, maks 5MB)">
              <input
                name="file_sertifikat"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full text-sm text-text-secondary file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
              />
            </Field>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalSert(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border-light text-text-secondary hover:bg-surface-container text-sm font-medium transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saveSertifikasi.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {saveSertifikasi.isPending ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ══ MODAL: INPASSING ══ */}
      {modalInp && (
        <Modal
          title={
            modalInp === "add" ? "Tambah Data Inpassing" : "Edit Data Inpassing"
          }
          onClose={() => setModalInp(null)}
        >
          <form onSubmit={handleInpassingSubmit} className="space-y-4">
            <Field label="Nomor SK" required>
              <input
                name="no_sk"
                defaultValue={modalInp?.no_sk ?? ""}
                required
                className={inputCls}
                placeholder="No. SK Inpassing"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tanggal SK" required>
                <input
                  name="tanggal_sk"
                  type="date"
                  defaultValue={modalInp?.tanggal_sk ?? ""}
                  required
                  className={inputCls}
                />
              </Field>
              <Field label="TMT Inpassing" required>
                <input
                  name="tmt_inpassing"
                  type="date"
                  defaultValue={modalInp?.tmt_inpassing ?? ""}
                  required
                  className={inputCls}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Golongan Hasil Inpassing">
                <select
                  name="golongan_sesudah"
                  defaultValue={modalInp?.golongan_sesudah ?? ""}
                  className={inputCls}
                >
                  <option value="">Pilih golongan</option>
                  {GOLONGAN_OPTS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Angka Kredit">
                <input
                  name="angka_kredit"
                  type="number"
                  step="0.01"
                  defaultValue={modalInp?.angka_kredit ?? ""}
                  className={inputCls}
                  placeholder="150.00"
                />
              </Field>
            </div>
            <Field label="Jabatan Fungsional">
              <input
                name="jabatan_fungsional"
                defaultValue={modalInp?.jabatan_fungsional ?? ""}
                className={inputCls}
                placeholder="Guru Pertama"
              />
            </Field>
            <Field label="Upload SK Inpassing (PDF/JPG, maks 5MB)">
              <input
                name="file_sk"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full text-sm text-text-secondary file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
              />
            </Field>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalInp(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border-light text-text-secondary hover:bg-surface-container text-sm font-medium transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saveInpassing.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {saveInpassing.isPending ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
