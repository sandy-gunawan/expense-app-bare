# PLAN — Workshop "Agentic SDLC di GitHub" (Base Repo: Expense Claim App)

> Dokumen ini ditulis supaya bisa langsung dipakai sebagai instruksi ke GitHub Copilot Agent Mode di VS Code (taruh sebagai `PLAN.md` di root repo, lalu kerjakan per Phase).
> Urutan skenario = urutan BELAJAR (simple → kompleks). Secara teknis, semua komponen sudah ada di repo `full`, jadi skenario bisa dijalankan tidak urut.

---

## 0. Ringkasan keputusan

| Hal | Keputusan |
|---|---|
| Aplikasi | **Expense Claim** (pengajuan klaim biaya karyawan): form klaim → daftar klaim → approval manager → laporan |
| Stack | Node.js 20 + Express (API) · Vanilla HTML/JS + Tailwind CDN (UI) · SQLite (better-sqlite3) · Vitest (unit) · Playwright (e2e + screenshot) · GitHub Actions (CI) |
| Alasan stack | Satu bahasa (JS/TS) → CodeQL support penuh, cepat di-install di laptop peserta, gampang dibaca audiens non-dev |
| Repo | 2 Template repository: `expense-app-bare` dan `expense-app-full` (lihat §3) |
| Reset | `main` tidak pernah disentuh agent (agent selalu kerja di branch `copilot/*` + draft PR). Tag `v0-baseline` + `scripts/reset.sh` |
| Before/After | Dua cara (lihat §5): (a) `main` = before, branch/PR agent = after; (b) folder `demo-before/` vs `demo-after/` untuk slide statis |
| Screenshot | Otomatis via Playwright script + Playwright MCP (lihat §7) |

---

## 1. Prasyarat GitHub — personal vs organization

