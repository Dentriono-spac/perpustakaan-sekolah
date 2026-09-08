/* ==========================================================
   PERPUSTAKAAN DIGITAL SEKOLAH - FRONTEND FINAL
   GitHub Pages
   ========================================================== */

const API_URL =
  "https://script.google.com/macros/s/AKfycbyk367Q4T6gyUN2Xptxi9PPYaOfNXjvTSaWqHRxH2uqNNgEynfRgpBAeHg8HFnyr8UOHw/exec";

let siswaAktif = null;
let bukuAktif = null;
let scannerAktif = null;
let scannerReaderId = null;
let scannerSedangDiproses = false;

/* ==========================================================
   MENU
   ========================================================== */
function bukaMenu(namaMenu) {
  hentikanScanner();

  document.getElementById("menuUtama").classList.add("hidden");
  document.querySelectorAll(".halaman").forEach(function (el) {
    if (el.id !== "menuUtama") el.classList.add("hidden");
  });

  const halaman = document.getElementById(namaMenu);
  if (!halaman) return;
  halaman.classList.remove("hidden");

  if (namaMenu === "terlambat") loadKeterlambatan();
}

function kembaliMenu() {
  hentikanScanner();
  document.querySelectorAll(".halaman").forEach(function (el) {
    if (el.id !== "menuUtama") el.classList.add("hidden");
  });
  document.getElementById("menuUtama").classList.remove("hidden");
  loadStatistik();
}

/* ==========================================================
   JSONP - SEMUA GET DARI GITHUB KE APPS SCRIPT
   Tidak memakai fetch GET sehingga tidak terkena masalah CORS.
   ========================================================== */
function requestJSONP(params, callback) {
  const callbackName =
    "perpusJSONP_" + Date.now() + "_" + Math.random().toString(36).slice(2);

  const script = document.createElement("script");
  let selesai = false;
  let timer = null;

  function cleanup() {
    if (timer) clearTimeout(timer);
    try { delete window[callbackName]; } catch (e) { window[callbackName] = undefined; }
    if (script.parentNode) script.parentNode.removeChild(script);
  }

  window[callbackName] = function (data) {
    if (selesai) return;
    selesai = true;
    cleanup();
    callback(data);
  };

  script.onerror = function () {
    if (selesai) return;
    selesai = true;
    cleanup();
    callback({ success: false, message: "Google Apps Script tidak dapat diakses." });
  };

  const query = new URLSearchParams();
  Object.keys(params || {}).forEach(function (key) {
    query.set(key, params[key]);
  });
  query.set("callback", callbackName);
  query.set("_", String(Date.now()));

  script.src = API_URL + "?" + query.toString();
  document.body.appendChild(script);

  timer = setTimeout(function () {
    if (selesai) return;
    selesai = true;
    cleanup();
    callback({ success: false, message: "Koneksi ke Google Apps Script timeout." });
  }, 10000);
}

/* ==========================================================
   SCANNER
   ========================================================== */
async function mulaiScanner(readerId, ketikaBerhasil) {
  if (typeof Html5Qrcode === "undefined") {
    alert("Library kamera belum termuat. Refresh halaman.");
    return;
  }

  await hentikanScanner();

  const reader = document.getElementById(readerId);
  if (!reader) {
    alert("Area kamera tidak ditemukan: " + readerId);
    return;
  }

  reader.innerHTML = "";
  reader.style.setProperty("display", "block", "important");
  reader.style.visibility = "visible";
  reader.style.width = "100%";
  reader.style.minHeight = "260px";
  reader.style.background = "#111";

  scannerReaderId = readerId;
  scannerSedangDiproses = false;

  const scanner = new Html5Qrcode(readerId);
  scannerAktif = scanner;

  try {
    let cameras = [];
    try {
      cameras = await Html5Qrcode.getCameras();
    } catch (e) {}

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    };

    if (cameras && cameras.length) {
      const belakang = cameras.find(function (cam) {
        return /back|rear|environment|belakang/i.test(cam.label || "");
      });
      await scanner.start(
        (belakang || cameras[0]).id,
        config,
        function (decodedText) {
          if (scannerSedangDiproses) return;
          scannerSedangDiproses = true;
          ketikaBerhasil(String(decodedText || "").trim());
        },
        function () {}
      );
    } else {
      await scanner.start(
        { facingMode: "environment" },
        config,
        function (decodedText) {
          if (scannerSedangDiproses) return;
          scannerSedangDiproses = true;
          ketikaBerhasil(String(decodedText || "").trim());
        },
        function () {}
      );
    }
  } catch (error) {
    console.error("Scanner error:", error);
    scannerAktif = null;
    reader.style.display = "none";
    alert("Kamera tidak dapat dibuka. Pastikan izin kamera diberikan.");
  }
}

