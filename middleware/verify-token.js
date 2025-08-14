const jwt = require("jsonwebtoken");

function generateToken(user) {
  // Waktu kedaluwarsa 365 hari
  const expiresIn = "365d";

  const payload = {
    userId: user.user_id,
    username: user.username,
    role: user.isPremium,
  };

  const options = {
    algorithm: "HS256",
    expiresIn: expiresIn, // Mengatur token agar kedaluwarsa dalam 365 hari
  };

  const secretKey = "nutrifacts";

  try {
    const token = jwt.sign(payload, secretKey, options);
    console.log("Token berhasil dibuat:", token);
    return token;
  } catch (error) {
    console.error("Kesalahan saat membuat token:", error);
    throw new Error("Gagal membuat token");
  }
}

// Middleware untuk verifikasi token
function authenticateToken(req, res, next) {
  // Mendapatkan token dari header Authorization
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Tidak Terautentikasi: Token tidak ditemukan" });
  }

  const secretKey = "nutrifacts";

  try {
    // Verifikasi token
    const decoded = jwt.verify(token, secretKey);

    // Menambahkan informasi user ke objek request untuk digunakan di rute berikutnya
    req.user = decoded;

    // Melanjutkan ke rute berikutnya
    next();
  } catch (error) {
    console.error("Kesalahan saat verifikasi token:", error);
    return res
      .status(401)
      .json({ message: "Tidak Terautentikasi: Token tidak valid" });
  }
}

module.exports = { generateToken, authenticateToken };
