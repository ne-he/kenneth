<p align="center">
  <img src="public/pwa-192.png" width="72" alt="KENNETH" />
</p>

<h1 align="center">KENNETH</h1>

<p align="center"><b>Cek parkir semudah cek cuaca.</b><br/>
Seberapa penuh, antri gerbang berapa menit, dan ke mana kalau penuh. Sebelum kamu berangkat.</p>

<p align="center"><a href="https://kenneth-9339d.web.app"><b>kenneth-9339d.web.app</b></a><br/>
Buka di HP untuk app-nya. Di laptop, app yang sama tampil di bingkai HP dengan QR di pojok.</p>

<p align="center">
  <img src="docs/screens/explore.png" width="200" alt="Tab Peta" />
  <img src="docs/screens/venue-led.png" width="200" alt="Detail lokasi dengan papan sisa slot" />
  <img src="docs/screens/valet.png" width="200" alt="Tiket valet, mobil siap di lobi" />
  <img src="docs/screens/account.png" width="200" alt="Tab Akun" />
</p>

> **Status: prototipe.** Dibuat untuk mata kuliah ENPR6312 Venture Creation (BINUS, semester ganjil 2026/2027).
> Semua angka okupansi, antrian, dan tarif di app ini **disimulasikan**. Belum ada pengelola gedung yang terhubung,
> dan app menyebut itu di setiap halaman lokasi.

*English summary: KENNETH is a mobile web app that shows how full Jakarta car parks (malls and the BINUS campuses)
are before you leave home, how long the gate queue is, and which nearby place still has space. It books priority
entry, the building's valet and EV chargers. This repo is a working prototype with simulated data, built for a
university venture course.*

---

## Masalahnya

Di Jakarta, akhir pekan, muter 20 sampai 30 menit nyari parkir itu biasa. Yang bikin kesel, sering ada mall lain
5 menit dari situ yang masih lega, dan nggak ada yang ngasih tahu. Hari kerja ceritanya pindah ke kampus: gedung parkir
BINUS penuh dari kelas pagi, padahal kampus sebelahnya masih ada tempat. Google Maps nganter sampai pintu gedung lalu
berhenti. App operator parkir baru kepakai setelah kamu masuk. Padahal keputusan paling berharga terjadi sebelum berangkat.

**Google Maps berhenti di pintu gedung. KENNETH mulai dari situ.**

## Cara pakainya

App-nya cuma tiga tab, selalu di tempat yang sama di bawah layar. Nggak ada dashboard, dan app nggak pernah pindah
tab sendiri.

| Tab | Isi |
|---|---|
| **Peta** | Peta plus daftar tempat, urut dari yang paling cepat dapet parkir. Filter Semua, Favorit, Kampus, Mall. Buka satu tempat untuk papan "SISA SLOT" dan empat tombol: Rute, Pesan, Parkir, Ingetin |
| **Tiket** | Yang sedang berjalan: lokasi parkirmu, tiket jalur prioritas, valet, charger. Lalu pengingat dan riwayat |
| **Akun** | Masuk dengan Google atau tetap jadi tamu, kendaraan (mobil dan motor), paket, dampak bulan ini, opsi peta, notifikasi |

Pertama kali dibuka ada onboarding empat langkah (bisa dilewati): sambutan, yang bisa dibantu, tempat favorit,
kendaraan. Setelah itu langsung ke peta.

Halaman lain:

| Halaman | Isi |
|---|---|
| `/mitra` | Dashboard untuk pengelola gedung (produk B2B): pengunjung yang batal datang, larinya ke mana, beban tiap gerbang, pola seminggu |
| `/booth` | Mode booth BINUS Festival: form validasi + feedback grid, hasilnya bisa diunduh CSV atau JSON |

Keduanya ada di Akun, bagian "Untuk tim dan demo". Untuk demo, jam app diset ke **Sabtu 14.07** (mall puncak).
Ganti lewat chip jam di kiri atas peta. **Selasa 10.00** memperlihatkan kampus yang penuh.

## Lokasi

20 lokasi, sengaja dipadatkan di sekitar tiap kampus BINUS (keputusan tim: kepadatan cakupan lebih penting dari luas):

| Area | Kampus | Mall |
|---|---|---|
| Kemanggisan, Tanjung Duren | BINUS Anggrek, Syahdan, Kijang | Central Park, Neo Soho, Taman Anggrek, Mal Ciputra, Plaza Slipi Jaya |
| Puri | | Lippo Mall Puri, Puri Indah Mall |
| Senayan, Thamrin | BINUS Senayan | Senayan City, Plaza Senayan, fX Sudirman, Grand Indonesia |
| Alam Sutera | BINUS Alam Sutera | Mall @ Alam Sutera, Living World |
| Bekasi | BINUS Bekasi | Summarecon Mall Bekasi |

