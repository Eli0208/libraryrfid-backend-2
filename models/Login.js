const db = require("../config/db"); // MySQL connection

// Create a log entry for login or logout
const createLog = async (userId, name, action) => {
  const query =
    "INSERT INTO LogIns (idNo, name, action, time, date) VALUES (?, ?, ?, NOW(), CURDATE())";
  const [result] = await db.execute(query, [userId, name, action]);
  return result;
};

const getAllLog = async () => {
  const query = "SELECT * FROM LogIns"; // Query to get all logs
  const [logs] = await db.execute(query); // Execute the query
  return logs; // Return the result
};

module.exports = {
  createLog,
  getAllLog,
};
