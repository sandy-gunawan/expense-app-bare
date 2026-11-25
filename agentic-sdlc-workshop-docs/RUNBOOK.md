# RUNBOOK — Cara menjalankan demo & mengambil screenshot

> Dipakai oleh presenter (manusia) DAN oleh agent di VS Code untuk membuat script otomasi + dokumentasi. Setiap skenario punya: pre-warm, langkah demo + talk track singkat, titik screenshot (nama file pasti), cara verifikasi, reset, dan troubleshooting.
> Konvensi nama screenshot: `docs/screenshots/SNN-<nn>-<slug>.png`. `SNN-before.png` dan `SNN-after.png` adalah alias untuk langkah pertama & terakhir yang dipakai slider di dokumentasi.

---

## 0. Persiapan umum (sekali per laptop)

```bash
git clone https://github.com/sandy-gunawan/agenticSDLC demo && cd demo
npm ci
npx playwright install chromium
cp .env.example .env            # tidak ada secret nyata; hanya PORT
gh auth status                  # harus login, scopes repo,workflow
gh extension list | grep gh-aw  # harus ada
```
Login GitHub untuk screenshot otomatis (sekali, disimpan ke `.auth/github.json`, di-.gitignore):
```bash
npm run shots:login             # buka browser → login manual → tekan Enter di terminal
```
Variabel di `scripts/demo.config.json`:
```json
{ "owner": "<user>", "repo": "expense-app-full", "baseBranch": "main",
  "beforePort": 3000, "afterPort": 3001, "screenshotDir": "docs/screenshots",
  "viewport": { "width": 1440, "height": 900 }, "darkMode": false }
```

### Pre-warm checklist (H-1 dan 30 menit sebelum sesi)
| Kapan | Tindakan | Kenapa |
|---|---|---|
| H-1 | `bash scripts/reset.sh` lalu `bash scripts/seed-issues.sh` | 15 issue segar, tidak ada PR lama |
| H-1 | Periksa run CodeQL terbaru di GitHub | Jika tidak ada alert, gunakan fixture berlabel ilustrasi untuk S10 |
| H-1 | `gh aw compile && git push` lalu `gh aw enable docs-sync issue-triage ci-fault-analysis` | Workflow S12/S13 aktif |
| H-1 | Pastikan branch `demo/pr-stock` ada dan PR-nya open sebagai draft | S09 bisa jalan tanpa S04 |
| H-1 | Cek sisa AI credits/premium requests di Settings → Copilot → Usage | Hindari kehabisan di tengah demo |
| −30 mnt | Assign issue S04 ke Copilot di repo *latihan* lalu close | Runner & model "hangat"; tahu latensi hari itu |
| −30 mnt | `npm run demo:before` (server `main` di :3000) | Browser tab "BEFORE" siap |
| −10 mnt | Buka tab: Issues, Agents (github.com/copilot/agents), Actions, Security, PR list | Tidak klik-klik saat presentasi |

### Script yang tersedia (`package.json`)
| Script | Fungsi |
|---|---|
| `npm run demo:before` | Jalankan app dari `main` di port 3000 |
| `npm run demo:after -- <branch>` | `git worktree add .worktrees/<branch>` + jalankan di port 3001 |
| `npm run demo:compare -- <branch>` | Keduanya sekaligus + buka dua tab browser berdampingan |
| `npm run shots -- S04` | Screenshot otomatis untuk satu skenario sesuai `scenarios.json` |
| `npm run shots:all` | Semua skenario yang branch/PR-nya sudah ada |
| `npm run shots:login` | Simpan sesi login GitHub untuk screenshot halaman GitHub |
| `npm run metrics -- S04 start|stop` | Catat waktu & credits ke `docs/metrics.json` |
| `npm run reset` | Jalankan `scripts/reset.sh` (konfirmasi dulu) |

---

## 1. Tiga tipe screenshot & cara ambilnya

| Tipe | Target | Alat | Dipicu oleh |
|---|---|---|---|
| A. UI aplikasi | localhost:3000 (before) / :3001 (after) | Playwright script `scripts/screenshots.mjs` | `scenarios.json` → `steps` |
| B. Halaman GitHub | Issue, Agents session, PR (Conversation/Files/Checks), Actions run, Security alert, Insights | Playwright dengan `storageState: .auth/github.json` | `scenarios.json` → `github` (daftar URL + selector tunggu) |
| C. VS Code | Chat Agent Mode, diff editor, terminal test | **Playwright MCP** dari dalam VS Code (skill `doc-shots`) atau manual Win+Shift+S | Prompt ke agent: "pakai skill doc-shots untuk S02" |

