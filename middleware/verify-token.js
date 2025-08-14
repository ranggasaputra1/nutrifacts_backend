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
    expiresIn: expiresIn, // Mengatur token agar kedaluwarsa dalam 1 hari
  };

  const secretKey = "nutrifacts";

  try {
    const token = jwt.sign(payload, secretKey, options);
    console.log("Token generated successfully:", token);
    return token;
  } catch (error) {
    console.error("Error generating token:", error);
    throw new Error("Failed to generate token");
  }
}

// Middleware untuk verifikasi token
function authenticateToken(req, res, next) {
  // Mendapatkan token dari header Authorization
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: Missing token" });
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
    console.error("Error verifying token:", error);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
}

module.exports = { generateToken, authenticateToken };
