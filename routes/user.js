var express = require("express");
var router = express.Router();
const db = require("../connection");
const { generateToken } = require("../middleware/verify-token");
const { authenticateToken } = require("../middleware/verify-token");

// --- Route Login dan Signup (Biarkan di atas) ---
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Mohon sediakan email dan kata sandi untuk login",
    });
  }

  const sql = "SELECT * FROM user WHERE email = ?";
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error("Error during login:", err);
      return res
        .status(500)
        .json({ success: false, message: "Kesalahan Internal Server" });
    }

    if (results.length === 0) {
      return res.status(401).json({
        success: false,
        message:
          "Akun tidak ditemukan. Pastikan email dan kata sandi sudah benar",
      });
    }

    const user = results[0];
    const isPasswordMatch = password === user.password;

    if (isPasswordMatch) {
      const token = generateToken(user);
      return res.status(200).json({
        success: true,
        message: "Login Berhasil",
        userId: user.user_id,
        username: user.username,
        token,
      });
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Kata sandi salah" });
    }
  });
});

router.post("/signup", (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "Mohon sediakan email, username, dan kata sandi.",
      });
    }

    if (!email.includes("@")) {
      return res.status(400).json({
        success: false,
        message:
          "Format email tidak valid. Mohon gunakan alamat email yang valid.",
      });
    }

    const checkEmailQuery = "SELECT * FROM user WHERE email = ?";
    db.query(checkEmailQuery, [email], (checkEmailErr, checkEmailResult) => {
      if (checkEmailErr) {
        console.error("Error checking email:", checkEmailErr);
        return res
          .status(500)
          .json({ success: false, message: "Kesalahan Internal Server" });
      }

      if (checkEmailResult.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Email sudah terdaftar. Mohon gunakan email lain.",
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: "Kata sandi harus memiliki panjang minimal 8 karakter.",
        });
      }

      const insertUserQuery =
        "INSERT INTO user (email, username, password) VALUES (?, ?, ?)";
      db.query(
        insertUserQuery,
        [email, username, password],
        (insertErr, result) => {
          if (insertErr) {
            console.error("Error during user registration:", insertErr);
            return res
              .status(500)
              .json({ success: false, message: "Kesalahan Internal Server" });
          }

          if (result.affectedRows > 0) {
            return res.status(200).json({
              success: true,
              message: "Pengguna berhasil terdaftar",
            });
          } else {
            return res
              .status(500)
              .json({ success: false, message: "Gagal mendaftarkan pengguna" });
          }
        }
      );
    });
  } catch (error) {
    console.error("Error during user registration:", error);
    res
      .status(500)
      .json({ success: false, message: "Kesalahan Internal Server" });
  }
});

// --- Rute-rute spesifik ditempatkan di atas rute umum `/:id` ---

// Route penanganan jika tidak memasukkan ID untuk history
router.get("/history", authenticateToken, (req, res) => {
  return res.status(400).json({
    success: false,
    message:
      "ID Pengguna harus disediakan untuk melihat riwayat. Mohon masukkan ID yang valid",
  });
});

// Rute untuk mendapatkan data userhistory berdasarkan ID (Disesuaikan)
router.get("/history/:id", authenticateToken, (req, res) => {
  const userId = req.params.id;
  const query = "SELECT * FROM userhistory WHERE id_user = ?";
  db.query(query, [userId], (error, results) => {
    if (error) {
      console.error("Failed to get user history data: " + error.message);
      return res
        .status(500)
        .json({ error: "Gagal mendapatkan data riwayat pengguna" });
    }
    if (results.length === 0) {
      return res
        .status(404)
        .json({ error: "Riwayat Pengguna tidak ditemukan" });
    } else {
      return res.json(results);
    }
  });
});

// Route untuk Post data ke User History (Disesuaikan)
router.post("/history", authenticateToken, (req, res) => {
  const { name, company, photoUrl, barcode, id_user } = req.body;
  const sql =
    "INSERT INTO userhistory (name, company, photoUrl, barcode, id_user) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [name, company, photoUrl, barcode, id_user], (err, result) => {
    if (err) {
      res.status(500).json({ error: "Gagal menyimpan data ke database" });
      throw err;
    }
    res.status(201).json({ message: "Data Riwayat berhasil disimpan" });
  });
});

// Route penanganan jika tidak memasukkan ID untuk saved
router.get("/saved", authenticateToken, (req, res) => {
  return res.status(400).json({
    success: false,
    message:
      "ID Pengguna harus disediakan untuk melihat produk yang disimpan. Mohon masukkan ID yang valid",
  });
});

router.get("/saved/:id", authenticateToken, (req, res) => {
  const userId = req.params.id;
  const query = "SELECT * FROM usersaved WHERE id_user = ?";

  db.query(query, [userId], (error, results) => {
    if (error) {
      console.error("Failed to get user saved data: " + error.message);
      // Jangan matikan proses, return array kosong
      return res.json({
        success: true,
        message:
          "Data produk tersimpan tidak tersedia, mengembalikan daftar kosong",
        UserSaved: [],
      });
    }
    return res.json({
      success: true,
      message:
        "Berhasil mengambil data produk tersimpan berdasarkan ID Pengguna",
      UserSaved: results,
    });
  });
});

