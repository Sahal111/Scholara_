#!/usr/bin/env python3
"""
Satukan sumber daftar permission ke SATU kelas: Database\\Seeders\\Support\\RbacCatalog

Sebelum:  SchoolSeeder, MultiSchoolSeeder, dan SyncPermissions masing-masing
          menyimpan salinan daftar permission sendiri (dan sudah saling menyimpang).
Sesudah:  ketiganya memanggil RbacCatalog.

Sumber kebenaran:
  - definisi permission : SchoolSeeder (file lokalmu) + permission yang hanya ada di
                          SyncPermissions (akun.*, dms.delete, pengaturan.update)
  - matriks role        : SchoolSeeder (kebijakan terbaru, setelah pemisahan RBAC)

Jalankan dari folder backend/:
    python3 refactor_rbac_catalog.py

Aman: file lama dibackup ke *.bak, dan skrip berhenti tanpa mengubah apa pun
kalau ada penanda yang tidak ditemukan.
"""
import pathlib
import re
import shutil
import sys

ROOT = pathlib.Path(".")
SCHOOL = ROOT / "database/seeders/SchoolSeeder.php"
MULTI = ROOT / "database/seeders/MultiSchoolSeeder.php"
SYNC = ROOT / "app/Console/Commands/SyncPermissions.php"
CATALOG = ROOT / "database/seeders/Support/RbacCatalog.php"

USE_LINE = "use Database\\Seeders\\Support\\RbacCatalog;\n"


def die(msg):
    sys.exit(f"GAGAL: {msg}\nTidak ada file yang diubah.")


def read(p):
    return p.read_text(encoding="utf-8")


def method_span(src, name):
    """Offset (mulai, akhir) sebuah `private function name(): array {...}` (akhir = setelah '    }\\n')."""
    m = re.search(rf"^    private function {name}\(\): array\n    \{{\n", src, re.M)
    if not m:
        return None
    end = re.compile(r"^    \}\n", re.M).search(src, m.end())
    if not end:
        return None
    return m.start(), end.end()


def delegasi(name):
    return (
        f"    private function {name}(): array\n"
        "    {\n"
        f"        return RbacCatalog::{name}();\n"
        "    }\n"
    )


def tambah_use(src):
    if USE_LINE in src:
        return src
    m = re.search(r"^namespace [^\n]+;\n\n", src, re.M)
    if not m:
        die("baris 'namespace' tidak ditemukan")
    return src[: m.end()] + USE_LINE + src[m.end():]


# ── pastikan kondisi awal ────────────────────────────────────────────────────
for p in (SCHOOL, MULTI, SYNC):
    if not p.exists():
        die(f"{p} tidak ditemukan. Jalankan dari folder backend/.")
if CATALOG.exists():
    die(f"{CATALOG} sudah ada (refactor sudah pernah dijalankan?).")

school_src, multi_src, sync_src = read(SCHOOL), read(MULTI), read(SYNC)

# ── 1. ambil dua method dari SchoolSeeder ────────────────────────────────────
span_def = method_span(school_src, "permissionDefinitions")
span_mat = method_span(school_src, "rolePermissionMatrix")
if not span_def or not span_mat:
    die("method permissionDefinitions/rolePermissionMatrix tidak ditemukan di SchoolSeeder")

def_text = school_src[span_def[0]:span_def[1]]
mat_text = school_src[span_mat[0]:span_mat[1]]

# ── 2. tambahan: definisi yang HANYA ada di SyncPermissions ──────────────────
slug_re = re.compile(r"\['slug' => '([^']+)', 'nama' => '[^']*', 'modul' => '[^']*'\],")
school_slugs = set(re.findall(r"\['slug' => '([^']+)'", def_text))

m_prop = re.search(r"^    private array \$permissionDefinitions = \[\n(.*?)^    \];\n", sync_src, re.M | re.S)
if not m_prop:
    die("properti $permissionDefinitions tidak ditemukan di SyncPermissions")

extras = [
    line.strip()
    for line in m_prop.group(1).splitlines()
    if (mm := slug_re.search(line)) and mm.group(1) not in school_slugs
]

# sisipkan sebelum penutup array di method definisi
close = def_text.rfind("        ];\n")
if close == -1:
    die("penutup array permissionDefinitions tidak ditemukan")
tambahan = (
    "\n            // ── Dulu hanya ada di command permissions:sync, tidak di seeder ──\n"
    + "".join(f"            {e}\n" for e in extras)
)
def_text = def_text[:close].rstrip("\n") + "\n" + tambahan + def_text[close:]