| Komponen | Personal account (Copilot Pro/Pro+) | Organization (Copilot Business/Enterprise) | Catatan |
|---|---|---|---|
| Agent Mode di VS Code (#1–#3) | ✅ | ✅ | |
| Coding agent: assign issue → draft PR (#4–#7, #15) | ✅ (Pro, Pro+, Max; Free terbatas) | ✅ (admin harus enable policy) | Pakai AI credits / premium requests |
| Custom agents `.github/agents/` (#8, #9, #11) | ✅ | ✅ | |
| Copilot code review di PR (#9) | ✅ | ✅ | |
| CodeQL code scanning + autofix (#10) | ✅ **hanya repo PUBLIC** | ✅ private perlu GitHub Code Security (GHAS) | Free/Pro tidak bisa scan private repo |
| Agentic Workflows gh-aw (#12, #13) | ✅ tapi perlu secret `COPILOT_GITHUB_TOKEN` (fine-grained PAT, Copilot Requests: Read) | ✅ pakai `GITHUB_TOKEN` + policy "Allow use of Copilot CLI billed to the organization" + `copilot-requests: write` | |
| Hooks `.github/hooks/` (#14) | ✅ | ✅ | |
| Enterprise policy, audit log, usage dashboard (#14) | ❌ terbatas | ✅ | Ini argumen "kenapa enterprise" |
| Jira/Teams entry point (#6) | ❌ | ✅ (Copilot Business/Enterprise) | Di personal: ganti dengan Issue |

**Rekomendasi untuk kamu:**
- **Bangun & simpan source di GitHub personal (repo PUBLIC)** supaya CodeQL gratis dan tidak terikat EMU. Nama repo tidak perlu mengandung nama client.
- **Demo governance (#14) dan Jira (#6)** jalankan di organisasi/EMU yang disetujui admin, dengan membuat repo dari template personal.
- Catatan EMU: repo personal EMU tidak bisa pakai Copilot personal; jangan campur. Personal = bangun & simpan; EMU = demo fitur enterprise.

### Checklist sebelum mulai
- [ ] GitHub personal: Copilot Pro/Pro+ aktif, cek `github.com/settings/copilot` → Coding agent: Enabled
- [ ] `gh` CLI ≥ 2.0 login: `gh auth login --scopes repo,workflow`
- [ ] `gh extension install github/gh-aw`
- [ ] Node 20 LTS, VS Code + ext: GitHub Copilot, GitHub Copilot Chat, Playwright Test, GitHub Actions, GitHub Pull Requests
- [ ] Fine-grained PAT (Copilot Requests: Read) → disimpan sebagai secret `COPILOT_GITHUB_TOKEN` di repo (untuk gh-aw di personal)
- [ ] Playwright MCP di VS Code: `code --add-mcp '{"name":"playwright","command":"npx","args":["@playwright/mcp@latest"]}'`

---

## 2. Aplikasi: Expense Claim App

### 2.1 Domain (sederhana, relevan FSI/enterprise)
- **Employee** mengajukan klaim: judul, kategori, jumlah, tanggal, lampiran (nama file saja), catatan.
- **Manager** melihat daftar klaim timnya, approve / reject.
- **Finance** melihat laporan: total per kategori, per bulan.
- Aturan bisnis yang dipakai skenario: limit approval bertingkat (≤1 jt manager, >1 jt perlu 2 approver), tanggal klaim tidak boleh masa depan, kategori valid.

### 2.2 Struktur folder (repo `bare` dan `full` sama, bedanya isi `.github/`)
```
expense-app/
├─ src/
│  ├─ server.js            # Express bootstrap
│  ├─ db.js                # SQLite init + seed
│  ├─ routes/
│  │  ├─ claims.js         # CRUD klaim
│  │  ├─ approvals.js      # approve/reject
│  │  └─ reports.js        # laporan
│  ├─ services/
│  │  ├─ approvalRules.js  # logika limit approval  ← target #8 (bug tersembunyi, 0 test)
│  │  └─ validation.js
│  └─ public/
│     ├─ index.html        # form + list klaim
│     ├─ manager.html      # approval
│     └─ report.html
├─ tests/
│  ├─ unit/                # Vitest
│  └─ e2e/                 # Playwright (juga dipakai untuk screenshot)
├─ docs/
│  ├─ api.md               # ← sengaja beda dari kode (#12)
│  └─ adr/                 # Architecture Decision Records (#11)
├─ scripts/
│  ├─ reset.sh / reset.ps1 # kembalikan ke v0-baseline, close PR, hapus branch copilot/*
│  ├─ seed-issues.sh       # buat ulang 15 issue demo dari issues/*.md
│  └─ screenshots.mjs      # Playwright screenshot before/after (lihat §7)
├─ issues/                 # template issue per skenario (S01.md … S15.md)
├─ .github/
│  ├─ workflows/ci.yml
│  ├─ copilot-instructions.md        # (hanya di full)
│  ├─ agents/                        # (hanya di full)
│  ├─ skills/new-endpoint/SKILL.md   # (hanya di full)
│  ├─ workflows/docs-sync.md + .lock.yml   # gh-aw (hanya di full)
│  ├─ workflows/issue-triage.md + .lock.yml
│  ├─ workflows/ci-fault-analysis.md + .lock.yml
│  └─ hooks/guardrails.json          # (hanya di full)
├─ AGENTS.md                         # (hanya di full)
├─ PLAN.md                           # dokumen ini
└─ README.md
```

### 2.3 Masalah yang SENGAJA ditanam (ada di `bare` maupun `full`)
| ID | Lokasi | Masalah | Dipakai skenario |
|---|---|---|---|
| P1 | seluruh `src/` | Campur gaya: camelCase vs snake_case, error handling tidak seragam, tidak ada instructions | #1 |
| P2 | model/UI | Belum ada field `category` di form & API | #2 |
| P3 | `routes/` | Tiap endpoint beda pola, `reports.js` tanpa validasi & logging | #3 |
| P4 | — | Issue siap: "Tambah `claimDate` + validasi tidak boleh masa depan" | #4 |
| P5 | `tests/unit/claims.test.js` | Test pakai `new Date()` tanpa fixed clock → flaky lintas timezone | #5 |
| P6 | `public/index.html` | Label tombol "Submit" dan tidak ada tooltip (ticket PM) | #6 |
| P7 | `src/legacy/csvExport.js` | Pakai library deprecated (`request`), 0 test | #7 |
| P8 | `services/approvalRules.js` | Coverage 0%; bug: batas `> 1000000` seharusnya `>=` | #8 |
| P9 | `routes/claims.js` | N+1 query saat list klaim + `console.log` seluruh objek user (PII) | #9 |
| P10 | `docs/fixtures/` | Skenario temuan keamanan ilustratif; laporan hidup tetap memakai query berparameter dan paket tidak sengaja diturunkan | #10 |
| P11 | — | Issue epik "Approval bertingkat" tanpa desain | #11 |
| P12 | `docs/api.md` | Dokumentasi response `GET /claims` beda dengan kode | #12 |
| P13 | — | Issue tanpa label; error CI "ECONNRESET" berulang di test e2e | #13 |
| P14 | `scripts/hooks/` | Bandingkan dengan dan tanpa hook memakai sinyal uji inert; tidak meminta agent memodifikasi file atau membaca rahasia untuk demonstrasi | #14 |
| P15 | — | Epik "Multi-currency expense" (IDR/USD/SGD) | #15 |

---

## 3. Dua repo template: `bare` vs `full`

| | `expense-app-bare` | `expense-app-full` |
|---|---|---|
| Isi | App + 15 masalah ditanam + CI + tests + issues/ | Sama + semua file `.github/` (instructions, agents, skills, gh-aw, hooks) |
| Untuk siapa | Peserta developer (belajar MEMBANGUN tim virtual dari nol) | Presenter / audiens eksekutif (lompat langsung ke #15) |
| Cara pakai | *Use this template* → repo peserta | *Use this template* → repo demo presenter |

Cara teknis: bangun `full` dulu, lalu `bare` = `full` dikurangi folder `.github/agents`, `.github/skills`, `.github/hooks`, `copilot-instructions.md`, `AGENTS.md`, dan file gh-aw. Script `scripts/make-bare.sh` melakukan ini otomatis supaya keduanya selalu sinkron.

---

## 4. 15 Skenario — detail per skenario

Format: **Tujuan belajar · Setup · Langkah demo · Bukti "after" · Reset**

### Level 1 — Inner loop (VS Code)

**S01 — Custom instructions / AGENTS.md**
- Tujuan: hasil agent konsisten mengikuti konvensi tim.
- Setup: `bare` tidak punya instructions.
- Demo: (1) Agent Mode: "tambah endpoint GET /claims/:id/history" → lihat gaya acak. (2) Tambah `.github/copilot-instructions.md` (naming, error format `{code,message}`, logger wajib, test wajib). (3) Ulangi prompt yang sama → bandingkan.
- Bukti: diff dua hasil side-by-side (screenshot `S01-before.png`, `S01-after.png`).
- Reset: `git checkout .` (lokal saja).

**S02 — Agent Mode fitur lintas file**
- Demo: "Tambahkan field `category` (enum: Travel, Meals, Equipment, Other) ke klaim: DB migration, model, API validasi, form UI, unit test." Agent edit 6 file, jalankan `npm test`.
- Bukti: form UI sebelum/sesudah + test hijau.
- Reset: lokal, `git checkout .`.

**S03 — Agent Skill `new-endpoint`**
- Setup (`full`): `.github/skills/new-endpoint/SKILL.md` berisi prosedur: route → validasi → service → test → docs.
- Demo: "Buat endpoint POST /claims/:id/comments pakai skill new-endpoint." Bandingkan dengan `reports.js` yang acak-acakan.
- Bukti: file baru seragam + `docs/api.md` ikut ter-update.

### Level 2 — Delegasi asinkron (coding agent)

**S04 — Issue → assign ke Copilot → draft PR** ★ jantung demo
- Setup: Issue dari `issues/S04.md` (acceptance criteria jelas).
- Demo: Assign ke **Copilot** → tab Agents/PR menunjukkan session log → draft PR muncul dengan ringkasan + test lolos → manusia review → comment "tambahkan test untuk tanggal hari ini" → agent revisi.
- Bukti: PR page, CI hijau, before/after UI (field tanggal muncul, error saat masa depan).
- Reset: close PR + hapus branch (tidak pernah merge).

**S05 — Fix CI merah**
- Setup: P5 flaky test; jalankan CI dengan `TZ=America/Los_Angeles` di matrix supaya pasti merah.
- Demo: dari failing run → "Fix with Copilot" / assign issue "CI gagal di run #N" → agent baca log → PR pakai `vi.setSystemTime`.
- Bukti: run merah → run hijau.

**S06 — Delegasi dari Jira/Teams (org only; di personal pakai Issue)**
- Demo: ticket "Ubah label Submit → Ajukan Klaim, tambah tooltip" → delegasi dari Jira/Teams → PR.
- Bukti: screenshot Jira/Teams + PR link.

**S07 — Legacy modernization kecil**
- Setup: `src/legacy/csvExport.js` pakai `request` (deprecated), 0 test.
- Demo: Issue 2 tahap: (a) "buat characterization test untuk csvExport" → PR1; (b) "ganti `request` dengan `fetch` native, test harus tetap hijau" → PR2.
- Pesan: test dulu sebagai safety net, baru migrasi.

### Level 3 — Virtual team (custom agents)

**S08 — Virtual QA: `qa-engineer` agent**
- Setup: `.github/agents/qa-engineer.agent.md` — tugas: cari modul coverage rendah, tulis test berbasis acceptance criteria, laporkan bug sebagai issue, TIDAK mengubah kode produksi.
- Demo: assign issue "QA review approvalRules" ke agent qa-engineer → agent tulis test → test gagal di boundary 1.000.000 → agent buka issue "Bug: limit approval off-by-one" + PR test.
- Bukti: coverage 0% → 95%, issue bug otomatis.

**S09 — Virtual Review Board (3 reviewer)**
- Setup: `security-reviewer`, `perf-reviewer`, `compliance-reviewer` (semua read-only, output = komentar PR dengan severity).
- Demo: buka PR S04 (atau PR "stok" di template) → panggil ketiga reviewer → security: PII di log; perf: N+1; compliance: tidak ada audit trail approval. Copilot code review built-in juga diaktifkan.
- Bukti: komentar PR dari 3 agent + ringkasan untuk Tech Lead.
- Dependensi: butuh PR yang sudah ada (S04 atau PR stok).

**S10 — Virtual Security team: CodeQL autofix**
- Setup: CodeQL default setup aktif jika tersedia. P10 memakai fixture laporan temuan yang ditandai ilustrasi; tidak membuat alert hidup buatan.
- Demo: Security tab → periksa hasil scan. Bila ada alert nyata yang disetujui pemilik, tinjau mitigasi, test, dan hasil scan ulang; jangan buat alert dengan melemahkan aplikasi.
- Pre-warm: push ke `main` minimal 15 menit sebelum sesi agar alert sudah ada.
- Bukti: alert open → closed by PR.

**S11 — Virtual Architect: design → implement → review**
- Setup: `architect.agent.md` output = `docs/adr/NNNN-*.md`; `implementer.agent.md`; handoff ke `security-reviewer`.
- Demo: epik "Approval bertingkat (>1 jt perlu 2 approver)" → architect buat ADR + task breakdown → Tech Lead approve (comment) → implementer → reviewer.
- Bukti: ADR file + PR berantai.

### Level 4 — Continuous AI (gh-aw)

**S12 — Docs sync workflow**
- Setup: `.github/workflows/docs-sync.md` trigger `push` ke branch + schedule; `safe-outputs: create-pull-request`; `permissions: contents: read`.
- Demo: push perubahan response `GET /claims` → workflow jalan → draft PR update `docs/api.md`.
- Bukti: Actions run + PR.

**S13 — Issue triage + CI fault analysis**
- Setup: `issue-triage.md` (`safe-outputs: add-labels, add-comment`), `ci-fault-analysis.md` (trigger `workflow_run` failed → `add-comment`).
- Demo: buat issue tanpa label "aplikasi error" → auto-label `needs-info` + pertanyaan klarifikasi. Trigger CI gagal → komentar akar masalah.

### Level 5 — Governance & Capstone

**S14 — Guardrails: hooks, safe-outputs, cost**
- Setup: `.github/hooks/guardrails.json`: blok `rm -rf`, `curl … | sh`, akses `.env`; log setiap tool call ke `audit/`.
- Demo: kirim sinyal uji inert ke harness hook lokal → keputusan deny dan log terlihat. Tunjukkan Copilot usage/AI credits dashboard (org) & frontmatter permissions gh-aw.
- Bukti: hook log + screenshot dashboard.

**S15 — Capstone: Feature Delivery End-to-End "Multi-currency expense"** ★
1. PM buat epik (Issue/Jira) → **planner agent** (`planner.agent.md`, pola Research → Plan → Assign) riset repo, pecah jadi: ADR, implementasi API+UI, test, docs.
2. **Architect (S11)** → ADR `0002-multi-currency.md` → Tech Lead approve.
3. **Coding agent (S04)** implementasi di branch `copilot/multi-currency`, test lolos, draft PR.
4. **CI (S05)** jalan; bila merah agent perbaiki.
5. **Review Board (S09)** + **CodeQL (S10)** di PR yang sama; agent revisi.
6. **Tech Lead merge** (branch protection: 1 approval + CI + CodeQL). ← satu-satunya merge, dilakukan di repo turunan template.
7. **Docs sync (S12)** update `docs/api.md`; **triage (S13)** siap untuk issue lanjutan.
8. **Guardrails (S14)** terlihat di audit log sepanjang alur.
- Durasi demo: 25–30 menit (dengan pre-warm). Versi sederhana (eksekutif): langkah 1, 3, 5, 6 saja.
- Bukti: UI before (hanya IDR) vs after (dropdown currency + konversi), timeline PR dengan komentar 3 reviewer, ADR, docs ter-update.

---

## 5. Strategi "Before vs After"

| Cara | Kapan dipakai | Implementasi |
|---|---|---|
| **A. Live: `main` vs branch agent** | Demo langsung | `npm run dev` di `main` (port 3000) dan `git worktree add ../after copilot/<branch>` → port 3001. Buka dua tab browser berdampingan. Script `scripts/compare.sh <branch>` otomatis buka keduanya. |
| **B. Snapshot statis** | Slide, dokumentasi, saat internet lambat | `scripts/screenshots.mjs` menghasilkan `docs/screenshots/S04-before.png`, `S04-after.png`; `docs/BEFORE-AFTER.md` memuat tabel gambar per skenario. |
| **C. Repo `expense-app-final`** (opsional) | Tunjukkan hasil akhir setelah 15 skenario | Branch `final` di repo `full` yang sudah merge semua PR — supaya audiens bisa lihat "ujungnya" tanpa menunggu demo. |

Rekomendasi: A untuk demo, B untuk materi, C hanya kalau sempat.

---

## 6. Reset & repeatability

- Tag `v0-baseline` menandai versi workshop siap pakai.
- `npm run reset` menghapus hanya worktree latihan yang bersih dan mengawali ulang demo lokal dari tag. Tidak mengubah riwayat, branch, issue, atau PR di GitHub.
- Untuk peserta: cukup *Use this template* lagi (history bersih).
- gh-aw workflows: bisa `gh aw disable <name>` di luar sesi supaya tidak jalan sendiri/menghabiskan credit.

---

## 7. Otomasi screenshot untuk dokumentasi (VS Code)

Dua lapis:

**7.1 Screenshot aplikasi (web UI) — Playwright script**
- `scripts/screenshots.mjs`: untuk setiap skenario di `scenarios.json` → start server dari branch yang ditentukan → navigasi → isi form → `page.screenshot({path: 'docs/screenshots/S04-after.png', fullPage: true})`.
- `scenarios.json` contoh:
  ```json
  [{ "id":"S04", "before":"main", "after":"copilot/claim-date",
     "steps":[{"goto":"/"},{"fill":"#title","value":"Taksi bandara"},{"click":"#submit"}] }]
  ```
- Jalankan: `npm run shots` (VS Code task `Capture Screenshots`). Output juga di-embed otomatis ke `docs/BEFORE-AFTER.md`.

**7.2 Screenshot GitHub & VS Code (PR page, Agents tab, Security tab) — Playwright MCP**
- Playwright MCP sudah di VS Code; buat skill `.github/skills/doc-shots/SKILL.md` berisi prosedur: login sekali (storage state disimpan di `.auth/` yang di-gitignore), lalu kunjungi URL PR/alert/Actions dan screenshot dengan nama `SNN-<step>.png`.
- Prompt ke agent: "Pakai skill doc-shots untuk skenario S10: screenshot alert CodeQL sebelum, PR autofix, dan alert closed."
- Untuk screenshot editor VS Code sendiri: pakai `code serve-web` + Playwright (pola skill `vscode-playwright` dari microsoft/hve-core).

**7.3 Video (opsional)**
- Playwright `recordVideo` di `scenarios.json` (`"video": true`) → `docs/video/S04.webm`. Narasi ditambahkan belakangan.

---

## 8. Urutan pengerjaan di VS Code (Phase)

| Phase | Yang dikerjakan (prompt ke Agent Mode) | Output |
|---|---|---|
| 0 | Buat repo `expense-app-full` kosong (public, personal), clone, taruh `PLAN.md` | repo |
| 1 | "Baca PLAN.md §2. Bangun Expense Claim App sesuai struktur, dengan seed data 20 klaim, Vitest, Playwright e2e dasar, CI. Jangan tanam masalah dulu." | app jalan, test hijau |
| 2 | "Tanam masalah P1–P13 sesuai §2.3, satu commit per masalah dengan pesan `seed(P#): …`" | commit per masalah |
| 3 | "Buat `issues/S01.md … S15.md` sesuai §4 (judul, konteks, acceptance criteria, label) dan `scripts/seed-issues.sh`" | 15 issue template |
| 4 | "Buat `.github/copilot-instructions.md`, `AGENTS.md`, agents (qa-engineer, security-reviewer, perf-reviewer, compliance-reviewer, architect, implementer, planner), skill new-endpoint, hooks guardrails" | tim virtual |
| 5 | "Buat gh-aw: docs-sync, issue-triage, ci-fault-analysis dengan safe-outputs & permissions minimal; compile `gh aw compile`" | workflows |
| 6 | "Buat `scripts/reset.sh/.ps1`, `compare.sh`, `make-bare.sh`, `screenshots.mjs`, `scenarios.json`, VS Code tasks" | tooling |
| 7 | Tag `v0-baseline`, push, enable CodeQL default setup, jadikan Template, jalankan `make-bare.sh` → repo `expense-app-bare` | 2 template |
| 8 | Dry-run S04, S09, S10, S15 end-to-end; jalankan `npm run shots`; isi `docs/BEFORE-AFTER.md` | bukti & screenshot |
| 9 | Import `full` ke demo org/EMU untuk S06 & S14 (dashboard, policy) | demo enterprise |

---

## 9. Hal yang saya tambahkan (belum kamu sebut, tapi penting)

1. **Branch protection di repo demo**: required CI + CodeQL + 1 approval — supaya pesan "agent tetap tunduk pada gate yang sama" terlihat nyata.
2. **PR "stok"** di template (branch `demo/pr-stock`) → S09 bisa dijalankan tanpa menunggu S04.
3. **Pre-warm checklist** sebelum sesi: push untuk CodeQL, compile gh-aw, buka 1 session coding agent supaya runner hangat, cek sisa AI credits.
4. **Budget**: estimasi credits per full dry-run (catat setelah Phase 8) → masuk slide S14 sebagai contoh "cost awareness".
5. **Nama client disamarkan**: semua seed data pakai nama fiktif; tidak ada logo.
6. **Fallback offline**: `docs/BEFORE-AFTER.md` + video S15 kalau koneksi/credit bermasalah saat demo.
7. **Licence note untuk peserta**: peserta tanpa Copilot Pro tetap bisa ikut S01–S03 dengan Copilot Free (terbatas) dan menonton S04+.
