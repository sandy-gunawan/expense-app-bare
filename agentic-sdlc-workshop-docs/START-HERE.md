# START-HERE — Instruksi untuk Copilot Agent Mode di VS Code

> Taruh file ini bersama 5 file lain di root repo kosong, lalu buka VS Code dan berikan prompt di §4. Agent tidak perlu bertanya ke pemilik kecuali untuk hal di §5.

## 1. Peta dokumen (urutan baca WAJIB)
| Urutan | File | Isi | Dipakai untuk |
|---|---|---|---|
| 1 | `CONTEXT.md` | Latar belakang Agentic SDLC, persona, 15 skenario (pain, kerugian, solusi, advantage) | Narasi di issue, docs, komentar |
| 2 | `PLAN.md` | Aplikasi, struktur folder, masalah yang ditanam (P1–P15), repo bare/full, reset, Phase 0–9 | Membangun repo |
| 3 | `TEMPLATES.md` | Isi file `.github/` (instructions, agents, skill, hooks, gh-aw, CI, setup-steps), issue template, business rules, kontrak scripts | Menulis file konfigurasi |
| 4 | `RUNBOOK.md` | Cara menjalankan tiap demo, talk track, titik screenshot, `scenarios.json`, metrics, troubleshooting | Script otomasi & halaman "Cara demo" |
| 5 | `DOCS-SPEC.md` | Spesifikasi situs HTML (skill ui-ux-pro-max, diagram, chart, template halaman) | Membangun `site/` |
| 6 | `START-HERE.md` | File ini | Orkestrasi |

Jika ada konflik: `CONTEXT.md` menang untuk konten/narasi; `TEMPLATES.md` menang untuk skema file; `RUNBOOK.md` menang untuk nama screenshot; dokumentasi resmi GitHub menang untuk sintaks yang berubah.

## 2. Keputusan yang SUDAH diambil (jangan ditanyakan lagi)
- Nama app: **Expense Claim App**; perusahaan fiktif **PT Nusantara Finansial**; persona sesuai `CONTEXT.md` §2.
- Stack: Node 20 + Express + better-sqlite3 + Vitest + Playwright + Tailwind CDN. Tanpa TypeScript, tanpa bundler.
- Repo: `sandy-gunawan/agenticSDLC` adalah varian full → `expense-app-bare` (hasil `make-bare.sh`). Keduanya **public**, template repository, di akun **personal non-EMU**.
- Bahasa: kode Inggris; UI, error message, issue, docs, situs = **Bahasa Indonesia** to the point. Istilah GitHub tetap Inggris.
- Agent tidak pernah merge; `main` dilindungi; ulangi demo dari tag `v0-baseline` di worktree baru, tanpa menulis ulang `main`.
- Angka di dokumentasi: hanya dari `docs/metrics.json` atau berlabel "ilustrasi".
- Skill UI: `ui-ux-pro-max` bila tersedia; fallback Tailwind + pola yang sama.
- Screenshot: Playwright (app + GitHub), Playwright MCP / manual untuk VS Code.

## 3. Urutan pengerjaan (Phase) & definisi selesai
Agent mengerjakan per Phase, commit per Phase dengan pesan `phase(N): …`, dan menulis status di `PROGRESS.md` (checklist + catatan masalah). Berhenti setelah tiap Phase hanya untuk melaporkan; lanjut otomatis bila tidak ada blocker.

