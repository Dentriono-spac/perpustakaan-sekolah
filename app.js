/*************************************************
 * KONFIGURASI API
 *************************************************/

const API_URL =
  "https://script.google.com/macros/s/AKfycbyk367Q4T6gyUN2Xptxi9PPYaOfNXjvTSaWqHRxH2uqNNgEynfRgpBAeHg8HFnyr8UOHw/exec";


/*************************************************
 * DATA SEMENTARA
 *************************************************/

let siswaAktif = null;
let bukuAktif = null;
let scannerAktif = null;


/*************************************************
 * JSONP HELPER
 *************************************************/

function panggilJSONP(action, parameter, callbackSelesai) {

  const callbackName =
    "__apiCallback_" +
    Date.now() +
    "_" +
    Math.floor(Math.random() * 100000);

  const script =
    document.createElement("script");

  let selesai = false;

  let query =
    "?action=" +
    encodeURIComponent(action) +
    "&callback=" +
    encodeURIComponent(callbackName);

  if (parameter) {

    Object.keys(parameter).forEach(function(key) {

      query +=
        "&" +
        encodeURIComponent(key) +
        "=" +
        encodeURIComponent(
          parameter[key] == null
            ? ""
            : parameter[key]
        );

    });

  }

  function bersihkan() {

    try {
      delete window[callbackName];
    } catch (e) {
      window[callbackName] = undefined;
    }

    if (script.parentNode) {
      script.parentNode.removeChild(script);
    }

  }

  window[callbackName] =
    function(data) {

      if (selesai) {
        return;
      }

      selesai = true;

      bersihkan();

      callbackSelesai(null, data);

    };


  script.onerror =
    function() {

      if (selesai) {
        return;
      }

      selesai = true;

      bersihkan();

      callbackSelesai(
        new Error(
          "Google Apps Script tidak dapat diakses."
        ),
        null
      );

    };


  script.src =
    API_URL + query;

  script.async = true;

  document.body.appendChild(script);


  /*
   * Timeout 15 detik.
   * Kalau server tidak membalas,
   * tampilkan error dengan jelas.
   */

  setTimeout(function() {

    if (selesai) {
      return;
    }

    selesai = true;

    bersihkan();

    callbackSelesai(
      new Error(
        "Server tidak merespons dalam 15 detik."
      ),
      null
    );

  }, 15000);

}


/*************************************************
 * PINDAH MENU
 *************************************************/

function bukaMenu(namaMenu) {

  const menuUtama =
    document.getElementById("menuUtama");

  if (menuUtama) {
    menuUtama.classList.add("hidden");
  }


  const statistik =
    document.getElementById("statistik");

  if (statistik) {
    statistik.classList.add("hidden");
  }


  const halaman =
    document.querySelectorAll(".halaman");

  halaman.forEach(function(item) {
    item.classList.add("hidden");
  });


  const halamanAktif =
    document.getElementById(namaMenu);

  if (halamanAktif) {
    halamanAktif.classList.remove("hidden");
  }


  if (namaMenu === "terlambat") {
    loadKeterlambatan();
  }

}


/*************************************************
 * KEMBALI KE MENU UTAMA
 *************************************************/

function kembaliMenu() {

  stopScanner();


  const halaman =
    document.querySelectorAll(".halaman");

  halaman.forEach(function(item) {
    item.classList.add("hidden");
  });


  const menuUtama =
    document.getElementById("menuUtama");

  if (menuUtama) {
    menuUtama.classList.remove("hidden");
  }


  const statistik =
    document.getElementById("statistik");

  if (statistik) {
    statistik.classList.remove("hidden");
  }


  loadStatistik();

}


/*************************************************
 * STOP SCANNER
 *************************************************/

function stopScanner() {

  if (!scannerAktif) {
    return;
  }

  const scanner =
    scannerAktif;

  scannerAktif = null;


  try {

    scanner.stop()
      .then(function() {

        console.log("Scanner dihentikan.");

      })
      .catch(function(error) {

        console.log(
          "Scanner sudah berhenti:",
          error
        );

      });

  }

  catch(error) {

    console.log(
      "Gagal menghentikan scanner:",
      error
    );

  }

}


