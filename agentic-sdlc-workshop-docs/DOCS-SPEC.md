# DOCS-SPEC — Spesifikasi dokumentasi workshop (HTML interaktif)

> Dibaca bersama `CONTEXT.md` (konten) dan `PLAN.md` (teknis). Output utama: satu situs HTML statis di folder `site/` yang bisa dibuka offline dan di-publish ke GitHub Pages.

---

## 1. Prinsip
- **Bahasa:** Indonesia, to the point, kalimat pendek. Istilah GitHub tetap Inggris.
- **Audiens ganda:** tab/toggle "Bisnis" (persona, pain, kerugian, advantage) dan "Teknis" (file, perintah, PR).
- **Setiap klaim punya bukti:** screenshot before/after dari `docs/screenshots/` atau link PR/run.
- **Skill wajib:** gunakan skill **`ui-ux-pro-max`** (atau skill UI/UX terbaik yang tersedia di environment) untuk layout, tipografi, warna, komponen, dan aksesibilitas. Kalau skill tidak tersedia, pakai Tailwind CDN + pola desain yang sama (card, stepper, tabs, dark mode).
- **Tanpa framework build:** HTML + Tailwind CDN + vanilla JS + Mermaid CDN + Chart.js CDN. Harus jalan dengan membuka `index.html` langsung.

## 2. Struktur situs `site/`
```
site/
├─ index.html              # Landing: apa itu Agentic SDLC, big picture, cara pakai repo
├─ scenarios/
│  ├─ index.html           # Peta 15 skenario (grid card, filter level & persona)
│  └─ S01.html … S15.html  # Satu halaman per skenario (template seragam)
├─ architecture.html       # Arsitektur app + arsitektur agentic (diagram)
├─ capstone.html           # S15 end-to-end, timeline interaktif
├─ governance.html         # S14: kontrol, hooks, biaya
├─ setup.html              # Prasyarat personal vs org, checklist, reset
├─ assets/
│  ├─ screenshots/         # symlink/copy dari docs/screenshots
│  ├─ diagrams/            # SVG hasil export Mermaid (fallback offline)
│  └─ data/scenarios.json  # sumber data untuk grid & chart
└─ js/app.js               # filter, tabs, before/after slider, chart init
```

## 3. Template halaman skenario (SNN.html) — urutan section WAJIB
1. **Header:** kode (S04), judul, level badge, persona chips, durasi demo.
2. **Pain point:** cerita singkat (dari CONTEXT.md) + kartu "Kerugian" (waktu / biaya / risiko / moral) dengan ikon.
3. **Masalah yang ditanam di repo:** path file + snippet kode (collapsible).
4. **Solusi:** fitur GitHub yang dipakai + file konfigurasi yang terlibat.
5. **Flow diagram (Mermaid):** siapa melakukan apa → agent → hasil. Lihat §4.
6. **Langkah demo:** stepper bernomor; tiap step punya perintah/prompt yang bisa di-copy (tombol copy).
7. **Before / After:** komponen slider geser (dua screenshot) + tabel perbedaan 3–5 baris.
8. **Advantage:** 3 bullet maksimal.
9. **Bukti:** link PR / Actions run / alert (placeholder yang diisi setelah dry-run).
10. **Reset:** perintah untuk kembali ke baseline.
11. **Navigasi:** prev / next skenario, link ke capstone.

