# S09 — bahan review, bukan komentar agent

Periksa operasi daftar klaim di `src/db.js`: satu query mengambil daftar dan sampai satu query tambahan mencari departemen untuk setiap klaim. Hitung dari kode; bukan hasil pengukuran waktu. Usulkan JOIN berparameter.

Kode berjalan hanya mencatat pengenal operasi dan jumlah klaim. Untuk diskusi privasi, gunakan objek fiktif `{ "reference": "DEMO-1", "dataClass": "personal" }` sebagai contoh jenis data yang **tidak** boleh dicatat. Untuk audit, cek `claim_events`; jangan melaporkan audit trail hilang bila kode menyimpannya.