async function hentikanScanner() {
  const scanner = scannerAktif;
  scannerAktif = null;
  scannerSedangDiproses = false;

  if (scanner) {
    try { await scanner.stop(); } catch (e) {}
    try { scanner.clear(); } catch (e) {}
  }

  if (scannerReaderId) {
    const reader = document.getElementById(scannerReaderId);
    if (reader) {
      reader.innerHTML = "";
      reader.style.display = "none";
      reader.style.minHeight = "0";
      reader.style.background = "transparent";
    }
  }
  scannerReaderId = null;
}

/* ==========================================================
   PINJAM - SISWA
   ========================================================== */
function mulaiScanSiswaPinjam() {
  mulaiScanner("readerSiswaPinjam", function (id) {
    document.getElementById("inputSiswaPinjam").value = id;
    hentikanScanner();
    cariSiswaPinjam(id);
  });
}

function cariSiswaPinjamManual() {
  const id = document.getElementById("inputSiswaPinjam").value.trim();
  if (!id) return alert("Masukkan ID Siswa.");
  cariSiswaPinjam(id);
}

function cariSiswaPinjam(idSiswa) {
  const area = document.getElementById("hasilSiswaPinjam");
  area.innerHTML = '<div class="success-box">⏳ Mencari data siswa...</div>';

  requestJSONP({ action: "cari_siswa", idSiswa: idSiswa }, function (data) {
    if (!data || data.success === false || !data.found) {
      siswaAktif = null;
      area.innerHTML = '<div class="error-box">❌ ' + esc(data && data.message ? data.message : "Data siswa tidak ditemukan") + '</div>';
      return;
    }

    siswaAktif = data;
    area.innerHTML =
      '<div class="success-box">' +
      '<b>✓ DATA SISWA</b><br><br>' +
      'Nama: ' + esc(data.nama_siswa) + '<br>' +
      'Kelas: ' + esc(data.kelas) + '<br>' +
      'ID: ' + esc(data.id_siswa) + '<br>' +
      'Status: ' + esc(data.status) +
      '</div>';
  });
}

/* ==========================================================
   PINJAM - BUKU
   ========================================================== */
function mulaiScanBukuPinjam() {
  mulaiScanner("readerBukuPinjam", function (id) {
    document.getElementById("inputBukuPinjam").value = id;
    hentikanScanner();
    cariBukuPinjam(id);
  });
}

function cariBukuPinjamManual() {
  const id = document.getElementById("inputBukuPinjam").value.trim();
  if (!id) return alert("Masukkan ID Buku.");
  cariBukuPinjam(id);
}

function cariBukuPinjam(idBuku) {
  const area = document.getElementById("hasilBukuPinjam");
  area.innerHTML = '<div class="success-box">⏳ Mencari data buku...</div>';

  requestJSONP({ action: "cari_buku", idBuku: idBuku }, function (data) {
    if (!data || data.success === false || !data.found) {
      bukuAktif = null;
      area.innerHTML = '<div class="error-box">❌ ' + esc(data && data.message ? data.message : "Data buku tidak ditemukan") + '</div>';
      return;
    }

    bukuAktif = data;
    area.innerHTML =
      '<div class="success-box">' +
      '<b>✓ DATA BUKU</b><br><br>' +
      'Judul: ' + esc(data.judul_buku) + '<br>' +
      'Penulis: ' + esc(data.penulis) + '<br>' +
      'Stok: ' + esc(data.stok) +
      '</div>';
  });
}