## 4. Diagram yang harus dibuat (Mermaid, embed + export SVG)
| ID | Halaman | Jenis | Isi |
|---|---|---|---|
| D1 | index | flowchart LR | Evolusi: completion → chat → coding agent → multi-agent SDLC |
| D2 | index | flowchart | SDLC loop: Plan → Build → Test → Review → Security → Deploy → Operate, tiap tahap diberi label skenario (S##) |
| D3 | architecture | C4-ish flowchart | Expense App: Browser → Express API → SQLite; CI; CodeQL |
| D4 | architecture | flowchart TB | Arsitektur agentic: Issue/Jira → Coding agent → Branch/PR → CI → Reviewer agents → CodeQL → Merge → gh-aw (docs/triage) → Audit/hooks |
| D5 | architecture | flowchart | Peta file `.github/` → agent mana membaca apa |
| D6 | S04 | sequenceDiagram | Dev → Issue → Copilot agent → Actions (test) → Draft PR → Review → Revisi |
| D7 | S09 | flowchart | PR → 3 reviewer agent paralel → ringkasan → Tech Lead |
| D8 | S10 | sequenceDiagram | CodeQL alert → assign Copilot → fix → rerun CodeQL → PR → alert closed |
| D9 | S11 | flowchart | architect → ADR → approve → implementer → security-reviewer |
| D10 | S12/S13 | flowchart | Event (push / issue / workflow_run) → gh-aw → safe-outputs (PR / label / comment) |
| D11 | S14 | flowchart | Request agent → hooks (allow/deny) → audit log; lapisan permissions |
| D12 | capstone | gantt atau timeline | 8 langkah S15 dengan aktor per langkah |
| D13 | setup | flowchart decision | Personal vs Org: fitur mana jalan di mana |

Aturan: label diagram bahasa Indonesia singkat; warna konsisten (manusia = biru, agent = ungu, gate/kontrol = oranye, artefak = abu). Setiap Mermaid diikuti `<noscript>`/fallback `<img src="assets/diagrams/Dx.svg">`.

## 5. Chart (Chart.js) — data dari dry-run, bukan karangan
| ID | Halaman | Chart | Data |
|---|---|---|---|
| C1 | index | bar horizontal | Tingkat otonomi per level (1–5) vs kontrol manusia yang dibutuhkan |
| C2 | scenarios | doughnut | Distribusi 15 skenario per persona |
| C3 | S08 | bar before/after | Coverage `approvalRules.js` sebelum vs sesudah (angka nyata dari Vitest) |
| C4 | S10 | bar | Jumlah alert open sebelum vs sesudah autofix (nyata) |
| C5 | capstone | stacked bar | Waktu per tahap "cara lama (ilustrasi)" vs "agentic (diukur saat dry-run)" |
| C6 | governance | line | AI credits terpakai per dry-run (dicatat di `docs/metrics.json`) |

Chart dengan data ilustrasi WAJIB berlabel "ilustrasi" di judulnya.

## 6. Komponen interaktif (vanilla JS, di `js/app.js`)
- Filter grid skenario: level, persona, "butuh org/enterprise".
- Toggle Bisnis / Teknis (disimpan di `localStorage`).
- Before/After image slider (drag).
- Tombol copy untuk prompt & perintah.
- Stepper capstone: klik langkah → highlight node di D12 + tampilkan screenshot langkah itu.
- Dark mode mengikuti `prefers-color-scheme`.
- Responsif sampai 320px; tanpa scroll horizontal.

## 7. Sumber screenshot → nama file
Mengikuti `scenarios.json` di `PLAN.md` §7. Konvensi: `SNN-before.png`, `SNN-after.png`, `SNN-<step>.png` (mis. `S04-02-agent-session.png`, `S10-03-alert-closed.png`). Halaman skenario memuat gambar berdasarkan konvensi ini; bila file belum ada, tampilkan placeholder "belum di-capture" (jangan gambar rusak).

## 8. Konten tambahan yang harus ada
- **Glossary** (1 halaman/section): coding agent, custom agent, skill, MCP, hook, gh-aw, safe-outputs, premium request / AI credit, branch protection.
- **FAQ** 8–10 pertanyaan dari sudut CISO/PM/Dev (mis. "Apakah agent bisa merge sendiri?" → tidak).
- **Peta file `.github/`** dengan deskripsi satu kalimat per file.
- **Kartu "Mulai dari mana"** di landing: Dev → S01; EM/PM → S04; QA → S08; AppSec → S10; CISO → S14; Eksekutif → capstone.

## 9. Definition of done dokumentasi
- [ ] 15 halaman skenario lengkap mengikuti template §3, konten identik dengan `CONTEXT.md`.
- [ ] 13 diagram Mermaid ter-render + SVG fallback.
- [ ] Chart C3, C4, C5, C6 memakai angka nyata dari dry-run; sisanya berlabel ilustrasi.
- [ ] Semua screenshot ada atau placeholder rapi.
- [ ] Buka `site/index.html` offline tanpa error console.
- [ ] Lighthouse: accessibility ≥ 90, tidak ada kontras gagal.
- [ ] Bahasa Indonesia konsisten, tidak ada nama client nyata.
- [ ] Publish ke GitHub Pages dari folder `site/` (workflow `pages.yml`).

## 10. Prompt pembuka untuk agent di VS Code
> "Baca `CONTEXT.md`, `PLAN.md`, dan `DOCS-SPEC.md`. Gunakan skill `ui-ux-pro-max`. Bangun folder `site/` sesuai DOCS-SPEC §2–§9. Mulai dari `assets/data/scenarios.json` (turunkan dari CONTEXT.md §3), lalu `index.html`, lalu template skenario dan generate S01–S15, lalu diagram D1–D13, lalu chart. Jangan mengarang angka; pakai placeholder 'ilustrasi' atau baca `docs/metrics.json`. Bahasa Indonesia, to the point."
