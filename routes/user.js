var express = require("express");
var router = express.Router();
const db = require("../connection");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { generateToken } = require("../middleware/verify-token");
const { authenticateToken } = require("../middleware/verify-token");

// // Route Login User
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Memeriksa apakah email dan password diinputkan
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide both email and password for login",
    });
  }

  const sql = "SELECT * FROM user WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error("Error during login:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }

    if (results.length === 0) {
      return res.status(401).json({
        success: false,
        message:
          "Account not Found. Make sure the email and password are correct",
      });
    }

    const user = results[0];

    // Memeriksa apakah password cocok
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    console.log("Input Password:", password);
    console.log("Stored Hashed Password:", user.password);
    console.log("Password Match:", isPasswordMatch);

    if (isPasswordMatch) {
      // Jika otentikasi berhasil, generate token
      const token = generateToken(user);

      return res.status(200).json({
        success: true,
        message: "Login Successful",
        userId: user.user_id,
        username: user.username,
        token,
      });
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Incorrect Password" });
    }
  });
});

// Route untuk signup user
router.post("/signup", async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Periksa apakah email, username, dan password telah diinputkan
    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email, username, and password.",
      });
    }

    // Periksa apakah email mengandung karakter '@'
    if (!email.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format. Please use a valid email address.",
      });
    }

    // Periksa apakah email sudah ada di database
    const checkEmailQuery = "SELECT * FROM user WHERE email = ?";
    db.query(
      checkEmailQuery,
      [email],
      async (checkEmailErr, checkEmailResult) => {
        if (checkEmailErr) {
          console.error("Error checking email:", checkEmailErr);
          return res
            .status(500)
            .json({ success: false, message: "Internal Server Error" });
        }

        // Jika email sudah ada, beri respons
        if (checkEmailResult.length > 0) {
          return res.status(400).json({
            success: false,
            message: "Email already exists. Please use a different email.",
          });
        }

        // Periksa panjang password
        if (password.length < 8) {
          return res.status(400).json({
            success: false,
            message: "Password should be at least 8 characters long.",
          });
        }

        // Hash password sebelum menyimpan ke database
        const hashedPassword = bcrypt.hashSync(password, 10);

        const createdat = new Date();

        // Query untuk insert user baru ke database dengan createdat
        const insertUserQuery =
          "INSERT INTO user (email, username, password, createdat) VALUES (?, ?, ?, ?)";
        db.query(
          insertUserQuery,
          [email, username, hashedPassword, createdat],
          (insertErr, result) => {
            if (insertErr) {
              console.error("Error during user registration:", insertErr);
              return res
                .status(500)
                .json({ success: false, message: "Internal Server Error" });
            }

            if (result.affectedRows > 0) {
              return res.status(200).json({
                success: true,
                message: "User Registered Successfully",
              });
            } else {
              return res
                .status(500)
                .json({ success: false, message: "Failed to Register User" });
            }
          }
        );
      }
    );
  } catch (error) {
    console.error("Error during user registration:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Route get all data user
router.get("/", authenticateToken, (req, res) => {
  const query = "SELECT * FROM user";
  db.query(query, (error, results, fields) => {
    if (error) {
      console.error("Error in MySQL query: " + error.message);
      res.status(500).send("Error in MySQL query");
      return;
    }
    res.json({ message: "Success", user: req.user, data: results });
  });
});

// Rute untuk mendapatkan data user berdasarkan ID
router.get("/:id", authenticateToken, (req, res) => {
  const userId = req.params.id;
  // Query ke database untuk mendapatkan data user berdasarkan ID
  const query = "SELECT * FROM user WHERE user_id = ?";
  db.query(query, [userId], (error, results, fields) => {
    if (error) {
      console.error("Failed to get user data: " + error.message);
      return res.status(500).json({ error: "Failed to get user data" });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    } else {
      const user = results[0];
      delete user.password;
      return res.json(user);
    }
  });
});

// Rute untuk Update data pengguna dan Photo Url berdasarkan ID
router.put("/:id", authenticateToken, async (req, res) => {
  const userId = req.params.id;
  const { username, email, password, photoUrl } = req.body;

  try {
    // Validasi panjang password
    if (password && password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    // Hash kata sandi menggunakan bcrypt jika ada perubahan kata sandi
    let hashedPassword = password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Periksa apakah pengguna sudah ada sebelum memperbarui data
    const checkUserQuery = "SELECT * FROM user WHERE user_id = ?";
    db.query(
      checkUserQuery,
      [userId],
      async (checkError, checkResults, checkFields) => {
        if (checkError) {
          console.error("Failed to get user data" + checkError.message);
          return res.status(500).json({ error: "Failed to get user data" });
        } else if (checkResults.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        // Update data User
        let updateUserQuery = "UPDATE user SET";
        let updateValues = [];

        if (photoUrl) {
          updateUserQuery += " photoUrl = ?,";
          updateValues.push(photoUrl);
        }

        if (username) {
          updateUserQuery += " username = ?,";
          updateValues.push(username);
        }

        if (email) {
          updateUserQuery += " email = ?,";
          updateValues.push(email);
        }

        if (password) {
          updateUserQuery += " password = ?,";
          updateValues.push(hashedPassword);
        }

        // Hapus koma terakhir
        updateUserQuery = updateUserQuery.slice(0, -1);

        updateUserQuery += " WHERE user_id = ?";
        updateValues.push(userId);

        db.query(
          updateUserQuery,
          updateValues,
          (updateError, updateResults, updateFields) => {
            if (updateError) {
              console.error("Failed to update user data" + updateError.message);
              return res
                .status(500)
                .json({ error: "Failed to update user data" });
            }

            // Query untuk mendapatkan data user yang baru saja diperbarui
            const getUpdatedUserQuery = "SELECT * FROM user WHERE user_id = ?";
            db.query(
              getUpdatedUserQuery,
              [userId],
              (getError, getResults, getFields) => {
                if (getError) {
                  console.error(
                    "Failed to get updated user data" + getError.message
                  );
                  return res
                    .status(500)
                    .json({ error: "Failed to get updated user data" });
                }

                const updatedUser = getResults[0];
                // Kirim respons dengan data user yang baru saja diperbarui
                return res.status(200).json({
                  message: "Update user data successful",
                  user: updatedUser,
                });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error("Error in updating user data: " + error.message);
    return res.status(500).json({ error: "Error in updating user data" });
  }
});

// Rute untuk menghapus data pengguna berdasarkan ID
router.delete("/:id", authenticateToken, (req, res) => {
  const userId = req.params.id;

  const checkUserQuery = "SELECT * FROM user WHERE user_id = ?";
  db.query(
    checkUserQuery,
    [userId],
    (checkError, checkResults, checkFields) => {
      if (checkError) {
        console.error("Failed to get user data" + checkError.message);
        return res.status(500).json({ error: "Failed to get user data" });
      }

      if (checkResults.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const deleteUserQuery = "DELETE FROM user WHERE user_id = ?";
      db.query(
        deleteUserQuery,
        [userId],
        (deleteError, deleteResults, deleteFields) => {
          if (deleteError) {
            console.error("Failed to delete user data" + deleteError.message);
            return res
              .status(500)
              .json({ error: "Failed to delete user data" });
          }

          return res
            .status(200)
            .json({ message: "User data has been deleted" });
        }
      );
    }
  );
});

// Rute untuk mendapatkan data userhistory berdasarkan ID
router.get("/history/:id", authenticateToken, (req, res) => {
  const userId = req.params.id;
  // Query ke database untuk mendapatkan data userhistory berdasarkan ID
  const query = "SELECT * FROM userhistory WHERE user_id = ?";
  db.query(query, [userId], (error, results, fields) => {
    if (error) {
      console.error("Failed to get user history data: " + error.message);
      return res.status(500).json({ error: "Failed to get user history data" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "User History not found" });
    } else {
      return res.json(results);
    }
  });
});

// Route untuk Post data ke User History
router.post("/history", authenticateToken, (req, res) => {
  const { name, company, photoUrl, barcode, user_id } = req.body;

  // Query untuk menyimpan data ke database
  const sql =
    "INSERT INTO userhistory (name, company, photoUrl, barcode, user_id) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [name, company, photoUrl, barcode, user_id], (err, result) => {
    if (err) {
      res.status(500).json({ error: "Failed to save data to database" });
      throw err;
    }
    res
      .status(201)
      .json({ message: "The data History has been successfully saved" });
  });
});

// Rute untuk mendapatkan data usersaved berdasarkan user_id
router.get("/saved/:id", authenticateToken, (req, res) => {
  const userId = req.params.id;
  // Query ke database untuk mendapatkan data usersaved berdasarkan ID
  const query = "SELECT * FROM usersaved WHERE user_id = ?";
  db.query(query, [userId], (error, results, fields) => {
    if (error) {
      console.error("Failed to get user saved data: " + error.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to get UserSaved data" });
    }
    return res.json({
      success: true,
      message: "Successfully retrieved Usersaved data by UserId",
      UserSaved: results,
    });
  });
});

// Route untuk Post UserSaved
router.post("/saved", authenticateToken, (req, res) => {
  const { name, company, photoUrl, barcode, user_id } = req.body;

  // Query untuk menyimpan data ke database
  const sql =
    "INSERT INTO usersaved (name, company, photoUrl, barcode, user_id) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [name, company, photoUrl, barcode, user_id], (err, result) => {
    if (err) {
      res.status(500).json({
        success: false,
        message: "Failed to save Usersaved data to database",
      });
      throw err;
    }
    res.status(201).json({
      success: true,
      message: "The data Usersaved has been successfully saved",
    });
  });
});

// Rute untuk menghapus data usersaved berdasarkan Id
router.delete("/saved/:id", authenticateToken, (req, res) => {
  const usersavedId = req.params.id;

  const checkUserQuery = "SELECT * FROM usersaved WHERE id = ?";
  db.query(
    checkUserQuery,
    [usersavedId],
    (checkError, checkResults, checkFields) => {
      if (checkError) {
        console.error("Failed to get Usersaved data" + checkError.message);
        return res
          .status(500)
          .json({ success: false, message: "Failed to get Usersaved data" });
      }

      if (checkResults.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Usersaved data not found" });
      }

      const deleteUserQuery = "DELETE FROM usersaved WHERE id = ?";
      db.query(
        deleteUserQuery,
        [usersavedId],
        (deleteError, deleteResults, deleteFields) => {
          if (deleteError) {
            console.error(
              "Failed to delete Usersaved data" + deleteError.message
            );
            return res.status(500).json({
              success: false,
              message: "Failed to delete Usersaved data",
            });
          }

          return res.status(200).json({
            success: true,
            message: "Usersaved data has been deleted",
          });
        }
      );
    }
  );
});

module.exports = router;