Catatan tipe B: halaman GitHub memuat konten dinamis → tunggu selector spesifik (mis. `[data-testid="pr-timeline"]` atau teks "Copilot finished work"), lalu `page.screenshot({fullPage:true})`. Simpan juga `.html` snapshot bila perlu bukti teks.

Catatan tipe C: gunakan screenshot manual atau Playwright dari sesi VS Code yang sudah diizinkan. Jangan menonaktifkan autentikasi editor atau menangkap data pribadi.

---

## 2. Runbook per skenario

Durasi = perkiraan demo live. Talk track = kalimat kunci yang diucapkan.

### S01 — Custom instructions (8 mnt, tipe C)
**Pre-warm:** branch `demo/s01-no-instructions` (tanpa `.github/copilot-instructions.md`).
1. Checkout branch tersebut. Agent Mode: "Tambah endpoint GET /claims/:id/history yang mengembalikan riwayat status klaim." → biarkan selesai. 📸 `S01-01-without-instructions.png` (diff + file baru).
2. `git stash`; checkout `main` (ada instructions). Buka `.github/copilot-instructions.md`, sorot 4 aturan. 📸 `S01-02-instructions-file.png`.
3. Prompt yang sama persis. 📸 `S01-03-with-instructions.png`.
4. Tampilkan dua hasil berdampingan (split editor). 📸 `S01-after.png` (alias langkah 3; `S01-before.png` = langkah 1).
**Talk track:** "Prompt sama, orang sama, hasil beda—karena sekarang agent tahu cara tim kerja."
**Verifikasi:** hasil kedua pakai logger, format error `{code,message}`, dan ada file test.
**Reset:** `git checkout . && git clean -fd`.

### S02 — Agent Mode lintas file (8 mnt, tipe A + C)
1. `npm run demo:before`. Buka form klaim. 📸 `S02-before.png` (form tanpa kategori).
2. Agent Mode: "Tambahkan field `category` (enum Travel, Meals, Equipment, Other) ke klaim: migration SQLite, model, validasi API, dropdown di form, tampil di list, unit test. Jalankan `npm test` sampai hijau." 📸 `S02-01-agent-plan.png` saat agent menampilkan rencana; 📸 `S02-02-files-changed.png` daftar file.
3. Terminal test hijau. 📸 `S02-03-tests-green.png`.
4. Refresh form. 📸 `S02-after.png` (dropdown kategori).
**Talk track:** "Satu permintaan, enam file, test jalan sendiri. Saya hanya membaca rencananya."
**Reset:** `git checkout . && git clean -fd`; restart `demo:before`.

### S03 — Skill new-endpoint (6 mnt, tipe C)
1. Buka `src/routes/reports.js` (tanpa validasi/logging). 📸 `S03-before.png`.
2. Agent Mode: "Buat endpoint POST /claims/:id/comments menggunakan skill new-endpoint." 📸 `S03-01-skill-loaded.png` (chat menunjukkan skill dipakai).
3. Buka file hasil + `docs/api.md` yang ikut berubah. 📸 `S03-after.png`.
**Verifikasi:** route punya validasi, logger, service, test, dan entri docs.

### S04 — Issue → Copilot → draft PR ★ (12 mnt + tunggu 5–10 mnt, tipe A + B)
**Pre-warm:** issue S04 sudah ada (dari seed). Server `main` di :3000.
1. Buka form. Pastikan belum ada input tanggal klaim. 📸 `S04-before.png`.
2. Buka issue S04, tunjukkan acceptance criteria. 📸 `S04-01-issue.png`.
3. Assignees → **Copilot**. `npm run metrics -- S04 start`. 📸 `S04-02-assigned.png` (👀 reaction muncul).
4. Buka Agents tab → session berjalan: tunjukkan agent membaca repo, menjalankan test. 📸 `S04-03-agent-session.png`. *Sambil menunggu: jelaskan branch `copilot/*`, bahwa `main` tidak tersentuh, dan CI tetap jalan.*
5. Draft PR muncul. Tab Conversation (ringkasan agent) 📸 `S04-04-pr-summary.png`; Files changed 📸 `S04-05-pr-files.png`; Checks hijau 📸 `S04-06-pr-checks.png`.
6. Review comment: "@copilot tambahkan test untuk tanggal hari ini (boundary) dan pesan error dalam Bahasa Indonesia." Tunggu revisi. 📸 `S04-07-revision.png`.
7. `npm run demo:after -- copilot/<branch>`; buka :3001, isi tanggal masa depan → ditolak. 📸 `S04-after.png`. `npm run metrics -- S04 stop`.
**Talk track:** "Yang saya lakukan: menulis issue yang jelas dan me-review. Sisanya PR biasa—gate-nya sama."
**Jangan merge.** **Reset:** `gh pr close <n> --delete-branch`, reopen issue bila perlu (`gh issue reopen`).
**Troubleshooting:** agent tidak mulai → cek Settings → Copilot → Coding agent enabled & repo diizinkan; PR tidak muncul >15 mnt → buka session log, biasanya test gagal berulang → komentar petunjuk.

