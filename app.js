/************************************************************
 * KONFIGURASI
 ************************************************************/

const API_URL =
  "https://script.google.com/macros/s/AKfycbyk367Q4T6gyUN2Xptxi9PPYaOfNXjvTSaWqHRxH2uqNNgEynfRgpBAeHg8HFnyr8UOHw/exec";


let scannerAktif = null;


/************************************************************
 * SAAT HALAMAN DIBUKA
 ************************************************************/

document.addEventListener(
  "DOMContentLoaded",
  function() {

    loadStatistik();

  }
);


/************************************************************
 * MENU
 ************************************************************/

function bukaMenu(namaMenu) {

  document
    .querySelectorAll(".halaman")
    .forEach(function(el) {

      el.classList.add("hidden");

    });


  const halaman =
    document.getElementById(namaMenu);


  if (halaman) {

    halaman.classList.remove("hidden");

  }


  stopScanner();


  if (
    namaMenu === "keterlambatan"
  ) {

    loadKeterlambatan();

  }

}


function kembaliMenu() {

  stopScanner();


  document
    .querySelectorAll(".halaman")
    .forEach(function(el) {

      el.classList.add("hidden");

    });


  const utama =
    document.getElementById("menuUtama");


  if (utama) {

    utama.classList.remove("hidden");

  }


  // Refresh statistik
  loadStatistik();

}


/************************************************************
 * STOP SCANNER
 ************************************************************/

function stopScanner() {

  if (scannerAktif) {

    try {

      scannerAktif
        .stop()
        .then(function() {

          try {
            scannerAktif.clear();
          } catch (e) {}

        })
        .catch(function() {});

    } catch (e) {}

    scannerAktif = null;

  }


  const readerIds = [

    "readerSiswaPinjam",
    "readerBukuPinjam",
    "readerKembali",
    "readerPinjaman"

  ];


  readerIds.forEach(function(id) {

    const el =
      document.getElementById(id);


    if (el) {

      el.style.display = "none";
      el.innerHTML = "";

    }

  });

}


/************************************************************
 * GENERIC START SCANNER
 ************************************************************/

function jalankanScanner(
  readerId,
  successCallback
) {

  stopScanner();


  const reader =
    document.getElementById(readerId);


  if (!reader) {

    alert(
      "Area kamera tidak ditemukan"
    );

    return;

  }


  reader.style.display = "block";


  scannerAktif =
    new Html5Qrcode(readerId);


  scannerAktif
    .start(

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

        const hasil =
          String(decodedText || "")
            .trim();


        if (!hasil) {
          return;
        }


        stopScanner();


        successCallback(hasil);

      },

      function(errorMessage) {

        // Abaikan error pembacaan frame
        // karena kamera sedang mencari QR

      }

    )
    .catch(function(error) {

      console.error(
        "Scanner error:",
        error
      );


      alert(
        "❌ Kamera tidak dapat dibuka.\n\n" +
        "Pastikan browser diberi izin kamera."
      );


      stopScanner();

    });

}


/************************************************************
 * SCAN SISWA - PINJAM
 ************************************************************/

function mulaiScanSiswaPinjam() {

  jalankanScanner(
    "readerSiswaPinjam",

    function(idSiswa) {

      document
        .getElementById(
          "inputSiswaPinjam"
        )
        .value = idSiswa;


      cariSiswaPinjamManual();

    }
  );

}


/************************************************************
 * CARI SISWA - PINJAM
 ************************************************************/

function cariSiswaPinjamManual() {

  const input =
    document.getElementById(
      "inputSiswaPinjam"
    );


  const id =
    input.value.trim();


  if (!id) {

    alert(
      "Masukkan atau scan ID siswa"
    );

    return;

  }


  cariSiswaAPI(
    id,
    "hasilSiswaPinjam"
  );

}


/************************************************************
 * SCAN BUKU - PINJAM
 ************************************************************/

function mulaiScanBukuPinjam() {

  jalankanScanner(
    "readerBukuPinjam",

    function(idBuku) {

      document
        .getElementById(
          "inputBukuPinjam"
        )
        .value = idBuku;


      cariBukuPinjamManual();

    }
  );

}


/************************************************************
 * CARI BUKU - PINJAM
 ************************************************************/

