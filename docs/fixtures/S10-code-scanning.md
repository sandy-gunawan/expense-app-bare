# S10 — contoh pembahasan temuan CodeQL

**Ilustrasi, bukan alert GitHub atau hasil pemindaian.** Reviewer menemukan query laporan yang seharusnya memisahkan kode SQL dari masukan pengguna. Periksa mitigasinya di `src/db.js`: SQL menggunakan placeholder dan bulan dikirim terpisah sebagai parameter. Pertahankan pemeriksaan peran Finance. Untuk dependency, bandingkan versi terkunci dengan advisory resmi sebelum menyarankan versi perbaikan. Jangan memasang versi rentan untuk memancing alert.

Saat demo, buka hasil scan repo. Bila tidak ada alert hidup, jelaskan tiga status yang berbeda: scan selesai, alert terdeteksi, dan perbaikan terverifikasi. Tidak ada angka before/after yang diukur dari fixture ini.
