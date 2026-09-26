# Model simulasi

Prototipe ini belum tersambung ke palang parkir mana pun, jadi angkanya dibuat oleh model kecil yang
deterministik: input yang sama selalu keluar angka yang sama. Itu penting buat demo (Sabtu 14.07 selalu
kelihatan sama) dan buat test. Semua kode ada di `src/engine/`.

## 1. Okupansi (`occupancy.ts`)

Produk nyatanya nanti: okupansi = mobil masuk dikurangi mobil keluar, dibaca dari palang tiap beberapa menit.

Di prototipe:

1. Mall punya tiga kurva per jam (WIB): akhir pekan, hari kerja, dan Jumat (hari kerja dengan malam yang lebih ramai).
   Kurva akhir pekan punya puncak jam 14 sampai 15, turun sekitar jam 17, lalu naik lagi buat makan malam.
   Kampus punya tiga kurva sendiri: hari kerja (naik tajam jam 7, penuh jam 9 sampai 14, turun sore dengan sisa kelas
   malam), Sabtu (sekitar separuhnya), dan Minggu (hampir kosong).
2. Tiap lokasi punya `load` (seberapa tinggi puncaknya) dan `shiftMin` (datang lebih cepat atau lebih lambat).
   Rumusnya `okupansi = 0,04 + (kurva - 0,04) × load`.
3. Ditambah "napas": dua gelombang sinus pelan (periode 17 dan 43 menit, amplitudo total sekitar 2%) supaya angka
   bergerak waktu layar dilihat lama.
4. Status: **lega** di bawah 70%, **ramai** 70 sampai 89%, **penuh** 90% ke atas.
5. Jam operasional per lokasi: mall 10.00 sampai 22.00, kampus 06.00 sampai 21.00. Perkiraan per jam, jendela
   booking, dan pencarian "kapan lancar lagi" mengikuti jam lokasinya.

**Motor.** Tiap lokasi juga punya slot motor sendiri: kapasitas, `load`, dan tarif. Kalau kendaraan yang dipakai
motor, app menukar ketiga angka itu (`forKind`) dan semua rumus di bawah jalan seperti biasa. Gerbang, lantai, dan
jam buka tetap sama.

Waktu selalu dihitung dalam WIB, apa pun zona waktu perangkatnya.

## 2. Antrian gerbang

Antrian muncul ketika laju mobil masuk lebih cepat dari laju mobil keluar. Di bawah 80% hampir nol, di atasnya
naik kuadratik:

```
antri(okupansi) = okupansi × 1,2                          kalau okupansi < 0,8
                = 0,96 + ((okupansi - 0,8) / 0,2)² × 16   kalau tidak
```

Tiap gerbang punya `pull`, yaitu seberapa banyak pengendara memilih gerbang itu karena kebiasaan. Antrian
gerbang = `antri × pull`. Gerbang utama biasanya punya pull besar, jadi di situlah antrian menumpuk, sementara
gerbang samping sering sepi. Itu yang dimanfaatkan fitur "gerbang paling lancar".

Setelah lewat gerbang, ada waktu muter nyari petak kalau okupansi di atas 85%: `((okupansi - 0,85) / 0,15)² × 10` menit.

## 3. Waktu sampai parkir (ranking)

```
waktu sampai parkir = waktu tempuh + antri di gerbang terbaik + waktu muter
```

Waktu tempuh diambil dari tabel OSRM (jarak jalan asli), dikali faktor lalu lintas karena OSRM menganggap jalan
kosong: 2,1× di akhir pekan jam 11.00 sampai 21.00, 2,4× di jam sibuk hari kerja, 1,4 sampai 1,6× di luar itu. Kalau OSRM tidak
bisa dihubungi, jarak garis lurus dikali 1,35 dengan kecepatan rata-rata 21 km/jam.

Daftar di tab Parkir diurutkan dari waktu sampai parkir paling kecil.

## 4. Kapan lancar lagi

Mulai dari sekarang, maju 15 menit sekali sampai jam tutup, cari saat pertama antrian gerbang utama 3 menit
atau kurang dan status tidak penuh. Hasilnya dibulatkan ke seperempat jam.

