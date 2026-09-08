/************************************************************
 * KONFIGURASI API
 ************************************************************/
const API_URL =
  "https://script.google.com/macros/s/AKfycbyk367Q4T6gyUN2Xptxi9PPYaOfNXjvTSaWqHRxH2uqNNgEynfRgpBAeHg8HFnyr8UOHw/exec";


/************************************************************
 * VARIABEL SCANNER
 ************************************************************/
let scannerAktif = null;


/************************************************************
 * =========================
 * MENU
 * =========================
 ************************************************************/

function bukaMenu(namaMenu) {

  // Matikan kamera jika masih aktif
  stopScanner();

  // Sembunyikan menu utama
  const menuUtama =
    document.getElementById("menuUtama");

  if (menuUtama) {
    menuUtama.classList.add("hidden");
  }

  // Sembunyikan semua halaman
  document.querySelectorAll(".halaman").forEach(function(el) {

    if (el.id !== "menuUtama") {
      el.classList.add("hidden");
    }

  });

  // Tampilkan halaman yang dipilih
  const halaman =
    document.getElementById(namaMenu);

  if (halaman) {
    halaman.classList.remove("hidden");
  }

  // Statistik hanya di menu utama
  sembunyikanStatistik();
}


function kembaliMenu() {

  // Matikan kamera
  stopScanner();

  // Sembunyikan semua halaman
  document.querySelectorAll(".halaman").forEach(function(el) {

    if (el.id !== "menuUtama") {
      el.classList.add("hidden");
    }

  });

  // Tampilkan menu utama
  const menuUtama =
    document.getElementById("menuUtama");

  if (menuUtama) {
    menuUtama.classList.remove("hidden");
  }

  // Tampilkan statistik
  tampilkanStatistik();

  // Ambil statistik terbaru
  loadStatistik();
}


/************************************************************
 * =========================
 * STATISTIK
 * =========================
 ************************************************************/

function sembunyikanStatistik() {

  const loading =
    document.getElementById(
      "statistikLoading"
    );

  const error =
    document.getElementById(
      "statistikError"
    );

  const data =
    document.getElementById(
      "statistikData"
    );

  if (loading) {
    loading.style.display = "none";
  }

  if (error) {
    error.style.display = "none";
  }

  if (data) {
    data.style.display = "none";
  }
}


function tampilkanStatistik() {

  const loading =
    document.getElementById(
      "statistikLoading"
    );

  if (loading) {
    loading.style.display = "block";
  }
}


function loadStatistik() {

  const loading =
    document.getElementById(
      "statistikLoading"
    );

  const error =
    document.getElementById(
      "statistikError"
    );

  const dataBox =
    document.getElementById(
      "statistikData"
    );

  // Loading
  if (loading) {
    loading.style.display = "block";
  }

  if (error) {
    error.style.display = "none";
  }

  if (dataBox) {
    dataBox.style.display = "none";
  }


  requestJSONP(
    {
      action: "statistik"
    },

    function(data) {

      if (!data || !data.success) {

        if (loading) {
          loading.style.display = "none";
        }

        if (dataBox) {
          dataBox.style.display = "none";
        }

        if (error) {
          error.style.display = "block";
        }

        return;
      }


      // Isi angka statistik
      const dipinjam =
        document.getElementById(
          "statDipinjam"
        );

      const dikembalikan =
        document.getElementById(
          "statDikembalikan"
        );

      const terlambat =
        document.getElementById(
          "statTerlambat"
        );


      if (dipinjam) {
        dipinjam.textContent =
          Number(data.dipinjam) || 0;
      }

      if (dikembalikan) {
        dikembalikan.textContent =
          Number(data.dikembalikan) || 0;
      }

      if (terlambat) {
        terlambat.textContent =
          Number(data.terlambat) || 0;
      }


      if (loading) {
        loading.style.display = "none";
      }

      if (error) {
        error.style.display = "none";
      }

      if (dataBox) {
        dataBox.style.display = "grid";
      }

    }
  );
}


/************************************************************
 * =========================
 * JSONP
 * =========================
 *
 * Dipakai untuk GET dari GitHub Pages
 * ke Google Apps Script.
 ************************************************************/

