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
      message: "Please provide both email and password for login",
    });
  }

  const sql = "SELECT * FROM user WHERE email = ?";
  db.query(sql, [email], (err, results) => {
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
    const isPasswordMatch = password === user.password;

    if (isPasswordMatch) {
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

router.post("/signup", (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email, username, and password.",
      });
    }

    if (!email.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format. Please use a valid email address.",
      });
    }

    const checkEmailQuery = "SELECT * FROM user WHERE email = ?";
    db.query(checkEmailQuery, [email], (checkEmailErr, checkEmailResult) => {
      if (checkEmailErr) {
        console.error("Error checking email:", checkEmailErr);
        return res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }

      if (checkEmailResult.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Email already exists. Please use a different email.",
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: "Password should be at least 8 characters long.",
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
    });
  } catch (error) {
    console.error("Error during user registration:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// --- Rute-rute spesifik ditempatkan di atas rute umum `/:id` ---

// Route penanganan jika tidak memasukkan ID untuk history
router.get("/history", authenticateToken, (req, res) => {
  return res.status(400).json({
    success: false,
    message: "User ID must be provided to get history. Please enter a valid ID",
  });
});

// Rute untuk mendapatkan data userhistory berdasarkan ID (Disesuaikan)
router.get("/history/:id", authenticateToken, (req, res) => {
  const userId = req.params.id;
  const query = "SELECT * FROM userhistory WHERE id_user = ?";
  db.query(query, [userId], (error, results) => {
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

// Route untuk Post data ke User History (Disesuaikan)
router.post("/history", authenticateToken, (req, res) => {
  const { name, company, photoUrl, barcode, id_user } = req.body;
  const sql =
    "INSERT INTO userhistory (name, company, photoUrl, barcode, id_user) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [name, company, photoUrl, barcode, id_user], (err, result) => {
    if (err) {
      res.status(500).json({ error: "Failed to save data to database" });
      throw err;
    }
    res
      .status(201)
      .json({ message: "The data History has been successfully saved" });
  });
});

// Route penanganan jika tidak memasukkan ID untuk saved
router.get("/saved", authenticateToken, (req, res) => {
  return res.status(400).json({
    success: false,
    message:
      "User ID must be provided to get saved products. Please enter a valid ID",
  });
});

// Rute untuk mendapatkan data usersaved berdasarkan user_id (Disesuaikan)
router.get("/saved/:id", authenticateToken, (req, res) => {
  const userId = req.params.id;
  const query = "SELECT * FROM usersaved WHERE id_user = ?";
  db.query(query, [userId], (error, results) => {
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

// Route untuk Post UserSaved (Disesuaikan)
router.post("/saved", authenticateToken, (req, res) => {
  const { name, company, photoUrl, barcode, id_user } = req.body;
  const sql =
    "INSERT INTO usersaved (name, company, photoUrl, barcode, id_user) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [name, company, photoUrl, barcode, id_user], (err, result) => {
    if (err) {
      res.status(500).json({
        success: false,
        message: "Failed to save Usersaved data to database",
      });
      throw err;
    }
    res.status(201).json({
      success: true,
      message: "The data Usersaved has been successfully saved into database",
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
        .json({ success: false, message: "Failed to get Usersaved data" });
    }
    if (checkResults.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Usersaved data not found" });
    }
    const deleteUserQuery = "DELETE FROM usersaved WHERE id = ?";
    db.query(deleteUserQuery, [usersavedId], (deleteError) => {
      if (deleteError) {
        console.error("Failed to delete Usersaved data" + deleteError.message);
        return res
          .status(500)
          .json({ success: false, message: "Failed to delete Usersaved data" });
      }
      return res
        .status(200)
        .json({ success: true, message: "Usersaved data has been deleted" });
    });
  });
});

// --- Rute-rute yang lebih umum (`/` dan `/:id`) diletakkan di bawah ---

// Route get all data user
router.get("/", authenticateToken, (req, res) => {
  const query = "SELECT * FROM user";
  db.query(query, (error, results) => {
    if (error) {
      console.error("Error in MySQL query: " + error.message);
      res.status(500).json({ success: false, message: "Error in MySQL query" });
      return;
    }
    const usersWithoutPassword = results.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    res.json({
      message: "Success",
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
        .json({ message: "Password must be at least 8 characters long" });
    }
    updateFields.push("password = ?");
    updateValues.push(password);
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ message: "No fields to update" });
  }

  let updateUserQuery =
    "UPDATE user SET " + updateFields.join(", ") + " WHERE user_id = ?";
  updateValues.push(userId);

  db.query(updateUserQuery, updateValues, (updateError, updateResults) => {
    if (updateError) {
      console.error("Failed to update user data" + updateError.message);
      return res.status(500).json({ error: "Failed to update user data" });
    }

    if (updateResults.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "User not found or no changes made" });
    }

    const getUpdatedUserQuery = "SELECT * FROM user WHERE user_id = ?";
    db.query(getUpdatedUserQuery, [userId], (getError, getResults) => {
      if (getError) {
        console.error("Failed to get updated user data" + getError.message);
        return res
          .status(500)
          .json({ error: "Failed to get updated user data" });
      }

      const updatedUser = getResults[0];
      delete updatedUser.password;
      return res.status(200).json({
        message: "Update user data successful",
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
      return res.status(500).json({ error: "Failed to get user data" });
    }

    if (checkResults.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const deleteUserQuery = "DELETE FROM user WHERE user_id = ?";
    db.query(deleteUserQuery, [userId], (deleteError) => {
      if (deleteError) {
        console.error("Failed to delete user data" + deleteError.message);
        return res.status(500).json({ error: "Failed to delete user data" });
      }

      return res.status(200).json({ message: "User data has been deleted" });
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

module.exports = router;