## 4b. Valet runner (`valet.ts`)

Valet dijalankan armada runner KENNETH, dan mobil diparkir di Zona KENNETH dekat lobi. Model kecilnya cuma dua
angka yang ikut keramaian:

```
runner datang   = 1 + 4 × clamp((okupansi - 0,50) / 0,45)   menit
mobil balik     = 4 + 6 × clamp((okupansi - 0,55) / 0,40)   menit
```

Jadi saat sepi mobil balik dalam 4 menit, saat hampir penuh sampai 10 menit. Lebih cepat dari valet biasa karena
mobil tidak dibawa ke basement paling bawah. Nama runner dan nomor badge di tiket dipilih dari id tiket, jadi
selalu sama untuk tiket yang sama. Status tiket dihitung dari waktu, bukan disimpan: menunggu kamu datang, dipegang
runner, sedang diambil, siap, selesai. Pesanan yang tidak didatangi lebih dari 45 menit setelah jam pilihan hangus
tanpa biaya.

## 5. Zona KENNETH (`zone.ts`, `pricing.ts`)

- Zona ada di mall yang punya gerbang berkamera pelat KENNETH. Lantainya lantai parkir pertama, dekat lobi utama.
- Jumlah petak = kapasitas mobil / 100, dibatasi 12 sampai 40.
- Petak kosong per jam datang = petak zona dikurangi petak terpakai, dengan
  terpakai = petak × clamp((okupansi - 0,45) / 0,50), plus sedikit variasi tetap per jam supaya demo selalu sama.
- Nomor petak (K-01 dan seterusnya) diturunkan dari id booking.
- Petak ditahan 30 menit dari jam datang, lalu dilepas lagi.
- Harga dasar naik linear dari Rp15.000 (okupansi 60%) ke Rp30.000 (okupansi 98%), dibulatkan ke ribuan.
- Premium: diskon 40%, dibulatkan ke 500 rupiah.

## 6. Ganjil-genap (`gage.ts`)

Berlaku Senin sampai Jumat, 06.00 sampai 10.00 dan 16.00 sampai 21.00, di koridor tertentu. Mobil listrik
bebas. Di data demo hanya Grand Indonesia (Thamrin) yang ditandai koridor. Hari libur nasional belum dimodelkan,
jadi app menyebutnya pengingat, bukan jaminan hukum.

## 7. Dampak (`impact.ts`)

```
bensin_L = menit_dihemat × 0,013
co2_kg   = bensin_L × 2,31
```

13 ml per menit adalah perkiraan konsumsi mobil kota saat diam atau jalan pelan di antrian. 2,31 kg CO₂ per liter
bensin adalah angka pembakaran yang umum dipakai. Mobil listrik dihitung hemat waktu, bensin dan emisinya nol.

## 8. Angka dashboard mitra (`mitra.ts`)

- Mobil masuk per jam = pertumbuhan okupansi × kapasitas + pergantian (okupansi × kapasitas / 2,6 jam rata-rata parkir).
- Pengunjung yang batal datang: mulai muncul di atas 88%, naik linear sampai 22% dari kedatangan di 100%.
- Pengalihan: dibagi ke lokasi terdekat yang tidak penuh, bobot `1 / jarak × (1 - okupansi)`, properti satu grup dikali 2,2.
- Pemerataan gerbang (dihitung di jam 15.00): tanpa app, porsi mengikuti `pull`. Dengan app, 45% pengendara
  dibagi ulang dengan bobot `1 / antrian gerbang`, jadi gerbang yang antriannya pendek dapat lebih banyak.

## Yang perlu divalidasi sebelum angka ini dipakai di luar demo

Semua parameter di atas adalah asumsi awal tim. Yang paling menentukan, dan paling perlu dicek ke lapangan:
kurva okupansi akhir pekan tiap mall, kurva kampus mengikuti jadwal kuliah yang sebenarnya, perbandingan slot motor
dan mobil di tiap kampus, porsi pengunjung yang batal datang saat penuh, faktor lalu lintas, dan waktu ambil mobil valet runner, dan ukuran Zona KENNETH.