/*************************************************
 * SCAN SISWA
 *************************************************/

function mulaiScanSiswa() {

  stopScanner();


  const reader =
    document.getElementById("readerSiswa");


  if (!reader) {

    alert(
      "Area scanner siswa tidak ditemukan."
    );

    return;

  }


  reader.innerHTML = "";


  if (typeof Html5Qrcode === "undefined") {

    alert(
      "Library scanner belum dimuat."
    );

    return;

  }


  const scanner =
    new Html5Qrcode("readerSiswa");

  scannerAktif = scanner;


  scanner.start(

    {
      facingMode: "environment"
    },

    {
      fps: 10,

      qrbox: {
        width: 250,
        height: 250
      }
    },


    function(decodedText) {

      const idSiswa =
        String(decodedText || "").trim();


      console.log(
        "QR SISWA TERBACA:",
        idSiswa
      );


      if (!idSiswa) {
        return;
      }


      stopScanner();


      cariSiswaAPI(idSiswa);

    },


    function(errorMessage) {

      // Abaikan error scan sementara

    }

  )

  .catch(function(error) {

    console.error(
      "ERROR KAMERA SISWA:",
      error
    );


    scannerAktif = null;


    alert(
      "Kamera siswa tidak dapat dibuka.\n\n" +
      error
    );

  });

}


/*************************************************
 * CARI SISWA
 * JSONP
 *************************************************/

function cariSiswaAPI(idSiswa) {

  const area =
    document.getElementById("dataSiswa");


  if (!area) {
    return;
  }


  idSiswa =
    String(idSiswa || "").trim();


  if (!idSiswa) {

    area.innerHTML = `
      <div class="error">
        ID siswa kosong.
      </div>
    `;

    return;

  }


  area.innerHTML =
    "🔍 Mencari data siswa...";


  siswaAktif = null;


  panggilJSONP(

    "cari_siswa",

    {
      idSiswa: idSiswa
    },

    function(error, data) {

      console.log(
        "HASIL CARI SISWA:",
        error,
        data
      );


      if (error) {

        area.innerHTML = `
          <div class="error">

            ❌ Gagal terhubung ke server.

            <br><br>

            <small>
              ${error.message}
            </small>

          </div>
        `;

        return;

      }


      if (!data) {

        area.innerHTML = `
          <div class="error">
            ❌ Data siswa kosong.
          </div>
        `;

        return;

      }


      if (data.found === true) {

        siswaAktif = data;


        area.innerHTML = `

          <div class="hasil-card">

            <b>✓ DATA SISWA</b>

            <br><br>

            <b>Nama:</b>
            ${data.nama_siswa || "-"}

            <br>

            <b>Kelas:</b>
            ${data.kelas || "-"}

            <br>

            <b>ID:</b>
            ${data.id_siswa || idSiswa}

          </div>

        `;

      }

      else {

        siswaAktif = null;


        area.innerHTML = `

          <div class="error">

            ❌ ${
              data.message ||
              "Data siswa tidak ditemukan"
            }

          </div>

        `;

      }

    }

  );

}


/*************************************************
 * SCAN BUKU
 *************************************************/

function mulaiScanBuku() {

  stopScanner();


  const reader =
    document.getElementById("readerBuku");


  if (!reader) {

    alert(
      "Area scanner buku tidak ditemukan."
    );

    return;

  }


  reader.innerHTML = "";


  if (typeof Html5Qrcode === "undefined") {

    alert(
      "Library scanner belum dimuat."
    );

    return;

  }


  const scanner =
    new Html5Qrcode("readerBuku");

  scannerAktif = scanner;


  scanner.start(

    {
      facingMode: "environment"
    },

    {
      fps: 10,

      qrbox: {
        width: 250,
        height: 250
      }
    },


    function(decodedText) {

      const idBuku =
        String(decodedText || "").trim();


      console.log(
        "QR BUKU TERBACA:",
        idBuku
      );


      if (!idBuku) {
        return;
      }


      stopScanner();


      cariBukuAPI(idBuku);

    },


    function(errorMessage) {

      // Abaikan error scan sementara

    }

  )

  .catch(function(error) {

    console.error(
      "ERROR KAMERA BUKU:",
      error
    );


    scannerAktif = null;


    alert(
      "Kamera buku tidak dapat dibuka.\n\n" +
      error
    );

  });

}