function requestJSONP(params, callback) {

  const callbackName =
    "perpusCallback_" +
    Date.now() +
    "_" +
    Math.random()
      .toString(36)
      .substring(2, 8);

  const script =
    document.createElement("script");

  let selesai = false;

  function cleanup() {

    if (script.parentNode) {
      script.parentNode.removeChild(script);
    }

    try {
      delete window[callbackName];
    } catch (e) {
      window[callbackName] = null;
    }
  }


  window[callbackName] =
    function(data) {

      if (selesai) return;

      selesai = true;

      cleanup();

      callback(data);
    };


  script.onerror =
    function() {

      if (selesai) return;

      selesai = true;

      cleanup();

      callback({
        success: false,
        message:
          "Google Apps Script tidak dapat diakses."
      });
    };


  // Jangan menunggu selamanya
  setTimeout(function() {

    if (selesai) return;

    selesai = true;

    cleanup();

    callback({
      success: false,
      message:
        "Koneksi Google Apps Script timeout."
    });

  }, 8000);


  const query =
    new URLSearchParams({
      ...params,
      callback: callbackName,
      _: Date.now()
    });


  script.src =
    API_URL +
    "?" +
    query.toString();

  document.body.appendChild(script);
}


/************************************************************
 * =========================
 * PINJAM BUKU
 * =========================
 ************************************************************/


/* ---------- CARI SISWA ---------- */

function cariSiswaPinjamManual() {

  const input =
    document.getElementById(
      "inputSiswaPinjam"
    );

  if (!input) return;

  const id =
    input.value.trim();

  if (!id) {

    alert("Masukkan ID Siswa.");

    return;
  }

  cariSiswaPinjam(id);
}


function cariSiswaPinjam(idSiswa) {

  requestJSONP(
    {
      action: "cari_siswa",
      idSiswa: idSiswa
    },

    function(data) {

      const hasil =
        document.getElementById(
          "hasilSiswaPinjam"
        );

      if (!data || !data.success) {

        if (hasil) {
          hasil.innerHTML =
            "<p>❌ Gagal mengambil data siswa.</p>";
        }

        return;
      }

      if (!data.found) {

        if (hasil) {
          hasil.innerHTML =
            "<p>❌ Siswa tidak ditemukan.</p>";
        }

        return;
      }


      if (hasil) {

        hasil.innerHTML = `
          <div class="hasil-card">
            <strong>👨‍🎓 ${escapeHTML(data.nama_siswa)}</strong>
            <div>ID: ${escapeHTML(data.id_siswa)}</div>
            <div>Kelas: ${escapeHTML(data.kelas)}</div>
            <div>Status: ${escapeHTML(data.status)}</div>
          </div>
        `;
      }

    }
  );
}


/* ---------- CARI BUKU ---------- */

function cariBukuPinjamManual() {

  const input =
    document.getElementById(
      "inputBukuPinjam"
    );

  if (!input) return;

  const id =
    input.value.trim();

  if (!id) {

    alert("Masukkan ID Buku.");

    return;
  }

  cariBukuPinjam(id);
}


function cariBukuPinjam(idBuku) {

  requestJSONP(
    {
      action: "cari_buku",
      idBuku: idBuku
    },

    function(data) {

      const hasil =
        document.getElementById(
          "hasilBukuPinjam"
        );

      if (!data || !data.success) {

        if (hasil) {
          hasil.innerHTML =
            "<p>❌ Gagal mengambil data buku.</p>";
        }

        return;
      }

      if (!data.found) {

        if (hasil) {
          hasil.innerHTML =
            "<p>❌ Buku tidak ditemukan.</p>";
        }

        return;
      }


      if (hasil) {

        hasil.innerHTML = `
          <div class="hasil-card">
            <strong>📖 ${escapeHTML(data.judul_buku)}</strong>
            <div>ID Buku: ${escapeHTML(data.id_buku)}</div>
            <div>Penulis: ${escapeHTML(data.penulis)}</div>
            <div>Stok: ${escapeHTML(data.stok)}</div>
          </div>
        `;
      }

    }
  );
}


/* ---------- SCAN SISWA PINJAM ---------- */

