# CONTEXT — Latar belakang, use case, dan 15 skenario Agentic SDLC

> File ini adalah SUMBER KEBENARAN untuk konteks bisnis. Agent di VS Code WAJIB membaca file ini sebelum mengerjakan `PLAN.md` (teknis) dan `DOCS-SPEC.md` (dokumentasi). Semua narasi di dokumentasi, issue template, dan slide harus konsisten dengan isi file ini. Jangan mengarang angka; angka durasi/biaya di sini adalah ILUSTRASI untuk cerita dan harus diberi label "ilustrasi".

---

## 1. Apa itu Agentic SDLC (versi singkat untuk audiens)

- **Dulu:** AI bantu menulis kode di editor (autocomplete, chat). Manusia mengerjakan semua tahap lain.
- **Sekarang (Agentic SDLC):** AI agent ikut *bekerja* di setiap tahap lifecycle — plan → build → test → review → security → deploy → operate — sebagai anggota tim, dengan manusia di titik kontrol (gate): approve desain, review PR, merge.
- **Evolusi:** code completion (2021) → chat (2023) → single coding agent (2024) → multi-agent Agentic SDLC (2026).
- **Prinsip kunci yang harus selalu muncul di dokumentasi:**
  1. Agent tidak pernah menyentuh `main`; selalu branch sendiri + draft PR.
  2. Agent tunduk pada gate yang sama dengan manusia: branch protection, required checks, code scanning.
  3. Semakin banyak didelegasikan, semakin penting kualitas issue, test otomatis, dan instructions.
  4. Governance (hooks, permissions minimal, audit, biaya) adalah bagian dari SDLC, bukan tambahan.

### Building blocks GitHub yang dipakai
| Blok | Fungsi | Lokasi di repo |
|---|---|---|
| Coding agent | Assign issue/task → kerja di background → draft PR yang sudah lolos test | Issues, Agents tab, IDE, CLI, Jira/Teams |
| Custom instructions | Aturan selalu-aktif (konvensi, checklist) | `.github/copilot-instructions.md`, `AGENTS.md` |
| Custom agents | Agent spesialis dengan instruksi & tool sendiri | `.github/agents/*.agent.md` |
| Agent skills | Prosedur berulang yang dimuat saat relevan | `.github/skills/*/SKILL.md` |
| MCP servers | Koneksi ke Jira, DB, API internal | `mcp.json` |
| Hooks | Blok perintah berisiko, audit log | `.github/hooks/*.json` |
| Agentic Workflows (gh-aw) | Workflow Markdown → GitHub Actions; "Continuous AI" | `.github/workflows/*.md` |
| Mission control (Agent HQ) | Satu tempat kelola banyak agent lintas repo | github.com/copilot/agents |

---

## 2. Aplikasi demo: Expense Claim App

**Cerita bisnis (nama fiktif):** PT Nusantara Finansial, 1.200 karyawan. Karyawan mengajukan klaim biaya (perjalanan, makan, peralatan). Manager menyetujui. Finance membuat laporan bulanan. Aplikasinya sederhana tapi memakai pola nyata: validasi, aturan approval bertingkat, laporan, data pribadi (PII), dan integrasi.

**Persona (dipakai di semua skenario):**
| Role | Nama fiktif | Pain utama |
|---|---|---|
| Dev Junior | Rani | Sering ditolak review karena konvensi tidak tertulis |
| Dev Senior / Tech Lead | Bima | Waktu habis untuk review & pekerjaan mekanis |
| QA | Sari (tim 2 orang untuk 15 dev) | Hanya sempat uji fungsional; jadi bottleneck release |
| AppSec | Dimas | 600 alert tidak tersentuh; audit berulang |
| PM / BA | Lina | Perubahan kecil butuh 2 minggu |
| DevOps / Platform | Yoga | Pipeline merah, perubahan lintas 60 repo |
| Engineering Manager | Hendra | Hutang teknis, coverage turun, biaya tak terlihat |
| CISO / Compliance | Ibu Maya | Menolak agent otonom tanpa kontrol konkret |

---

## 3. Lima belas skenario (urutan BELAJAR, simple → kompleks)

Format tiap skenario: **Role · Cerita (pain point) · Kerugian · Masalah yang ditanam di repo · Solusi (fitur GitHub) · Advantage · Bukti before/after**