### S05 — Fix CI merah (8 mnt, tipe B)
**Pre-warm:** workflow `ci.yml` matrix `TZ: [Asia/Jakarta, America/Los_Angeles]`; run terakhir di `main` merah pada LA.
1. Actions → run merah → job LA → log error. 📸 `S05-before.png`.
2. Buat issue: "CI gagal di run #<n> job TZ=America/Los_Angeles. Analisa dan perbaiki test yang flaky." Assign Copilot. 📸 `S05-01-issue.png`.
3. PR muncul (biasanya `vi.useFakeTimers` / `vi.setSystemTime`). 📸 `S05-02-pr-fix.png`.
4. Checks pada PR hijau di kedua TZ. 📸 `S05-after.png`.
**Verifikasi:** `grep -R "setSystemTime" tests/`.

### S06 — Delegasi dari Jira/Teams (6 mnt, org only; di personal pakai Issue, tipe B)
1. Ticket di Jira/Teams dengan label tombol & tooltip. 📸 `S06-before.png` (UI tombol "Submit").
2. Delegasikan ke Copilot dari Jira/Teams (atau: buat Issue dan assign). 📸 `S06-01-ticket.png`.
3. PR muncul; link balik ke ticket. 📸 `S06-02-pr.png`. UI :3001 tombol "Ajukan Klaim" + tooltip. 📸 `S06-after.png`.

### S07 — Legacy modernization (10 mnt + tunggu, tipe B)
1. Tampilkan `src/legacy/csvExport.js` yang memakai adaptor callback lokal dan belum punya test khusus. 📸 `S07-before.png`.
2. Issue S07a "characterization test untuk csvExport, jangan ubah kode produksi" → assign. PR1. 📸 `S07-01-pr-tests.png`.
3. Issue S07b "ganti adaptor callback dengan antarmuka async; semua test S07a harus tetap hijau" → assign. PR2. 📸 `S07-02-pr-migration.png`.
4. Coverage report. 📸 `S07-after.png`.
**Talk track:** "Test dulu sebagai jaring pengaman, baru ganti mesinnya."

### S08 — Virtual QA (10 mnt, tipe B)
1. `npm run coverage` → `approvalRules.js` 0%. 📸 `S08-before.png`.
2. Agents tab → pilih custom agent **qa-engineer** → prompt: "Review coverage `src/services/approvalRules.js`, tulis test dari aturan di `docs/business-rules.md`, laporkan bug sebagai issue, jangan ubah kode produksi." 📸 `S08-01-agent-picker.png`.
3. PR test + issue "Bug: batas approval 1.000.000 off-by-one" otomatis. 📸 `S08-02-bug-issue.png`.
4. Coverage di PR ≈95%. 📸 `S08-after.png`.
**Verifikasi:** PR hanya menyentuh `tests/`.

### S09 — Virtual Review Board (10 mnt, tipe B)
**Pre-warm:** PR `demo/pr-stock` open (berisi N+1 + PII log). Atau pakai PR S04.
1. Tampilkan PR tanpa komentar reviewer. 📸 `S09-before.png`.
2. Di PR, Reviewers → Copilot (code review built-in). Lalu di Agents tab jalankan `security-reviewer`, `perf-reviewer`, `compliance-reviewer` dengan prompt "Review PR #<n>, komentar di PR dengan severity." (tiga session paralel). 📸 `S09-01-three-sessions.png`.
3. Komentar muncul: PII di log (security), N+1 (perf), tidak ada audit trail approval (compliance). 📸 `S09-02-comments.png`.
4. Ringkasan untuk Tech Lead (komentar summary). 📸 `S09-after.png`.
**Talk track:** "Tiga spesialis mereview bersamaan; Bima membaca ringkasannya, bukan 400 baris."