function mulaiScanSiswaPinjam() {

  bukaScanner(
    "readerSiswaPinjam",
    function(decodedText) {

      const id =
        decodedText.trim();

      const input =
        document.getElementById(
          "inputSiswaPinjam"
        );

      if (input) {
        input.value = id;
      }

      stopScanner();

      cariSiswaPinjam(id);
    }
  );
}


/* ---------- SCAN BUKU PINJAM ---------- */

function mulaiScanBukuPinjam() {

  bukaScanner(
    "readerBukuPinjam",
    function(decodedText) {

      const id =
        decodedText.trim();

      const input =
        document.getElementById(
          "inputBukuPinjam"
        );

      if (input) {
        input.value = id;
      }

      stopScanner();

      cariBukuPinjam(id);
    }
  );
}


/************************************************************
 * PROSES PINJAM
 ************************************************************/

async function prosesPinjam() {

  const siswa =
    document.getElementById(
      "inputSiswaPinjam"
    );

  const buku =
    document.getElementById(
      "inputBukuPinjam"
    );

  const idSiswa =
    siswa ? siswa.value.trim() : "";

  const idBuku =
    buku ? buku.value.trim() : "";


  if (!idSiswa) {

    alert("Masukkan ID Siswa.");

    return;
  }


  if (!idBuku) {

    alert("Masukkan ID Buku.");

    return;
  }


  try {

    const body =
      new URLSearchParams();

    body.append(
      "action",
      "PINJAM_BUKU"
    );

    body.append(
      "idSiswa",
      idSiswa
    );

    body.append(
      "idBuku",
      idBuku
    );


    const response =
      await fetch(
        API_URL,
        {
          method: "POST",
          body: body
        }
      );


    const data =
      await response.json();


    if (!data.success) {

      alert(
        data.message ||
        "Gagal meminjam buku."
      );

      return;
    }


    alert(
      data.message ||
      "Buku berhasil dipinjam."
    );


    // Bersihkan hasil
    const hasilSiswa =
      document.getElementById(
        "hasilSiswaPinjam"
      );

    const hasilBuku =
      document.getElementById(
        "hasilBukuPinjam"
      );


    if (hasilSiswa) {
      hasilSiswa.innerHTML = "";
    }

    if (hasilBuku) {
      hasilBuku.innerHTML = "";
    }


    if (siswa) {
      siswa.value = "";
    }

    if (buku) {
      buku.value = "";
    }


    loadStatistik();

  } catch (error) {

    console.error(error);

    alert(
      "Gagal menghubungi Google Apps Script."
    );
  }
}


/************************************************************
 * =========================
 * PENGEMBALIAN
 * =========================
 ************************************************************/


function cariPengembalianManual() {

  const input =
    document.getElementById(
      "inputCariPengembalian"
    );

  if (!input) return;

  const id =
    input.value.trim();

  if (!id) {

    alert("Masukkan ID Siswa.");

    return;
  }

  tampilkanPinjamanSiswa(id);
}


function mulaiScanPengembalian() {

  bukaScanner(
    "readerKembali",
    function(decodedText) {

      const id =
        decodedText.trim();

      const input =
        document.getElementById(
          "inputCariPengembalian"
        );

      if (input) {
        input.value = id;
      }

      stopScanner();

      tampilkanPinjamanSiswa(id);
    }
  );
}


/************************************************************
 * TAMPILKAN PINJAMAN UNTUK PENGEMBALIAN
 ************************************************************/