### LEVEL 1 — INNER LOOP (developer individu, VS Code)

#### S01 — Custom instructions / AGENTS.md
- **Role:** Rani (Dev Junior), Bima (Tech Lead)
- **Cerita:** Rani buat PR; Bima menolak karena naming, struktur folder, dan error handling tidak sesuai kebiasaan tim yang tidak tertulis. Berulang 2–3 kali per PR.
- **Kerugian:** Tech Lead jadi "polisi konvensi"; PR kecil tertunda berhari-hari; onboarding dev baru berminggu-minggu.
- **Ditanam:** P1 — kode campur gaya, tidak ada `copilot-instructions.md`.
- **Solusi:** `.github/copilot-instructions.md` + `AGENTS.md` berisi konvensi, format error, logger wajib, test wajib.
- **Advantage:** Output agent konsisten; konvensi jadi eksplisit & terversi; onboarding cepat.
- **Bukti:** prompt yang sama dijalankan sebelum & sesudah instructions → diff berdampingan.

#### S02 — Agent Mode untuk fitur lintas file
- **Role:** Bima (Dev Senior)
- **Cerita:** Diminta tambah field "kategori klaim". Terdengar kecil, tapi menyentuh DB migration, model, validasi API, form UI, dan test. Setengah hari habis untuk pekerjaan mekanis.
- **Kerugian:** Jam senior mahal terpakai untuk hal yang bisa diprediksi; mudah ada file terlewat → bug di QA.
- **Ditanam:** P2 — field `category` belum ada.
- **Solusi:** Agent Mode di VS Code: satu prompt → agent rencanakan, edit 6 file, jalankan `npm test`, perbaiki sendiri.
- **Advantage:** Developer fokus review & keputusan desain; tidak ada file terlewat.
- **Bukti:** form UI sebelum/sesudah + test hijau.

#### S03 — Agent Skill `new-endpoint`
- **Role:** Rani, Yoga (DevOps)
- **Cerita:** Tiap developer bikin endpoint dengan caranya sendiri: ada yang tanpa validasi, ada yang tanpa logging. DevOps susah monitoring.
- **Kerugian:** Inkonsistensi antar endpoint; review lama; tribal knowledge hilang saat orang resign.
- **Ditanam:** P3 — `reports.js` tanpa validasi & logging, pola beda dari route lain.
- **Solusi:** `.github/skills/new-endpoint/SKILL.md`: route → validasi → service → test → update docs.
- **Advantage:** Prosedur jadi aset tim yang reusable; hasil seragam tanpa prompt panjang.
- **Bukti:** endpoint baru vs `reports.js` lama berdampingan.

### LEVEL 2 — DELEGASI ASINKRON (coding agent)

#### S04 — Issue → assign ke Copilot → draft PR ★ JANTUNG DEMO
- **Role:** Hendra (EM), Bima
- **Cerita:** Backlog ada 40 chore (validasi, dependency, pesan error). Selalu ditunda karena sprint penuh fitur. Audit menemukan dependency ber-CVE berumur 8 bulan.
- **Kerugian:** Hutang teknis & risiko security menumpuk diam-diam; saat dikerjakan biayanya jauh lebih besar.
- **Ditanam:** P4 — issue "Tambah `claimDate` + validasi tidak boleh masa depan" dengan acceptance criteria.
- **Solusi:** Assign issue ke Copilot → agent kerja di background → jalankan test → draft PR dengan penjelasan → manusia review, minta revisi via komentar, agent revisi.
- **Advantage:** Chore dikerjakan tanpa mengganggu senior; hasil masuk sebagai PR yang sudah lolos test; kapasitas senior kembali ke pekerjaan bernilai tinggi.
- **Bukti:** session log agent, PR page, CI hijau, UI sebelum/sesudah (field tanggal + error saat masa depan).

#### S05 — Fix CI merah
- **Role:** Rani, Bima, Yoga
- **Cerita:** Pipeline merah jam 4 sore. Rani buka log 3.000 baris, tidak paham, tanya Bima yang sedang meeting. Besok pagi baru ketemu: test flaky karena timezone.
- **Kerugian:** Deployment tertunda sehari; dua orang terganggu untuk satu masalah; pipeline merah lama-lama diabaikan.
- **Ditanam:** P5 — test pakai `new Date()` tanpa fixed clock; CI matrix dengan `TZ` berbeda memastikan merah.
- **Solusi:** Dari failing run → agent analisa log → PR fix (`vi.setSystemTime`).
- **Advantage:** Waktu pulih pipeline turun dari sehari ke menit; developer bukan lagi "tukang baca log".
- **Bukti:** run merah → run hijau.

