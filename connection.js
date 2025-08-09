// Koneksi ke Database MySql
const mysql = require("mysql");
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "nutrifacts",
});
connection.connect((err) => {
  if (err) {
    console.error("MySQL connection failed: " + err.stack);
    return;
  }

  console.log("Successfully connect to MySQL");
});

module.exports = connection;