function tampilkanPinjamanSiswa(idSiswa) {

  const container =
    document.getElementById(
      "dataPengembalian"
    );

  if (container) {
    container.innerHTML =
      "<p>⏳ Memuat data...</p>";
  }


  requestJSONP(
    {
      action: "lihat_pinjaman",
      idSiswa: idSiswa
    },

    function(data) {

      if (!container) return;


      if (!data || !data.success) {

        container.innerHTML = `
          <div class="hasil-card">
            <p>❌ ${
              escapeHTML(
                data &&
                data.message
                  ? data.message
                  : "Gagal mengambil data pinjaman."
              )
            }</p>
          </div>
        `;

        return;
      }


      const daftar =
        Array.isArray(data.data)
          ? data.data
          : [];


      if (daftar.length === 0) {

        container.innerHTML = `
          <div class="hasil-card">
            <p>📚 Siswa tidak sedang meminjam buku.</p>
          </div>
        `;

        return;
      }


      container.innerHTML =
        daftar.map(function(item) {

          return `
            <div class="hasil-card">

              <strong>
                📖 ${escapeHTML(item.judul_buku)}
              </strong>

              <div>
                ID Transaksi:
                ${escapeHTML(item.id_transaksi)}
              </div>

              <div>
                ID Buku:
                ${escapeHTML(item.id_buku)}
              </div>

              <div>
                Tanggal Pinjam:
                ${escapeHTML(item.tanggal_pinjam)}
              </div>

              <div>
                Batas Kembali:
                ${escapeHTML(item.batas_kembali)}
              </div>

              <div>
                Status:
                ${escapeHTML(item.status)}
              </div>

              <br>

              <button
                class="btn-proses"
                onclick="prosesKembalikan('${escapeJS(item.id_transaksi)}')"
              >
                ↩️ KEMBALIKAN
              </button>

            </div>
          `;

        }).join("");

    }
  );
}


/************************************************************
 * PROSES PENGEMBALIAN
 ************************************************************/

async function prosesKembalikan(idTransaksi) {

  if (!idTransaksi) {

    alert("ID transaksi tidak ditemukan.");

    return;
  }


  try {

    const body =
      new URLSearchParams();

    body.append(
      "action",
      "KEMBALIKAN_BUKU"
    );

    body.append(
      "idTransaksi",
      idTransaksi
    );


    const response =
      await fetch(
        API_URL,
        {
          method: "POST",
          body: body
        }
      );


    const data =
      await response.json();


    if (!data.success) {

      alert(
        data.message ||
        "Gagal mengembalikan buku."
      );

      return;
    }


    alert(
      data.message ||
      "Buku berhasil dikembalikan."
    );


    const input =
      document.getElementById(
        "inputCariPengembalian"
      );


    if (
      input &&
      input.value.trim()
    ) {

      tampilkanPinjamanSiswa(
        input.value.trim()
      );

    }


    loadStatistik();


  } catch (error) {

    console.error(error);

    alert(
      "Gagal menghubungi Google Apps Script."
    );
  }
}


/************************************************************
 * =========================
 * BUKU DIPINJAM
 * =========================
 ************************************************************/

function cariPinjamanManual() {

  const input =
    document.getElementById(
      "inputCariSiswa"
    );

  if (!input) return;

  const id =
    input.value.trim();

  if (!id) {

    alert("Masukkan ID Siswa.");

    return;
  }

  tampilkanHasilPinjaman(id);
}


function mulaiScanPinjaman() {

  bukaScanner(
    "readerPinjaman",
    function(decodedText) {

      const id =
        decodedText.trim();

      const input =
        document.getElementById(
          "inputCariSiswa"
        );

      if (input) {
        input.value = id;
      }

      stopScanner();

      tampilkanHasilPinjaman(id);
    }
  );
}


function tampilkanHasilPinjaman(idSiswa) {

  const container =
    document.getElementById(
      "hasilPinjaman"
    );

  if (container) {
    container.innerHTML =
      "<p>⏳ Memuat data...</p>";
  }


  requestJSONP(
    {
      action: "lihat_pinjaman",
      idSiswa: idSiswa
    },

    function(data) {

      if (!container) return;


      if (!data || !data.success) {

        container.innerHTML = `
          <div class="hasil-card">
            <p>❌ ${
              escapeHTML(
                data &&
                data.message
                  ? data.message
                  : "Gagal mengambil data pinjaman."
              )
            }</p>
          </div>
        `;

        return;
      }


      const daftar =
        Array.isArray(data.data)
          ? data.data
          : [];


      if (!daftar.length) {

        container.innerHTML = `
          <div class="hasil-card">
            <p>📚 Tidak ada buku yang sedang dipinjam.</p>
          </div>
        `;

        return;
      }


      container.innerHTML =
        daftar.map(function(item) {

          return `
            <div class="hasil-card">

              <strong>
                📖 ${escapeHTML(item.judul_buku)}
              </strong>

              <div>
                ID Buku:
                ${escapeHTML(item.id_buku)}
              </div>

              <div>
                Tanggal Pinjam:
                ${escapeHTML(item.tanggal_pinjam)}
              </div>

              <div>
                Batas Kembali:
                ${escapeHTML(item.batas_kembali)}
              </div>

              <div>
                Status:
                ${escapeHTML(item.status)}
              </div>

            </div>
          `;

        }).join("");

    }
  );
}