# ── 3. ubah menjadi static, rapikan referensi $this ──────────────────────────
def jadikan_static(text):
    text = re.sub(r"private function (\w+)\(\): array", r"public static function \1(): array", text, count=1)
    return text.replace("$this->permissionDefinitions()", "self::permissionDefinitions()")

catalog = f"""<?php

namespace Database\\Seeders\\Support;

/**
 * SATU-SATUNYA sumber daftar permission & pembagian peran (RBAC).
 *
 * Dipakai oleh:
 *   - SchoolSeeder
 *   - MultiSchoolSeeder
 *   - php artisan permissions:sync
 *
 * Menambah permission baru: cukup ubah file ini, lalu
 *   php artisan db:seed --class=MultiSchoolSeeder   (sekolah dev)
 *   php artisan permissions:sync                    (sekolah yang sudah ada)
 *
 * Dijaga oleh tests/Feature/RbacCatalogTest.php.
 */
final class RbacCatalog
{{
{jadikan_static(def_text)}
{jadikan_static(mat_text)}}}
"""

# ── 4. tulis katalog + ubah tiga pemakai ─────────────────────────────────────
new_school = school_src[: span_def[0]] + delegasi("permissionDefinitions") + school_src[span_def[1]:]
span_mat2 = method_span(new_school, "rolePermissionMatrix")
new_school = new_school[: span_mat2[0]] + delegasi("rolePermissionMatrix") + new_school[span_mat2[1]:]
new_school = tambah_use(new_school)

new_multi = multi_src
for name in ("permissionDefinitions", "rolePermissionMatrix"):
    sp = method_span(new_multi, name)
    if not sp:
        die(f"method {name} tidak ditemukan di MultiSchoolSeeder")
    new_multi = new_multi[: sp[0]] + delegasi(name) + new_multi[sp[1]:]
new_multi = tambah_use(new_multi)

# SyncPermissions: buang salinan lokal, pakai katalog
new_sync = sync_src[: m_prop.start()] + sync_src[m_prop.end():]
if "foreach ($this->permissionDefinitions as $def)" not in new_sync:
    die("pemakaian $this->permissionDefinitions di SyncPermissions tidak ditemukan")
new_sync = new_sync.replace(
    "foreach ($this->permissionDefinitions as $def)",
    "foreach (RbacCatalog::permissionDefinitions() as $def)",
)

m_bl = re.search(r"^    private array \$operatorBlacklist = \[\n.*?^    \];\n\n?", new_sync, re.M | re.S)
old_allowed = re.search(
    r"\$allowedSlugs = array_diff\(\s*array_column\(\$toInsert, 'slug'\),\s*\$this->operatorBlacklist\s*\);",
    new_sync,
)
if not m_bl or not old_allowed:
    die("operatorBlacklist/allowedSlugs di SyncPermissions tidak ditemukan")

new_sync = new_sync.replace(
    old_allowed.group(0),
    "$allowedSlugs = array_intersect(\n"
    "                array_column($toInsert, 'slug'),\n"
    "                RbacCatalog::rolePermissionMatrix()['operator'] ?? []\n"
    "            );",
)
new_sync = new_sync[: m_bl.start()] + new_sync[m_bl.end():]

if "use Illuminate\\Support\\Facades\\DB;\n" not in new_sync:
    die("baris 'use ...\\DB;' tidak ditemukan di SyncPermissions")
new_sync = new_sync.replace(
    "use Illuminate\\Support\\Facades\\DB;\n",
    "use Illuminate\\Support\\Facades\\DB;\n" + USE_LINE,
    1,
)

# ── 5. commit perubahan ──────────────────────────────────────────────────────
for p in (SCHOOL, MULTI, SYNC):
    shutil.copyfile(p, str(p) + ".bak")

CATALOG.parent.mkdir(parents=True, exist_ok=True)
CATALOG.write_text(catalog, encoding="utf-8")
SCHOOL.write_text(new_school, encoding="utf-8")
MULTI.write_text(new_multi, encoding="utf-8")
SYNC.write_text(new_sync, encoding="utf-8")

print(f"Selesai. Katalog dibuat: {CATALOG}")
print(f"Definisi tambahan dari SyncPermissions: {len(extras)} permission")
for e in extras:
    print("   +", re.search(r"'slug' => '([^']+)'", e).group(1))
print("Backup: SchoolSeeder.php.bak, MultiSchoolSeeder.php.bak, SyncPermissions.php.bak")
