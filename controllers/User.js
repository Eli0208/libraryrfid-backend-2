const userModel = require("../models/User"); // Import the user model
const jwt = require("jsonwebtoken"); // For generating JWT tokens
const bcrypt = require("bcryptjs");
const { createLog, getAllLog } = require("../models/Login");

// Register a new user
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  // Check if all fields are provided
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields" });
  }

  try {
    // Check if the user already exists
    const existingUser = await userModel.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create the new user
    const userId = await userModel.createUser(name, email, password);

    // Generate JWT token
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: "9h",
    });

    // Respond with success
    res.status(201).json({
      message: "User registered successfully",
      user: { id: userId, name, email },
      token,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password" });
  }

  try {
    // Fetch the user by email
    const user = await userModel.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.idNo,
        role: user.role,
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    // Log the login action in the database
    await createLog(user.idNo, user.name, "login");

    // Respond with the token and user details
    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user.idNo, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const logoutUser = async (req, res) => {
  const { userId, name } = req.body; // Expect both userId and name in the request body

  // Validate the request
  if (!userId || !name) {
    return res
      .status(400)
      .json({ message: "User ID and name are required for logout" });
  }

  try {
    // Call createLog function to log the logout action
    await createLog(userId, name, "logout");

    // Respond with success message
    res.status(200).json({ message: `Logout successful for ${name}` });
  } catch (error) {
    console.error("Error logging out user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllLogs = async (req, res) => {
  try {
    // Fetch all logs from the database
    const logs = await getAllLog();

    // Respond with the logs
    res.status(200).json({
      message: "Logs retrieved successfully",
      logs,
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    // Fetch all users using the model
    const users = await userModel.findAllUsers();

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    // Respond with the list of users
    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const editUser = async (req, res) => {
  const { userId } = req.params; // Get the user ID from route parameters
  const { name, email, password, role } = req.body; // Include 'role' in the request body

  // Check if at least one field is provided for update
  if (!name && !email && !password && !role) {
    return res
      .status(400)
      .json({ message: "Please provide at least one field to update" });
  }

  try {
    const fieldsToUpdate = { name, email, role };

    // If password is provided, hash it before updating
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      fieldsToUpdate.password = hashedPassword;
    }

    // Update the user using the model
    const result = await userModel.updateUser(userId, fieldsToUpdate);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteUser = async (req, res) => {
  const { userId } = req.params; // Get the user ID from route parameters

  try {
    // Attempt to delete the user
    const result = await userModel.deleteUserById(userId);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getAllLogs,
  getAllUsers,
  editUser,
  deleteUser,
};