### S10 — CodeQL autofix (8 mnt, tipe B) — WAJIB pre-warm ≥15 mnt
1. Security → Code scanning → lihat hasil scan. 📸 `S10-before.png`.
2. Bila tersedia alert nyata yang disetujui pemilik, periksa opsi **Assign to Copilot**. 📸 `S10-01-assign.png`.
3. Tinjau perubahan defensif dan hasil scan ulang. 📸 `S10-02-pr-autofix.png`.
4. Jika tidak ada alert, jelaskan contoh di `docs/fixtures/` dan tetap tandai bukti alert/PR sebagai belum diambil. 📸 `S10-after.png` hanya jika ada hasil nyata.
**Troubleshooting:** tidak ada tombol assign → repo private tanpa GHAS; pakai repo public.

### S11 — Virtual Architect (12 mnt, tipe B)
1. Issue epik "Approval bertingkat" tanpa desain. 📸 `S11-before.png`.
2. Agents → `architect` → "Buat ADR di docs/adr/ untuk issue #<n>, termasuk task breakdown. Jangan menulis kode." PR ADR. 📸 `S11-01-adr-pr.png`.
3. Tech Lead comment "Approved, lanjut implementasi" → `implementer` dengan prompt menunjuk ADR. PR implementasi. 📸 `S11-02-impl-pr.png`.
4. `security-reviewer` di PR implementasi. 📸 `S11-after.png`.

### S12 — Docs sync workflow (6 mnt, tipe B)
1. `docs/api.md` vs `routes/claims.js` berbeda. 📸 `S12-before.png`.
2. Push commit kecil ke branch `demo/docs-trigger` yang mengubah response → Actions "Docs Sync" jalan. 📸 `S12-01-run.png`.
3. Draft PR update docs (safe-output). 📸 `S12-after.png`.
**Verifikasi:** permissions di run hanya `contents: read`; PR dibuat oleh safe-outputs.

### S13 — Triage + CI fault analysis (6 mnt, tipe B)
1. Buat issue "aplikasi error" tanpa detail. 📸 `S13-before.png`.
2. Label `needs-info` + komentar klarifikasi muncul. 📸 `S13-01-triage.png`.
3. Trigger CI gagal (branch `demo/ci-econnreset`). Komentar akar masalah di run/PR. 📸 `S13-after.png`.

### S14 — Guardrails (8 mnt, tipe B)
1. Tampilkan `.github/hooks/guardrails.json`. 📸 `S14-01-hooks-file.png`.
2. Jalankan `npm test -- tests/unit/guard.test.js` untuk melihat izin dan penolakan pada input uji inert. 📸 `S14-before.png` → `S14-after.png` (keputusan dan log lokal, bukan sesi cloud).
3. Copilot usage dashboard (org: Insights → Copilot; personal: Settings → Billing → Usage). 📸 `S14-02-usage.png`.
4. Frontmatter gh-aw `permissions`/`safe-outputs`/`max-ai-credits`. 📸 `S14-03-gh-aw-permissions.png`.
**Talk track untuk CISO:** "Agent hanya bisa yang kita izinkan; setiap tindakan tercatat; biaya dibatasi per workflow."

### S15 — Capstone end-to-end (25–30 mnt live; 10 mnt versi eksekutif, tipe A + B)
**Pre-warm:** semua di atas + `npm run metrics -- S15 start`.
1. UI hanya IDR. 📸 `S15-before.png`. Epik issue "Multi-currency". 📸 `S15-01-epic.png`.
2. `planner` → sub-issue: ADR, implementasi, test, docs. 📸 `S15-02-breakdown.png`.
3. `architect` → ADR 0002 → approve. 📸 `S15-03-adr.png`.
4. Issue implementasi di-assign Copilot → draft PR. 📸 `S15-04-pr.png`.
5. CI hijau (atau merah → agent perbaiki). 📸 `S15-05-ci.png`.
6. Review board + Copilot code review + CodeQL di PR. 📸 `S15-06-reviews.png`.
7. **Merge** (branch protection: 1 approval + checks). 📸 `S15-07-merge.png`.
8. Docs Sync jalan → PR docs. 📸 `S15-08-docs.png`. Hook audit log. 📸 `S15-09-audit.png`.
9. `npm run demo:after -- main` (pasca-merge) → dropdown currency. 📸 `S15-after.png`. `npm run metrics -- S15 stop`.
**Versi eksekutif:** langkah 1, 4, 6, 7, 9.
**Reset:** ulangi di repo turunan baru. `npm run reset` hanya mengembalikan worktree lokal ke kondisi bersih, bukan GitHub.

