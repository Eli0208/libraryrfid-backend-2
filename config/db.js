const mysql = require("mysql2");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const promisePool = pool.promise(); // This will use the promise-based API for async/await

module.exports = promisePool;
