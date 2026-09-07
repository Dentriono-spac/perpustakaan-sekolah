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
 * PINDAH MENU
 *************************************************/

function bukaMenu(namaMenu) {

  // Sembunyikan menu utama
  const menuUtama =
    document.getElementById("menuUtama");

  if (menuUtama) {
    menuUtama.classList.add("hidden");
  }


  // Sembunyikan STATUS PERPUSTAKAAN
  const statistik =
    document.getElementById("statistik");

  if (statistik) {
    statistik.classList.add("hidden");
  }


  // Sembunyikan semua halaman
  const halaman =
    document.querySelectorAll(".halaman");

  halaman.forEach(function(item) {
    item.classList.add("hidden");
  });


  // Tampilkan halaman yang dipilih
  const halamanAktif =
    document.getElementById(namaMenu);

  if (halamanAktif) {
    halamanAktif.classList.remove("hidden");
  }


  // Jika membuka keterlambatan,
  // langsung ambil datanya
  if (namaMenu === "terlambat") {
    loadKeterlambatan();
  }

}

/*************************************************
 * KEMBALI KE MENU UTAMA
 *************************************************/

function kembaliMenu() {

  // Matikan scanner jika sedang aktif
  stopScanner();


  // Sembunyikan semua halaman
  const halaman =
    document.querySelectorAll(".halaman");

  halaman.forEach(function(item) {
    item.classList.add("hidden");
  });


  // Tampilkan menu utama
  const menuUtama =
    document.getElementById("menuUtama");

  if (menuUtama) {
    menuUtama.classList.remove("hidden");
  }


  // Tampilkan kembali STATUS PERPUSTAKAAN
  const statistik =
    document.getElementById("statistik");

  if (statistik) {
    statistik.classList.remove("hidden");
  }


  // Perbarui statistik
  loadStatistik();

}


/*************************************************
 * STOP SCANNER
 *************************************************/

function stopScanner() {

  if (scannerAktif) {

    scannerAktif
      .stop()
      .then(function() {

        scannerAktif = null;

      })
      .catch(function(error) {

        console.log(error);

        scannerAktif = null;

      });

  }

}


/*************************************************
 * SCAN SISWA
 *************************************************/

function mulaiScanSiswa() {

  stopScanner();


  scannerAktif =
    new Html5Qrcode(
      "readerSiswa"
    );


  scannerAktif.start(

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

      stopScanner();

      cariSiswaAPI(decodedText);

    },


    function(errorMessage) {

      // QR belum ditemukan

    }

  )

  .catch(function(error) {

    alert(
      "Kamera tidak dapat dibuka: " +
      error
    );

  });

}


/*************************************************
 * CARI SISWA - JSONP
 *************************************************/

function cariSiswaAPI(idSiswa) {

  const area =
    document.getElementById("dataSiswa");


  area.innerHTML =
    "Mencari data siswa...";


  const callbackName =
    "__cariSiswa_" + Date.now();


  const script =
    document.createElement("script");


  script.src =
    API_URL +
    "?action=cari_siswa" +
    "&idSiswa=" +
    encodeURIComponent(idSiswa) +
    "&callback=" +
    encodeURIComponent(callbackName);


  window[callbackName] =
    function(data) {

      // Hapus callback
      try {
        delete window[callbackName];
      } catch (e) {
        window[callbackName] = undefined;
      }


      // Hapus script
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }


      console.log(
        "Hasil scan siswa:",
        data
      );


      if (!data) {

        siswaAktif = null;

        area.innerHTML = `
          <div class="error">
            Data siswa tidak ditemukan.
          </div>
        `;

        return;

      }


      if (data.found) {

        siswaAktif = data;


        area.innerHTML = `

          <div class="hasil-card">

            <b>✓ DATA SISWA</b>

            <br><br>

            Nama:
            ${data.nama_siswa}

            <br>

            Kelas:
            ${data.kelas}

            <br>

            ID:
            ${data.id_siswa}

          </div>

        `;

      }

      else {

        siswaAktif = null;


        area.innerHTML = `

          <div class="error">

            ${data.message || "Siswa tidak ditemukan"}

          </div>

        `;

      }

    };


  script.onerror =
    function() {

      try {
        delete window[callbackName];
      } catch (e) {
        window[callbackName] = undefined;
      }


      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }


      siswaAktif = null;


      area.innerHTML = `

        <div class="error">

          ❌ Gagal terhubung ke server

          <br>

          <small>
            Google Apps Script tidak dapat diakses.
          </small>

        </div>

      `;

    };


  document.body.appendChild(script);

}

/*************************************************
 * SCAN BUKU
 *************************************************/

function mulaiScanBuku() {

  stopScanner();


  scannerAktif =
    new Html5Qrcode(
      "readerBuku"
    );


  scannerAktif.start(

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

      stopScanner();

      cariBukuAPI(decodedText);

    },


    function(errorMessage) {}

  )

  .catch(function(error) {

    alert(
      "Kamera tidak dapat dibuka: " +
      error
    );

  });

}