/* ==========================================================
   PINJAM - SIMPAN TRANSAKSI
   Menggunakan JSONP GET agar tidak terganggu CORS.
   ========================================================== */
function prosesPinjam() {
  const hasil = document.getElementById("hasilPinjam");

  if (!siswaAktif) return alert("Cari atau scan siswa terlebih dahulu.");
  if (!bukuAktif) return alert("Cari atau scan buku terlebih dahulu.");

  hasil.innerHTML = '<div class="success-box">⏳ Memproses peminjaman...</div>';

  requestJSONP({
    action: "pinjam_buku",
    idSiswa: siswaAktif.id_siswa,
    idBuku: bukuAktif.id_buku
  }, function (data) {
    if (!data || !data.success) {
      hasil.innerHTML = '<div class="error-box">❌ ' + esc(data && data.message ? data.message : "Gagal memproses peminjaman") + '</div>';
      return;
    }

    hasil.innerHTML =
      '<div class="success-box"><b>✓ ' + esc(data.message) + '</b><br><br>' +
      'Siswa: ' + esc(data.nama_siswa) + '<br>' +
      'Buku: ' + esc(data.judul_buku) + '<br>' +
      'Batas kembali: ' + esc(data.batas_kembali) + '</div>';

    siswaAktif = null;
    bukuAktif = null;
    document.getElementById("inputSiswaPinjam").value = "";
    document.getElementById("inputBukuPinjam").value = "";
    document.getElementById("hasilSiswaPinjam").innerHTML = "";
    document.getElementById("hasilBukuPinjam").innerHTML = "";
    loadStatistik();
  });
}

/* ==========================================================
   PENGEMBALIAN
   ========================================================== */
function mulaiScanPengembalian() {
  mulaiScanner("readerKembali", function (id) {
    document.getElementById("inputCariPengembalian").value = id;
    hentikanScanner();
    tampilkanPinjamanSiswa(id);
  });
}

function cariPengembalianManual() {
  const id = document.getElementById("inputCariPengembalian").value.trim();
  if (!id) return alert("Masukkan ID Siswa.");
  tampilkanPinjamanSiswa(id);
}

function tampilkanPinjamanSiswa(idSiswa) {
  const area = document.getElementById("dataPengembalian");
  area.innerHTML = '<div class="success-box">⏳ Mencari buku yang dipinjam...</div>';

  requestJSONP({ action: "lihat_pinjaman", idSiswa: idSiswa }, function (data) {
    const daftar = normalisasiDaftar(data);

    if (data && data.success === false) {
      area.innerHTML = '<div class="error-box">❌ ' + esc(data.message || "Gagal mengambil data") + '</div>';
      return;
    }

    if (!daftar.length) {
      area.innerHTML = '<div class="error-box">📚 Siswa tidak sedang meminjam buku.</div>';
      return;
    }

    area.innerHTML = daftar.map(function (item) {
      return kartuPinjaman(item, true);
    }).join("");
  });
}

function prosesKembalikan(idTransaksi) {
  if (!confirm("Yakin buku akan dikembalikan?")) return;

  const area = document.getElementById("dataPengembalian");
  area.innerHTML = '<div class="success-box">⏳ Memproses pengembalian...</div>';

  requestJSONP({
    action: "kembalikan_buku",
    idTransaksi: idTransaksi
  }, function (data) {
    if (!data || !data.success) {
      area.innerHTML = '<div class="error-box">❌ ' + esc(data && data.message ? data.message : "Gagal mengembalikan buku") + '</div>';
      return;
    }

    area.innerHTML =
      '<div class="success-box">✓ ' + esc(data.message) +
      '<br>Terlambat: ' + Number(data.terlambat_hari || 0) + ' hari</div>';

    loadStatistik();
  });
}

/* ==========================================================
   BUKU DIPINJAM
   ========================================================== */
function mulaiScanPinjaman() {
  mulaiScanner("readerPinjaman", function (id) {
    document.getElementById("inputCariSiswa").value = id;
    hentikanScanner();
    tampilkanHasilPinjaman(id);
  });
}

function cariPinjamanManual() {
  const id = document.getElementById("inputCariSiswa").value.trim();
  if (!id) return alert("Masukkan ID Siswa.");
  tampilkanHasilPinjaman(id);
}

