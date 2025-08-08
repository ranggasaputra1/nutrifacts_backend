var express = require('express');
var router = express.Router();
const db = require('../connection');
const { authenticateToken } = require('../middleware/verify-token');

// Rute untuk mendapatkan semua data produk
router.get('/', authenticateToken, (req, res) => {
  const query = `
      SELECT
       id,
       name,
       company,
       photoUrl,
       barcode
      FROM product
    `;
  db.query(query, (error, results, fields) => {
    if (error) {
      console.error('Error in MySQL query: ' + error.message);
      return res.status(500).json({ success: false, message: 'Error in MySQL query' });
    }
    res.json({ success: true, message: 'Product data has been successfully retrieved', product: results });
  });
});



// Route apabila tidak memasukan barcode
router.get('/barcode', authenticateToken, (req, res) => {
    return res.status(400).json({ success: false, message: 'Product barcode must be filled in. Please enter a valid barcode' });
  });

// Rute untuk mendapatkan data Nutrisi Produk berdasarkan Barcode
router.get('/barcode/:barcode', authenticateToken, (req, res) => {
  const barcode = req.params.barcode;

  const query = `SELECT * FROM product WHERE barcode = ?`;

  db.query(query, [barcode], (error, results, fields) => {
    if (error) {
      console.error('Failed to get Product data: ' + error.message);
      return res.status(500).json({ success: false, message: 'Failed to get product Nutrition data' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Product Nutrition data not found, make sure to enter the barcode code correctly' });
    } else {
      const productData = results[0];
      return res.json({ success: true, message: 'successfully retrieved product Nutrition data by barcode', product: productData });
    }
  });
});


// Route apabila tidak memasukan Name
router.get('/name', authenticateToken, (req, res) => {
    return res.status(400).json({ success: false, message: 'The product name must be filled in. Please enter a valid name' });
  });

// Route Menampilkan Produk berdasarkan Name
  router.get('/name/:name', authenticateToken, (req, res) => {
    const partialName = req.params.name;
  
    // Pilih hanya kolom yang diinginkan
    const query = `
      SELECT
       id,
       name,
       company,
       photoUrl,
       barcode
      FROM product
      WHERE name LIKE ?
    `;
  
    const partialNameWithWildcards = `%${partialName}%`;
  
    db.query(query, [partialNameWithWildcards], (error, results, fields) => {
      if (error) {
        console.error('Failed to get Product data: ' + error.message);
        return res.status(500).json({ success: false, message: 'Failed to get product data' });
      }
  
      if (results.length === 0) {
        const recommendQuery = 'SELECT DISTINCT name FROM product WHERE name LIKE ? LIMIT 5';
        db.query(recommendQuery, [`%${partialName}%`], (recommendError, recommendResults) => {
          if (recommendError) {
            console.error('Failed to get product name : ' + recommendError.message);
            return res.status(500).json({ success: false, message: 'Failed to get product name ' });
          }
  
          const recommendedNames = recommendResults.map(result => result.name);
          return res.status(404).json({ success: false, message: 'Product data not found, Make sure to enter the product name correctly'});
        });
      } else {
        return res.json({ success: true, message: 'successfully retrieved product data by name', product: results });
      }
    });
  });
  

// Route apabila tidak memasukan barcode pada product detail
router.get('/detail', authenticateToken, (req, res) => {
    return res.status(400).json({ success: false, message: 'Product details by barcode must be filled in. Please enter a valid barcode' });
  });

// Rute untuk mendapatkan detail produk berdasarkan Barcode
router.get('/detail/:barcode', authenticateToken, (req, res) => {
  const barcode = req.params.barcode;

  // Query ke database untuk mendapatkan data produk berdasarkan Barcode
  const query = 'SELECT * FROM product WHERE barcode = ?';
  db.query(query, [barcode], (error, results, fields) => {
    if (error) {
      console.error('Failed to get product data: ' + error.message);
      return res.status(500).json({ success: false, message: 'Failed to get product data' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Product data not found, make sure to enter the barcode code correctly' });
    }
    const productDetail = results[0];
    return res.json({ success: true, message: 'successfully retrieved detailed product data by barcode', product: productDetail });
  });
});

module.exports = router;
