// Koneksi ke Database MySql
const mysql = require("mysql");
const connection = mysql.createConnection({
  host: "sql12.freesqldatabase.com",
  user: "sql12795913",
  password: "TbD7nMeQxj",
  database: "sql12795913",
});
connection.connect((err) => {
  if (err) {
    console.error("MySQL connection failed: " + err.stack);
    return;
  }

  console.log("Successfully connect to MySQL");
});

module.exports = connection;
