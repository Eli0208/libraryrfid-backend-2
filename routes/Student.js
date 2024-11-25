const express = require("express");
const {
  registerStudent,
  logStudentTimeIn,
  getAllTimeIns,
  getAllStudents,
  editStudent,
  deleteStudent,
} = require("../controllers/Student");
const { verifyToken, verifyAdmin } = require("../middlewares/Auth");
const router = express.Router();

// Route to register a new student
router.post("/register", verifyToken, registerStudent);
router.get("/allstudents", verifyToken, verifyAdmin, getAllStudents);
router.post("/rfid", logStudentTimeIn);
router.get("/time-ins", getAllTimeIns);
router.put("/:id", verifyToken, verifyAdmin, editStudent);
router.delete("/:id", verifyToken, verifyAdmin, deleteStudent);

module.exports = router;
