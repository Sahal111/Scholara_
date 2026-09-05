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

/**
 * TabRiwayat — Tab 6: Riwayat Kepegawaian, Diklat, Mutasi & Pangkat
 */
export default function TabRiwayat({ nuptk, guru }) {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("master_data.guru.create");
  const canUpdate = hasPermission("master_data.guru.update");
  const canDelete = hasPermission("master_data.guru.delete");
  const downloadFile = useFileDownload(nuptk);
  const queryClient = useQueryClient();
  const [modalDiklat, setModalDiklat] = useState(null);

  const { data: diklats = [] } = useQuery({
    queryKey: ["guru-diklat", nuptk],
    queryFn: () =>
      api
        .get(`/operator/master-data/guru/${nuptk}/diklat`)
        .then((r) => r.data.data),
    initialData: guru.diklats ?? [],
  });

  const saveDiklat = useMutation({
    mutationFn: ({ data, id }) => {
      const fd = new FormData();
      Object.entries(data).forEach(
        ([k, v]) => v != null && v !== "" && fd.append(k, v),
      );
      return id
        ? api.post(
            `/operator/master-data/guru/${nuptk}/diklat/${id}?_method=PUT`,
            fd,
            { headers: { "Content-Type": "multipart/form-data" } },
          )
        : api.post(`/operator/master-data/guru/${nuptk}/diklat`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
    },
    onSuccess: () => {
      toast.success("Diklat disimpan.");
      queryClient.invalidateQueries(["guru-diklat", nuptk]);
      setModalDiklat(null);
    },
    onError: (e) =>
      toast.error(e.response?.data?.message ?? "Gagal menyimpan."),
  });

  const deleteDiklat = useMutation({
    mutationFn: (id) =>
      api.delete(`/operator/master-data/guru/${nuptk}/diklat/${id}`),
    onSuccess: () => {
      toast.success("Diklat dihapus.");
      queryClient.invalidateQueries(["guru-diklat", nuptk]);
    },
    onError: (e) =>
      toast.error(e.response?.data?.message ?? "Gagal menghapus."),
  });

  const handleDiklatSubmit = (e) => {
    e.preventDefault();
    const f = e.target;
    saveDiklat.mutate({
      id: modalDiklat?.id,
      data: {
        nama_diklat: f.nama_diklat.value,
        penyelenggara: f.penyelenggara.value,
        jenis: f.jenis.value,
        tingkat: f.tingkat.value,
        tanggal_mulai: f.tanggal_mulai.value,
        tanggal_selesai: f.tanggal_selesai.value,
        jumlah_jam: f.jumlah_jam.value,
        peran: f.peran.value,
        file_sertifikat: f.file_sertifikat.files[0] ?? null,
      },
    });
  };

  const mutasis = guru.mutasis ?? [];
  const jabatans = guru.jabatans ?? [];

  return (
    <div className="space-y-6">
      {/* SEKSI DIKLAT & PELATIHAN */}
      <div className="bg-white rounded-[16px] border border-outline-variant/30 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <SectionTitle
            icon="model_training"
            label="Diklat & Pelatihan"
            desc={`${diklats.length} pelatihan diikuti`}
          />
          <button
            onClick={() => setModalDiklat("add")}
            className="px-3 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold flex items-center gap-1.5 hover:bg-primary/90 transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>{" "}
            Tambah
          </button>
        </div>
        {diklats.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-8">
            Belum ada riwayat diklat.
          </p>
        ) : (
          <div className="space-y-3">
            {diklats.map((d) => (
              <div
                key={d.id}
                className="p-4 bg-surface-container-low rounded-xl border border-border-light"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary">
                      {d.nama_diklat}
                    </p>
                    <p className="text-sm text-text-secondary mt-0.5">
                      Penyelenggara: {d.penyelenggara} · {d.tingkat}
                      {d.jumlah_jam && ` · ${d.jumlah_jam} Jam`}
                    </p>
                    {(d.tanggal_mulai || d.tanggal_selesai) && (
                      <p className="text-xs text-text-secondary mt-0.5">
                        {fmtDate(d.tanggal_mulai)} –{" "}
                        {fmtDate(d.tanggal_selesai)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {d.file_sertifikat && (
                      <button
                        onClick={() =>
                          downloadFile(
                            d.file_sertifikat,
                            `Sertifikat_${d.nama_diklat}`,
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
                      onClick={() => setModalDiklat(d)}
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
                          confirm("Hapus data diklat ini?") &&
                          deleteDiklat.mutate(d.id)
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

      {/* SEKSI MUTASI */}
      <div className="bg-white rounded-[16px] border border-outline-variant/30 shadow-sm p-6">
        <SectionTitle
          icon="transfer_within_a_station"
          label="Riwayat Mutasi & Status"
          desc={`${mutasis.length} riwayat tercatat`}
        />
        {mutasis.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-8">
            Belum ada riwayat mutasi.
          </p>
        ) : (
          <div className="space-y-3">
            {mutasis.map((m) => (
              <div
                key={m.id}
                className="p-4 bg-surface-container-low rounded-xl border border-border-light"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-primary uppercase">
                      {m.jenis_mutasi}
                    </span>
                    <p className="font-semibold text-text-primary text-sm mt-0.5">
                      {m.alasan ?? "Mutasi Kepegawaian"}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      TMT: {fmtDate(m.tmt_mutasi)} · SK: {m.no_sk ?? "-"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DIKLAT */}
      {modalDiklat && (
        <Modal
          title={
            modalDiklat === "add"
              ? "Tambah Riwayat Diklat"
              : "Edit Riwayat Diklat"
          }
          onClose={() => setModalDiklat(null)}
        >
          <form onSubmit={handleDiklatSubmit} className="space-y-4">
            <Field label="Nama Diklat / Pelatihan" required>
              <input
                name="nama_diklat"
                defaultValue={modalDiklat?.nama_diklat ?? ""}
                required
                className={inputCls}
                placeholder="Nama diklat..."
              />
            </Field>
            <Field label="Penyelenggara" required>
              <input
                name="penyelenggara"
                defaultValue={modalDiklat?.penyelenggara ?? ""}
                required
                className={inputCls}
                placeholder="Kemdikbud / Dinas..."
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Jenis Diklat">
                <select
                  name="jenis"
                  defaultValue={modalDiklat?.jenis ?? "Fungsional"}
                  className={inputCls}
                >
                  <option value="Fungsional">Fungsional</option>
                  <option value="Teknis">Teknis</option>
                  <option value="Manajerial">Manajerial</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </Field>
              <Field label="Tingkat">
                <select
                  name="tingkat"
                  defaultValue={modalDiklat?.tingkat ?? "Kabupaten/Kota"}
                  className={inputCls}
                >
                  <option value="Kecamatan">Kecamatan</option>
                  <option value="Kabupaten/Kota">Kabupaten/Kota</option>
                  <option value="Provinsi">Provinsi</option>
                  <option value="Nasional">Nasional</option>
                  <option value="Internasional">Internasional</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tanggal Mulai">
                <input
                  name="tanggal_mulai"
                  type="date"
                  defaultValue={modalDiklat?.tanggal_mulai ?? ""}
                  className={inputCls}
                />
              </Field>
              <Field label="Tanggal Selesai">
                <input
                  name="tanggal_selesai"
                  type="date"
                  defaultValue={modalDiklat?.tanggal_selesai ?? ""}
                  className={inputCls}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Jumlah Jam (JP)">
                <input
                  name="jumlah_jam"
                  type="number"
                  defaultValue={modalDiklat?.jumlah_jam ?? ""}
                  className={inputCls}
                  placeholder="32"
                />
              </Field>
              <Field label="Peran">
                <select
                  name="peran"
                  defaultValue={modalDiklat?.peran ?? "Peserta"}
                  className={inputCls}
                >
                  <option value="Peserta">Peserta</option>
                  <option value="Narasumber">Narasumber</option>
                  <option value="Panitia">Panitia</option>
                </select>
              </Field>
            </div>
            <Field label="Upload Sertifikat Diklat (PDF/JPG, maks 5MB)">
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
                onClick={() => setModalDiklat(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border-light text-text-secondary hover:bg-surface-container text-sm font-medium transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saveDiklat.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {saveDiklat.isPending ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