/************************************************************
 * =========================
 * KETERLAMBATAN
 * =========================
 ************************************************************/

function loadKeterlambatan() {

  const container =
    document.getElementById(
      "dataKeterlambatan"
    );

  if (!container) return;


  container.innerHTML =
    "<p>⏳ Memuat data keterlambatan...</p>";


  requestJSONP(
    {
      action: "keterlambatan"
    },

    function(data) {

      if (!data || !data.success) {

        container.innerHTML = `
          <div class="hasil-card">
            <p>❌ ${
              escapeHTML(
                data &&
                data.message
                  ? data.message
                  : "Gagal mengambil data keterlambatan."
              )
            }</p>
          </div>
        `;

        return;
      }


      const daftar =
        Array.isArray(data.data)
          ? data.data
          : [];


      if (!daftar.length) {

        container.innerHTML = `
          <div class="hasil-card">
            <p>🎉 Tidak ada keterlambatan.</p>
          </div>
        `;

        return;
      }


      container.innerHTML =
        daftar.map(function(item) {

          return `
            <div class="hasil-card">

              <strong>
                👨‍🎓 ${escapeHTML(item.nama_siswa)}
              </strong>

              <div>
                Kelas:
                ${escapeHTML(item.kelas)}
              </div>

              <div>
                Buku:
                ${escapeHTML(item.judul_buku)}
              </div>

              <div>
                Batas Kembali:
                ${escapeHTML(item.batas_kembali)}
              </div>

              <div>
                ⚠️ Terlambat:
                <strong>
                  ${escapeHTML(item.terlambat)}
                  hari
                </strong>
              </div>

            </div>
          `;

        }).join("");

    }
  );
}


/************************************************************
 * =========================
 * SCANNER UMUM
 * =========================
 ************************************************************/

function bukaScanner(readerId, onSuccess) {

  stopScanner();


  const reader =
    document.getElementById(
      readerId
    );

  if (!reader) {

    alert(
      "Area kamera tidak ditemukan."
    );

    return;
  }


  reader.innerHTML = "";


  scannerAktif =
    new Html5Qrcode(
      readerId
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

      onSuccess(decodedText);

    },

    function() {}

  ).catch(function(error) {

    console.error(error);

    alert(
      "Kamera tidak dapat dibuka. Pastikan izin kamera diberikan."
    );

    stopScanner();

  });
}


/************************************************************
 * STOP SCANNER
 ************************************************************/

function stopScanner() {

  if (!scannerAktif) return;


  const scanner =
    scannerAktif;

  scannerAktif = null;


  scanner.stop()

    .then(function() {

      try {
        scanner.clear();
      } catch (e) {}

    })

    .catch(function(error) {

      console.warn(
        "Scanner stop:",
        error
      );

      try {
        scanner.clear();
      } catch (e) {}

    });
}


/************************************************************
 * =========================
 * UTILITAS
 * =========================
 ************************************************************/

function escapeHTML(value) {

  return String(
    value == null
      ? ""
      : value
  )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function escapeJS(value) {

  return String(
    value == null
      ? ""
      : value
  )
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}


/************************************************************
 * =========================
 * SAAT HALAMAN DIBUKA
 * =========================
 ************************************************************/

document.addEventListener(
  "DOMContentLoaded",
  function() {

    // Pastikan menu utama aktif
    const menuUtama =
      document.getElementById(
        "menuUtama"
      );

    if (menuUtama) {
      menuUtama.classList.remove(
        "hidden"
      );
    }


    // Semua halaman lain disembunyikan
    document.querySelectorAll(
      ".halaman"
    ).forEach(function(el) {

      if (
        el.id !== "menuUtama"
      ) {
        el.classList.add(
          "hidden"
        );
      }

    });


    // Ambil statistik
    loadStatistik();

  }
);