#### S06 — Delegasi dari Jira / Teams (org only)
- **Role:** Lina (PM), Rani
- **Cerita:** Lina tulis ticket "ubah label tombol & tambah tooltip". Harus tunggu sprint planning, di-assign, dev buka Jira lalu GitHub, Lina cek lagi di Jira.
- **Kerugian:** Perubahan 15 menit butuh 2 minggu lead time; PM merasa dev lambat, dev merasa diganggu — gesekan antar tim.
- **Ditanam:** P6 — label "Submit", tanpa tooltip.
- **Solusi:** Delegasi langsung dari Jira / Azure Boards / Teams ke coding agent; hasil tetap terlacak di PR.
- **Advantage:** Alur PM → kode memendek; non-dev bisa memicu pekerjaan teknis dengan aman.
- **Bukti:** screenshot ticket + PR link. *Di repo personal: ganti dengan Issue GitHub.*

#### S07 — Legacy modernization bertahap
- **Role:** Hendra, Bima
- **Cerita:** Modul export CSV pakai library deprecated, 0 test. Tiap tahun proposal migrasi ditolak: "terlalu berisiko, tidak ada test".
- **Kerugian:** Biaya extended support, sulit rekrut, security tidak ter-patch, biaya makin besar tiap tahun ditunda.
- **Ditanam:** P7 — `src/legacy/csvExport.js` pakai adaptor callback lokal, tanpa test khusus.
- **Solusi:** Dua issue berurutan: (a) buat characterization test → PR1; (b) ganti adaptor dengan antarmuka async, test harus tetap hijau → PR2.
- **Advantage:** Modernisasi jadi task kecil terukur dengan test sebagai safety net; risiko jauh lebih rendah dari big-bang.
- **Bukti:** coverage 0% → ada; dependency deprecated hilang.

### LEVEL 3 — VIRTUAL TEAM (custom agents)

#### S08 — Virtual QA: agent `qa-engineer`
- **Role:** Sari (QA), Hendra
- **Cerita:** Coverage turun dari 70% ke 45% dalam setahun tanpa ada yang sadar. Saat insiden, Hendra baru tahu modul approval hampir tidak punya test.
- **Kerugian:** Setiap perubahan berisiko; tim takut refactor; "sprint hardening" darurat menghentikan delivery.
- **Ditanam:** P8 — `approvalRules.js` coverage 0%, bug off-by-one di batas 1.000.000.
- **Solusi:** Custom agent `qa-engineer` (read-only terhadap kode produksi): cari modul coverage rendah → tulis test dari acceptance criteria → test gagal → buka issue bug otomatis + PR test.
- **Advantage:** QA bergeser dari bottleneck ke oversight; bug ditemukan sebelum produksi.
- **Bukti:** coverage 0% → ~95%; issue "Bug: limit approval off-by-one" dibuat agent.

#### S09 — Virtual Review Board (3 reviewer agent)
- **Role:** Sari, Dimas (AppSec), Bima
- **Cerita:** QA 2 orang untuk 15 dev hanya sempat uji fungsional. Performa, security, compliance tidak tersentuh. Release menumpuk menunggu review.
- **Kerugian:** Defect non-fungsional (lambat, bocor data, crash saat beban) baru ketemu di produksi; QA burnout.
- **Ditanam:** P9 — N+1 query di list klaim + `console.log` objek user (PII).
- **Solusi:** `security-reviewer`, `perf-reviewer`, `compliance-reviewer` (read-only, output komentar PR dengan severity) + Copilot code review built-in. Manusia baca ringkasan, bukan semua baris.
- **Advantage:** Setiap PR direview dari beberapa dimensi secara paralel; reviewer manusia dapat ringkasan temuan.
- **Bukti:** komentar 3 agent di PR S04 (atau PR stok): PII di log, N+1, tidak ada audit trail approval.
- **Dependensi:** butuh PR yang sudah ada (S04 atau branch `demo/pr-stock`).