/*************************************************
 * CARI BUKU
 * JSONP
 *************************************************/

function cariBukuAPI(idBuku) {

  const area =
    document.getElementById("dataBuku");


  if (!area) {
    return;
  }


  idBuku =
    String(idBuku || "").trim();


  if (!idBuku) {

    area.innerHTML = `
      <div class="error">
        ID buku kosong.
      </div>
    `;

    return;

  }


  area.innerHTML =
    "🔍 Mencari data buku...";


  bukuAktif = null;


  panggilJSONP(

    "cari_buku",

    {
      idBuku: idBuku
    },

    function(error, data) {

      console.log(
        "HASIL CARI BUKU:",
        error,
        data
      );


      if (error) {

        area.innerHTML = `
          <div class="error">

            ❌ Gagal terhubung ke server.

            <br><br>

            <small>
              ${error.message}
            </small>

          </div>
        `;

        return;

      }


      if (!data) {

        area.innerHTML = `
          <div class="error">
            ❌ Data buku kosong.
          </div>
        `;

        return;

      }


      if (data.found === true) {

        bukuAktif = data;


        area.innerHTML = `

          <div class="hasil-card">

            <b>✓ DATA BUKU</b>

            <br><br>

            <b>Judul:</b>
            ${data.judul_buku || "-"}

            <br>

            <b>Penulis:</b>
            ${data.penulis || "-"}

            <br>

            <b>Penerbit:</b>
            ${data.penerbit || "-"}

            <br>

            <b>Kategori:</b>
            ${data.kategori || "-"}

            <br>

            <b>Tahun:</b>
            ${data.tahun || "-"}

            <br>

            <b>Stok:</b>
            ${data.stok ?? "-"}

          </div>

        `;

      }

      else {

        bukuAktif = null;


        area.innerHTML = `

          <div class="error">

            ❌ ${
              data.message ||
              "Data buku tidak ditemukan"
            }

          </div>

        `;

      }

    }

  );

}


/*************************************************
 * PROSES PINJAM
 *************************************************/

async function prosesPinjam() {

  const hasil =
    document.getElementById("hasilPinjam");


  if (!hasil) {
    return;
  }


  if (!siswaAktif) {

    alert(
      "Silakan scan siswa terlebih dahulu"
    );

    return;

  }


  if (!bukuAktif) {

    alert(
      "Silakan scan buku terlebih dahulu"
    );

    return;

  }


  hasil.innerHTML =
    "Memproses peminjaman...";


  try {

    const response =
      await fetch(

        API_URL,

        {
          method: "POST",

          body:
            JSON.stringify({

              action: "pinjam_buku",

              idSiswa:
                siswaAktif.id_siswa,

              idBuku:
                bukuAktif.id_buku

            })

        }

      );


    const data =
      await response.json();


    if (data.success) {

      hasil.innerHTML = `

        <div class="hasil-card success">

          ✓ ${data.message || "Peminjaman berhasil"}

          <br><br>

          Siswa:
          ${data.nama_siswa || siswaAktif.nama_siswa}

          <br>

          Buku:
          ${data.judul_buku || bukuAktif.judul_buku}

          <br>

          Batas kembali:
          ${data.batas_kembali || "-"}

        </div>

      `;


      siswaAktif = null;
      bukuAktif = null;


      loadStatistik();

    }

    else {

      hasil.innerHTML = `

        <div class="error">

          ❌ ${
            data.message ||
            "Peminjaman gagal"
          }

        </div>

      `;

    }

  }

  catch(error) {

    console.error(
      "ERROR PINJAM:",
      error
    );


    hasil.innerHTML = `

      <div class="error">

        ❌ Gagal memproses peminjaman

        <br><br>

        <small>
          ${error.message}
        </small>

      </div>

    `;

  }

}


/*************************************************
 * SCAN SISWA UNTUK PENGEMBALIAN
 *************************************************/