function cariBukuPinjamManual() {

  const input =
    document.getElementById(
      "inputBukuPinjam"
    );


  const id =
    input.value.trim();


  if (!id) {

    alert(
      "Masukkan atau scan ID buku"
    );

    return;

  }


  cariBukuAPI(
    id,
    "hasilBukuPinjam"
  );

}


/************************************************************
 * CARI SISWA API - JSONP
 ************************************************************/

function cariSiswaAPI(
  idSiswa,
  targetId
) {

  const target =
    document.getElementById(targetId);


  if (target) {

    target.innerHTML =
      "<p>⏳ Mencari siswa...</p>";

  }


  const callback =
    "siswaCallback_" +
    Date.now();


  window[callback] =
    function(data) {

      try {

        if (
          !data ||
          data.success === false
        ) {

          throw new Error(
            data &&
            data.message
              ? data.message
              : "Gagal mengambil data"
          );

        }


        if (!data.found) {

          target.innerHTML =
            `<div class="error-box">
              ❌ Siswa tidak ditemukan
            </div>`;

          return;

        }


        target.innerHTML = `

          <div class="success-box">

            <b>✅ Siswa ditemukan</b>

            <p>
              <b>ID:</b>
              ${escapeHtml(data.id_siswa)}
            </p>

            <p>
              <b>Nama:</b>
              ${escapeHtml(data.nama_siswa)}
            </p>

            <p>
              <b>Kelas:</b>
              ${escapeHtml(data.kelas)}
            </p>

            <p>
              <b>Status:</b>
              ${escapeHtml(data.status)}
            </p>

          </div>

        `;

      } catch (error) {

        target.innerHTML =
          `<div class="error-box">
            ❌ ${escapeHtml(error.message)}
          </div>`;

      } finally {

        hapusJSONPScript(callback);

      }

    };


  buatJSONPScript(
    API_URL +
    "?action=cari_siswa" +
    "&idSiswa=" +
    encodeURIComponent(idSiswa) +
    "&callback=" +
    callback
  );

}


/************************************************************
 * CARI BUKU API - JSONP
 ************************************************************/

function cariBukuAPI(
  idBuku,
  targetId
) {

  const target =
    document.getElementById(targetId);


  if (target) {

    target.innerHTML =
      "<p>⏳ Mencari buku...</p>";

  }


  const callback =
    "bukuCallback_" +
    Date.now();


  window[callback] =
    function(data) {

      try {

        if (
          !data ||
          data.success === false
        ) {

          throw new Error(
            data &&
            data.message
              ? data.message
              : "Gagal mengambil data"
          );

        }


        if (!data.found) {

          target.innerHTML =
            `<div class="error-box">
              ❌ Buku tidak ditemukan
            </div>`;

          return;

        }


        const stok =
          Number(data.stok || 0);


        target.innerHTML = `

          <div class="success-box">

            <b>✅ Buku ditemukan</b>

            <p>
              <b>ID:</b>
              ${escapeHtml(data.id_buku)}
            </p>

            <p>
              <b>Judul:</b>
              ${escapeHtml(data.judul_buku)}
            </p>

            <p>
              <b>Penulis:</b>
              ${escapeHtml(data.penulis)}
            </p>

            <p>
              <b>Penerbit:</b>
              ${escapeHtml(data.penerbit)}
            </p>

            <p>
              <b>Stok:</b>
              ${stok}
            </p>

          </div>

        `;

      } catch (error) {

        target.innerHTML =
          `<div class="error-box">
            ❌ ${escapeHtml(error.message)}
          </div>`;

      } finally {

        hapusJSONPScript(callback);

      }

    };


  buatJSONPScript(
    API_URL +
    "?action=cari_buku" +
    "&idBuku=" +
    encodeURIComponent(idBuku) +
    "&callback=" +
    callback
  );

}


/************************************************************
 * JSONP HELPER
 ************************************************************/

function buatJSONPScript(url) {

  const script =
    document.createElement("script");


  const callback =
    new URL(url)
      .searchParams
      .get("callback");


  script.id = callback;

  script.src =
    url;


  script.onerror =
    function() {

      console.error(
        "JSONP gagal:",
        url
      );

      hapusJSONPScript(callback);

    };


  document.body.appendChild(script);

}


function hapusJSONPScript(callback) {

  delete window[callback];


  const script =
    document.getElementById(callback);


  if (script) {

    script.remove();

  }

}


