var express = require("express");
var router = express.Router();
const db = require("../connection");
const { authenticateToken } = require("../middleware/verify-token");

// ... import dan middleware lainnya

// Rute untuk mendapatkan semua data produk
router.get("/", authenticateToken, (req, res) => {
  const query = "SELECT * FROM product";

  db.query(query, (error, results) => {
    if (error) {
      console.error("Error in MySQL query:", error.message);
      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat mengambil data produk",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Data produk berhasil diambil",
      products: results,
    });
  });
});

// Route apabila tidak memasukan barcode
router.get("/barcode", authenticateToken, (req, res) => {
  return res.status(400).json({
    success: false,
    message: "Barcode produk harus diisi. Mohon masukkan barcode yang valid",
  });
});

// Rute untuk mendapatkan data Nutrisi Produk berdasarkan Barcode
router.get("/barcode/:barcode", authenticateToken, (req, res) => {
  const barcode = req.params.barcode.trim();

  // Validasi: Pastikan barcode hanya berisi angka dan memiliki panjang yang sesuai
  if (!/^\d+$/.test(barcode)) {
    return res.status(400).json({
      success: false,
      message: "Format barcode tidak valid. Barcode hanya boleh berisi angka",
    });
  }

  const query = `SELECT * FROM product WHERE barcode = ?`;

  db.query(query, [barcode], (error, results) => {
    if (error) {
      console.error("Failed to get Product data: " + error.message);
      return res.status(500).json({
        success: false,
        message: "Gagal mendapatkan data nutrisi produk",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data produk tidak ditemukan / Barcode tidak Valid",
      });
    } else {
      const productData = results[0];
      return res.json({
        success: true,
        message: "Berhasil mendapatkan data nutrisi produk berdasarkan barcode",
        product: productData,
      });
    }
  });
});

//

// Route apabila tidak memasukan Name
router.get("/name", authenticateToken, (req, res) => {
  return res.status(400).json({
    success: false,
    message: "Nama produk harus diisi. Mohon masukkan nama yang valid",
  });
});

// Route menampilkan seluruh data produk berdasarkan name
router.get("/name/:name", authenticateToken, (req, res) => {
  const partialName = req.params.name.trim();

  // Validasi: Pastikan nama tidak kosong setelah di trim
  if (!partialName) {
    return res.status(400).json({
      success: false,
      message: "Nama produk tidak boleh kosong",
    });
  }

  const searchPattern = `%${partialName}%`;
  const query = "SELECT * FROM product WHERE name LIKE ?";

  db.query(query, [searchPattern], (error, results) => {
    if (error) {
      console.error("Error in MySQL query:", error.message);
      return res.status(500).json({
        success: false,
        message:
          "Terjadi kesalahan saat mengambil data produk berdasarkan nama",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tidak ada produk yang ditemukan dengan nama tersebut",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Data produk berhasil diambil berdasarkan nama",
      products: results,
    });
  });
});

// Route apabila tidak memasukan barcode pada product detail
router.get("/detail", authenticateToken, (req, res) => {
  return res.status(400).json({
    success: false,
    message:
      "Detail produk berdasarkan barcode harus diisi. Mohon masukkan barcode yang valid",
  });
});

// Rute untuk mendapatkan detail produk berdasarkan Barcode
router.get("/detail/:barcode", authenticateToken, (req, res) => {
  // ✅ PERBAIKAN: Tambahkan .trim() untuk membersihkan spasi di awal dan akhir
  const barcode = req.params.barcode.trim();

  // Validasi: Pastikan barcode hanya berisi angka dan memiliki panjang yang sesuai
  if (!/^\d+$/.test(barcode)) {
    return res.status(400).json({
      success: false,
      message: "Format barcode tidak valid. Barcode hanya boleh berisi angka",
    });
  }

  // Query ke database untuk mendapatkan data produk berdasarkan Barcode
  const query = "SELECT * FROM product WHERE barcode = ?";
  db.query(query, [barcode], (error, results) => {
    if (error) {
      console.error("Failed to get product data: " + error.message);
      return res
        .status(500)
        .json({ success: false, message: "Gagal mendapatkan data produk" });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Data produk tidak ditemukan, pastikan kode barcode yang dimasukkan benar",
      });
    }
    const productDetail = results[0];
    return res.json({
      success: true,
      message: "Berhasil mendapatkan data detail produk berdasarkan barcode",
      product: productDetail,
    });
  });
});

// Rute untuk menambahkan produk baru
router.post("/", authenticateToken, (req, res) => {
  const {
    name,
    company,
    photoUrl,
    calories,
    fat,
    saturated_fat,
    trans_fat,
    cholesterol,
    sodium,
    carbohydrate,
    dietary_fiber,
    sugar,
    proteins,
    calcium,
    iron,
    vitamin_a,
    vitamin_c,
    vitamin_d,
    label_halal, // <-- Tambahkan label_halal di sini
    nutrition_level,
    barcode,
    information,
    keterangan,
  } = req.body;

  // Validasi: Memastikan data penting tidak kosong
  if (!name || !company || !barcode || !calories) {
    return res.status(400).json({
      success: false,
      message: "Nama produk, perusahaan, barcode, dan kalori harus diisi.",
    });
  }

  // Query untuk memeriksa apakah barcode sudah ada
  const checkBarcodeQuery = "SELECT * FROM product WHERE barcode = ?";
  db.query(checkBarcodeQuery, [barcode], (checkError, checkResults) => {
    if (checkError) {
      console.error("Error checking barcode:", checkError.message);
      return res.status(500).json({
        success: false,
        message: "Kesalahan internal server saat memeriksa barcode.",
      });
    }

    if (checkResults.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Produk dengan barcode ini sudah ada di database.",
      });
    }

    // Query untuk menambahkan data produk baru ke database
    const insertQuery = `INSERT INTO product (name, company, photoUrl, calories, fat, saturated_fat, trans_fat, cholesterol, sodium, carbohydrate, dietary_fiber, sugar, proteins, calcium, iron, vitamin_a, vitamin_c, vitamin_d, label_halal, nutrition_level, barcode, information, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      name,
      company,
      photoUrl,
      calories,
      fat,
      saturated_fat,
      trans_fat,
      cholesterol,
      sodium,
      carbohydrate,
      dietary_fiber,
      sugar,
      proteins,
      calcium,
      iron,
      vitamin_a,
      vitamin_c,
      vitamin_d,
      label_halal, // <-- Tambahkan nilai label_halal di sini
      nutrition_level,
      barcode,
      information,
      keterangan,
    ];

    db.query(insertQuery, values, (error, results) => {
      if (error) {
        console.error("Error inserting new product:", error.message);
        return res.status(500).json({
          success: false,
          message: "Gagal menambahkan produk baru ke database.",
        });
      }

      return res.status(201).json({
        success: true,
        message: "Produk baru berhasil ditambahkan.",
        productId: results.insertId,
      });
    });
  });
});

module.exports = router;
