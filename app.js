/************************************************************
 * KONFIGURASI API
 ************************************************************/
const API_URL =
  "https://script.google.com/macros/s/AKfycbyk367Q4T6gyUN2Xptxi9PPYaOfNXjvTSaWqHRxH2uqNNgEynfRgpBAeHg8HFnyr8UOHw/exec";


/************************************************************
 * SCANNER
 ************************************************************/
let scannerAktif = null;


/************************************************************
 * JSONP REQUEST
 *
 * Ini pengganti fetch GET ke Google Apps Script.
 * Tujuannya menghindari masalah CORS dari GitHub Pages.
 ************************************************************/
function requestJSONP(params, callback) {

  const callbackName =
    "jsonp_" +
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
      window[callbackName] = undefined;
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
 * CARI SISWA
 ************************************************************/
function cariSiswaAPI(idSiswa) {

  const input =
    document.getElementById("inputCariSiswa");

  if (
    !idSiswa &&
    input
  ) {
    idSiswa = input.value.trim();
  }

  if (!idSiswa) {

    alert("Masukkan ID siswa.");

    return;
  }

  requestJSONP(
    {
      action: "cari_siswa",
      idSiswa: idSiswa
    },
    function(data) {

      if (!data) {

        alert(
          "Tidak ada respons dari server."
        );

        return;
      }

      if (!data.success) {

        alert(
          data.message ||
          "Gagal mengambil data siswa."
        );

        return;
      }

      if (!data.found) {

        alert(
          data.message ||
          "Siswa tidak ditemukan."
        );

        return;
      }

      tampilkanDataSiswa(data);
    }
  );
}


/************************************************************
 * TAMPILKAN SISWA
 ************************************************************/
function tampilkanDataSiswa(data) {

  const container =
    document.getElementById("hasilSiswa");

  if (!container) return;

  container.innerHTML = `
    <div class="hasil-card">
      <strong>${escapeHTML(data.nama_siswa)}</strong>
      <div>ID: ${escapeHTML(data.id_siswa)}</div>
      <div>Kelas: ${escapeHTML(data.kelas)}</div>
      <div>Status: ${escapeHTML(data.status)}</div>
    </div>
  `;
}


/************************************************************
 * CARI BUKU
 ************************************************************/
function cariBukuAPI(idBuku) {

  const input =
    document.getElementById("inputCariBuku");

  if (
    !idBuku &&
    input
  ) {
    idBuku = input.value.trim();
  }

  if (!idBuku) {

    alert("Masukkan ID buku.");

    return;
  }

  requestJSONP(
    {
      action: "cari_buku",
      idBuku: idBuku
    },
    function(data) {

      if (!data) {

        alert(
          "Tidak ada respons dari server."
        );

        return;
      }

      if (!data.success) {

        alert(
          data.message ||
          "Gagal mengambil data buku."
        );

        return;
      }

      if (!data.found) {

        alert(
          data.message ||
          "Buku tidak ditemukan."
        );

        return;
      }

      tampilkanDataBuku(data);
    }
  );
}


/************************************************************
 * TAMPILKAN BUKU
 ************************************************************/
function tampilkanDataBuku(data) {

  const container =
    document.getElementById("hasilBuku");

  if (!container) return;

  container.innerHTML = `
    <div class="hasil-card">
      <strong>${escapeHTML(data.judul_buku)}</strong>
      <div>ID Buku: ${escapeHTML(data.id_buku)}</div>
      <div>Penulis: ${escapeHTML(data.penulis)}</div>
      <div>Penerbit: ${escapeHTML(data.penerbit)}</div>
      <div>Kategori: ${escapeHTML(data.kategori)}</div>
      <div>Tahun: ${escapeHTML(data.tahun)}</div>
      <div>Stok: ${escapeHTML(data.stok)}</div>
    </div>
  `;
}


/************************************************************
 * LIHAT PINJAMAN SISWA
 *
 * SEBELUMNYA:
 * fetch(API_URL + "?action=lihat_pinjaman...")
 *
 * SEKARANG:
 * JSONP
 ************************************************************/
function tampilkanPinjamanSiswa(idSiswa) {

  const input =
    document.getElementById(
      "inputCariPengembalian"
    );

  if (
    !idSiswa &&
    input
  ) {
    idSiswa =
      input.value.trim();
  }

  if (!idSiswa) {

    alert("Masukkan ID siswa.");

    return;
  }

  const container =
    document.getElementById(
      "hasilPengembalian"
    ) ||
    document.getElementById(
      "dataPengembalian"
    ) ||
    document.getElementById(
      "hasilPinjaman"
    );

  if (container) {

    container.innerHTML =
      "<p>Memuat data...</p>";
  }

  requestJSONP(
    {
      action: "lihat_pinjaman",
      idSiswa: idSiswa
    },
    function(data) {

      if (!data) {

        if (container) {
          container.innerHTML =
            "<p>Gagal mengambil data.</p>";
        }

        return;
      }

      if (!data.success) {

        if (container) {
          container.innerHTML =
            `<p>${escapeHTML(
              data.message ||
              "Gagal mengambil data pinjaman."
            )}</p>`;
        }

        return;
      }

      const daftar =
        Array.isArray(data.data)
          ? data.data
          : [];

      if (!daftar.length) {

        if (container) {

          container.innerHTML = `
            <div class="hasil-card">
              <p>Siswa tidak sedang meminjam buku.</p>
            </div>
          `;
        }

        return;
      }

      if (!container) return;

      container.innerHTML =
        daftar
          .map(function(item) {

            return `
              <div class="hasil-card">
                <strong>
                  ${escapeHTML(
                    item.judul_buku
                  )}
                </strong>

                <div>
                  ID Transaksi:
                  ${escapeHTML(
                    item.id_transaksi
                  )}
                </div>

                <div>
                  ID Buku:
                  ${escapeHTML(
                    item.id_buku
                  )}
                </div>

                <div>
                  Tanggal Pinjam:
                  ${escapeHTML(
                    item.tanggal_pinjam
                  )}
                </div>

                <div>
                  Batas Kembali:
                  ${escapeHTML(
                    item.batas_kembali
                  )}
                </div>

                <div>
                  Status:
                  ${escapeHTML(
                    item.status
                  )}
                </div>

                <button
                  onclick="prosesKembalikan('${escapeJS(
                    item.id_transaksi
                  )}')"
                >
                  KEMBALIKAN
                </button>
              </div>
            `;

          })
          .join("");
    }
  );
}


/************************************************************
 * BUKU YANG DIPINJAM
 ************************************************************/
function tampilkanHasilPinjaman(idSiswa) {

  const input =
    document.getElementById(
      "inputCariSiswa"
    );

  if (
    !idSiswa &&
    input
  ) {
    idSiswa =
      input.value.trim();
  }

  if (!idSiswa) {

    alert("Masukkan ID siswa.");

    return;
  }

  const container =
    document.getElementById(
      "hasilPinjaman"
    );

  if (container) {

    container.innerHTML =
      "<p>Memuat data...</p>";
  }

  requestJSONP(
    {
      action: "lihat_pinjaman",
      idSiswa: idSiswa
    },
    function(data) {

      if (!container) return;

      if (
        !data ||
        !data.success
      ) {

        container.innerHTML = `
          <div class="hasil-card">
            <p>
              ${
                data &&
                data.message
                  ? escapeHTML(data.message)
                  : "Gagal mengambil data pinjaman."
              }
            </p>
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
            <p>Tidak ada buku yang sedang dipinjam.</p>
          </div>
        `;

        return;
      }

      container.innerHTML =
        daftar
          .map(function(item) {

            return `
              <div class="hasil-card">
                <strong>
                  ${escapeHTML(
                    item.judul_buku
                  )}
                </strong>

                <div>
                  ID Buku:
                  ${escapeHTML(
                    item.id_buku
                  )}
                </div>

                <div>
                  Tanggal Pinjam:
                  ${escapeHTML(
                    item.tanggal_pinjam
                  )}
                </div>

                <div>
                  Batas Kembali:
                  ${escapeHTML(
                    item.batas_kembali
                  )}
                </div>

                <div>
                  Status:
                  ${escapeHTML(
                    item.status
                  )}
                </div>
              </div>
            `;

          })
          .join("");
    }
  );
}


/************************************************************
 * KETERLAMBATAN
 ************************************************************/
function loadKeterlambatan() {

  const container =
    document.getElementById(
      "dataKeterlambatan"
    ) ||
    document.getElementById(
      "hasilKeterlambatan"
    );

  if (container) {

    container.innerHTML =
      "<p>Memuat data...</p>";
  }

  requestJSONP(
    {
      action: "keterlambatan"
    },
    function(data) {

      if (!container) return;

      if (
        !data ||
        !data.success
      ) {

        container.innerHTML = `
          <p>
            ${
              data &&
              data.message
                ? escapeHTML(data.message)
                : "Gagal mengambil data keterlambatan."
            }
          </p>
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
        daftar
          .map(function(item) {

            return `
              <div class="hasil-card">
                <strong>
                  ${escapeHTML(
                    item.nama_siswa
                  )}
                </strong>

                <div>
                  Kelas:
                  ${escapeHTML(
                    item.kelas
                  )}
                </div>

                <div>
                  Buku:
                  ${escapeHTML(
                    item.judul_buku
                  )}
                </div>

                <div>
                  Batas:
                  ${escapeHTML(
                    item.batas_kembali
                  )}
                </div>

                <div>
                  Terlambat:
                  <strong>
                    ${escapeHTML(
                      item.terlambat
                    )} hari
                  </strong>
                </div>
              </div>
            `;

          })
          .join("");
    }
  );
}


/************************************************************
 * STATISTIK
 ************************************************************/
function loadStatistik() {

  const container =
    document.getElementById(
      "statistik"
    );

  if (!container) return;

  container.innerHTML = `
    <p>Memuat statistik...</p>
  `;

  requestJSONP(
    {
      action: "statistik"
    },
    function(data) {

      if (
        !data ||
        !data.success
      ) {

        container.innerHTML = `
          <p>
            ❌ Gagal memuat statistik
          </p>
          <small>
            ${
              data &&
              data.message
                ? escapeHTML(data.message)
                : "Google Apps Script tidak dapat diakses."
            }
          </small>
        `;

        return;
      }

      container.innerHTML = `
        <div>
          📚 Dipinjam:
          <strong>${data.dipinjam}</strong>
        </div>

        <div>
          ✅ Dikembalikan:
          <strong>${data.dikembalikan}</strong>
        </div>

        <div>
          ⚠️ Terlambat:
          <strong>${data.terlambat}</strong>
        </div>
      `;
    }
  );
}


/************************************************************
 * CARI MANUAL PENGEMBALIAN
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

    alert("Masukkan ID siswa.");

    return;
  }

  tampilkanPinjamanSiswa(id);
}


/************************************************************
 * CARI MANUAL BUKU DIPINJAM
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

    alert("Masukkan ID siswa.");

    return;
  }

  tampilkanHasilPinjaman(id);
}


/************************************************************
 * SCAN SISWA
 ************************************************************/
function mulaiScanSiswa() {

  stopScanner();

  const reader =
    document.getElementById(
      "readerSiswa"
    );

  if (!reader) return;

  reader.innerHTML = "";

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

      cariSiswaAPI(id);
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
 * SCAN BUKU
 ************************************************************/
function mulaiScanBuku() {

  stopScanner();

  const reader =
    document.getElementById(
      "readerBuku"
    );

  if (!reader) return;

  reader.innerHTML = "";

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

      const id =
        decodedText.trim();

      const input =
        document.getElementById(
          "inputCariBuku"
        );

      if (input) {
        input.value = id;
      }

      stopScanner();

      cariBukuAPI(id);
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
 * SCAN PENGEMBALIAN
 ************************************************************/
function mulaiScanPengembalian() {

  stopScanner();

  const reader =
    document.getElementById(
      "readerKembali"
    );

  if (!reader) return;

  reader.innerHTML = "";

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
 * SCAN BUKU DIPINJAM
 ************************************************************/
function mulaiScanPinjaman() {

  stopScanner();

  const reader =
    document.getElementById(
      "readerPinjaman"
    );

  if (!reader) return;

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
 * PINJAM BUKU
 *
 * Menggunakan POST.
 ************************************************************/
async function prosesPinjam() {

  const inputSiswa =
    document.getElementById(
      "inputCariSiswa"
    );

  const inputBuku =
    document.getElementById(
      "inputCariBuku"
    );

  const idSiswa =
    inputSiswa
      ? inputSiswa.value.trim()
      : "";

  const idBuku =
    inputBuku
      ? inputBuku.value.trim()
      : "";

  if (!idSiswa) {

    alert("Masukkan ID siswa.");

    return;
  }

  if (!idBuku) {

    alert("Masukkan ID buku.");

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

    if (
      typeof loadStatistik ===
      "function"
    ) {
      loadStatistik();
    }

  } catch (error) {

    console.error(error);

    alert(
      "Gagal menghubungi Google Apps Script."
    );
  }
}


/************************************************************
 * KEMBALIKAN BUKU
 ************************************************************/
async function prosesKembalikan(
  idTransaksi
) {

  if (!idTransaksi) {

    alert(
      "ID transaksi tidak ditemukan."
    );

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

    /*
     * Refresh data
     */
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
 * ESCAPE HTML
 ************************************************************/
function escapeHTML(value) {

  return String(
    value == null ? "" : value
  )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/************************************************************
 * ESCAPE JAVASCRIPT
 ************************************************************/
function escapeJS(value) {

  return String(
    value == null ? "" : value
  )
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}


/************************************************************
 * LOAD STATISTIK SAAT HALAMAN DIBUKA
 ************************************************************/
document.addEventListener(
  "DOMContentLoaded",
  function() {

    setTimeout(
      function() {
        loadStatistik();
      },
      500
    );

  }
);