/************************************************************
 * PROSES PINJAM
 ************************************************************/

async function prosesPinjam() {

  const idSiswa =
    document
      .getElementById(
        "inputSiswaPinjam"
      )
      .value
      .trim();


  const idBuku =
    document
      .getElementById(
        "inputBukuPinjam"
      )
      .value
      .trim();


  if (!idSiswa) {

    alert("ID siswa belum diisi");
    return;

  }


  if (!idBuku) {

    alert("ID buku belum diisi");
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
                "PINJAM_BUKU",

              idSiswa:
                idSiswa,

              idBuku:
                idBuku

            })

        }
      );


    const data =
      await response.json();


    if (!data.success) {

      alert(
        "❌ " +
        (data.message ||
          "Gagal meminjam buku")
      );

      return;

    }


    alert(
      "✅ Buku berhasil dipinjam!"
    );


    document
      .getElementById(
        "inputSiswaPinjam"
      )
      .value = "";


    document
      .getElementById(
        "inputBukuPinjam"
      )
      .value = "";


    document
      .getElementById(
        "hasilSiswaPinjam"
      )
      .innerHTML = "";


    document
      .getElementById(
        "hasilBukuPinjam"
      )
      .innerHTML = "";


    loadStatistik();

  } catch (error) {

    console.error(error);

    alert(
      "❌ Gagal terhubung ke server"
    );

  }

}


/************************************************************
 * SCAN PENGEMBALIAN
 ************************************************************/

function mulaiScanPengembalian() {

  jalankanScanner(
    "readerKembali",

    function(idSiswa) {

      document
        .getElementById(
          "inputCariPengembalian"
        )
        .value = idSiswa;


      tampilkanPinjamanSiswa(
        idSiswa
      );

    }
  );

}


/************************************************************
 * CARI PENGEMBALIAN MANUAL
 ************************************************************/

function cariPengembalianManual() {

  const idSiswa =
    document
      .getElementById(
        "inputCariPengembalian"
      )
      .value
      .trim();


  if (!idSiswa) {

    alert(
      "Masukkan atau scan ID siswa"
    );

    return;

  }


  tampilkanPinjamanSiswa(
    idSiswa
  );

}


/************************************************************
 * TAMPILKAN PINJAMAN SISWA
 * JSONP - BUKAN FETCH GET
 ************************************************************/

function tampilkanPinjamanSiswa(
  idSiswa
) {

  const target =
    document.getElementById(
      "dataPengembalian"
    );


  target.innerHTML =
    "<p>⏳ Mengambil data pinjaman...</p>";


  const callback =
    "pengembalianCallback_" +
    Date.now();


  window[callback] =
    function(data) {

      try {

        if (
          !data ||
          data.success === false
        ) {

          throw new Error(
            data &&
            data.message
              ? data.message
              : "Gagal mengambil data"
          );

        }


        if (
          !data.data ||
          data.data.length === 0
        ) {

          target.innerHTML = `

            <div class="error-box">

              ℹ️ Siswa tidak memiliki
              buku yang sedang dipinjam.

            </div>

          `;

          return;

        }


        let html = "";


        data.data.forEach(
          function(item) {

            html += `

              <div class="card">

                <h3>
                  📖
                  ${escapeHtml(
                    item.judul_buku
                  )}
                </h3>

                <p>
                  <b>ID Buku:</b>
                  ${escapeHtml(
                    item.id_buku
                  )}
                </p>

                <p>
                  <b>Tanggal Pinjam:</b>
                  ${escapeHtml(
                    item.tanggal_pinjam
                  )}
                </p>

                <p>
                  <b>Batas Kembali:</b>
                  ${escapeHtml(
                    item.batas_kembali
                  )}
                </p>

                <button
                  class="btn-proses"
                  onclick="prosesKembalikan('${escapeJs(item.id_transaksi)}')"
                >
                  ↩️ KEMBALIKAN BUKU
                </button>

              </div>

            `;

          }
        );


        target.innerHTML =
          html;

      } catch (error) {

        target.innerHTML =
          `<div class="error-box">
            ❌ ${escapeHtml(error.message)}
          </div>`;

      } finally {

        hapusJSONPScript(callback);

      }

    };


  buatJSONPScript(

    API_URL +
    "?action=lihat_pinjaman" +
    "&idSiswa=" +
    encodeURIComponent(idSiswa) +
    "&callback=" +
    callback

  );

}


