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

  document
    .getElementById("menuUtama")
    .classList
    .add("hidden");


  const halaman = document.querySelectorAll(".halaman");


  halaman.forEach(function(item) {

    item.classList.add("hidden");

  });


  document
    .getElementById(namaMenu)
    .classList
    .remove("hidden");


  if (namaMenu === "terlambat") {

    loadKeterlambatan();

  }

}


/*************************************************
 * KEMBALI KE MENU
 *************************************************/

function kembaliMenu() {

  stopScanner();


  const halaman =
    document.querySelectorAll(".halaman");


  halaman.forEach(function(item) {

    item.classList.add("hidden");

  });


  document
    .getElementById("menuUtama")
    .classList
    .remove("hidden");

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
 * CARI SISWA API
 *************************************************/

async function cariSiswaAPI(idSiswa) {

  const area =
    document.getElementById("dataSiswa");


  area.innerHTML =
    "Mencari data siswa...";


  try {

    const url =
      API_URL +
      "?action=cari_siswa&idSiswa=" +
      encodeURIComponent(idSiswa);


    const response =
      await fetch(url);


    const data =
      await response.json();


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

          ${data.message}

        </div>

      `;

    }

  }

  catch(error) {

    console.error(error);

    area.innerHTML = `

      <div class="error">

        Gagal terhubung ke server

      </div>

    `;

  }

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
 * CARI BUKU API
 *************************************************/

async function cariBukuAPI(idBuku) {

  const area =
    document.getElementById("dataBuku");


  area.innerHTML =
    "Mencari data buku...";


  try {

    const url =
      API_URL +
      "?action=cari_buku&idBuku=" +
      encodeURIComponent(idBuku);


    const response =
      await fetch(url);


    const data =
      await response.json();


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

          ${data.message}

        </div>

      `;

    }

  }

  catch(error) {

    console.error(error);

    area.innerHTML = `

      <div class="error">

        Gagal terhubung ke server

      </div>

    `;

  }

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
 * CARI PINJAMAN MANUAL
 *************************************************/

function cariPinjamanManual() {

  const id =

    document
      .getElementById(
        "inputCariSiswa"
      )
      .value
      .trim();


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


  area.innerHTML =
    "Memuat data...";


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

      area.innerHTML =
        "Tidak ada buku dipinjam.";

      return;

    }


    let html = "";


    data.forEach(function(item) {

      html += `

        <div class="hasil-card">

          <b>${item.judul_buku}</b>

          <br>

          Pinjam:
          ${item.tanggal_pinjam}

          <br>

          Batas:
          ${item.batas_kembali}

        </div>

      `;

    });


    area.innerHTML = html;

  }

  catch(error) {

    console.error(error);

    area.innerHTML =
      "Gagal mengambil data.";

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


  area.innerHTML =
    "Memuat data...";


  try {

    const response =
      await fetch(

        API_URL +
        "?action=keterlambatan"

      );


    const data =
      await response.json();


    if (!data || data.length === 0) {

      area.innerHTML =
        "Tidak ada keterlambatan.";

      return;

    }


    let html = "";


    data.forEach(function(item) {

      html += `

        <div class="hasil-card">

          <b>${item.nama_siswa}</b>

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


    area.innerHTML = html;

  }

  catch(error) {

    console.error(error);

    area.innerHTML =
      "Gagal mengambil data.";

  }

}

/*************************************************
 * STATISTIK PERPUSTAKAAN
 *************************************************/

async function loadStatistik() {

  const area = document.getElementById("statistik");

  if (!area) {
    console.warn("Elemen #statistik tidak ditemukan.");
    return;
  }

  area.innerHTML = `
    <div class="statistik-title">
      📊 STATUS PERPUSTAKAAN
    </div>
    <div class="statistik-loading">
      Memuat statistik...
    </div>
  `;

  try {

    const response = await fetch(
      API_URL + "?action=statistik"
    );

    const data = await response.json();

    if (!data || data.success === false) {
      throw new Error(
        data && data.message
          ? data.message
          : "Statistik tidak dapat dimuat"
      );
    }

    area.innerHTML = `

      <div class="statistik-title">
        📊 STATUS PERPUSTAKAAN
      </div>

      <div class="statistik-grid">

        <div class="statistik-card">
          <div class="statistik-icon">📕</div>

          <div class="statistik-info">
            <div class="statistik-label">
              Sedang Dipinjam
            </div>

            <div class="statistik-number">
              ${Number(data.dipinjam) || 0}
            </div>
          </div>
        </div>


        <div class="statistik-card">
          <div class="statistik-icon">✅</div>

          <div class="statistik-info">
            <div class="statistik-label">
              Dikembalikan
            </div>

            <div class="statistik-number">
              ${Number(data.dikembalikan) || 0}
            </div>
          </div>
        </div>


        <div class="statistik-card">
          <div class="statistik-icon">⚠️</div>

          <div class="statistik-info">
            <div class="statistik-label">
              Terlambat
            </div>

            <div class="statistik-number">
              ${Number(data.terlambat) || 0}
            </div>
          </div>
        </div>

      </div>
    `;

  } catch (error) {

    console.error(
      "Gagal memuat statistik:",
      error
    );

    area.innerHTML = `
      <div class="statistik-title">
        📊 STATUS PERPUSTAKAAN
      </div>

      <div class="error">
        Statistik belum dapat dimuat
      </div>
    `;
  }
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
