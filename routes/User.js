const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  getAllLogs,
  getAllUsers,
  editUser,
  deleteUser,
  forgotPassword,
  resetPassword,
} = require("../controllers/User"); // Import the controller
const { verifyToken, verifyAdmin } = require("../middlewares/Auth");
const router = express.Router();

// Route for registering a new user
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/all-logs", verifyToken, verifyAdmin, getAllLogs);
router.get("/users", verifyToken, verifyAdmin, getAllUsers);
router.put("/users/:userId", verifyToken, verifyAdmin, editUser);
router.delete("/users/:userId", verifyToken, verifyAdmin, deleteUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