/************************************************************
 * PROSES PENGEMBALIAN
 ************************************************************/

async function prosesKembalikan(
  idTransaksi
) {

  if (
    !confirm(
      "Apakah buku ini akan dikembalikan?"
    )
  ) {

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
                "KEMBALIKAN_BUKU",

              idTransaksi:
                idTransaksi

            })

        }
      );


    const data =
      await response.json();


    if (!data.success) {

      alert(
        "❌ " +
        (
          data.message ||
          "Gagal mengembalikan buku"
        )
      );

      return;

    }


    alert(
      "✅ Buku berhasil dikembalikan!"
    );


    const idSiswa =
      document
        .getElementById(
          "inputCariPengembalian"
        )
        .value
        .trim();


    if (idSiswa) {

      tampilkanPinjamanSiswa(
        idSiswa
      );

    }


    loadStatistik();

  } catch (error) {

    console.error(error);

    alert(
      "❌ Gagal terhubung ke server"
    );

  }

}


/************************************************************
 * SCAN BUKU DIPINJAM
 ************************************************************/

function mulaiScanPinjaman() {

  jalankanScanner(
    "readerPinjaman",

    function(idSiswa) {

      document
        .getElementById(
          "inputCariSiswa"
        )
        .value = idSiswa;


      tampilkanHasilPinjaman(
        idSiswa
      );

    }
  );

}


/************************************************************
 * CARI BUKU DIPINJAM MANUAL
 ************************************************************/

function cariPinjamanManual() {

  const idSiswa =
    document
      .getElementById(
        "inputCariSiswa"
      )
      .value
      .trim();


  if (!idSiswa) {

    alert(
      "Masukkan atau scan ID siswa"
    );

    return;

  }


  tampilkanHasilPinjaman(
    idSiswa
  );

}


/************************************************************
 * TAMPILKAN BUKU YANG DIPINJAM
 ************************************************************/

function tampilkanHasilPinjaman(
  idSiswa
) {

  const target =
    document.getElementById(
      "hasilPinjaman"
    );


  target.innerHTML =
    "<p>⏳ Mengambil data...</p>";


  const callback =
    "pinjamanCallback_" +
    Date.now();


  window[callback] =
    function(data) {

      try {

        if (
          !data ||
          data.success === false
        ) {

          throw new Error(
            data &&
            data.message
              ? data.message
              : "Gagal mengambil data"
          );

        }


        if (
          !data.data ||
          data.data.length === 0
        ) {

          target.innerHTML = `

            <div class="error-box">

              ℹ️ Tidak ada buku
              yang sedang dipinjam.

            </div>

          `;

          return;

        }


        let html = "";


        data.data.forEach(
          function(item) {

            html += `

              <div class="card">

                <h3>
                  📖
                  ${escapeHtml(
                    item.judul_buku
                  )}
                </h3>

                <p>
                  <b>ID Buku:</b>
                  ${escapeHtml(
                    item.id_buku
                  )}
                </p>

                <p>
                  <b>Tanggal Pinjam:</b>
                  ${escapeHtml(
                    item.tanggal_pinjam
                  )}
                </p>

                <p>
                  <b>Batas Kembali:</b>
                  ${escapeHtml(
                    item.batas_kembali
                  )}
                </p>

                <p>
                  <b>Status:</b>
                  ${escapeHtml(
                    item.status
                  )}
                </p>

              </div>

            `;

          }
        );


        target.innerHTML =
          html;

      } catch (error) {

        target.innerHTML =
          `<div class="error-box">
            ❌ ${escapeHtml(error.message)}
          </div>`;

      } finally {

        hapusJSONPScript(callback);

      }

    };


  buatJSONPScript(

    API_URL +
    "?action=lihat_pinjaman" +
    "&idSiswa=" +
    encodeURIComponent(idSiswa) +
    "&callback=" +
    callback

  );

}


/************************************************************
 * STATISTIK
 ************************************************************/