function mulaiScanPengembalian() {

  stopScanner();


  const reader =
    document.getElementById("readerKembali");


  if (!reader) {

    alert(
      "Area scanner pengembalian tidak ditemukan."
    );

    return;

  }


  reader.innerHTML = "";


  if (typeof Html5Qrcode === "undefined") {

    alert(
      "Library scanner belum dimuat."
    );

    return;

  }


  const scanner =
    new Html5Qrcode("readerKembali");

  scannerAktif = scanner;


  scanner.start(

    {
      facingMode: "environment"
    },

    {
      fps: 10,

      qrbox: {
        width: 250,
        height: 250
      }
    },


    function(decodedText) {

      const idSiswa =
        String(decodedText || "").trim();


      if (!idSiswa) {
        return;
      }


      stopScanner();


      tampilkanPinjamanSiswa(idSiswa);

    },


    function(errorMessage) {}

  )

  .catch(function(error) {

    console.error(
      "ERROR SCANNER PENGEMBALIAN:",
      error
    );


    scannerAktif = null;


    alert(
      "Kamera tidak dapat dibuka.\n\n" +
      error
    );

  });

}


/*************************************************
 * TAMPILKAN PINJAMAN SISWA
 *************************************************/

function tampilkanPinjamanSiswa(idSiswa) {

  const area =
    document.getElementById(
      "dataPengembalian"
    );


  if (!area) {
    return;
  }


  idSiswa =
    String(idSiswa || "").trim();


  area.innerHTML =
    "🔍 Mencari buku yang dipinjam...";


  panggilJSONP(

    "lihat_pinjaman",

    {
      idSiswa: idSiswa
    },

    function(error, data) {

      console.log(
        "PINJAMAN SISWA:",
        error,
        data
      );


      if (error) {

        area.innerHTML = `

          <div class="error">

            ❌ Gagal mengambil data pinjaman

            <br><br>

            <small>
              ${error.message}
            </small>

          </div>

        `;

        return;

      }


      if (!data) {

        area.innerHTML = `
          <div class="warning">
            Tidak ada data pinjaman.
          </div>
        `;

        return;

      }


      if (!Array.isArray(data)) {

        if (data.success === false) {

          area.innerHTML = `
            <div class="error">
              ❌ ${data.message || "Gagal mengambil pinjaman"}
            </div>
          `;

          return;

        }

        data = [];

      }


      if (data.length === 0) {

        area.innerHTML = `

          <div class="warning">

            Tidak ada buku yang sedang dipinjam.

          </div>

        `;

        return;

      }


      let html = "";


      data.forEach(function(item) {

        html += `

          <div class="hasil-card">

            <b>${item.judul_buku || "-"}</b>

            <br>

            ID Buku:
            ${item.id_buku || "-"}

            <br>

            Pinjam:
            ${item.tanggal_pinjam || "-"}

            <br>

            Batas:
            ${item.batas_kembali || "-"}

            <br><br>

            <button
              onclick="prosesKembalikan('${item.id_transaksi}')">

              KEMBALIKAN BUKU

            </button>

          </div>

        `;

      });


      area.innerHTML = html;

    }

  );

}


/*************************************************
 * PROSES KEMBALIKAN
 *************************************************/

async function prosesKembalikan(idTransaksi) {

  const konfirmasi =
    confirm(
      "Yakin buku akan dikembalikan?"
    );


  if (!konfirmasi) {
    return;
  }


  try {

    const response =
      await fetch(

        API_URL,

        {
          method: "POST",

          body:
            JSON.stringify({

              action:
                "kembalikan_buku",

              idTransaksi:
                idTransaksi

            })

        }

      );


    const data =
      await response.json();


    if (data.success) {

      alert(

        (data.message || "Buku berhasil dikembalikan") +

        "\nTerlambat: " +

        (data.terlambat_hari || 0) +

        " hari"

      );


      const area =
        document.getElementById(
          "dataPengembalian"
        );


      if (area) {

        area.innerHTML =
          "✓ Buku berhasil dikembalikan.";

      }


      loadStatistik();

    }

    else {

      alert(
        data.message ||
        "Gagal mengembalikan buku"
      );

    }

  }

  catch(error) {

    console.error(
      "ERROR KEMBALIKAN:",
      error
    );


    alert(
      "Gagal mengembalikan buku.\n\n" +
      error.message
    );

  }

}


