// Koneksi ke Database MySql
const mysql = require("mysql");
const connection = mysql.createConnection({
  host: "sql12.freesqldatabase.com",
  user: "sql12793979",
  password: "ka23dtcQZt",
  database: "sql12793979",
});
connection.connect((err) => {
  if (err) {
    console.error("MySQL connection failed: " + err.stack);
    return;
  }

  console.log("Successfully connect to MySQL");
});

module.exports = connection;
