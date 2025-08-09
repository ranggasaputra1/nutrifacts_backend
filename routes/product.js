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
        message: "Error retrieving product data",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product data retrieved successfully",
      products: results,
    });
  });
});

// Route apabila tidak memasukan barcode
router.get("/barcode", authenticateToken, (req, res) => {
  return res.status(400).json({
    success: false,
    message: "Product barcode must be filled in. Please enter a valid barcode",
  });
});

// Rute untuk mendapatkan data Nutrisi Produk berdasarkan Barcode
router.get("/barcode/:barcode", authenticateToken, (req, res) => {
  const barcode = req.params.barcode.trim();

  // Validasi: Pastikan barcode hanya berisi angka dan memiliki panjang yang sesuai
  if (!/^\d+$/.test(barcode)) {
    return res.status(400).json({
      success: false,
      message: "Invalid barcode format. Barcode must contain only numbers",
    });
  }

  const query = `SELECT * FROM product WHERE barcode = ?`;

  db.query(query, [barcode], (error, results) => {
    if (error) {
      console.error("Failed to get Product data: " + error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to get product Nutrition data",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Product Nutrition data not found, make sure to enter the barcode code correctly",
      });
    } else {
      const productData = results[0];
      return res.json({
        success: true,
        message: "successfully retrieved product Nutrition data by barcode",
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
    message: "The product name must be filled in. Please enter a valid name",
  });
});

// Route menampilkan seluruh data produk berdasarkan name
router.get("/name/:name", authenticateToken, (req, res) => {
  const partialName = req.params.name.trim();

  // Validasi: Pastikan nama tidak kosong setelah di trim
  if (!partialName) {
    return res.status(400).json({
      success: false,
      message: "Product name must not be empty",
    });
  }

  const searchPattern = `%${partialName}%`;
  const query = "SELECT * FROM product WHERE name LIKE ?";

  db.query(query, [searchPattern], (error, results) => {
    if (error) {
      console.error("Error in MySQL query:", error.message);
      return res.status(500).json({
        success: false,
        message: "Error retrieving product data by name",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No products found with the given name",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product data retrieved successfully by name",
      products: results,
    });
  });
});

// Route apabila tidak memasukan barcode pada product detail
router.get("/detail", authenticateToken, (req, res) => {
  return res.status(400).json({
    success: false,
    message:
      "Product details by barcode must be filled in. Please enter a valid barcode",
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
      message: "Invalid barcode format. Barcode must contain only numbers",
    });
  }

  // Query ke database untuk mendapatkan data produk berdasarkan Barcode
  const query = "SELECT * FROM product WHERE barcode = ?";
  db.query(query, [barcode], (error, results) => {
    if (error) {
      console.error("Failed to get product data: " + error.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to get product data" });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Product data not found, make sure to enter the barcode code correctly",
      });
    }
    const productDetail = results[0];
    return res.json({
      success: true,
      message: "successfully retrieved detailed product data by barcode",
      product: productDetail,
    });
  });
});

module.exports = router;