/*************************************************
 * SCAN QR BUKU YANG DIPINJAM
 *************************************************/

function mulaiScanPinjaman() {

  stopScanner();


  const reader =
    document.getElementById(
      "readerPinjaman"
    );


  if (!reader) {

    alert(
      "Area scanner tidak ditemukan."
    );

    return;

  }


  reader.innerHTML = "";


  if (typeof Html5Qrcode === "undefined") {

    alert(
      "Library scanner belum dimuat."
    );

    return;

  }


  const scanner =
    new Html5Qrcode(
      "readerPinjaman"
    );

  scannerAktif = scanner;


  scanner.start(

    {
      facingMode: "environment"
    },

    {
      fps: 10,

      qrbox: {
        width: 250,
        height: 250
      }
    },


    function(decodedText) {

      const idSiswa =
        String(decodedText || "").trim();


      if (!idSiswa) {
        return;
      }


      stopScanner();


      const input =
        document.getElementById(
          "inputCariSiswa"
        );


      if (input) {
        input.value = idSiswa;
      }


      tampilkanHasilPinjaman(idSiswa);

    },


    function(errorMessage) {

      // Abaikan QR belum ditemukan

    }

  )

  .catch(function(error) {

    console.error(
      "SCANNER PINJAMAN:",
      error
    );


    scannerAktif = null;


    alert(
      "Kamera tidak dapat dibuka.\n\n" +
      error
    );

  });

}


/*************************************************
 * CARI PINJAMAN MANUAL
 *************************************************/

function cariPinjamanManual() {

  const input =
    document.getElementById(
      "inputCariSiswa"
    );


  if (!input) {

    alert(
      "Kolom ID siswa tidak ditemukan."
    );

    return;

  }


  const id =
    input.value.trim();


  if (!id) {

    alert(
      "Masukkan ID siswa"
    );

    return;

  }


  tampilkanHasilPinjaman(id);

}


/*************************************************
 * TAMPILKAN HASIL PINJAMAN
 *************************************************/

function tampilkanHasilPinjaman(idSiswa) {

  const area =
    document.getElementById(
      "hasilPinjaman"
    );


  if (!area) {
    return;
  }


  idSiswa =
    String(idSiswa || "").trim();


  area.innerHTML =
    "🔍 Memuat data...";


  panggilJSONP(

    "lihat_pinjaman",

    {
      idSiswa: idSiswa
    },

    function(error, data) {

      console.log(
        "HASIL PINJAMAN:",
        error,
        data
      );


      if (error) {

        area.innerHTML = `

          <div class="error">

            ❌ Gagal mengambil data pinjaman

            <br><br>

            <small>
              ${error.message}
            </small>

          </div>

        `;

        return;

      }


      if (!Array.isArray(data)) {

        if (data && data.success === false) {

          area.innerHTML = `
            <div class="error">
              ❌ ${data.message || "Gagal mengambil data"}
            </div>
          `;

          return;

        }

        data = [];

      }


      if (data.length === 0) {

        area.innerHTML = `

          <div class="warning">

            Tidak ada buku yang sedang dipinjam.

          </div>

        `;

        return;

      }


      let html = "";


      data.forEach(function(item) {

        html += `

          <div class="hasil-card">

            <b>📖 ${item.judul_buku || "-"}</b>

            <br><br>

            ID Buku:
            ${item.id_buku || "-"}

            <br>

            Tanggal Pinjam:
            ${item.tanggal_pinjam || "-"}

            <br>

            Batas Kembali:
            ${item.batas_kembali || "-"}

          </div>

        `;

      });


      area.innerHTML =
        html;

    }

  );

}


/*************************************************
 * LOAD KETERLAMBATAN
 *************************************************/

