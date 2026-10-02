# KENNETH: status terakhir (patokan untuk update berikutnya)

Ditulis 2 Okt 2026, setelah versi ini dipresentasikan di kelas. File ini menjelaskan isi app **persis seperti
yang ada di `main` sekarang**, supaya siapa pun (orang atau AI agent) yang melanjutkan tahu titik awalnya.
Kalau ada yang bertabrakan dengan ingatan atau catatan lama, yang benar adalah kode di `main` dan file ini.

## 0. Ringkasan cepat

| Hal | Nilai |
|---|---|
| Versi | `0.4.0` (package.json), tag `v0.4.0` plus perbaikan sesudahnya |
| Commit patokan | `3c87868` di `main` (2 Okt 2026), merge PR #12 "Review tab Aktivitas dan tiket" |
| Live | https://kenneth-park.web.app dan https://kenneth-9339d.web.app (dua situs, satu deploy) |
| Repo | https://github.com/ne-he/kenneth (publik) |
| Test | 109 test di 14 file, semua lolos (`npm test`) |
| PR yang masih terbuka | Tidak ada. PR #12 "Review tab Aktivitas dan tiket" sudah di-merge 2 Okt 2026 (`3c87868`) |
| Versi lama | branch `v0.1`, `v0.2`, `v0.3` (v0.3 = versi jalur prioritas sebelum diganti Zona KENNETH) |
| Status data | Semua angka okupansi, antrian, tarif, petak, runner adalah **simulasi**. Belum ada pengelola gedung yang terhubung |

Untuk apa app ini: KENNETH menunjukkan seberapa penuh parkiran mall dan kampus BINUS di Jakarta sebelum orang
berangkat, antri gerbang berapa menit, dan ke mana kalau penuh. Ditambah tiga layanan yang bisa dipesan: petak di
Zona KENNETH, valet runner, dan charger EV. Proyek kelompok mata kuliah ENPR6312 Venture Creation (BINUS).

## 1. Keputusan produk yang sedang berlaku

1. **KENNETH dinilai sebagai ide, bukan harus realistis hari ini** (keputusan 24 Sep 2026). Makin bagus idenya
   makin baik, tapi app tetap jujur bahwa semuanya simulasi.
2. **Zona KENNETH menggantikan jalur prioritas.** Seperti zona parkir khusus Lexus di beberapa mall, tapi mereknya
   KENNETH. Jalur prioritas dibuang karena banyak gedung cuma punya satu lajur masuk dan mobil biasa jadi menunggu.
3. **Valet dijalankan armada runner KENNETH sendiri**, bukan valet gedung. Bayar di app. Tanpa Face ID, cukup
   kode pesanan dan pelat. Runner adalah **karyawan KENNETH**, bukan mitra lepas (keputusan 2 Okt 2026).
4. **Booking bayar per pakai.** Premium hanya menjual hal yang tidak pernah habis stoknya (pesan lebih awal,
   diskon, notifikasi).
5. **Kampus dan gedung kantor boleh menjual layanan, dengan aturan yang sama** (keputusan 2 Okt 2026, menggantikan
   "kampus tidak menjual apa pun"). Kode masih memakai aturan lama: kampus cuma informasi dan belum ada lokasi
   kantor. Motor tetap tidak bisa memesan layanan apa pun.
6. **Jujur soal sumber data.** Tiap lokasi berlabel "Data palang" atau "Estimasi".
7. **Data pribadi tinggal di HP.** Tidak ada database server. Login Google hanya untuk nama, email, foto.
8. **App tidak pernah pindah tab sendiri.** Setelah aksi, cukup toast plus titik di tab Aktivitas.
9. **Satu layar untuk semua layanan.** Layanan baru = mode baru di layar Parkir, bukan layar baru.

## 2. Nama yang dipakai (wajib konsisten di layar dan di kode)

| Di layar | Di kode | Arti |
|---|---|---|
| Parkir | `park` | Cek penuh atau lega, rute ke gerbang paling lancar. Gratis |
| Zona KENNETH | `zone` | Petak pasti di zona khusus dekat lobi, dipesan per jam datang |
| Valet runner | `valet` | Runner KENNETH menerima mobil di lobi dan memarkirnya di Zona KENNETH |
| Charger EV | `ev` | Charger mobil listrik yang dikunci atas nama pengguna |
| Area (A, B, C) | `section` | Bagian lantai parkir (huruf di pilar). **Bukan** Zona KENNETH |