Kampus punya kurva sendiri (penuh dari kelas pagi di hari kerja, sepi hari Minggu) dan jam buka 06.00 sampai 21.00.
Kalau satu kampus penuh, alternatifnya kampus lain atau tempat yang bisa dijalan kaki, bukan mall di seberang kota.
Motor dan mobil punya slot, tingkat keterisian, dan tarif sendiri: ganti kendaraan di Akun, semua angka ikut berubah.

## Fitur, dipetakan ke 11 fitur di dokumen strategi

| # | Fitur | Di mana |
|---|---|---|
| 01 | Kondisi parkir real-time | Pin dan daftar di Peta, papan "SISA SLOT" di detail lokasi |
| 02 | Rekomendasi alternatif | Detail lokasi yang penuh, bagian "Masih lega di dekat sini" |
| 03 | Ingetin saat lega | Tombol "Ingetin" di detail, baris pengingat di daftar |
| 04 | Estimasi biaya parkir | Detail lokasi, baris "Biaya parkir" |
| 05 | Arahkan ke gerbang yang bener | Chip antrian tiap gerbang di peta, tombol Rute ke gerbang paling lancar (di KENNETH, Google Maps, atau Waze) |
| 06 | Inget lokasi mobil | Tombol "Parkir", simpan lantai, zona, pilar, lobi, foto. Muncul di Tiket dan sebagai chip di peta |
| 07 | Rute mobil ke tenant | Detail lokasi, "Dari parkir ke tujuan", plus denah basement 3D di "Cari kendaraan" |
| 08 | Slot difabel dan ibu hamil | Detail lokasi, baris "Slot khusus" |
| 09 | Booking jalur prioritas | Tombol "Pesan", tab Jalur prioritas. Tiket QR di tab Tiket |
| 10 | Booking charger EV | Tombol "Pesan", tab Charger EV |
| 11 | Pola kebiasaan pribadi | Akun, Dampak bulan ini, "Pola kebiasaanmu" (Premium) |

Tambahan di luar 11 fitur:

- **Valet gedung.** Pesan drop-off, tunjukkan QR ke petugas, lalu tekan "Siapkan mobil" sebelum turun ke lobi.
  Ada hitung mundur dan notifikasi "Mobilmu siap di Lobi A". Bayarnya tetap di meja valet.
- **Opsi peta.** Tampilan Tenang atau Detail, gedung 3D nyala atau mati, dan tombol Rute bisa langsung membuka
  Google Maps atau Waze dengan tujuan gerbang paling lancar.
- **Akun Google** lewat Firebase Authentication. Mode tamu tetap bisa semua fitur.
- Scrubber jam ala ramalan cuaca, lapor kondisi ala Waze, cek ganjil-genap, laporan dampak bulanan dengan rumus terbuka,
  pusat privasi, mode gelap, bahasa Indonesia dan Inggris, bisa di-install sebagai app (PWA).

## Keputusan produk yang kelihatan di app

- **Tidak jual petak, jual giliran masuk.** Tiket prioritas berlaku 15 menit untuk lewat jalur khusus. Setelah masuk,
  parkir biasa tanpa batas waktu dan tanpa denda. Lihat [docs/PRODUCT.md](docs/PRODUCT.md) untuk alasannya.
- **Booking bayar per pakai.** Premium cuma jual hal yang nggak pernah habis: booking lebih awal, diskon, notifikasi.
- **Jalur prioritas cuma ditawarkan kalau antrian nyata** (5 menit ke atas). Kalau sepi, app bilang nggak perlu.
- **Valet milik gedung, bukan armada kami.** KENNETH cuma pintu digitalnya. Nol biometrik, bayar di meja valet.
- **Kampus tidak menjual apa pun.** Di kampus app cuma menunjukkan seberapa penuh dan ke mana kalau penuh.
- **Jujur soal sumber data.** Tiap lokasi berlabel "Data palang" atau "Estimasi".
- **Data pribadi tinggal di HP.** Login Google hanya mengirim nama, email, dan foto profil. Riwayat, tiket, dan lokasi
  parkir tetap di perangkat. Yang nantinya dijual ke pengelola hanya agregat per jam.

## Jalankan sendiri