| Phase | Deliverable | Selesai bila |
|---|---|---|
| 0 | Repo init, `.gitignore`, `README.md` ringkas, `PROGRESS.md` | push pertama berhasil |
| 1 | App lengkap (tanpa masalah ditanam): routes claims/approvals/reports, UI 3 halaman, seed 20 klaim + 6 user (3 role), logger, validation helper, Vitest ≥ 15 test, Playwright e2e 3 flow, `ci.yml` | `npm test`, `npm run e2e`, CI hijau |
| 2 | Masalah P1–P15 ditanam, satu commit per masalah `seed(P#): …` | tabel P# di `PLAN.md` §2.3 semua ada di kode; CI sengaja merah hanya di TZ LA (P5) |
| 3 | `issues/S01.md … S15.md` (+ `S07a`, `S07b`), `docs/business-rules.md`, `scripts/seed-issues.sh` | `seed-issues.sh` membuat 16 issue tanpa error |
| 4 | `.github/copilot-instructions.md`, `AGENTS.md`, 7 agents, skill `new-endpoint` + templates, hooks + `scripts/hooks/*`, `copilot-setup-steps.yml` | semua frontmatter tervalidasi terhadap docs resmi; agent muncul di dropdown Agents tab |
| 5 | gh-aw: `docs-sync.md`, `issue-triage.md`, `ci-fault-analysis.md` + `.lock.yml` | `gh aw compile` tanpa error; satu run manual sukses |
| 6 | `scripts/demo.sh`, `screenshots.mjs`, `scenarios.json` (15 skenario), `metrics.mjs`, `reset.sh/.ps1`, `make-bare.sh`, `protect-main.sh`, `.vscode/tasks.json` | `npm run shots -- S04` menghasilkan minimal before/after dari branch dummy |
| 7 | Tag `v0-baseline`, branch `demo/pr-stock` + draft PR, branch `demo/s01-no-instructions`, `demo/ci-econnreset`, `demo/docs-trigger`; CodeQL default setup; branch protection; template flag; repo `bare` | semua branch & setting terverifikasi via `gh` |
| 8 | Dry-run S04, S08, S09, S10, S12, S15; `npm run shots:all`; `docs/metrics.json` terisi; `docs/BEFORE-AFTER.md` | tiap skenario dry-run punya ≥ 2 screenshot nyata |
| 9 | `site/` sesuai `DOCS-SPEC.md` (15 halaman, 13 diagram, 6 chart, glossary, FAQ, halaman "Cara demo" dari RUNBOOK) + `pages.yml` | DoD `DOCS-SPEC.md` §9 terpenuhi; Pages live |
| 10 | Import `full` ke org/EMU untuk S06 & S14 (langkah manual tercatat di `docs/ORG-SETUP.md`) | dokumen langkah + screenshot |

## 4. Prompt pembuka (copy ke Copilot Chat, Agent Mode)
```
Baca START-HERE.md, lalu CONTEXT.md, PLAN.md, TEMPLATES.md, RUNBOOK.md, DOCS-SPEC.md secara berurutan.
Kerjakan Phase 0 sampai 9 sesuai START-HERE.md §3. Setelah setiap Phase: update PROGRESS.md, commit, dan lanjut ke Phase berikutnya tanpa bertanya kecuali ada blocker di START-HERE.md §5.
Gunakan skill ui-ux-pro-max untuk Phase 9. Verifikasi setiap frontmatter/skema terhadap URL dokumentasi resmi di TEMPLATES.md sebelum commit.
Bahasa Indonesia to the point untuk semua teks yang dibaca manusia; kode dalam bahasa Inggris.
```
Prompt lanjutan bila sesi terputus: `Baca PROGRESS.md dan lanjutkan Phase yang belum selesai.`

## 5. Satu-satunya hal yang boleh ditanyakan ke pemilik
1. Username GitHub dan nama repo final (default: `expense-app-full`, `expense-app-bare`).
2. Secret `COPILOT_GITHUB_TOKEN` (pemilik yang membuat PAT; agent hanya memberi instruksi langkah).
3. Login GitHub untuk `npm run shots:login` (manual, sekali).
4. Gunakan repo turunan baru bila workshop perlu diulang di GitHub; skrip reset tidak melakukan force-push.
Selain itu, ambil keputusan sendiri dan catat alasannya di `PROGRESS.md` bagian "Keputusan".

## 6. Hal yang sering terlewat (checklist akhir)
- [ ] Semua 15 skenario punya: issue template, entri `scenarios.json`, halaman `site/scenarios/SNN.html`, bagian di `RUNBOOK` (sudah), screenshot atau placeholder.
- [ ] `docs/BEFORE-AFTER.md` dan `site/` membaca nama screenshot yang sama persis dengan `RUNBOOK.md`.
- [ ] Tidak ada nama client nyata, logo, atau data pribadi nyata di repo.
- [ ] `.auth/`, `.env`, `audit/`, `.worktrees/` ter-ignore.
- [ ] `README.md` root memuat: tujuan, 3 perintah utama (`npm run demo:before`, `npm run shots -- SNN`, `npm run reset`), link ke `site/` dan ke 6 dokumen ini.
- [ ] `PROGRESS.md` terakhir menyatakan Phase mana yang selesai dan apa yang masih manual (S06, S14 org).