function loadKeterlambatan() {

  const area =
    document.getElementById(
      "hasilTerlambat"
    );


  if (!area) {
    return;
  }


  area.innerHTML =
    "🔍 Memuat data...";


  panggilJSONP(

    "keterlambatan",

    {},

    function(error, data) {

      console.log(
        "KETERLAMBATAN:",
        error,
        data
      );


      if (error) {

        area.innerHTML = `

          <div class="error">

            ❌ Gagal mengambil data keterlambatan

            <br><br>

            <small>
              ${error.message}
            </small>

          </div>

        `;

        return;

      }


      if (!Array.isArray(data)) {

        if (data && data.success === false) {

          area.innerHTML = `
            <div class="error">
              ❌ ${data.message || "Gagal mengambil data"}
            </div>
          `;

          return;

        }

        data = [];

      }


      if (data.length === 0) {

        area.innerHTML = `

          <div class="hasil-card">

            Tidak ada keterlambatan.

          </div>

        `;

        return;

      }


      let html = "";


      data.forEach(function(item) {

        html += `

          <div class="hasil-card">

            <b>⚠️ ${item.nama_siswa || "-"}</b>

            <br>

            Kelas:
            ${item.kelas || "-"}

            <br>

            Buku:
            ${item.judul_buku || "-"}

            <br>

            Terlambat:

            <span class="warning">

              ${item.terlambat_hari || 0} hari

            </span>

          </div>

        `;

      });


      area.innerHTML =
        html;

    }

  );

}


/*************************************************
 * STATISTIK PERPUSTAKAAN
 *************************************************/

function loadStatistik() {

  const area =
    document.getElementById(
      "statistik"
    );


  if (!area) {
    return;
  }


  area.innerHTML = `

    <div class="statistik-title">

      📊 STATUS PERPUSTAKAAN

    </div>

    <div style="
      padding:15px;
      text-align:center;
    ">

      Memuat statistik...

    </div>

  `;


  panggilJSONP(

    "statistik",

    {},

    function(error, data) {

      console.log(
        "DATA STATISTIK:",
        error,
        data
      );


      if (error) {

        area.innerHTML = `

          <div class="statistik-title">

            📊 STATUS PERPUSTAKAAN

          </div>

          <div style="
            padding:15px;
            color:#dc2626;
            text-align:center;
          ">

            ❌ Gagal memuat statistik

            <br>

            <small>
              ${error.message}
            </small>

          </div>

        `;

        return;

      }


      if (!data) {

        area.innerHTML = `

          <div class="statistik-title">

            📊 STATUS PERPUSTAKAAN

          </div>

          <div style="
            padding:15px;
            color:#dc2626;
            text-align:center;
          ">

            ❌ Data statistik kosong

          </div>

        `;

        return;

      }


      if (data.success === false) {

        area.innerHTML = `

          <div class="statistik-title">

            📊 STATUS PERPUSTAKAAN

          </div>

          <div style="
            padding:15px;
            color:#dc2626;
            text-align:center;
          ">

            ❌ Gagal memuat statistik

            <br>

            <small>
              ${
                data.message ||
                "API statistik gagal"
              }
            </small>

          </div>

        `;

        return;

      }


      const dipinjam =
        Number(data.dipinjam) || 0;


      const dikembalikan =
        Number(data.dikembalikan) || 0;


      const terlambat =
        Number(data.terlambat) || 0;


      area.innerHTML = `

        <div class="statistik-title">

          📊 STATUS PERPUSTAKAAN

        </div>


        <div class="statistik-grid">


          <div class="statistik-card">

            <div class="statistik-icon">
              📕
            </div>

            <div class="statistik-info">

              <div class="statistik-label">
                Sedang Dipinjam
              </div>

              <div class="statistik-number">
                ${dipinjam}
              </div>

            </div>

          </div>


          <div class="statistik-card">

            <div class="statistik-icon">
              ✅
            </div>

            <div class="statistik-info">

              <div class="statistik-label">
                Dikembalikan
              </div>

              <div class="statistik-number">
                ${dikembalikan}
              </div>

            </div>

          </div>


          <div class="statistik-card">

            <div class="statistik-icon">
              ⚠️
            </div>

            <div class="statistik-info">

              <div class="statistik-label">
                Terlambat
              </div>

              <div class="statistik-number">
                ${terlambat}
              </div>

            </div>

          </div>


        </div>

      `;

    }

  );

}


/*************************************************
 * SAAT HALAMAN DIBUKA
 *************************************************/

document.addEventListener(
  "DOMContentLoaded",
  function() {

    loadStatistik();

  }
);