/*************************************************
 * CARI BUKU - JSONP
 *************************************************/

function cariBukuAPI(idBuku) {

  const area =
    document.getElementById("dataBuku");


  area.innerHTML =
    "Mencari data buku...";


  const callbackName =
    "__cariBuku_" + Date.now();


  const script =
    document.createElement("script");


  script.src =
    API_URL +
    "?action=cari_buku" +
    "&idBuku=" +
    encodeURIComponent(idBuku) +
    "&callback=" +
    encodeURIComponent(callbackName);


  window[callbackName] =
    function(data) {

      try {
        delete window[callbackName];
      } catch (e) {
        window[callbackName] = undefined;
      }


      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }


      console.log(
        "Hasil scan buku:",
        data
      );


      if (!data) {

        bukuAktif = null;

        area.innerHTML = `

          <div class="error">

            Data buku tidak ditemukan.

          </div>

        `;

        return;

      }


      if (data.found) {

        bukuAktif = data;


        area.innerHTML = `

          <div class="hasil-card">

            <b>✓ DATA BUKU</b>

            <br><br>

            Judul:
            ${data.judul_buku}

            <br>

            Penulis:
            ${data.penulis}

            <br>

            Stok:
            ${data.stok}

          </div>

        `;

      }

      else {

        bukuAktif = null;


        area.innerHTML = `

          <div class="error">

            ${data.message || "Buku tidak ditemukan"}

          </div>

        `;

      }

    };


  script.onerror =
    function() {

      try {
        delete window[callbackName];
      } catch (e) {
        window[callbackName] = undefined;
      }


      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }


      bukuAktif = null;


      area.innerHTML = `

        <div class="error">

          ❌ Gagal terhubung ke server

          <br>

          <small>
            Google Apps Script tidak dapat diakses.
          </small>

        </div>

      `;

    };


  document.body.appendChild(script);

}

/*************************************************
 * PROSES PINJAM
 *************************************************/

async function prosesPinjam() {

  const hasil =
    document.getElementById("hasilPinjam");


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

          ✓ ${data.message}

          <br><br>

          Siswa:
          ${data.nama_siswa}

          <br>

          Buku:
          ${data.judul_buku}

          <br>

          Batas kembali:
          ${data.batas_kembali}

        </div>

      `;


      siswaAktif = null;

      bukuAktif = null;


      loadStatistik();

    }

    else {

      hasil.innerHTML = `

        <div class="error">

          ${data.message}

        </div>

      `;

    }

  }

  catch(error) {

    console.error(error);

    hasil.innerHTML = `

      <div class="error">

        Gagal memproses peminjaman

      </div>

    `;

  }

}


/*************************************************
 * SCAN SISWA UNTUK PENGEMBALIAN
 *************************************************/

function mulaiScanPengembalian() {

  stopScanner();


  scannerAktif =
    new Html5Qrcode(
      "readerKembali"
    );


  scannerAktif.start(

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

      stopScanner();

      tampilkanPinjamanSiswa(
        decodedText
      );

    },


    function(errorMessage) {}

  )

  .catch(function(error) {

    alert(
      "Kamera tidak dapat dibuka: " +
      error
    );

  });

}


/*************************************************
 * TAMPILKAN PINJAMAN SISWA
 *************************************************/

async function tampilkanPinjamanSiswa(idSiswa) {

  const area =
    document.getElementById(
      "dataPengembalian"
    );


  area.innerHTML =
    "Mencari buku yang dipinjam...";


  try {

    const url =

      API_URL +

      "?action=lihat_pinjaman&idSiswa=" +

      encodeURIComponent(idSiswa);


    const response =
      await fetch(url);


    const data =
      await response.json();


    if (!data || data.length === 0) {

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

          <b>${item.judul_buku}</b>

          <br>

          ID Buku:
          ${item.id_buku}

          <br>

          Pinjam:
          ${item.tanggal_pinjam}

          <br>

          Batas:
          ${item.batas_kembali}

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

  catch(error) {

    console.error(error);

    area.innerHTML = `

      <div class="error">

        Gagal mengambil data pinjaman

      </div>

    `;

  }

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

        data.message +

        "\nTerlambat: " +

        data.terlambat_hari +

        " hari"

      );


      document
        .getElementById(
          "dataPengembalian"
        )
        .innerHTML =

        "Buku berhasil dikembalikan";


      loadStatistik();

    }

    else {

      alert(data.message);

    }

  }

  catch(error) {

    console.error(error);

    alert(
      "Gagal mengembalikan buku"
    );

  }

}


/*************************************************
 * SCAN QR UNTUK BUKU YANG DIPINJAM
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


  scannerAktif =
    new Html5Qrcode(
      "readerPinjaman"
    );


  scannerAktif.start(

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

      stopScanner();


      const input =
        document.getElementById(
          "inputCariSiswa"
        );


      if (input) {

        input.value =
          decodedText;

      }


      tampilkanHasilPinjaman(
        decodedText
      );

    },


    function(errorMessage) {

      // QR belum ditemukan

    }

  )

  .catch(function(error) {

    console.error(
      "Scanner pinjaman:",
      error
    );


    alert(
      "Kamera tidak dapat dibuka. Pastikan izin kamera diberikan.\n\n" +
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


  tampilkanHasilPinjaman(
    id
  );

}


/*************************************************
 * TAMPILKAN HASIL PINJAMAN
 *************************************************/

async function tampilkanHasilPinjaman(idSiswa) {

  const area =
    document.getElementById(
      "hasilPinjaman"
    );


  if (!area) {

    return;

  }


  area.innerHTML =
    "Memuat data...";


  try {

    const url =

      API_URL +

      "?action=lihat_pinjaman&idSiswa=" +

      encodeURIComponent(idSiswa);


    const response =
      await fetch(url);


    if (!response.ok) {

      throw new Error(
        "HTTP " +
        response.status
      );

    }


    const data =
      await response.json();


    if (!data || data.length === 0) {

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

          <b>📖 ${item.judul_buku}</b>

          <br><br>

          ID Buku:
          ${item.id_buku}

          <br>

          Tanggal Pinjam:
          ${item.tanggal_pinjam}

          <br>

          Batas Kembali:
          ${item.batas_kembali}

        </div>

      `;

    });


    area.innerHTML =
      html;

  }

  catch(error) {

    console.error(
      "Error lihat pinjaman:",
      error
    );


    area.innerHTML = `

      <div class="error">

        Gagal mengambil data pinjaman

        <br>

        <small>
          ${error.message}
        </small>

      </div>

    `;

  }

}


