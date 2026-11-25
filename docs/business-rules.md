# Aturan bisnis Expense Claim

1. Kategori yang didukung: `Travel`, `Meals`, `Equipment`, `Other`. Form baseline belum dapat memilih kategori (S02).
2. Jumlah harus rupiah bulat, lebih dari `0` dan paling banyak `50.000.000`.
3. Tanggal klaim memakai hari UTC, tidak boleh di masa depan, dan paling lama 90 hari ke belakang (inklusif). Baseline hanya memakai tanggal pencatatan (S04).
4. Di bawah `1.000.000` IDR perlu persetujuan manager. Tepat `1.000.000` atau lebih perlu manager lalu Finance. Baseline keliru di batas tepat satu juta (S08).
5. Pengaju tidak boleh menyetujui klaimnya sendiri; manager hanya memeriksa timnya. Klaim berstatus final tidak boleh diputus lagi.
6. Ketika status berubah, `claim_events` menyimpan aktor, waktu UTC, status asal, dan status tujuan dalam transaksi yang sama.
7. Laporan bulanan memuat klaim yang sudah `approved`, dikelompokkan per kategori dan departemen.
8. Lampiran hanya nama file. Jangan unggah isi file, PII, atau data produksi.
