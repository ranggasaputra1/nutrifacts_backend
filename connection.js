// Koneksi ke Database MySql
const mysql = require('mysql');
const connection = mysql.createConnection({
  host: '34.101.221.64',
  user: 'root',
  password: 'capstone-project-CH2-PS588',
  database: 'capstone-project',
});
connection.connect((err) => {
  if (err) {
    console.error('MySQL connection failed: ' + err.stack);
    return;
  }

  console.log('Successfully connect to MySQL');
});

module.exports = connection