function loadStatistik() {

  const loading =
    document.getElementById(
      "statistikLoading"
    );


  const errorBox =
    document.getElementById(
      "statistikError"
    );


  const dataBox =
    document.getElementById(
      "statistikData"
    );


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


  if (
    !loading ||
    !errorBox ||
    !dataBox
  ) {

    return;

  }


  loading.style.display =
    "block";


  errorBox.style.display =
    "none";


  dataBox.style.display =
    "none";


  const callback =
    "statistikCallback_" +
    Date.now();


  let selesai =
    false;


  const timeout =
    setTimeout(
      function() {

        if (selesai) {
          return;
        }


        selesai = true;


        loading.style.display =
          "none";


        errorBox.style.display =
          "block";


        hapusJSONPScript(
          callback
        );

      },
      10000
    );


  window[callback] =
    function(data) {

      if (selesai) {
        return;
      }


      selesai = true;


      clearTimeout(timeout);


      try {

        console.log(
          "STATISTIK:",
          data
        );


        if (
          !data ||
          data.success === false
        ) {

          throw new Error(
            data &&
            data.message
              ? data.message
              : "Gagal mengambil statistik"
          );

        }


        dipinjam.innerHTML =
          Number(
            data.dipinjam || 0
          );


        dikembalikan.innerHTML =
          Number(
            data.dikembalikan || 0
          );


        terlambat.innerHTML =
          Number(
            data.terlambat || 0
          );


        loading.style.display =
          "none";


        errorBox.style.display =
          "none";


        dataBox.style.display =
          "grid";


      } catch (error) {

        console.error(
          "Statistik error:",
          error
        );


        loading.style.display =
          "none";


        errorBox.style.display =
          "block";


        dataBox.style.display =
          "none";

      } finally {

        hapusJSONPScript(
          callback
        );

      }

    };


  buatJSONPScript(

    API_URL +
    "?action=statistik" +
    "&callback=" +
    callback +
    "&t=" +
    Date.now()

  );

}


/************************************************************
 * KETERLAMBATAN
 ************************************************************/

function loadKeterlambatan() {

  const target =
    document.getElementById(
      "dataKeterlambatan"
    );


  if (!target) {
    return;
  }


  target.innerHTML =
    "<p>⏳ Memuat data...</p>";


  const callback =
    "terlambatCallback_" +
    Date.now();


  window[callback] =
    function(data) {

      try {

        if (
          !data ||
          data.success === false
        ) {

          throw new Error(
            data &&
            data.message
              ? data.message
              : "Gagal mengambil data"
          );

        }


        if (
          !data.data ||
          data.data.length === 0
        ) {

          target.innerHTML = `

            <div class="success-box">

              ✅ Tidak ada keterlambatan.

            </div>

          `;

          return;

        }


        let html = "";


        data.data.forEach(
          function(item) {

            html += `

              <div class="card">

                <h3>
                  ⚠️
                  ${escapeHtml(
                    item.nama_siswa
                  )}
                </h3>

                <p>
                  <b>Kelas:</b>
                  ${escapeHtml(
                    item.kelas
                  )}
                </p>

                <p>
                  <b>Buku:</b>
                  ${escapeHtml(
                    item.judul_buku
                  )}
                </p>

                <p>
                  <b>Batas Kembali:</b>
                  ${escapeHtml(
                    item.batas_kembali
                  )}
                </p>

                <p>
                  <b>Terlambat:</b>
                  ${item.hari_terlambat}
                  hari
                </p>

              </div>

            `;

          }
        );


        target.innerHTML =
          html;

      } catch (error) {

        target.innerHTML =
          `<div class="error-box">
            ❌ ${escapeHtml(error.message)}
          </div>`;

      } finally {

        hapusJSONPScript(
          callback
        );

      }

    };


  buatJSONPScript(

    API_URL +
    "?action=keterlambatan" +
    "&callback=" +
    callback

  );

}


/************************************************************
 * ESCAPE HTML
 ************************************************************/

function escapeHtml(text) {

  return String(
    text == null
      ? ""
      : text
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


/************************************************************
 * ESCAPE JAVASCRIPT
 ************************************************************/

function escapeJs(text) {

  return String(
    text == null
      ? ""
      : text
  )
    .replace(
      /\\/g,
      "\\\\"
    )
    .replace(
      /'/g,
      "\\'"
    )
    .replace(
      /"/g,
      '\\"'
    )
    .replace(
      /\n/g,
      "\\n"
    )
    .replace(
      /\r/g,
      "\\r"
    );

}
