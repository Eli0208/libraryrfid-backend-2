const db = require("../config/db"); // MySQL connection
const bcrypt = require("bcryptjs"); // For hashing passwords

// Create a new user with optional role (default is 'admin')
const createUser = async (name, email, password, role = "user") => {
  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert user into the database
  const [result] = await db.execute(
    "INSERT INTO user (name, email, password, role) VALUES (?, ?, ?, ?)",
    [name, email, hashedPassword, role]
  );

  return result.insertId; // Return the new user's ID
};

// Get user by email (to check login or registration)
const getUserByEmail = async (email) => {
  const [rows] = await db.execute("SELECT * FROM user WHERE email = ?", [
    email,
  ]);
  return rows.length > 0 ? rows[0] : null; // Return the user object or null
};

// Get user by ID (for user details or update)
const getUserById = async (id) => {
  const [rows] = await db.execute("SELECT * FROM user WHERE idNo = ?", [id]);
  return rows.length > 0 ? rows[0] : null;
};

// Compare password (used in login to compare hashed passwords)
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

const findAllUsers = async () => {
  const query = "SELECT idNo, name, email, role FROM User";
  const [rows] = await db.execute(query);
  return rows;
};

const updateUser = async (userId, fieldsToUpdate) => {
  const { name, email, password, role } = fieldsToUpdate;

  // Build dynamic query and values array
  let query = "UPDATE User SET ";
  const values = [];

  if (name) {
    query += "name = ?, ";
    values.push(name);
  }
  if (email) {
    query += "email = ?, ";
    values.push(email);
  }
  if (password) {
    query += "password = ?, ";
    values.push(password);
  }
  if (role) {
    query += "role = ?, ";
    values.push(role);
  }

  // Remove trailing comma and space
  query = query.slice(0, -2);

  // Add the WHERE clause
  query += " WHERE idNo = ?";
  values.push(userId);

  // Execute the query
  const [result] = await db.execute(query, values);
  return result;
};

const deleteUserById = async (userId) => {
  const query = "DELETE FROM User WHERE idNo = ?";
  const [result] = await db.execute(query, [userId]);
  return result;
};

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
  comparePassword,
  findAllUsers,
  updateUser,
  deleteUserById,
};
