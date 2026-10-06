# KENNETH: status terakhir (patokan untuk update berikutnya)

Ditulis 2 Okt 2026 setelah presentasi di kelas, diperbarui 3 Okt 2026 setelah desain ulang (PR #13 sampai #21).
File ini menjelaskan isi app **persis seperti yang ada di `main` sekarang**, supaya siapa pun (orang atau AI agent)
yang melanjutkan tahu titik awalnya. Kalau ada yang bertabrakan dengan ingatan atau catatan lama, yang benar adalah
kode di `main` dan file ini.

## 0. Ringkasan cepat

| Hal | Nilai |
|---|---|
| Versi | `0.4.0` (package.json), tag `v0.4.0` plus perbaikan dan desain ulang sesudahnya |
| Commit patokan | `0e1f4b7` di `main` (3 Okt 2026), merge PR #21 "fix(splash): calm the loading screen to a still ink mark" |
| Live | https://kenneth-park.web.app dan https://kenneth-9339d.web.app (dua situs, satu deploy). **Masih desain lama**, desain ulang di `main` belum di-deploy |
| Repo | https://github.com/ne-he/kenneth (publik) |
| Test | 129 test di 15 file, semua lolos (`npm test`) |
| PR yang masih terbuka | Tidak ada |
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
   Mall tetap memakai Zona KENNETH (keputusan 2 Okt 2026).
3. **Valet dijalankan armada runner KENNETH sendiri**, bukan valet gedung. Bayar di app. Tanpa Face ID, cukup
   kode pesanan dan pelat. Runner adalah **karyawan KENNETH**, bukan mitra lepas (keputusan 2 Okt 2026).
4. **Pesanan bayar per pakai.** Premium hanya menjual hal yang tidak pernah habis stoknya (pesan lebih awal,
   diskon, notifikasi). Batal tetap gratis sampai jam datang (keputusan 2 Okt 2026).
5. **Kampus dan gedung kantor boleh menjual layanan, dengan aturan yang sama** (keputusan 2 Okt 2026, menggantikan
   "kampus tidak menjual apa pun"). Sudah di kode: tiap tempat punya Zona KENNETH, valet dan charger di tempat
   yang menyediakannya. Motor tetap tidak bisa memesan layanan apa pun.
6. **Jujur soal sumber data.** Tiap lokasi berlabel "Data langsung" (dari palang parkir) atau "Estimasi".
7. **Data pribadi tinggal di HP.** Tidak ada database server. Login Google hanya untuk nama, email, foto.
8. **App tidak pernah pindah tab sendiri.** Setelah aksi, cukup toast plus titik di tab Tiket.
9. **Peta adalah panggungnya, layanan dipilih di lembar Beranda** (direvisi 2 Okt 2026 di PR #13, menggantikan
   dropdown "Mau ngapain?"). Tiga layanan berbayar tampil sebagai pilihan besar yang bisa dinyalakan dan dilepas.
   Kalau tidak ada yang dipilih, app menampilkan cek parkir biasa. Tetap tidak ada layar baru untuk layanan baru.
   Alasan lengkapnya di [PRODUCT.md](PRODUCT.md), bagian Navigasi.
10. **Warna** (PR #13): netral onyx dan porselen, aksen cornflower (`#2f5bd3`). Hijau, kuning, dan merah hanya untuk
    status lega, ramai, penuh. Tombol mengikuti resep tombol design system Daily Log (hanya tombolnya yang
    diadopsi, 4 Okt): tombol utama berwarna aksen dengan gradasi halus, tombol sekunder bernuansa aksen,
    tombol netral berupa tile dengan garis tipis, tombol bahaya hanya teks merah. Semua tombol berbentuk pil.
    Pilihan yang aktif (segmented, saklar, tile hari/jam/charger/bentuk mobil, filter, metode bayar) juga
    memakai isian aksen yang sama. Resepnya ada di `src/components/ui/buttonStyles.ts` dan kelas
    `.btn-primary` / `.btn-tile` di `src/index.css`.
    Aksen bisa diganti di Akun (PR #24, #26): Biru (cornflower, bawaan), Ungu, Pink, Grafit. Merah, oranye, dan
    hijau sengaja tidak ditawarkan supaya aksen tidak terbaca sebagai status.

## 2. Nama yang dipakai (wajib konsisten di layar dan di kode)

| Di layar | Di kode | Arti |
|---|---|---|
| Cek parkir (tidak ada layanan dipilih) | `park` | Cek penuh atau lega, rute ke gerbang paling lancar. Gratis |
| Zona KENNETH | `zone` | Petak pasti di zona khusus dekat lobi, dipesan per jam datang |
| Valet runner | `valet` | Runner KENNETH menerima mobil di lobi dan memarkirnya di Zona KENNETH |
| Charger EV | `ev` | Charger mobil listrik yang dikunci atas nama pengguna |
| Area (A, B, C) | `section` | Bagian lantai parkir (huruf di pilar). **Bukan** Zona KENNETH |
| Tab Tiket, Beranda, Akun | `activity`, `park`, `account` | Nama tab di layar berubah di PR #13, nama di kode tetap |

- Tombol layanan berbayar selalu diawali "Pesan" (Pesan petak, Pesan runner, Pesan charger).
- Booking disebut "pesanan" di teks, kode booking disebut "kode pesanan".
- Sisa nama lama yang sengaja dipertahankan: data booking Zona tersimpan di key `passes` (tipe `ZonePass`) dan
  gerbang berkamera pelat ditandai `zoneLane`. Jangan diganti, data di HP pengguna bergantung pada itu.

## 3. Isi app, layar per layar

### 3.1 Tiga tab (dock kaca mengambang di bawah)

Tab tampil sebagai ikon tanpa tulisan; tab yang aktif duduk di pil aksen yang bergeser antar tab.

| Tab | Isi |
|---|---|
| **Tiket** (kiri) | Yang sedang berjalan: lokasi parkir tersimpan, runner yang jalan, petak yang sedang ditahan, charger yang mengisi. Kalau kosong, ada tombol "Cari parkir". Nanti: pesanan belum mulai dan pengingat. Riwayat: selesai, dibatalkan, hangus, masing-masing dengan tombol "Lagi". Ringkasan bulan ini (kali parkir, menit dihemat) |
| **Beranda** (tengah) | Peta MapLibre. Di atas peta: label kecil "Demo" dengan jam simulasi (tidak muncul di mode waktu nyata; jamnya diganti di Akun), tombol lokasiku, dan avatar yang membuka Akun. Lembar bawah "Mau parkir di mana?" dengan chip kendaraan di sebelah judul (ikon 3D mobilnya sesuai model dan warna, ketuk untuk ganti kendaraan), kolom cari, dan tiga pilihan layanan satu baris. Lembar ditarik ke atas memperlihatkan daftar lokasi dengan filter Semua, Favorit, Mall, Kampus, Kantor |
| **Akun** (kanan) | Kartu profil: nama (Google atau tamu), mobil yang dipakai dengan ikon 3D dan pelatnya, dan angka bulan ini (kali parkir, menit antre dan liter bensin yang dihemat, berlabel "contoh" kalau dari riwayat contoh). Lalu paket Gratis/Premium, tempat favorit dengan kondisinya sekarang (ketuk untuk buka di peta), garasi kendaraan (mobil/motor, pelat, EV), peta dan navigasi, notifikasi dan preferensi, bahasa, tema (ikut sistem, terang, gelap), privasi, "Untuk tim dan demo" (jam simulasi, /booth, /mitra), reset |

### 3.2 Layanan di Beranda

Layout sama. Yang berubah saat layanan dipilih hanya angka di pin, angka di daftar, dan tombol utama di kartu tempat.

| Layanan dipilih | Pin dan daftar menunjukkan | Tombol utama di kartu tempat |
|---|---|---|
| Tidak ada (cek parkir) | titik status dengan persen terisi, menit sampai dapat petak | Rute ke gerbang paling lancar |
| Zona KENNETH | harga petak (pin cornflower), "habis" kalau penuh | Pesan petak, dengan harga di tombol |
| Valet runner | menit mobil balik | Pesan runner |
| Charger EV | charger kosong x/total | Pesan charger |

- Kartu tempat punya deretan chip layanan sendiri. Layanan yang tidak dijual di lokasi itu redup dan tidak bisa
  dinyalakan. Rute ke gerbang turun jadi baris tipis di bawah tombol pesan.
- Pin berupa titik status. Angka muncul kalau ada ruang, nama singkat lokasi muncul saat peta diperbesar, nama
  lengkap muncul di lokasi yang dipilih.
- Kendaraan aktif motor: tiga pilihan layanan abu-abu dengan keterangan "Khusus mobil".

### 3.3 Sheet (panel yang naik dari bawah)
- **Kartu lokasi**: di atas, status, gerbang yang disarankan, tombol Rute atau Pesan, dan saran (Zona KENNETH, tempat
  lain yang lega). Di bawahnya grafik perkiraan hari ini (garis dengan titik per jam, bisa digeser jam), daftar
  "Masih lega di dekat sini" kalau tempatnya tidak lega, lalu satu baris **Detail lokasi** yang bisa dibuka: sisa slot
  dan cincin okupansi, gerbang masuk dan antriannya, biaya parkir (stepper jam), slot difabel dan ibu hamil,
  ganjil-genap (hanya kalau ada koridor), rute dari parkir ke tenant, dan catatan sumber data. Lapor kondisi (Penuh,
  Antri panjang, Masih lega) tetap terlihat. Ganjil-genap pindah ke luar Detail lokasi kalau pelatmu dilarang hari
  itu. Favorit dan bagikan ada di kepala kartu dan menu "..."
- **Pesan** (BookHub): tab per layanan. Setelah pesan, hasil tetap di layar dengan tombol buka tiket dan "Salah pesan? Batalkan".
  - Zona: pilih hari (hari ini, Premium sampai H-7), pilih jam datang per 30 menit, harga dan sisa petak tiap slot,
    metode bayar simulasi (QRIS, e-wallet, kartu), penjelasan "Kok bisa ada zona khusus?".
  - Valet: pilih lobi, jam datang per 15 menit, estimasi runner datang dan mobil balik, pelat, metode bayar.
  - EV: jam mulai, durasi, unit charger (dibuka di unit yang kosong).
- **Tiket petak** (gaya boarding pass): nomor petak besar (misal K-05), lantai dan lobi, gerbang masuk, QR cadangan,
  jam datang, hitung mundur "datang dalam" atau "ditahan lagi" (format menit:detik), harga, Batalkan.
- **Tiket runner**: nama dan badge runner (misal Bayu, R-841), kode pesanan plus pelat, lalu satu langkah besar per
  fase: Kunci udah diserahin, Siapkan mobil (hitung mundur dan notifikasi "Mobilmu siap di Lobi A"), Mobil udah diambil.
  Ada tombol "Percepat" di mode demo.
- **Simpan lokasi parkir**: lantai, area, pilar (default 12), lobi terdekat, foto, catatan. **Cari kendaraan**: ringkasan
  plus denah basement 3D (three.js) dengan mobil di pilarnya, tombol bagikan, "Udah keluar parkir".
- Lainnya: Search (cari lokasi, layanan, atau tenant), Jam simulasi, Paket (Gratis, Pesan saat perlu, Premium),
  Dampak (rumus terbuka), Privasi (unduh data, hapus semua), Kendaraan. Opsi peta (Tenang/Detail, gedung 3D, tombol
  Rute buka KENNETH, Google Maps, atau Waze) ada langsung di Akun, bukan sheet terpisah.
- **Navigasi di dalam app**: rute jalan dari OSRM ke gerbang paling lancar (atau gerbang zona kalau Zona KENNETH
  dipilih), banner antrian saat tiba, "Udah sampai" membuka simpan lokasi. Selama navigasi, titik lokasi diganti
  mobil pengguna sendiri (model dan warnanya) yang berjalan di rute dan menghadap arah jalan, seperti ikon mobil
  Google Maps.
- **Ikon kendaraan**: 115 model mobil populer di Indonesia punya ikon isometrik 3D (`public/vehicles`, depan dan
  belakang, dicerminkan jadi empat arah). Form kendaraan punya pencarian model (yang paling laris tampil duluan) dan
  pilihan warna (Putih, Silver, Abu-abu, Hitam, Merah, Biru, Cokelat); warna dilukis di HP dari bodi hijau kunci,
  jadi satu gambar cukup untuk semua warna. Model yang belum ada di daftar memakai mobil template. Ikon dibuat ulang
  dengan `python docs/brand/make_vehicle_icons.py <folder render>`, yang juga menulis `src/data/carModels.ts`.
  Motor masih memakai ikon datar.

### 3.4 Halaman lain
| Rute | Isi |
|---|---|
| `/mitra` | Dashboard B2B untuk pengelola gedung: mobil masuk, puncak okupansi, perkiraan pengunjung batal datang (label estimasi model), booking Zona KENNETH dan nilai kotornya, okupansi per jam, ke mana yang batal pergi, beban gerbang di jam tersibuk, heatmap Senin sampai Minggu, produk yang cocok untuk lokasi itu |
| `/booth` | Mode booth BiFest: form validasi 5 pertanyaan + pilih 2 fitur + feedback grid, tally jawaban, ekspor CSV dan JSON |

Di laptop, app tampil di bingkai HP dengan QR di pojok. Splash: layar tinta dengan ikon K kecil, memudar setelah peta siap.
Onboarding pertama kali: satu layar sambutan (Mulai, atau masuk dengan Google kalau tersedia), lalu peta. Pelat ditanya
saat pertama memesan Zona KENNETH atau valet runner dan disimpan ke kendaraan; riwayat contoh berlabel "Contoh".

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
| Ganjil-genap | Senin sampai Jumat 06-10 dan 16-21 di koridor, EV bebas, tidak berlaku di hari libur nasional 2026 dan 2027 (SKB 3 Menteri; cuti bersama tetap berlaku) | `gage.ts` |

Penjelasan lengkap rumus: [docs/MODEL.md](MODEL.md). Alasan produk dan harga: [docs/PRODUCT.md](PRODUCT.md).

## 5. Lokasi (39)

11 kampus (enam BINUS), 22 mall, 6 gedung kantor, semuanya di blok sekitar kampus BINUS. Daftar per area ada di
[README](../README.md#lokasi).

Semua 39 punya Zona KENNETH, 26 punya valet runner, 33 punya charger EV.
Koordinat dari OpenStreetMap, sisanya (kapasitas, tarif, gerbang, charger, tenant, lantai) data demo.

## 6. Teknis

- **Stack**: React 19, TypeScript, Vite, Tailwind CSS 4, Motion, MapLibre GL + OpenFreeMap, OSRM (rute), three.js
  (denah 3D), Zustand (state di localStorage), Firebase Authentication (Google, dimuat saat tombol ditekan),
  vite-plugin-pwa. Font SF Pro di perangkat Apple, Inter di luar itu.
- **Brand**: ikon PWA, favicon, OG image, splash, dan manifest dibuat ulang di palet baru. Generatornya
  `docs/brand/make_assets.py`.
- **Hosting**: Firebase Hosting paket Spark, project `kenneth-9339d`, dua target (`main` dan `park`) di `.firebaserc`.
  Header keamanan dan CSP Report-Only di `firebase.json`. Bukan Vercel.
- **State**: `src/store/app.ts` versi persist **3** (v1 satu mobil, v2 garasi, v3 `zone` lantai jadi `section`).
  Kalau mengubah bentuk data yang disimpan, naikkan versi dan tambah migrasi di `migrateApp` plus test.
- **Teks**: semua di `src/i18n/id.ts` dan `src/i18n/en.ts` (tipe `Dict` bikin build gagal kalau salah satu kurang).
  `/mitra` dan `/booth` punya `COPY` sendiri di filenya.
- **Struktur**:
  ```
  src/data       venues.ts (39 lokasi: kampus, mall, kantor), types.ts
  src/engine     occupancy, recommend, pricing, zone, pass, valet, services, modes, activity, mitra, gage, impact
  src/store      app (persist), ui (tab, mode, sheet), clock (jam simulasi), booth
  src/components explore (tab Beranda, termasuk HomeSheet), activity (tab Tiket), account, sheets (+ sheets/book),
                 map (+ declutter label pin), nav, park (3D), onboarding, shell, ui
  src/lib        auth, routing (OSRM), navApps, geo, time (WIB), share, notify, haptics, splash, theme, status
  src/pages      Mitra.tsx, Booth.tsx
  ```
- **Jalankan**: `npm install`, `npm run dev`, `npm test`, `npm run lint` (oxlint), `npm run build`.
- **Buka di HP tanpa deploy**: `npm run build`, lalu `npx vite preview --host`, dan buka alamat Network yang muncul
  dari HP yang satu Wi-Fi. Wi-Fi kampus bisa memblokir koneksi antar perangkat, pakai hotspot HP kalau begitu.
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

- **Situs tim belum di-deploy ulang.** kenneth-9339d.web.app dan kenneth-park.web.app masih desain lama; versi terbaru
  live di https://park-kenneth.web.app (project terpisah, `npm run deploy:park`).
- Semua angka simulasi. Tidak ada palang, gedung, runner, atau pembayaran sungguhan. Pembayaran hanya animasi.
- Notifikasi "ada yang batal" (Premium) jalan dalam demo saja: tidak ada pengguna lain yang memesan, jadi petak kembali satu sampai dua menit setelah minta kabar (`engine/watch.ts`).
- Laporan kondisi pengguna dan jawaban booth hanya tersimpan di perangkat itu.
- Data tidak sinkron antar perangkat walau sudah login (disengaja).
- Sisa temuan audit UI yang belum dikerjakan: lihat [UX-AUDIT.md](UX-AUDIT.md), bagian "Status setelah desain ulang".

## 9. Masukan presentasi dan rencana update

Masukan dari presentasi di kelas (1 Okt 2026). Audit UI lengkapnya ada di [UX-AUDIT.md](UX-AUDIT.md).

| Masukan | Dari | Keputusan | Status |
|---|---|---|---|
| Idenya oke | Kelas, Epen | Tidak ada perubahan | Selesai |
| Pesanan perlu penghalang, khawatir pengguna non-KENNETH mengambil petak KENNETH. Gimana memastikan yang parkir di zona itu pengguna KENNETH? | Kelas, Epen | Konsepnya sudah ada (gerbang zona membaca pelat, QR cadangan di tiket), tapi belum kelihatan saat demo. Tambahkan palang atau *parking lock* per petak di konsep, dan tunjukkan di tiket petak | Selesai: tiket petak menampilkan kunci petak yang turun saat pelat terbaca di gerbang |
| Ke Neo Soho, langsung ditunjukkan petaknya atau harus cari lagi? | Epen | Tiket sudah memberi nomor petak, lantai, dan gerbang. Tambah denah kecil letak petak di tiket, dan tunjukkan alur pesan sampai tiket saat demo | Selesai: denah lantai zona di tiket (gerbang, lorong, petakmu, lobi lift) |
| Kalau pengguna batal, app dan gedung rugi | Epen | Untuk sekarang batal tetap gratis sampai jam datang, dana kembali penuh. Potongan biaya batal bisa dibahas lagi nanti | Selesai |
| Kampus bisa pakai valet juga? | Epen | Ya. Kampus dan kantor boleh menjual layanan dengan aturan yang sama (bagian 1 no. 5) | Selesai |
| Buat apa mall menyisihkan petak, kalau margin KENNETH kecil? | Diskusi tim | Untuk sekarang mall tetap memakai Zona KENNETH | Selesai |
| Runner itu mitra lepas? Keamanannya gimana? | Diskusi tim | Runner karyawan KENNETH (bagian 1 no. 3) | Selesai |
| Tambah pilihan mall | Ellyn | Setuju, tambah mall baru dengan data demo | Selesai: 39 lokasi termasuk kampus dan kantor (PR #44) |
| Ganti nama | Ellyn | Tidak diganti | Selesai |
| UI bikin pusing, butuh waktu untuk paham | Ellyn | Desain ulang oleh Frederick (PR #13): layanan jadi pilihan besar di Beranda, dropdown dihapus, kartu dan pin lebih ringkas. Sisa temuan audit tercatat di [UX-AUDIT.md](UX-AUDIT.md) | Sebagian selesai, belum di-deploy |
| Desain oke, tapi kombinasi warnanya kurang | Delon | Tema baru onyx dan porselen dengan aksen cornflower (PR #13). Warna aksen bisa dipilih di Akun: Biru, Ungu, Pink, Grafit (PR #24, #26) | Selesai, belum di-deploy |

## 10. Riwayat versi singkat

| Versi | Tanggal | Inti |
|---|---|---|
| v0.1 | 18 Sep 2026 | prototipe pertama, okupansi, alternatif, jalur prioritas |
| v0.2 | 19 Sep 2026 | motor, 20 lokasi termasuk 6 kampus BINUS, valet gedung, login Google, pindah ke Firebase Hosting |
| v0.3 | 22 Sep 2026 | 3 tab (Aktivitas, Parkir, Akun), mode di satu layar, Batalkan yang kelihatan |
| v0.4 | 24 Sep 2026 | Zona KENNETH menggantikan jalur prioritas, valet runner menggantikan valet gedung |
| v0.4 + review | 25 sampai 28 Sep 2026 | PR #1 sampai #11: nama layanan konsisten (`zone`, `section`), cari lewat layanan dan tenant, penunjuk menu layanan, dashboard mitra lebih jujur, booth lebih aman, CSP Report-Only, perbaikan login, 106 test |
| v0.4 + review | 2 Okt 2026 | PR #12: tab Aktivitas dan tiket runner lebih rapi, slot ikut jam buka gedung, 109 test |
| v0.4 + desain ulang | 2 sampai 3 Okt 2026 | PR #13 sampai #21: tema onyx dan cornflower, Beranda ala Uber dengan tiga pilihan layanan, dropdown dihapus, tab Tiket/Beranda/Akun di dock mengambang, layout HP sempit, test pesan zona dan valet, PWA lebih ringan, splash tenang, 129 test. Belum di-deploy |
| v0.4 + masukan tim | 3 Okt 2026 | PR #22 sampai #26: lembar beranda turun ke bawah dock, pilihan layanan satu baris, warna aksen di Akun (empat pilihan, tanpa warna status), catatan kelas dan audit UI. Belum di-deploy |
