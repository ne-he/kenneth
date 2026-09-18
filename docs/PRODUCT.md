# Dokumen produk

Ringkasan keputusan produk KENNETH dan alasannya. Dokumen strategi lengkap milik tim ada di luar repo ini.
Yang ditulis di sini adalah bagian yang kelihatan di app, supaya siapa pun yang membaca kodenya paham
kenapa sebuah layar dibuat seperti itu.

## Untuk siapa

Pengunjung mall di Jakarta yang bawa mobil, di akhir pekan. Mulainya sengaja sempit: enam mall di
Jakarta Barat (Central Park, Neo Soho, Taman Anggrek, Mal Ciputra, Lippo Mall Puri, Puri Indah Mall),
ditambah Grand Indonesia sebagai contoh mall besar dengan rute ke tenant.

Kenapa sempit? Data parkir baru berguna kalau cakupannya rapat. Empat sampai enam mall yang saling
berdekatan lebih cepat terasa manfaatnya daripada lima puluh mall yang berjauhan.

## Janjinya

Keputusan yang paling mahal diambil sebelum berangkat: mau ke mana, jam berapa, lewat gerbang mana.
KENNETH menjawab itu dalam satu layar yang bisa dibaca dalam 3 detik.

Tiga hal yang menentukan produk ini hidup atau mati, urut dari yang paling penting:

1. Akurasi data. Sekali app bilang lega padahal penuh, orang menghapusnya.
2. Terbaca sekilas. Angka besar, satu warna status, tanpa grafik yang harus dipelajari dulu.
3. Kepadatan cakupan. Rekomendasi alternatif cuma berguna kalau mall sebelahnya juga tercakup.

## Yang dijual, dan yang sengaja tidak

**Tidak menjual petak parkir.** Kalau yang dijual petak selama sekian jam, kami tidak punya wewenang
mengusir, menderek, atau menggembok mobil yang kelamaan. Denda kecil tidak bikin jera. Denda besar
bikin pengguna jalan di mall sambil lihat jam, artinya produk merugikan penggunanya sendiri.

**Yang dijual adalah giliran masuk.** Pengguna memesan jendela 15 menit, misalnya 14.00 sampai 14.15,
lalu scan QR di jalur khusus. Setelah lewat gerbang ia pengguna parkir biasa: boleh berapa lama pun,
bayar tarif normal. Tidak ada yang ditahan, jadi tidak ada yang bisa overstay.

Aturan tambahan yang ikut ditanam di app:

- Booking dibayar per pakai, bukan bagian dari langganan. Lihat tulisan "habis" sebelum bayar itu
  kecewa biasa. Lihatnya setelah bayar langganan itu merasa ditipu.
- Per jendela 15 menit, lajur prioritas menampung 30 mobil tapi yang dijual paling banyak 24.
  Sisanya bantalan buat yang telat.
- Jalur prioritas hanya ditawarkan kalau antrian dasar 5 menit atau lebih. Kalau sepi, app bilang
  tidak perlu beli.
- Kalau parkiran hampir penuh total, app bilang di depan bahwa jalur prioritas memotong antrian
  gerbang tapi tetap menunggu ada mobil keluar.
- Booking charger mobil listrik aman dijanjikan, karena chargernya sendiri jadi sensor sekaligus
  penegak aturan.

**Sengaja tidak dibuat:**

| Ide | Kenapa tidak |
|---|---|
| Reservasi petak | Tidak bisa ditegakkan, lihat di atas |
| Bayar parkir di app | Sudah dikerjakan operator parkir. Kami masuk sebelum mereka, bukan menggantikan |
| Poin, lencana, gamifikasi | Tidak menjawab masalah. Diganti laporan dampak bulanan dengan rumus terbuka |
| Valet antar pengguna dengan Face ID (ada di mockup awal) | Bukan bagian dari 11 fitur, butuh armada, dan data biometrik terlalu berisiko untuk prototipe |

## Harga

Semua angka di bawah masih perkiraan dan belum divalidasi ke pengelola gedung mana pun.

**Untuk pengguna**

| Paket | Harga | Isi |
|---|---|---|
| Gratis | Rp0 | Okupansi dan antrian semua lokasi, rekomendasi alternatif, gerbang paling lancar, simpan lokasi mobil, rute ke tenant. Booking prioritas maksimal 2 jam sebelumnya dengan harga normal |
| Jalur prioritas | Rp15.000 sampai Rp30.000 per pakai | Harga ikut keramaian. Sabtu siang mahal, Selasa pagi murah atau tidak perlu beli |
| Premium | Rp29.000 per bulan | Booking sampai 7 hari sebelumnya, diskon 40% tiap booking, notifikasi jam lega lokasi favorit, notifikasi duluan kalau ada yang batal, pola kebiasaan pribadi |