Butuh Node.js 20.19 atau lebih baru.

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`. Tanpa konfigurasi apa pun app jalan dalam mode tamu. Untuk mengaktifkan tombol
"Masuk dengan Google", salin `.env.example` jadi `.env.local` lalu isi nilainya (cara ambilnya tertulis di file itu).

```bash
npm test          # unit test mesin simulasi (vitest)
npm run build     # build produksi ke dist/
npm run preview   # jalankan hasil build
npm run lint      # oxlint
```

## Deploy ke Firebase Hosting

Konfigurasi ada di [firebase.json](firebase.json): semua rute diarahkan ke `index.html` (app satu halaman),
file di `assets/` di-cache setahun karena namanya selalu berubah tiap build, sedangkan semua rute, `index.html`,
dan service worker selalu dicek ulang supaya versi baru langsung sampai. Paket gratis (Spark) sudah cukup.

Folder ini sudah terhubung ke project `kenneth-9339d` lewat [.firebaserc](.firebaserc). Yang mau rilis harus
ditambahkan dulu sebagai anggota project di Firebase console, lalu login sekali:

```bash
npx firebase-tools login
```

Setelah itu setiap mau rilis:

```bash
npm run deploy           # build lalu publish ke https://kenneth-9339d.web.app
npm run deploy:preview   # link uji coba terpisah, hangus sendiri setelah 7 hari
```

Login Google perlu diaktifkan sekali oleh pemilik project: Firebase console, Authentication, Get started,
Sign-in method, Google, Enable, pilih email dukungan, Save. Tidak perlu deploy ulang setelahnya.

## Stack

React 19, TypeScript, Vite, Tailwind CSS 4, Motion untuk animasi, MapLibre GL dengan peta
[OpenFreeMap](https://openfreemap.org) (data OpenStreetMap, gratis tanpa API key), rute dari server demo
[OSRM](https://project-osrm.org), three.js untuk denah basement 3D, Zustand untuk state yang disimpan di perangkat,
Firebase Authentication untuk login Google (dimuat hanya saat tombolnya ditekan), vite-plugin-pwa.
Font: Plus Jakarta Sans (dibuat untuk identitas kota Jakarta) dan Doto untuk angka ala papan LED parkir.

## Struktur

```
src/
  data/        daftar lokasi (koordinat dan gerbang dari OSM, sisanya data demo)
  engine/      mesin simulasi: okupansi, antrian gerbang, harga, valet, ganjil-genap, dampak, ranking, angka mitra
  store/       state app (disimpan di localStorage), state UI, jam simulasi, jawaban booth
  i18n/        teks Indonesia dan Inggris
  components/  UI per layar: explore (Peta), tickets, account, sheets (termasuk sheets/book), onboarding, map, park (3D)
  lib/         login Google, navigasi ke app lain, notifikasi, waktu WIB
  pages/       /mitra dan /booth
docs/          dokumen produk, model simulasi, screenshot, logo (docs/brand)
```

## Logo dan layar pembuka

Logonya huruf K yang tersusun dari jalan dilihat dari atas, dengan satu mobil di cabang bawah. Batangnya
jalan yang sedang kamu lewati, dua cabangnya pilihan tempat, dan mobilnya mengambil yang lega.
File asli dan versi 1024px ada di [docs/brand](docs/brand).

Saat app dibuka muncul layar hitam dengan logo. Selama app memuat, mobilnya diam di tempat parkirnya. Begitu
peta selesai digambar, mobil itu jalan ke persimpangan, belok kanan, lalu keluar lewat cabang atas sementara layar
pembuka memudar. Mobil sengaja menunggu peta karena pembuatan peta sempat menahan browser, jadi kalau jalan lebih
awal gerakannya bisa patah. Paling lambat 3,2 detik setelah halaman dibuka mobil tetap jalan. Pengguna yang
mematikan animasi langsung masuk tanpa klip.

Gerakan mobil mengikuti klip hasil generate AI, tapi setiap piksel mobil dan jalan diambil dari logo asli, jadi
bentuknya tidak pernah berubah. Klipnya ada di `public/brand/` (MP4, WebM, dan poster frame pertama), begitu juga
loop 6 detik versi kecil yang dipakai di layar sambutan onboarding. Versi loop untuk booth dan media sosial (1:1, 9:16,
16:9) ada di [docs/brand](docs/brand).

Cara kerja simulasinya dijelaskan di [docs/MODEL.md](docs/MODEL.md). Panduan buat anggota tim ada di
[CONTRIBUTING.md](CONTRIBUTING.md).

## Data dan atribusi

- Peta: © OpenStreetMap contributors, disajikan oleh OpenFreeMap.
- Rute: OSRM demo server, dipakai sewajarnya untuk prototipe. Kalau server lambat, app jatuh ke rute perkiraan.
- Koordinat mall dan kampus dari Nominatim (OpenStreetMap). Posisi gerbang lokasi yang ditambahkan 19 Sep 2026 diambil
  dari pintu parkir dan jalan servis yang tercatat di OSM. Kapasitas, tarif, tarif valet, jumlah charger, dan lantai
  tenant adalah **data demo** dan belum dikonfirmasi ke pengelola.
- Nama mall dan kampus dipakai hanya sebagai contoh lokasi. Tidak ada kerja sama atau afiliasi dengan pengelola mana pun.

<p align="center">
  <img src="docs/screens/desktop.png" width="820" alt="Tampilan di laptop: app di bingkai HP dan QR" />
</p>
