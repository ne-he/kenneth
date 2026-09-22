# Panduan kontribusi

Buat anggota tim yang mau ikut ngoding. Baca sekali, sisanya tinggal diikuti.

## Setup

Butuh Node.js 20.19 atau lebih baru dan Git.

```bash
git clone https://github.com/ne-he/kenneth.git
cd kenneth
npm install
npm run dev
```

Buka `http://localhost:5173`. Di laptop app tampil di dalam bingkai HP. Buat lihat versi HP asli,
buka DevTools lalu nyalakan device toolbar (Ctrl+Shift+M), atau buka alamat Network yang muncul di
terminal dari HP yang satu Wi-Fi dengan `npm run dev -- --host`.

Tidak ada API key atau file `.env` yang dibutuhkan. Peta dari OpenFreeMap dan rute dari OSRM, dua-duanya gratis.

## Alur kerja

1. Tarik perubahan terbaru: `git pull origin main`.
2. Bikin branch sendiri, jangan kerja langsung di `main`:
   `git checkout -b feat/nama-singkat` atau `fix/nama-singkat`.
3. Kerjakan satu hal. Commit tiap kali satu perubahan selesai, jangan ditumpuk jadi satu commit besar.
4. Sebelum push, tiga perintah ini harus lolos:

   ```bash
   npm test
   npm run lint
   npm run build
   ```

5. Push branch-nya lalu buka Pull Request ke `main`. Minta satu orang lain review sebelum merge.
6. Rilis ke Firebase (`npm run deploy`) dilakukan pemilik project Firebase setelah merge ke `main`.
   Mau nunjukin hasil branch ke tim dulu? Minta dibuatkan link uji coba lewat `npm run deploy:preview`.

## Format commit

Pakai format [Conventional Commits](https://www.conventionalcommits.org), bahasa Inggris, huruf kecil,
kalimat perintah. Scope di dalam kurung boleh diisi nama bagian yang diubah.

```
feat(book): let Premium book up to 7 days ahead
fix(map): reset padding before fitBounds
docs: explain the simulation model
```

Jenis yang dipakai di repo ini: `feat` fitur baru, `fix` perbaikan bug, `refactor` ubah struktur tanpa
ubah perilaku, `perf` performa, `test` test, `docs` dokumen, `style` tampilan tanpa ubah logika,
`chore` urusan alat dan konfigurasi.

Satu commit, satu perubahan. Kalau pesan commit-nya butuh kata "dan" untuk dua hal yang tidak
berhubungan, pecah jadi dua commit.

## Aturan kode

**Teks.** Semua teks yang tampil di layar masuk ke `src/i18n/id.ts` dan `src/i18n/en.ts`. Tipe `Dict`
bikin build gagal kalau salah satunya kelupaan. Halaman `/mitra` dan `/booth` punya objek `COPY`
sendiri di filenya.

**Gaya tulisan.** Bahasa Indonesia santai tapi jelas, seperti ngobrol sama teman. Jangan pakai tanda
pisah panjang (em dash). Pakai koma, titik, atau pecah jadi dua kalimat.

**Warna.** Pakai token dari `src/index.css` (`bg-surface`, `text-ink-2`, `bg-lega`, dan seterusnya).
Kode hex langsung hanya untuk hal yang sengaja tidak ikut tema, seperti tiket prioritas yang selalu
gelap dan garis rute di peta. Setiap perubahan tampilan dicek di mode terang dan gelap. Ganti tema
lewat Profil, Tampilan.

**Angka.** Semua hitungan (okupansi, antrian, harga, dampak) ada di `src/engine/`. Komponen hanya
menampilkan. Kalau mengubah rumus di engine, tambah atau ubah test di file `*.test.ts` sebelahnya,
lalu perbarui [docs/MODEL.md](docs/MODEL.md).

**Waktu.** Semua jam dihitung dalam WIB lewat `src/lib/time.ts`, jangan pakai `new Date().getHours()`
langsung. Komponen ambil waktu dari `useNow()`, bukan `Date.now()`, supaya ikut jam simulasi.

**Kejujuran data.** Angka simulasi harus tetap kelihatan sebagai simulasi atau estimasi di layar.
Jangan hapus label "Estimasi", "Data palang", atau keterangan pembayaran simulasi.

## Menambah lokasi

Tambah satu objek di `src/data/venues.ts` dan id-nya di tipe `VenueId` di `src/data/types.ts`.

- Koordinat lokasi dan gerbang ambil dari OpenStreetMap, urutannya bujur dulu lalu lintang. Untuk gerbang, cari
  `amenity=parking_entrance` atau jalan servis di sebelah gedung.
- `category` menentukan kurvanya (`mall` atau `kampus`), `hours` jam buka dan tutupnya.
- `load` mengatur seberapa ramai puncaknya (1 berarti menyentuh puncak kurva), `shiftMin` menggeser jam ramainya.
- `motor` berisi slot motor sendiri: kapasitas, `load`, dan tarif (harus lebih murah dari tarif mobil).
- `valet` opsional dan hanya untuk mall. Lobinya harus salah satu dari `lobbies`.
- Mall wajib punya minimal satu gerbang dengan `priorityLane`, kampus tidak boleh punya.
- `walkLinks` harus dua arah dengan menit yang sama, test akan menagihnya.
- `pull` tiap gerbang menentukan ke mana antrian menumpuk. Gerbang utama biasanya paling besar.
- `labelDir` mengatur arah label pin di peta supaya tidak bertabrakan dengan lokasi di dekatnya.
- Kapasitas, tarif, charger, dan tenant diisi sebagai data demo dan tetap disebut demo.

Jalankan `npm test` setelahnya. `src/data/venues.test.ts` mengecek koordinat tertukar, gerbang yang
kejauhan dari gedungnya, dan field yang wajib ada.

## Tips

- Jam app bisa diganti lewat chip jam di kiri atas peta. Skenario default Sabtu 14.07, Selasa 10.00 untuk kampus penuh.
- Akun, Privasi dan data, "Hapus data" mengembalikan app ke kondisi awal, termasuk onboarding.
- Tombol "Masuk dengan Google" baru muncul kalau `.env.local` diisi (lihat `.env.example`).
- Nggak ada yang boleh pindah tab otomatis. Setelah aksi berhasil, cukup toast dan titik di tab Aktivitas (`markActivity`).
  Satu-satunya perpindahan tab adalah yang ditekan pengguna sendiri, misalnya tombol "Lagi" di Riwayat.
- Tab Parkir satu template untuk semua mode. Mode baru berarti isi pin dan tombol baru di `engine/modes.ts` dan
  `explore/PlaceCard.tsx`, bukan layar baru.
- Booking yang bisa dibatalkan selalu pakai `CancelConfirm`, dan yang dibatalkan tetap tercatat (lihat `engine/activity.ts`).
- Di mode dev, objek peta tersedia di console sebagai `window.__kmap`.
- Rute dari OSRM kadang lambat. Setelah 6 detik app otomatis pakai rute perkiraan.
- Data app tersimpan di `localStorage` dengan kunci `kenneth-app`.