---

## 3. `scenarios.json` — kontrak untuk `scripts/screenshots.mjs`

```json
{
  "S04": {
    "title": "Issue → Copilot → draft PR",
    "before": { "branch": "main", "port": 3000 },
    "after":  { "branch": "copilot/*", "port": 3001, "resolve": "latestPrBranchForIssue", "issue": "S04" },
    "app": [
      { "name": "before", "goto": "/", "actions": [
          { "fill": "#title", "value": "Taksi bandara" },
          { "fill": "#amount", "value": "250000" },
          { "fill": "#claimDate", "value": "2030-01-01" },
          { "click": "#submit" } ], "waitFor": ".toast", "shot": "S04-before.png" },
      { "name": "after", "goto": "/", "actions": "same", "waitFor": ".error", "shot": "S04-after.png" }
    ],
    "github": [
      { "url": "issues/{issueNumber}", "waitFor": "text=Acceptance", "shot": "S04-01-issue.png" },
      { "url": "pull/{prNumber}", "waitFor": "text=Copilot", "shot": "S04-04-pr-summary.png" },
      { "url": "pull/{prNumber}/files", "waitFor": ".diff-view", "shot": "S04-05-pr-files.png" },
      { "url": "pull/{prNumber}/checks", "waitFor": "text=successful", "shot": "S04-06-pr-checks.png" }
    ],
    "video": false
  }
}
```
Aturan implementasi `screenshots.mjs`:
- `resolve: latestPrBranchForIssue` → `gh pr list --search "<issue title>" --json headRefName,number` ambil terbaru.
- Server dijalankan via `git worktree` di `.worktrees/<branch>`; `npm ci` hanya bila `package-lock.json` berubah.
- Semua langkah idempotent; gagal satu shot → lanjut, tulis `docs/screenshots/_missing.json`.
- Setelah selesai, regenerate `docs/BEFORE-AFTER.md` dan `site/assets/data/scenarios.json`.
- Jika `video: true` → `recordVideo` ke `docs/video/SNN.webm`.

---

## 4. `docs/metrics.json` — angka nyata untuk chart
```json
{ "S04": { "runs": [ { "date": "2026-11-26", "startedAt": "...", "prAt": "...", "minutesToPr": 7.5,
   "revisionMinutes": 4.2, "premiumRequests": 3, "aiCredits": 0.0 } ] } }
```
`npm run metrics -- SNN start|stop` mengisi waktu; kolom credits diisi manual dari dashboard usage (link di S14) atau dari `gh api /users/{user}/settings/billing/usage` bila tersedia.

---

## 5. Troubleshooting umum
| Gejala | Penyebab umum | Tindakan |
|---|---|---|
| Copilot tidak muncul di Assignees | Coding agent belum enabled / repo EMU personal | Settings → Copilot → Coding agent; pakai repo personal non-EMU atau org |
| Agent berjalan >15 mnt tanpa PR | Test gagal berulang, atau dependency install lama | Buka session log; tambahkan `copilot-setup-steps.yml` untuk cache `npm ci` |
| CodeQL alert tidak muncul | Belum ada push setelah enable; repo private tanpa GHAS | Push kosong, tunggu; gunakan repo public |
| gh-aw workflow tidak jalan | Belum `gh aw compile`, lock file tidak di-commit, token tidak ada | `gh aw compile`, commit `.lock.yml`, set `COPILOT_GITHUB_TOKEN` (personal) atau `copilot-requests: write` (org) |
| Custom agent tidak terlihat di dropdown | File belum di default branch / nama file salah | Merge ke `main`; nama hanya `a-z0-9._-` |
| Hook tidak jalan di cloud agent | Hook file bukan di default branch | Commit ke `main` |
| Screenshot GitHub kosong/redirect login | `.auth/github.json` kadaluarsa | `npm run shots:login` ulang |
| Dua server bentrok port | worktree lama masih jalan | `npm run demo:stop` (kill by port) |
| Kehabisan premium requests saat demo | Pre-warm terlalu banyak | Cek usage H-1; siapkan video fallback `docs/video/S15.webm` |