function tampilkanHasilPinjaman(idSiswa) {
  const area = document.getElementById("hasilPinjaman");
  area.innerHTML = '<div class="success-box">⏳ Memuat data...</div>';

  requestJSONP({ action: "lihat_pinjaman", idSiswa: idSiswa }, function (data) {
    const daftar = normalisasiDaftar(data);

    if (data && data.success === false) {
      area.innerHTML = '<div class="error-box">❌ ' + esc(data.message || "Gagal mengambil data") + '</div>';
      return;
    }

    if (!daftar.length) {
      area.innerHTML = '<div class="error-box">📚 Tidak ada buku yang sedang dipinjam.</div>';
      return;
    }

    area.innerHTML = daftar.map(function (item) {
      return kartuPinjaman(item, false);
    }).join("");
  });
}

function kartuPinjaman(item, adaTombolKembali) {
  let html =
    '<div class="success-box">' +
    '<b>📖 ' + esc(item.judul_buku) + '</b><br><br>' +
    'ID Buku: ' + esc(item.id_buku) + '<br>' +
    'Pinjam: ' + esc(item.tanggal_pinjam) + '<br>' +
    'Batas: ' + esc(item.batas_kembali) + '<br>' +
    'Status: ' + esc(item.status || "DIPINJAM");

  if (adaTombolKembali) {
    html += '<br><br><button class="btn-proses" onclick="prosesKembalikan(\'' + escJS(item.id_transaksi) + '\')">↩️ KEMBALIKAN BUKU</button>';
  }

  html += '</div>';
  return html;
}

/* ==========================================================
   KETERLAMBATAN
   ========================================================== */
function loadKeterlambatan() {
  const area = document.getElementById("dataKeterlambatan");
  area.innerHTML = '<div class="success-box">⏳ Memuat data keterlambatan...</div>';

  requestJSONP({ action: "keterlambatan" }, function (data) {
    const daftar = normalisasiDaftar(data);

    if (data && data.success === false) {
      area.innerHTML = '<div class="error-box">❌ ' + esc(data.message || "Gagal mengambil data") + '</div>';
      return;
    }

    if (!daftar.length) {
      area.innerHTML = '<div class="success-box">🎉 Tidak ada keterlambatan.</div>';
      return;
    }

    area.innerHTML = daftar.map(function (item) {
      return '<div class="error-box">' +
        '<b>⚠️ ' + esc(item.nama_siswa) + '</b><br>' +
        'Kelas: ' + esc(item.kelas) + '<br>' +
        'Buku: ' + esc(item.judul_buku) + '<br>' +
        'Batas kembali: ' + esc(item.batas_kembali) + '<br>' +
        '<b>Terlambat: ' + Number(item.terlambat_hari || 0) + ' hari</b>' +
        '</div>';
    }).join("");
  });
}

/* ==========================================================
   STATISTIK
   ========================================================== */
function loadStatistik() {
  const loading = document.getElementById("statistikLoading");
  const error = document.getElementById("statistikError");
  const errorText = document.getElementById("statistikErrorText");
  const box = document.getElementById("statistikData");

  loading.style.display = "block";
  error.style.display = "none";
  box.style.display = "none";

  requestJSONP({ action: "statistik" }, function (data) {
    if (!data || data.success !== true) {
      loading.style.display = "none";
      error.style.display = "block";
      errorText.textContent = data && data.message ? data.message : "Google Apps Script tidak dapat diakses.";
      return;
    }

    document.getElementById("statDipinjam").textContent = Number(data.dipinjam || 0);
    document.getElementById("statDikembalikan").textContent = Number(data.dikembalikan || 0);
    document.getElementById("statTerlambat").textContent = Number(data.terlambat || 0);

    loading.style.display = "none";
    error.style.display = "none";
    box.style.display = "grid";
  });
}

/* ==========================================================
   UTILITAS
   ========================================================== */
function normalisasiDaftar(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escJS(value) {
  return String(value == null ? "" : value)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}

/* ==========================================================
   AWAL HALAMAN
   ========================================================== */
document.addEventListener("DOMContentLoaded", function () {
  loadStatistik();
});
