# Product Requirements Document (PRD) - Aplikasi Absensi "Smart-Check"

**Project Name:** Smart-Check Attendance System  
**Tech Stack:** Next.js, Node.js, PostgreSQL, Vercel  
**Author:** David (Vibe Coder)  
**Status:** Initial Draft  

---

## 1. Pendahuluan
Aplikasi ini dirancang untuk mengelola absensi karyawan dengan tingkat keamanan tinggi melalui verifikasi wajah (Liveness Detection) dan pembatasan lokasi (Geofencing). Aplikasi ini berjalan di atas infrastruktur web modern (Next.js) dan dideploy di Vercel.

## 2. User Roles
1. **Admin**: Pengelola sistem yang memiliki hak penuh atas data karyawan dan laporan.
2. **Karyawan**: Pengguna yang melakukan absensi harian.

---

## 3. Fitur Utama (Functional Requirements)

### A. Panel Admin
| Fitur | Spesifikasi |
| :--- | :--- |
| **Manajemen Karyawan** | Menambahkan data: Nama, KTP (opsional), Master Wajah, Alamat, No HP, Email. |
| **Monitoring Kalender** | Melihat riwayat kehadiran (jam masuk & pulang) semua karyawan dalam tampilan Calendar UI. |
| **Reporting System** | Generate laporan kehadiran otomatis (Mingguan, Bulanan, Tahunan). |
| **Pencatatan Absen Manual** | Fitur untuk menandai karyawan yang tidak hadir (Sakit/Izin/Alpha) yang tidak masuk sistem. |
| **Manajemen Hari Kerja** | Menentukan hari operasional (Masuk) dan hari libur nasional/kantor di kalender. |

### B. Panel Karyawan
| Fitur | Spesifikasi |
| :--- | :--- |
| **Autentikasi** | Login aman menggunakan akun yang didaftarkan admin. |
| **Submit Kehadiran** | Melakukan 'Jam Masuk' dengan verifikasi Liveness (Wajah) & Geofencing. |
| **Submit Kepulangan** | Melakukan 'Jam Pulang' di akhir jam kerja. |
| **Sinkronisasi Jadwal** | Tombol absen hanya muncul/aktif sesuai dengan generate kalender dari Admin. |

---

## 4. Spesifikasi Keamanan & Validasi (Non-Functional)

### 1. Liveness Detection
* Sistem harus mendeteksi gerakan manusia (seperti berkedip atau menoleh) untuk memastikan karyawan tidak menggunakan foto/print-out.
* Menggunakan library sisi klien (misal: FaceIO atau MediaPipe) untuk efisiensi beban server.

### 2. Geofencing (Radius 50 Meter)
* Titik pusat koordinat ditetapkan pada lokasi "Warung".
* Menggunakan rumus **Haversine** untuk kalkulasi jarak antara titik user dan titik warung.
* Jika jarak > 50 meter, proses absensi ditolak secara otomatis.

---

## 5. Struktur Database (PostgreSQL)

### Table: `users`
* `id`: UUID (Primary Key)
* `name`: String
* `email`: String (Unique)
* `password`: Hash String
* `ktp`: String (Optional)
* `face_data`: Text/Vector (Master face embedding)
* `role`: Enum ('admin', 'employee')

### Table: `schedules`
* `id`: Serial
* `date`: Date (Unique)
* `status`: Enum ('work_day', 'holiday')

### Table: `attendances`
* `id`: UUID
* `user_id`: FK to users
* `check_in`: Timestamp
* `check_out`: Timestamp
* `latitude`: Float
* `longitude`: Float
* `status`: Enum ('present', 'absent', 'late')

---

## 6. Rencana Deployment
* **Platform**: Vercel.
* **Database**: Vercel Postgres / Supabase.
* **Environment Variables**:
    * `TARGET_LATITUDE`: Koordinat lat warung.
    * `TARGET_LONGITUDE`: Koordinat long warung.
    * `DATABASE_URL`: Connection string Postgres.

---

## 7. Kriteria Penerimaan (Acceptance Criteria)
* Karyawan tidak bisa absen jika berada di luar radius 50m.
* Admin bisa melihat laporan dalam bentuk kalender yang interaktif.
* Sistem liveness berhasil menolak penggunaan foto statis.