/*************************************************
 * LOAD KETERLAMBATAN
 *************************************************/

async function loadKeterlambatan() {

  const area =
    document.getElementById(
      "hasilTerlambat"
    );


  if (!area) {

    return;

  }


  area.innerHTML =
    "Memuat data...";


  try {

    const response =
      await fetch(

        API_URL +
        "?action=keterlambatan"

      );


    if (!response.ok) {

      throw new Error(
        "HTTP " +
        response.status
      );

    }


    const data =
      await response.json();


    if (!data || data.length === 0) {

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

          <b>⚠️ ${item.nama_siswa}</b>

          <br>

          Kelas:
          ${item.kelas}

          <br>

          Buku:
          ${item.judul_buku}

          <br>

          Terlambat:

          <span class="warning">

            ${item.terlambat_hari} hari

          </span>

        </div>

      `;

    });


    area.innerHTML =
      html;

  }

  catch(error) {

    console.error(
      "Error keterlambatan:",
      error
    );


    area.innerHTML = `

      <div class="error">

        Gagal mengambil data keterlambatan

        <br>

        <small>
          ${error.message}
        </small>

      </div>

    `;

  }

}


/*************************************************
 * STATISTIK PERPUSTAKAAN
 *
 * Menggunakan JSONP supaya GitHub Pages
 * tidak terkena masalah CORS / Failed to fetch.
 *************************************************/

function loadStatistik() {

  const area =
    document.getElementById(
      "statistik"
    );


  if (!area) {

    console.error(
      "Elemen #statistik tidak ditemukan"
    );

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


  const callbackName =
    "__statistikCallback_" +
    Date.now();


  const script =
    document.createElement(
      "script"
    );


  script.src =
    API_URL +
    "?action=statistik&callback=" +
    encodeURIComponent(
      callbackName
    );


  script.async = true;


  let selesai = false;


  window[callbackName] =
    function(data) {

      selesai = true;


      console.log(
        "Data statistik:",
        data
      );


      try {

        delete window[
          callbackName
        ];

      }

      catch(error) {

        window[
          callbackName
        ] = undefined;

      }


      if (
        script.parentNode
      ) {

        script.parentNode
          .removeChild(
            script
          );

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


      if (
        data.success === false
      ) {

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
        Number(
          data.dipinjam
        ) || 0;


      const dikembalikan =
        Number(
          data.dikembalikan
        ) || 0;


      const terlambat =
        Number(
          data.terlambat
        ) || 0;


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

    };


  script.onerror =
    function() {

      if (selesai) {

        return;

      }


      console.error(
        "API statistik gagal diakses"
      );


      try {

        delete window[
          callbackName
        ];

      }

      catch(error) {

        window[
          callbackName
        ] = undefined;

      }


      if (
        script.parentNode
      ) {

        script.parentNode
          .removeChild(
            script
          );

      }


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

            API Google Apps Script
            tidak dapat diakses

          </small>

        </div>

      `;

    };


  document.body.appendChild(
    script
  );

}


/*************************************************
 * LOAD STATISTIK SAAT HALAMAN DIBUKA
 *************************************************/

document.addEventListener(
  "DOMContentLoaded",
  function() {

    loadStatistik();

  }
);
