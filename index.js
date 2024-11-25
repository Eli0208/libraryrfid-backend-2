const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const morgan = require("morgan");

const app = express();

// Load environment variables
dotenv.config();

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Import routes
const authRoutes = require("./routes/User"); // Import auth routes
const studentRoutes = require("./routes/Student");

// Use routes
app.use("/api/auth", authRoutes); // Use the /api/auth prefix for auth routes
app.use("/api/students", studentRoutes);
// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