// Route untuk Post UserSaved (Disesuaikan)
router.post("/saved", authenticateToken, (req, res) => {
  const { name, company, photoUrl, barcode, id_user } = req.body;
  const sql =
    "INSERT INTO usersaved (name, company, photoUrl, barcode, id_user) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [name, company, photoUrl, barcode, id_user], (err, result) => {
    if (err) {
      res.status(500).json({
        success: false,
        message: "Gagal menyimpan data produk tersimpan ke database",
      });
      throw err;
    }
    res.status(201).json({
      success: true,
      message: "Data produk tersimpan berhasil disimpan ke database",
    });
  });
});

// Rute untuk menghapus data usersaved berdasarkan Id
router.delete("/saved/:id", authenticateToken, (req, res) => {
  const usersavedId = req.params.id;

  const checkUserQuery = "SELECT * FROM usersaved WHERE id = ?";
  db.query(checkUserQuery, [usersavedId], (checkError, checkResults) => {
    if (checkError) {
      console.error("Failed to get Usersaved data" + checkError.message);
      return res
        .status(500)
        .json({
          success: false,
          message: "Gagal mendapatkan data produk tersimpan",
        });
    }
    if (checkResults.length === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Data produk tersimpan tidak ditemukan",
        });
    }
    const deleteUserQuery = "DELETE FROM usersaved WHERE id = ?";
    db.query(deleteUserQuery, [usersavedId], (deleteError) => {
      if (deleteError) {
        console.error("Failed to delete Usersaved data" + deleteError.message);
        return res
          .status(500)
          .json({
            success: false,
            message: "Gagal menghapus data produk tersimpan",
          });
      }
      return res
        .status(200)
        .json({
          success: true,
          message: "Data produk tersimpan telah dihapus",
        });
    });
  });
});

// Route get all data user
router.get("/", authenticateToken, (req, res) => {
  const query = "SELECT * FROM user";
  db.query(query, (error, results) => {
    if (error) {
      console.error("Error in MySQL query: " + error.message);
      res
        .status(500)
        .json({ success: false, message: "Error dalam query MySQL" });
      return;
    }
    const usersWithoutPassword = results.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    res.json({
      message: "Berhasil",
      user: req.user,
      data: usersWithoutPassword,
    });
  });
});

// Rute untuk Update data pengguna berdasarkan ID
router.put("/:id", authenticateToken, (req, res) => {
  const userId = req.params.id;
  const { username, email, password, photoUrl } = req.body;

  let updateValues = [];
  let updateFields = [];

  if (photoUrl) {
    updateFields.push("photoUrl = ?");
    updateValues.push(photoUrl);
  }

  if (username) {
    updateFields.push("username = ?");
    updateValues.push(username);
  }

  if (email) {
    updateFields.push("email = ?");
    updateValues.push(email);
  }

  if (password) {
    if (password.length < 8) {
      return res
        .status(400)
        .json({
          message: "Kata sandi harus memiliki panjang minimal 8 karakter",
        });
    }
    updateFields.push("password = ?");
    updateValues.push(password);
  }

  if (updateFields.length === 0) {
    return res
      .status(400)
      .json({ message: "Tidak ada bidang untuk diperbarui" });
  }

  let updateUserQuery =
    "UPDATE user SET " + updateFields.join(", ") + " WHERE user_id = ?";
  updateValues.push(userId);

  db.query(updateUserQuery, updateValues, (updateError, updateResults) => {
    if (updateError) {
      console.error("Failed to update user data" + updateError.message);
      return res.status(500).json({ error: "Gagal memperbarui data pengguna" });
    }

    if (updateResults.affectedRows === 0) {
      return res
        .status(404)
        .json({
          error:
            "Pengguna tidak ditemukan atau tidak ada perubahan yang dibuat",
        });
    }

    const getUpdatedUserQuery = "SELECT * FROM user WHERE user_id = ?";
    db.query(getUpdatedUserQuery, [userId], (getError, getResults) => {
      if (getError) {
        console.error("Failed to get updated user data" + getError.message);
        return res
          .status(500)
          .json({
            error: "Gagal mendapatkan data pengguna yang telah diperbarui",
          });
      }

      const updatedUser = getResults[0];
      delete updatedUser.password;
      return res.status(200).json({
        message: "Pembaruan data pengguna berhasil",
        user: updatedUser,
      });
    });
  });
});

// Rute untuk menghapus data pengguna berdasarkan ID
router.delete("/:id", authenticateToken, (req, res) => {
  const userId = req.params.id;

  const checkUserQuery = "SELECT * FROM user WHERE user_id = ?";
  db.query(checkUserQuery, [userId], (checkError, checkResults) => {
    if (checkError) {
      console.error("Failed to get user data" + checkError.message);
      return res.status(500).json({ error: "Gagal mendapatkan data pengguna" });
    }

    if (checkResults.length === 0) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan" });
    }

    const deleteUserQuery = "DELETE FROM user WHERE user_id = ?";
    db.query(deleteUserQuery, [userId], (deleteError) => {
      if (deleteError) {
        console.error("Failed to delete user data" + deleteError.message);
        return res.status(500).json({ error: "Gagal menghapus data pengguna" });
      }

      return res.status(200).json({ message: "Data pengguna telah dihapus" });
    });
  });
});

// Rute untuk mendapatkan data user berdasarkan ID
router.get("/:id", authenticateToken, (req, res) => {
  const userId = req.params.id;
  const query = "SELECT * FROM user WHERE user_id = ?";
  db.query(query, [userId], (error, results) => {
    if (error) {
      console.error("Failed to get user data: " + error.message);
      return res.status(500).json({ error: "Gagal mendapatkan data pengguna" });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Pengguna tidak ditemukan" });
    } else {
      const user = results[0];
      delete user.password;
      return res.json(user);
    }
  });
});

module.exports = router;