- Tombol layanan berbayar selalu diawali "Pesan" (Pesan petak, Pesan runner, Pesan charger).
- Booking disebut "pesanan" di teks, kode booking disebut "kode pesanan" (di PR #12).
- Sisa nama lama yang sengaja dipertahankan: data booking Zona tersimpan di key `passes` (tipe `ZonePass`) dan
  gerbang berkamera pelat ditandai `zoneLane`. Jangan diganti, data di HP pengguna bergantung pada itu.

## 3. Isi app, layar per layar

### 3.1 Tiga tab (bawah layar)
| Tab | Isi |
|---|---|
| **Aktivitas** (kiri) | Sekarang: lokasi parkir tersimpan, runner yang jalan, petak yang sedang ditahan, charger yang mengisi. Nanti: pesanan belum mulai dan pengingat. Riwayat: selesai, dibatalkan, hangus, masing-masing dengan tombol "Lagi". Kartu ringkasan bulan ini (kali parkir, menit dihemat) |
| **Parkir** (logo K, tengah, menonjol) | Peta MapLibre, search, chip jam simulasi, dropdown "Mau ngapain?" (4 mode plus pilih kendaraan), daftar lokasi di dock sheet, kartu tempat. Tap K lagi = balik ke tampilan awal |
| **Akun** (kanan) | Login Google atau tamu, garasi kendaraan (mobil/motor, pelat, EV), paket Gratis/Premium, dampak bulan ini, opsi peta, notifikasi dan preferensi, bahasa, tema, privasi, "Untuk tim dan demo" (jam simulasi, /booth, /mitra), reset |

### 3.2 Mode di tab Parkir
Layout sama, yang berubah hanya angka di pin, angka di kanan tiap baris daftar, dan satu tombol utama di kartu.

| Mode | Pin dan daftar menunjukkan | Kartu tempat | Tombol utama |
|---|---|---|---|
| Parkir | persen terisi, menit sampai dapat petak | gerbang paling lancar vs gerbang utama, saran alternatif, saran "Males muter?" kalau okupansi 80% ke atas | Rute |
| Zona KENNETH | harga petak, "habis" kalau penuh | lokasi zona (lantai, lobi, gerbang), petak kosong x/total, harga, ±1 mnt ke lift | Pesan petak |
| Valet runner | menit mobil balik | lobi runner, runner datang (mnt), mobil balik (mnt), tarif | Pesan runner |
| Charger EV | charger kosong x/total | daya kW, jumlah unit, peringatan kalau kendaraan aktif bukan EV | Pesan charger |

Pengguna baru diberi penunjuk satu kali ke menu layanan. Mode berlayanan tidak muncul kalau kendaraan aktif motor.

### 3.3 Sheet (panel yang naik dari bawah)
- **Detail lokasi**: papan LED "SISA SLOT", grafik perkiraan hari ini (bisa digeser jam), gerbang masuk dan antriannya,
  biaya parkir (stepper jam), layanan yang bisa dipesan, slot difabel dan ibu hamil, alternatif yang masih lega
  (jalan kaki atau berkendara), rute dari parkir ke tenant, lapor kondisi (Penuh, Antri panjang, Masih lega),
  ganjil-genap (hanya kalau ada koridor), favorit, bagikan.
- **Pesan** (BookHub): tab per layanan. Setelah pesan, hasil tetap di layar dengan tombol buka tiket dan "Salah pesan? Batalkan".
  - Zona: pilih hari (hari ini, Premium sampai H-7), pilih jam datang per 30 menit, harga dan sisa petak tiap slot,
    metode bayar simulasi (QRIS, e-wallet, kartu), penjelasan "Kok bisa ada zona khusus?".
  - Valet: pilih lobi, jam datang per 15 menit, estimasi runner datang dan mobil balik, pelat, metode bayar.
  - EV: jam mulai, durasi, unit charger.
- **Tiket petak** (gaya boarding pass, selalu gelap): nomor petak besar (misal K-05), lantai dan lobi, gerbang masuk,
  QR cadangan, jam datang, hitung mundur "datang dalam" atau "ditahan lagi", harga, Batalkan.
- **Tiket runner**: nama dan badge runner (misal Bayu, R-841), kode pesanan plus pelat, lalu satu langkah besar per
  fase: Kunci udah diserahin, Siapkan mobil (hitung mundur dan notifikasi "Mobilmu siap di Lobi A"), Mobil udah diambil.
  Ada tombol "Percepat" di mode demo.
- **Simpan lokasi parkir**: lantai, area, pilar (default 12), lobi terdekat, foto, catatan. **Cari kendaraan**: ringkasan
  plus denah basement 3D (three.js) dengan mobil di pilarnya, tombol bagikan, "Udah keluar parkir".
- Lainnya: Search (cari lokasi, layanan, atau tenant), Jam simulasi, Opsi peta (Tenang/Detail, gedung 3D, tombol
  Rute buka KENNETH, Google Maps, atau Waze), Paket (Gratis, Pesan saat perlu, Premium), Dampak (rumus terbuka),
  Privasi (unduh data, hapus semua), Kendaraan.
- **Navigasi di dalam app**: rute jalan dari OSRM ke gerbang paling lancar, banner antrian saat tiba, "Udah sampai"
  membuka simpan lokasi.

### 3.4 Halaman lain
| Rute | Isi |
|---|---|
| `/mitra` | Dashboard B2B untuk pengelola gedung: mobil masuk, puncak okupansi, perkiraan pengunjung batal datang (label estimasi model), booking Zona KENNETH dan nilai kotornya, okupansi per jam, ke mana yang batal pergi, beban gerbang di jam tersibuk, heatmap Senin sampai Minggu, produk yang cocok untuk lokasi itu |
| `/booth` | Mode booth BiFest: form validasi 5 pertanyaan + pilih 2 fitur + feedback grid, tally jawaban, ekspor CSV dan JSON |

Di laptop, app tampil di bingkai HP dengan QR di pojok. Splash: logo K dari jalan, mobil jalan keluar setelah peta siap.

## 4. Angka dan aturan yang tertanam di mesin (`src/engine`)

| Hal | Aturan | File |
|---|---|---|
| Zona per mall | ada di mall yang punya gerbang `zoneLane`, lantai = level pertama, dekat lobi utama | `zone.ts` |
| Ukuran zona | kapasitas mobil / 100, dibatasi 12 sampai 40 petak (CP = 32) | `zone.ts` |
| Slot dan tahan petak | jam datang per 30 menit, petak ditahan 30 menit dari jam datang | `zone.ts`, `pass.ts` |
| Nomor petak | `K-01` dst., diturunkan dari id pesanan (stabil) | `zone.ts` |
| Harga Zona | Rp15rb (okupansi 60%) naik linear ke Rp30rb (98%), bulat ke ribuan. Premium diskon 40% | `pricing.ts` |
| Pesan lebih awal | Gratis maksimal 2 jam sebelumnya, Premium sampai 7 hari | `pricing.ts` |
| Premium | Rp29rb per bulan | `pricing.ts` |
| Runner datang | 1 sampai 5 menit ikut okupansi | `valet.ts` |
| Mobil balik | 4 sampai 10 menit ikut okupansi | `valet.ts` |
| Pesanan runner hangus | 45 menit setelah jam datang | `valet.ts` |
| Tarif runner | Rp40-75rb per lokasi (data demo di `venues.ts`) | `data/venues.ts` |
| Batal | Zona sampai jam datang, runner sampai kunci diserahkan, EV sampai jam mulai. Semua dana kembali penuh, tetap tercatat di Riwayat | `activity.ts` |
| Okupansi | kurva mingguan mall vs kampus, dikali `load` dan digeser `shiftMin` per lokasi, status lega/ramai/penuh di 70% dan 90% | `occupancy.ts` |
| Dampak | 1 menit antri ≈ 13 ml bensin, 1 L ≈ 2,31 kg CO2, EV nol bensin | `impact.ts` |
| Ganjil-genap | Senin sampai Jumat 06-10 dan 16-21 di koridor, EV bebas, hari libur belum dihitung | `gage.ts` |

Penjelasan lengkap rumus: [docs/MODEL.md](MODEL.md). Alasan produk dan harga: [docs/PRODUCT.md](PRODUCT.md).

## 5. Lokasi (20)

| Area | Kampus | Mall |
|---|---|---|
| Kemanggisan, Tanjung Duren | BINUS Anggrek, Syahdan, Kijang | Central Park, Neo Soho, Taman Anggrek, Mal Ciputra, Plaza Slipi Jaya |
| Puri | | Lippo Mall Puri, Puri Indah Mall |
| Senayan, Thamrin | BINUS Senayan | Senayan City, Plaza Senayan, fX Sudirman, Grand Indonesia |
| Alam Sutera | BINUS Alam Sutera | Mall @ Alam Sutera, Living World |
| Bekasi | BINUS Bekasi | Summarecon Mall Bekasi |

14 mall punya Zona KENNETH. 13 punya valet runner (Plaza Slipi Jaya tidak). Kampus tidak punya layanan berbayar.
Koordinat dari OpenStreetMap, sisanya (kapasitas, tarif, gerbang, charger, tenant, lantai) data demo.

## 6. Teknis

- **Stack**: React 19, TypeScript, Vite, Tailwind CSS 4, Motion, MapLibre GL + OpenFreeMap, OSRM (rute), three.js
  (denah 3D), Zustand (state di localStorage), Firebase Authentication (Google, dimuat saat tombol ditekan),
  vite-plugin-pwa. Font Plus Jakarta Sans dan Doto.
- **Hosting**: Firebase Hosting paket Spark, project `kenneth-9339d`, dua target (`main` dan `park`) di `.firebaserc`.
  Header keamanan dan CSP Report-Only di `firebase.json`. Bukan Vercel.
- **State**: `src/store/app.ts` versi persist **3** (v1 satu mobil, v2 garasi, v3 `zone` lantai jadi `section`).
  Kalau mengubah bentuk data yang disimpan, naikkan versi dan tambah migrasi di `migrateApp` plus test.
- **Teks**: semua di `src/i18n/id.ts` dan `src/i18n/en.ts` (tipe `Dict` bikin build gagal kalau salah satu kurang).
  `/mitra` dan `/booth` punya `COPY` sendiri di filenya.
- **Struktur**:
  ```
  src/data       venues.ts (20 lokasi), types.ts
  src/engine     occupancy, recommend, pricing, zone, pass, valet, services, modes, activity, mitra, gage, impact
  src/store      app (persist), ui (tab, mode, sheet), clock (jam simulasi), booth
  src/components explore (tab Parkir), activity, account, sheets (+ sheets/book), map, nav, park (3D), onboarding, shell, ui
  src/lib        auth, routing (OSRM), navApps, geo, time (WIB), share, notify, haptics, splash, theme, status
  src/pages      Mitra.tsx, Booth.tsx
  ```
- **Jalankan**: `npm install`, `npm run dev`, `npm test`, `npm run lint` (oxlint), `npm run build`.
- **Rilis**: `npm run deploy` (dua situs sekaligus) atau `npm run deploy:preview` (link 7 hari). Yang deploy harus
  ditambahkan sebagai anggota project di Firebase console dan `npx firebase-tools login` sekali.
- **Login Google** lewat `kenneth-9339d.firebaseapp.com` (lihat `src/lib/auth.ts`). Butuh `.env.local` dari
  `.env.example`. Tanpa itu app jalan sebagai tamu.
- **Jam demo**: default Sabtu 14.07 (mall puncak). Selasa 10.00 menunjukkan kampus penuh.

## 7. Aturan kerja di repo ini

- Satu commit satu perubahan, pesan bahasa Inggris gaya `fix(area): ...`. Kerja di branch, masuk lewat PR ke `main`.
- Commit tanpa jejak AI (tanpa `Co-Authored-By` AI, tanpa "Generated with").
- **Tanpa em dash** di teks mana pun (layar, dokumen, komentar). Pakai koma, titik, atau pecah kalimat.
- Ubah sekecil mungkin, tiru gaya kode sekitar. Tiap perubahan logika di `engine` disertai test.
- Cek tampilan di mode terang dan gelap, dan di lebar HP (375 px).
- Jangan menambah kode yang memindah tab otomatis. Jangan menambah layar baru untuk layanan baru.
- Jangan menyimpan data pribadi di server, dan jangan commit `.env.local`.
- Panduan tim lengkap: [CONTRIBUTING.md](../CONTRIBUTING.md). Guide konten Instagram: [docs/social/GUIDE.md](social/GUIDE.md).

## 8. Yang belum selesai atau belum ada

- Semua angka simulasi. Tidak ada palang, gedung, runner, atau pembayaran sungguhan. Pembayaran hanya animasi.
- Notifikasi "ada yang batal" (Premium) baru tertulis di halaman paket.
- Laporan kondisi pengguna dan jawaban booth hanya tersimpan di perangkat itu.
- Data tidak sinkron antar perangkat walau sudah login (disengaja).
- Ganjil-genap belum menghitung hari libur nasional.
- Kampus dan kantor belum bisa memesan layanan di app, walau keputusannya sudah berubah (bagian 1 no. 5).

## 9. Masukan presentasi dan rencana update

Masukan dari presentasi di kelas (1 Okt 2026). Audit UI lengkapnya ada di [UX-AUDIT.md](UX-AUDIT.md).

| Masukan | Dari | Keputusan | Status |
|---|---|---|---|
| Idenya oke | Kelas, Epen | Tidak ada perubahan | Selesai |
| Pesanan perlu penghalang, khawatir pengguna non-KENNETH mengambil petak KENNETH. Gimana memastikan yang parkir di zona itu pengguna KENNETH? | Kelas, Epen | Konsepnya sudah ada (gerbang zona membaca pelat, QR cadangan di tiket), tapi belum kelihatan saat demo. Tambahkan palang atau *parking lock* per petak di konsep, dan tunjukkan di tiket petak | Belum dikerjakan |
| Ke Neo Soho, langsung ditunjukkan petaknya atau harus cari lagi? | Epen | Tiket sudah memberi nomor petak, lantai, dan gerbang. Tambah denah kecil letak petak di tiket, dan tunjukkan alur pesan sampai tiket saat demo | Belum dikerjakan |
| Kalau pengguna batal, app dan gedung rugi | Epen | Untuk sekarang batal tetap gratis sampai jam datang, dana kembali penuh. Potongan biaya batal bisa dibahas lagi nanti | Selesai |
| Kampus bisa pakai valet juga? | Epen | Ya. Kampus dan kantor boleh menjual layanan dengan aturan yang sama (bagian 1 no. 5) | Belum dikerjakan di kode |
| Buat apa mall menyisihkan petak, kalau margin KENNETH kecil? | Diskusi tim | Untuk sekarang mall tetap memakai Zona KENNETH | Selesai |
| Runner itu mitra lepas? Keamanannya gimana? | Diskusi tim | Runner karyawan KENNETH (bagian 1 no. 3) | Selesai |
| Tambah pilihan mall | Ellyn | Setuju, tambah mall baru dengan data demo | Belum dikerjakan |
| Ganti nama | Ellyn | Tidak diganti | Selesai |
| UI bikin pusing, butuh waktu untuk paham | Ellyn | Setuju. Rombak dengan acuan app Apple, urutan kerja di [UX-AUDIT.md](UX-AUDIT.md) | Audit selesai, perbaikan belum |
| Desain oke, tapi kombinasi warnanya kurang | Delon | Tema terang, gelap, dan ikut sistem sudah ada. Tambah pilihan warna aksen di Akun | Belum dikerjakan |

## 10. Riwayat versi singkat

| Versi | Tanggal | Inti |
|---|---|---|
| v0.1 | 18 Sep 2026 | prototipe pertama, okupansi, alternatif, jalur prioritas |
| v0.2 | 19 Sep 2026 | motor, 20 lokasi termasuk 6 kampus BINUS, valet gedung, login Google, pindah ke Firebase Hosting |
| v0.3 | 22 Sep 2026 | 3 tab (Aktivitas, Parkir, Akun), mode di satu layar, Batalkan yang kelihatan |
| v0.4 | 24 Sep 2026 | Zona KENNETH menggantikan jalur prioritas, valet runner menggantikan valet gedung |
| v0.4 + review | 25 sampai 28 Sep 2026 | PR #1 sampai #11: nama layanan konsisten (`zone`, `section`), cari lewat layanan dan tenant, penunjuk menu layanan, dashboard mitra lebih jujur, booth lebih aman, CSP Report-Only, perbaikan login, 106 test |
| v0.4 + review | 2 Okt 2026 | PR #12: tab Aktivitas dan tiket runner lebih rapi, slot ikut jam buka gedung, 109 test |