#### S10 — Virtual Security team: CodeQL autofix
- **Role:** Dimas (AppSec), Bima
- **Cerita:** Code scanning menemukan 600 alert. Dikirim sebagai spreadsheet ke dev. Dev: "tidak ada waktu". AppSec: "wajib untuk audit". Enam bulan kemudian masih 550.
- **Kerugian:** Temuan audit/regulator berulang; risiko breach; hubungan dev–security memburuk.
- **Ditanam:** P10 — fixture laporan temuan berlabel ilustrasi. Kode berjalan tidak sengaja dilemahkan dan tidak memasang paket ber-CVE sebagai target latihan.
- **Solusi:** Alert code scanning → assign ke Copilot → agent perbaiki → jalankan ulang CodeQL untuk validasi → draft PR (bisa hingga 25 alert dalam satu PR).
- **Advantage:** Backlog security turun drastis tanpa menambah beban dev; AppSec jadi reviewer, bukan pengejar.
- **Bukti:** alert open → closed by PR. *Pre-warm: push ≥15 menit sebelum sesi.*

#### S11 — Virtual Architect: design → implement → review
- **Role:** Rani, Bima
- **Cerita:** Rani langsung coding fitur approval bertingkat tanpa desain. Saat review minggu kedua, Bima baru lihat logika retry bisa menyebabkan approval ganda.
- **Kerugian:** Rework satu sprint; kasus terburuk bug finansial masuk produksi.
- **Ditanam:** P11 — epik "Approval bertingkat (>1 jt perlu 2 approver)" tanpa desain.
- **Solusi:** Agent `architect` menulis ADR + task breakdown → Tech Lead approve via komentar → `implementer` → handoff ke `security-reviewer`.
- **Advantage:** Desain jadi tahapan eksplisit; masalah ditangkap sebelum kode; dokumentasi desain terbentuk otomatis.
- **Bukti:** file `docs/adr/0001-*.md` + PR berantai.

### LEVEL 4 — CONTINUOUS AI (Agentic Workflows)

#### S12 — Docs sync workflow
- **Role:** Bima, tim mobile/partner eksternal
- **Cerita:** Tim API ubah format response, lupa update docs. Tim mobile dan partner integrasi pakai docs lama, aplikasi mereka error di produksi.
- **Kerugian:** Insiden lintas tim, debugging dua pihak, kepercayaan partner rusak.
- **Ditanam:** P12 — `docs/api.md` beda dengan kode `GET /claims`.
- **Solusi:** gh-aw `docs-sync.md` (trigger push + schedule, `permissions: contents: read`, `safe-outputs: create-pull-request`) membandingkan kode vs docs dan membuka draft PR.
- **Advantage:** Dokumentasi jadi produk sampingan yang hidup, bukan pekerjaan terpisah.
- **Bukti:** Actions run + PR update docs.

#### S13 — Issue triage + CI fault analysis
- **Role:** Yoga (Platform), Bima
- **Cerita:** 30 issue/minggu, separuh tidak lengkap; Senin pagi habis untuk melabeli. Error "ECONNRESET" di CI sudah dianalisa 5 orang berbeda dari nol dalam 3 bulan.
- **Kerugian:** Waktu senior habis untuk admin; pengetahuan troubleshooting hilang di chat.
- **Ditanam:** P13 — issue tanpa label; error e2e berulang.
- **Solusi:** gh-aw `issue-triage.md` (`safe-outputs: add-labels, add-comment`) + `ci-fault-analysis.md` (trigger `workflow_run` failed → komentar akar masalah).
- **Advantage:** Maintainer langsung ke issue yang siap; pengetahuan troubleshooting terakumulasi di PR/issue.
- **Bukti:** issue baru auto-label `needs-info` + pertanyaan; komentar akar masalah di run gagal.

### LEVEL 5 — GOVERNANCE & CAPSTONE

