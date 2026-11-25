# TEMPLATES — Isi file konfigurasi yang harus dibuat agent di VS Code

> Semua file di bawah adalah DRAFT siap pakai. Agent boleh menyempurnakan isi Markdown (instruksi), tetapi WAJIB mempertahankan struktur frontmatter/JSON sesuai dokumentasi resmi yang dirujuk. Sebelum commit, agent harus memverifikasi skema terhadap:
> - Custom agents: https://docs.github.com/en/copilot/reference/custom-agents-configuration
> - Hooks: https://docs.github.com/en/copilot/concepts/customizations/hooks dan how-to "Customize agent workflows with hooks"
> - gh-aw frontmatter: https://github.github.com/gh-aw/reference/frontmatter/
> - Coding agent environment: `.github/workflows/copilot-setup-steps.yml` (docs "Customizing the development environment for Copilot coding agent")

---

## 1. `.github/copilot-instructions.md`
```markdown
# Konvensi repo Expense Claim App

## Bahasa & gaya
- Kode, nama variabel, komentar: Inggris. Pesan ke pengguna (UI/error): Bahasa Indonesia.
- camelCase untuk variabel/fungsi, PascalCase untuk class, kebab-case untuk nama file route.
- ES Modules (`import`/`export`), Node 20, tanpa TypeScript.

## Struktur
- `src/routes/*` hanya parsing request + memanggil `src/services/*`. Logika bisnis TIDAK boleh di routes.
- Akses DB hanya lewat `src/db.js` (prepared statements). DILARANG string concatenation untuk SQL.
- Validasi input memakai helper di `src/services/validation.js`; setiap endpoint wajib memvalidasi body/params.

## Error & logging
- Format error HTTP: `{ "code": "CLAIM_DATE_FUTURE", "message": "Tanggal klaim tidak boleh di masa depan" }`.
- Gunakan `logger` dari `src/logger.js`. DILARANG `console.log`. DILARANG mencatat PII (nama, email, NIK, nomor rekening).

## Test
- Setiap perubahan di `src/services/*` wajib disertai unit test Vitest di `tests/unit/`.
- Test tidak boleh bergantung pada waktu nyata: gunakan `vi.useFakeTimers()` + `vi.setSystemTime()`.
- Jalankan `npm test` dan pastikan hijau sebelum menyelesaikan tugas.

## Dokumentasi
- Perubahan endpoint wajib memperbarui `docs/api.md` (method, path, request, response, error codes).
- Keputusan arsitektur ditulis sebagai ADR di `docs/adr/NNNN-judul.md`.

## Git
- Commit message: `type(scope): ringkasan` (feat, fix, test, docs, chore, refactor).
- Jangan pernah commit `.env`, `.auth/`, atau file di `.worktrees/`.
```

## 2. `AGENTS.md` (root) — ringkasan untuk semua agent
```markdown
# AGENTS.md
Repo ini adalah aplikasi demo Expense Claim untuk workshop Agentic SDLC. Baca `CONTEXT.md` untuk latar bisnis.
- Ikuti `.github/copilot-instructions.md`.
- Perintah: `npm ci`, `npm test`, `npm run coverage`, `npm run dev`.
- Jangan ubah file di `issues/`, `docs/screenshots/`, `site/` kecuali diminta eksplisit.
- Jangan merge PR. Selalu bekerja di branch dan buat draft PR.
- Bila menemukan bug di luar scope tugas, buat issue baru dengan label `bug`, jangan perbaiki diam-diam.
```

## 3. Custom agents — `.github/agents/*.agent.md`
Frontmatter resmi: `name`, `description` (wajib), `tools`, `model`, `target`, `disable-model-invocation`, `user-invocable`, `mcp-servers`, `metadata`.

### `qa-engineer.agent.md`
```markdown
---
name: QA Engineer
description: Menulis dan memperluas test otomatis berdasarkan aturan bisnis; melaporkan bug sebagai issue; tidak mengubah kode produksi.
tools: ["read", "search", "edit", "bash"]
---
Kamu adalah QA Engineer untuk Expense Claim App.
Sumber kebenaran aturan bisnis: `docs/business-rules.md`.
Tugas:
1. Ukur coverage (`npm run coverage`) dan identifikasi modul di `src/services/` dengan coverage < 60%.
2. Tulis unit test Vitest di `tests/unit/` yang menurunkan aturan bisnis menjadi kasus uji, termasuk boundary (nilai tepat di batas, di bawah, di atas).
3. Jalankan test. Bila ada test yang gagal karena kode produksi salah, JANGAN memperbaiki kode produksi. Buat issue berjudul `Bug: <ringkasan>` berisi: aturan yang dilanggar, input, expected vs actual, lokasi file & baris.
4. Buka draft PR yang hanya berisi perubahan di `tests/`. Di deskripsi PR tulis coverage sebelum/sesudah dan daftar issue bug yang dibuat.
Batasan: dilarang mengubah file di `src/`. Dilarang menghapus test yang ada.
```

### `security-reviewer.agent.md`
```markdown
---
name: Security Reviewer
description: Mereview pull request dari sisi keamanan aplikasi dan privasi data; hanya memberi komentar, tidak mengubah kode.
tools: ["read", "search"]
---
Review PR yang ditunjuk. Fokus: injection (SQL/command), PII di log, secret di kode, validasi input, authz pada endpoint approval, dependency berisiko.
Format komentar per temuan: `[SEV-HIGH|MED|LOW] <judul>` lalu: lokasi (file:baris), mengapa berisiko, saran perbaikan konkret, referensi (OWASP/CWE).
Akhiri dengan komentar ringkasan: jumlah temuan per severity dan rekomendasi `APPROVE` / `REQUEST CHANGES`.
Dilarang membuat commit atau mengubah file.
```

### `perf-reviewer.agent.md`
```markdown
---
name: Performance Reviewer
description: Mereview pull request untuk masalah performa (N+1 query, query tanpa index, loop berat, payload besar); hanya komentar.
tools: ["read", "search"]
---
Fokus: N+1 (query di dalam loop), SELECT tanpa batas/pagination, operasi sinkron berat di request path, caching yang hilang, payload tidak perlu.
Format sama dengan Security Reviewer (`[SEV-…]`). Sertakan perkiraan dampak (mis. "20 klaim → 21 query").
```

### `compliance-reviewer.agent.md`
```markdown
---
name: Compliance Reviewer
description: Mereview pull request terhadap aturan kepatuhan internal: audit trail, segregation of duties pada approval, retensi data, dokumentasi.
tools: ["read", "search"]
---
Checklist: setiap perubahan status klaim tercatat (siapa, kapan, dari→ke); approver ≠ pengaju; limit approval sesuai `docs/business-rules.md`; `docs/api.md` diperbarui; tidak ada PII di log.
Format `[SEV-…]` + ringkasan. Hanya komentar.
```

### `architect.agent.md`
```markdown
---
name: Architect
description: Menulis Architecture Decision Record dan task breakdown untuk sebuah issue epik; tidak menulis kode aplikasi.
tools: ["read", "search", "edit"]
---
Untuk issue yang ditunjuk: baca kode terkait, lalu tulis `docs/adr/NNNN-<slug>.md` dengan bagian: Konteks, Keputusan, Alternatif yang dipertimbangkan, Konsekuensi, Rencana implementasi (daftar task kecil, masing-masing ≤ 1 PR, dengan acceptance criteria), Risiko & mitigasi.
Buka draft PR hanya berisi ADR. Di deskripsi PR, minta Tech Lead menjawab "Approved" sebelum implementasi.
Dilarang mengubah file di `src/` atau `tests/`.
```

### `implementer.agent.md`
```markdown
---
name: Implementer
description: Mengimplementasikan task sesuai ADR yang sudah disetujui, lengkap dengan test dan docs.
tools: ["read", "search", "edit", "bash"]
---
Input: nomor ADR dan task yang ditunjuk. Jangan menyimpang dari keputusan ADR; bila ADR tidak cukup, tulis pertanyaan di PR, jangan menebak.
Wajib: unit test, `npm test` hijau, update `docs/api.md`, ikuti `.github/copilot-instructions.md`.
Di deskripsi PR: tautkan ADR dan centang acceptance criteria yang terpenuhi. Minta review dari Security Reviewer.
```

### `planner.agent.md`
```markdown
---
name: Planner
description: Meneliti repo untuk sebuah epik lalu memecahnya menjadi issue-issue kecil yang siap di-assign ke coding agent.
tools: ["read", "search", "bash"]
---
Untuk epik yang ditunjuk: ringkas area kode yang terdampak, lalu buat issue terpisah untuk: (1) ADR, (2) implementasi per komponen, (3) test, (4) dokumentasi. Setiap issue: konteks 3 kalimat, acceptance criteria dalam checklist, definition of done, label `agent-ready`, dan referensi ke epik.
Urutkan dependensi dan tulis urutan eksekusi di komentar epik. Jangan menulis kode.
```

## 4. Skill — `.github/skills/new-endpoint/SKILL.md`
```markdown
---
name: new-endpoint
description: Prosedur baku membuat endpoint HTTP baru di Expense Claim App (route → validasi → service → test → docs).
---
# Membuat endpoint baru
1. Tentukan method, path, request body/params, response, error codes. Tulis dulu di `docs/api.md`.
2. Tambahkan skema validasi di `src/services/validation.js` (gunakan helper `validate(schema)`).
3. Tambahkan fungsi bisnis di `src/services/<domain>.js` memakai prepared statement dari `src/db.js`.
4. Tambahkan route tipis di `src/routes/<domain>.js`: validasi → panggil service → `res.json`. Gunakan `logger.info` dengan field non-PII (`claimId`, `userId`).
5. Tulis unit test service di `tests/unit/<domain>.test.js` dan satu test route di `tests/unit/routes/<domain>.test.js` (supertest).
6. `npm test` hijau. Commit `feat(<domain>): add <METHOD> <path>`.
Template kode ada di `./templates/route.js`, `./templates/service.js`, `./templates/test.js`.
```
(Buat juga folder `templates/` dengan tiga file contoh minimal.)

## 5. Hooks — `.github/hooks/guardrails.json`
Skema resmi: `{"version":1,"hooks":{<event>:[{"type":"command","bash":"...","powershell":"...","cwd":".","timeoutSec":N,"env":{}}]}}`. Event `preToolUse` menerima JSON di stdin dan dapat mengembalikan keputusan allow/deny — lihat referensi untuk format output yang tepat.
```json
{
  "version": 1,
  "hooks": {
    "sessionStart": [
      { "type": "command", "bash": "mkdir -p audit && echo \"$(date -u +%FT%TZ) sessionStart\" >> audit/session.log",
        "powershell": "New-Item -ItemType Directory -Force audit | Out-Null; Add-Content audit/session.log \"$(Get-Date -Format o) sessionStart\"",
        "cwd": ".", "timeoutSec": 10 }
    ],
    "preToolUse": [
      { "type": "command", "bash": "./scripts/hooks/guard.sh", "powershell": "./scripts/hooks/guard.ps1",
        "cwd": ".", "timeoutSec": 15 }
    ],
    "postToolUse": [
      { "type": "command", "bash": "./scripts/hooks/audit.sh", "powershell": "./scripts/hooks/audit.ps1",
        "cwd": ".", "timeoutSec": 10 }
    ]
  }
}
```
`scripts/hooks/guard.sh` (logika; sesuaikan format output dengan referensi hooks):
- Baca JSON stdin; ambil nama tool dan argumen perintah.
- DENY bila cocok regex: `rm\s+-rf`, `curl[^|]*\|\s*(ba)?sh`, `cat\s+\.env`, `printenv`, `git\s+push\s+.*main`, `--force`, akses `.auth/`.
- Tulis setiap keputusan ke `audit/tools.log` dengan timestamp, tool, ringkasan argumen, keputusan.
- Hook file HARUS ada di default branch agar dipakai cloud agent.

## 6. Agentic Workflows (gh-aw) — `.github/workflows/*.md`
Setelah membuat/mengubah: `gh aw compile` → commit `.md` **dan** `.lock.yml`. Personal repo: set secret `COPILOT_GITHUB_TOKEN`. Org: `permissions: copilot-requests: write` + policy org.

### `docs-sync.md`
```markdown
---
description: Menjaga docs/api.md sinkron dengan kode route.
on:
  push:
    branches: [main, "demo/**"]
    paths: ["src/routes/**", "docs/api.md"]
  schedule: daily
permissions:
  contents: read
  pull-requests: read
engine: copilot
tools:
  github:
    toolsets: [default]
safe-outputs:
  create-pull-request:
    title-prefix: "[docs-sync] "
    draft: true
    labels: [documentation, agentic-workflow]
max-ai-credits: 2
timeout-minutes: 15
---
Bandingkan setiap route di `src/routes/*.js` (method, path, body, response, error codes) dengan `docs/api.md`.
Jika ada perbedaan, perbarui `docs/api.md` agar sesuai kode. Jangan mengubah kode. Jelaskan perbedaan yang ditemukan di deskripsi PR dalam Bahasa Indonesia.
Jika tidak ada perbedaan, jangan membuat PR.
```

### `issue-triage.md`
```markdown
---
description: Melabeli dan meminta klarifikasi issue baru.
on:
  issues:
    types: [opened]
permissions:
  contents: read
  issues: read
engine: copilot
safe-outputs:
  add-labels:
    allowed: [bug, enhancement, question, needs-info, agent-ready, security]
  add-comment:
    max: 1
max-ai-credits: 1
---
Baca issue. Tentukan 1–2 label dari daftar yang diizinkan. Jika issue tidak memuat langkah reproduksi / acceptance criteria / versi, tambahkan label `needs-info` dan tulis satu komentar sopan (Bahasa Indonesia) berisi maksimal 3 pertanyaan klarifikasi. Jika sudah lengkap dan jelas, tambahkan `agent-ready`.
```

### `ci-fault-analysis.md`
```markdown
---
description: Menjelaskan akar masalah saat workflow CI gagal.
on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]
if: ${{ github.event.workflow_run.conclusion == 'failure' }}
permissions:
  contents: read
  actions: read
  pull-requests: read
engine: copilot
safe-outputs:
  add-comment:
    max: 1
max-ai-credits: 1
---
Ambil log job yang gagal dari run `${{ github.event.workflow_run.id }}`. Identifikasi akar masalah (bukan gejala), file & baris yang terlibat, dan 1–2 saran perbaikan. Jika pola error pernah muncul sebelumnya (cari di issue/PR), sebutkan tautannya. Tulis sebagai satu komentar ringkas (Bahasa Indonesia) di PR terkait, atau buat komentar di commit bila tidak ada PR.
```

## 7. CI — `.github/workflows/ci.yml`
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        tz: ["Asia/Jakarta", "America/Los_Angeles"]
    env:
      TZ: ${{ matrix.tz }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --coverage
      - uses: actions/upload-artifact@v4
        with: { name: coverage-${{ matrix.tz }}, path: coverage }
```

## 8. Coding agent environment — `.github/workflows/copilot-setup-steps.yml`
```yaml
name: Copilot Setup Steps
on: workflow_dispatch
jobs:
  copilot-setup-steps:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
```

## 9. Issue template per skenario — `issues/SNN.md` (dipakai `seed-issues.sh`)
Format file: baris pertama `# <judul>`, lalu blok `labels:`, lalu body. Contoh `issues/S04.md`:
```markdown
# Tambah tanggal klaim (claimDate) dengan validasi tidak boleh di masa depan
labels: enhancement, agent-ready, scenario:S04

## Konteks
Finance (Hendra) menemukan 12 klaim bertanggal masa depan bulan lalu. Saat ini form klaim tidak memiliki tanggal klaim; tanggal hanya diambil dari waktu input.

## Acceptance criteria
- [ ] Field `claimDate` (ISO date) ditambahkan ke tabel `claims` via migration, model, dan response API.
- [ ] `POST /claims` menolak `claimDate` > hari ini dengan HTTP 400 dan error `{ code: "CLAIM_DATE_FUTURE", message: "Tanggal klaim tidak boleh di masa depan" }`.
- [ ] `claimDate` = hari ini diterima (boundary).
- [ ] Form di `public/index.html` memiliki input tanggal (default hari ini) dan menampilkan pesan error dari API.
- [ ] Unit test untuk: masa depan ditolak, hari ini diterima, kemarin diterima, format tidak valid ditolak. Gunakan fake timers.
- [ ] `docs/api.md` diperbarui.

## Definition of done
`npm test` hijau di kedua timezone CI; tidak ada `console.log`; tidak ada PII di log.

## Skenario workshop
S04 — lihat CONTEXT.md.
```
`scripts/seed-issues.sh` membaca semua `issues/*.md`, membuat label bila belum ada (`gh label create`), lalu `gh issue create --title --body --label`. Idempotent: lewati jika issue dengan judul sama sudah open.

## 10. `docs/business-rules.md` (sumber untuk QA agent)
```markdown
# Aturan bisnis Expense Claim
1. Kategori valid: Travel, Meals, Equipment, Other.
2. Jumlah klaim > 0 dan ≤ 50.000.000 IDR.
3. Tanggal klaim tidak boleh di masa depan; maksimal 90 hari ke belakang.
4. Approval: jumlah < 1.000.000 → 1 approver (manager). Jumlah ≥ 1.000.000 → 2 approver (manager + finance). (Bug yang ditanam: kode memakai `>` sehingga tepat 1.000.000 hanya butuh 1 approver.)
5. Approver tidak boleh sama dengan pengaju.
6. Setiap perubahan status dicatat di `claim_events` (who, when, from, to).
7. Laporan bulanan: total per kategori dan per departemen.
```

## 11. Scripts (ringkasan kontrak; implementasi oleh agent)
| File | Kontrak |
|---|---|
| `scripts/reset.sh` / `.ps1` | Konfirmasi interaktif; close semua PR open (`--delete-branch`); hapus remote branch `copilot/*`, `demo/pr-stock` dikecualikan; `git reset --hard v0-baseline` + `push --force-with-lease`; close issue open; jalankan `seed-issues.sh`; `git worktree prune` |
| `scripts/seed-issues.sh` | Lihat §9 |
| `scripts/make-bare.sh` | Clone `full` → hapus `.github/agents`, `.github/skills`, `.github/hooks`, `.github/copilot-instructions.md`, `AGENTS.md`, `.github/workflows/*.md` + `*.lock.yml`, `site/`; commit; push ke repo `expense-app-bare`; set template |
| `scripts/demo.sh before|after <branch>|compare <branch>|stop` | Worktree + port; `stop` kill by port 3000/3001 |
| `scripts/screenshots.mjs` | Lihat RUNBOOK §3 |
| `scripts/metrics.mjs` | Lihat RUNBOOK §4 |
| `scripts/hooks/guard.sh|.ps1`, `audit.sh|.ps1` | Lihat §5 |
| `.vscode/tasks.json` | Task: "Demo: before", "Demo: after", "Demo: compare", "Shots: scenario", "Shots: all", "Reset" |

## 12. `.gitignore` tambahan
```
.env
.auth/
.worktrees/
audit/
coverage/
node_modules/
playwright-report/
test-results/
```

## 13. Branch protection (jalankan sekali, `gh api`)
Required: status check `test (Asia/Jakarta)`, `test (America/Los_Angeles)`, `CodeQL`; 1 approving review; dismiss stale reviews; tidak boleh force-push kecuali admin (dipakai `reset.sh`). Agent menulis perintah `gh api -X PUT repos/{owner}/{repo}/branches/main/protection ...` di `scripts/protect-main.sh`.
