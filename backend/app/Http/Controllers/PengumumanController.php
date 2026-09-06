<?php

namespace App\Http\Controllers;

use App\Http\Requests\Pengumuman\StorePengumumanRequest;
use App\Http\Requests\Pengumuman\UpdatePengumumanRequest;
use App\Models\Pengumuman;
use Illuminate\Http\Request;

class PengumumanController extends Controller
{
    public function index(Request $request)
    {
        $query = Pengumuman::with('penulis:id,username')
            ->whereIn('target', ['semua', 'internal'])
            ->orderBy('created_at', 'desc');

        // Operator, kepsek, dan wakasek boleh lihat semua termasuk yang terjadwal (publish_at di masa depan).
        // Role lain (guru, ortu, dll) hanya lihat yang sudah publish.
        // Gunakan hasRole() — skema baru tidak punya kolom role_id di tabel users.
        $user = $request->user();
        $canSeeScheduled = $user && (
            $user->hasRole('operator') ||
            $user->hasRole('kepsek') ||
            $user->hasRole('wakasek')
        );

        if (!$canSeeScheduled) {
            $query->where(function ($q) {
                $q->whereNull('publish_at')
                    ->orWhere('publish_at', '<=', now());
            });
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    public function store(StorePengumumanRequest $request)
    {

        $pengumuman = Pengumuman::create([
            'judul' => $request->judul,
            'konten' => $request->konten,
            'kategori' => $request->kategori,
            'target' => $request->target,
            'penulis_id' => $request->user()->id,
            'publish_at' => $request->publish_at ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengumuman berhasil ditambahkan.',
            'data' => $pengumuman,
        ], 201);
    }

    public function update(UpdatePengumumanRequest $request, $id)
    {

        $pengumuman = Pengumuman::findOrFail($id);
        $pengumuman->update([
            'judul' => $request->judul,
            'konten' => $request->konten,
            'kategori' => $request->kategori,
            'target' => $request->target,
            'publish_at' => $request->publish_at ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengumuman berhasil diperbarui.',
            'data' => $pengumuman,
        ]);
    }

    public function destroy($id)
    {
        $pengumuman = Pengumuman::findOrFail($id);
        $pengumuman->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pengumuman berhasil dihapus.'
        ]);
    }
}