#### S14 — Guardrails: hooks, safe-outputs, biaya
- **Role:** Ibu Maya (CISO), Hendra, Yoga
- **Cerita:** Dev ingin pakai agent otomatis. CISO menolak: "Bagaimana kalau agent push ke main atau baca secret?" Tidak ada jawaban konkret, pilot dibatalkan. Di tempat lain, tagihan AI credit naik 3× karena workflow agent jalan tiap commit tanpa pemilik.
- **Kerugian:** Organisasi tertinggal; shadow AI; biaya tak terkendali; temuan kepatuhan; program dihentikan manajemen.
- **Ditanam:** P14 — tidak ada hooks; agent bisa jalankan apa saja.
- **Solusi:** `.github/hooks/guardrails.json` (blok `rm -rf`, `curl | sh`, akses `.env`; log tiap tool call), safe-outputs & permissions minimal di gh-aw, enterprise policy, usage/credits dashboard.
- **Advantage:** Tim bisa menunjukkan kontrol konkret ke CISO; biaya terpantau; adopsi aman secara kepatuhan dan finansial.
- **Bukti:** sinyal uji inert ditolak hook → audit log; screenshot dashboard credits bila sudah disetujui untuk dibagikan.

#### S15 — CAPSTONE: Feature Delivery End-to-End "Multi-currency expense" ★
- **Role:** semua persona
- **Cerita:** Lina bawa epik "dukung klaim dalam IDR/USD/SGD". Biasanya: Bima riset codebase seminggu, tulis 25 task larut malam, Rani coding tanpa desain, Sari review terlambat, Dimas menemukan alert setelah merge, docs tidak ter-update, partner komplain.
- **Kerugian:** Lead time ide → produksi berbulan-bulan; kualitas tergantung satu orang; insiden setelah rilis.
- **Ditanam:** P15 — epik multi-currency.
- **Solusi (alur):**
  1. Epik di Issue/Jira → agent `planner` (Research → Plan → Assign) riset repo, pecah jadi issue: ADR, implementasi, test, docs.
  2. `architect` (S11) → ADR `0002-multi-currency.md` → Tech Lead approve.
  3. Coding agent (S04) implementasi di `copilot/multi-currency`, test lolos, draft PR.
  4. CI (S05) jalan; bila merah agent perbaiki.
  5. Review Board (S09) + CodeQL (S10) di PR yang sama; agent revisi.
  6. Tech Lead merge — satu-satunya merge, branch protection berlaku (1 approval + CI + CodeQL).
  7. Docs sync (S12) update `docs/api.md`; triage (S13) menerima issue lanjutan.
  8. Guardrails (S14) terlihat di audit log sepanjang alur.
- **Advantage:** Dari ide ke fitur ter-merge dalam satu sesi, dengan semua gate kualitas, security, dan dokumentasi terlewati otomatis; manusia hanya di titik keputusan.
- **Bukti:** UI before (hanya IDR) vs after (dropdown currency + konversi); timeline PR dengan komentar 3 reviewer; ADR; docs ter-update; audit log.
- **Versi eksekutif (10 menit):** langkah 1, 3, 5, 6 saja.

---

## 4. Pemetaan cepat skenario → persona → level

| Level | Skenario | Persona utama | Pesan satu kalimat |
|---|---|---|---|
| 1 | S01–S03 | Rani, Bima | "Ajari agent cara tim kerja, hasilnya konsisten." |
| 2 | S04–S07 | Bima, Hendra, Lina | "Delegasikan pekerjaan utuh, review hasilnya sebagai PR." |
| 3 | S08–S11 | Sari, Dimas, Bima | "Bangun tim virtual: QA, security, arsitek yang selalu tersedia." |
| 4 | S12–S13 | Yoga, Bima | "Biarkan agent menjaga kualitas terus-menerus, bukan saat sprint hardening." |
| 5 | S14–S15 | Ibu Maya, semua | "Aman, terukur, dan end-to-end." |

## 5. Aturan konsistensi untuk agent yang mengerjakan repo ini
- Gunakan nama persona & cerita di atas di semua issue template (`issues/SNN.md`), komentar demo, dan dokumentasi.
- Setiap issue template memuat: Konteks (cerita singkat), Acceptance criteria, Definition of done, Label, Skenario terkait.
- Angka (durasi, persentase, biaya) selalu diberi label "ilustrasi" kecuali diukur dari dry-run.
- Jangan menyebut nama client nyata atau logo. Nama perusahaan fiktif: PT Nusantara Finansial.
- Bahasa dokumentasi: Indonesia, to the point. Istilah teknis GitHub tetap dalam bahasa Inggris (pull request, branch, coding agent, workflow).