Prinsip Premium: yang dijual hanya hal yang tidak pernah habis stoknya. Premium tidak menjamin dapat giliran.

**Untuk pengelola gedung**

| Pelanggan | Perkiraan harga | Yang didapat |
|---|---|---|
| Mall sepi | Rp10 juta sampai Rp15 juta per bulan | Muncul sebagai rekomendasi saat lokasi lain penuh. Pengunjungnya sudah di jalan, sudah bawa mobil, sudah niat belanja |
| Mall ramai | Bagi hasil booking | Jalur prioritas, pengingat yang menahan pengunjung supaya datang nanti daripada batal, pemerataan antrian antar gerbang |
| Semua lokasi | Rp5 juta sampai Rp10 juta per bulan | Dashboard: berapa orang batal datang karena lihat penuh, larinya ke mana, jam berapa kehilangan pengunjung |

Halaman `/mitra` di app adalah contoh dashboard itu, dengan angka simulasi.

## Risiko dan jawabannya di app

Sebelas risiko ini dari daftar risiko tim. Kolom terakhir menunjukkan di mana jawabannya kelihatan.

| # | Risiko | Jawaban | Di app |
|---|---|---|---|
| 1 | Orang booking lalu tidak keluar-keluar | Tidak jual petak, jual giliran masuk | Teks pembuka di layar booking |
| 2 | Slot sedikit, peminat banyak | Bayar per pakai, jual 24 dari 30 | Sisa giliran di tiap jendela, label "Habis" |
| 3 | Mall ramai tidak mau kerja sama | Produk berbeda untuk mall ramai, pengalihan ke properti satu grup dulu | Dashboard mitra, bagian "Ke mana mereka pergi" |
| 4 | Pengelola belum tentu mau bayar | Prototipe tidak bergantung pada mereka. Data simulasi sah untuk tahap ini | Label "Estimasi" dan keterangan simulasi |
| 5 | Data salah, pengguna kabur | Jujur soal sumber, uji toleransi meleset di booth | Label "Data palang" atau "Estimasi" di tiap lokasi, pertanyaan 3 di `/booth` |
| 6 | Ayam dan telur | Mulai dari area sempit, laporan pengguna | Tombol "Kondisi di lokasi beda?" |
| 7 | Google bisa bikin ini | Akuisisi jalan keluar yang sah. Yang harus dibangun komunitas dan hubungan dengan pengelola | Tidak ada di app |
| 8 | Hanya terasa di akhir pekan | Visi jangka panjang: kantor, rumah sakit, kampus | Tidak ada di app. Pilot sengaja mall dulu |
| 9 | Yang tidak bayar menunggu lebih lama | Mirip fast track bandara, dan fitur gratis ikut mengurangi antrian | "Kenapa ini adil" di layar booking |
| 10 | Parkiran penuh total | Diakui di depan | Peringatan "hampir penuh total" di layar booking |
| 11 | Privasi data lokasi | Yang dijual ke pengelola hanya agregat dan anonim | Profil, Privasi dan data. Semua data prototipe tinggal di HP |

## Yang diuji di BINUS Festival

Halaman `/booth` dipakai di stan. Satu pengunjung mengisi satu kali, jawabannya tersimpan di perangkat
dan bisa diunduh sebagai CSV atau JSON.

Pertanyaannya:

1. Kapan terakhir muter nyari parkir di mall, dan berapa lama.
2. Kalau app kadang meleset 10 sampai 15 persen, masih mau pakai? Ini menguji risiko 5.
3. Dua fitur yang paling dibutuhkan, dari 11 fitur.
4. Mau bayar Rp15.000 sampai Rp30.000 buat masuk tanpa antri? Ini menguji harga jalur prioritas.
5. Feedback grid: yang disuka, yang diharapkan, yang masih bikin bingung, ide.

Kontak untuk follow up opsional dan hanya diisi dengan izin.

## Yang belum ada di prototipe

Supaya tidak ada yang mengira ini sudah jalan sungguhan:

- Angka okupansi, antrian, dan tarif semuanya simulasi. Belum ada palang yang terhubung.
- Pembayaran hanya simulasi. Tidak ada uang yang ditarik.
- Notifikasi duluan kalau ada yang batal (Premium) baru tertulis di halaman paket.
- Laporan kondisi dari pengguna tersimpan di HP, belum dikirim ke server mana pun.
- Tidak ada akun. Pindah HP berarti mulai dari awal.
- Ganjil-genap belum menghitung hari libur nasional.
- Denah basement, lantai tenant, dan jumlah charger adalah data demo.
