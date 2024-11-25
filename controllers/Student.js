const studentModel = require("../models/Student");
const {
  logTimeIn,
  getAllTimeIns,
  updateTimeInStudentNumber,
} = require("../models/Timeins");

exports.registerStudent = async (req, res) => {
  const { idNo, name, studentNumber, institute, rfidTag, status } = req.body;

  // Validate input
  if (!idNo || !name || !studentNumber || !institute || !rfidTag) {
    return res.status(400).json({
      message:
        "Please provide idNo, name, student number, institute, and RFID tag",
    });
  }

  try {
    // Check if the RFID tag already exists
    const existingRFID = await studentModel.findStudentByRFID(rfidTag);
    if (existingRFID) {
      return res
        .status(400)
        .json({ message: "RFID tag is already registered" });
    }

    // Check if the student number already exists
    const existingStudentNumber = await studentModel.findStudentByNumber(
      studentNumber
    );
    if (existingStudentNumber) {
      return res
        .status(400)
        .json({ message: "Student number is already registered" });
    }

    // Add the new student
    const result = await studentModel.addStudent({
      idNo,
      name,
      studentNumber,
      institute,
      rfidTag,
      status: status || "Active", // default to "Active" if not provided
    });

    res.status(201).json({
      message: "Student registered successfully",
      student: {
        idNo,
        name,
        studentNumber,
        institute,
        rfidTag,
        status: status || "Active",
      },
    });
  } catch (error) {
    console.error("Error registering student:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    const students = await studentModel.getAllStudents();

    if (!students || students.length === 0) {
      return res.status(404).json({ message: "No students found" });
    }

    res.status(200).json({ students });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.logStudentTimeIn = async (req, res) => {
  const { rfidTag } = req.body;

  if (!rfidTag) {
    return res.status(400).json({ message: "RFID tag is required." });
  }

  try {
    // Find the student by RFID tag
    const student = await studentModel.findStudentByRFID(rfidTag);

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const studentNumber = student.studentNumber;

    // Get current date and time in Philippine Standard Time (PST)
    const now = new Date();
    const pstOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    const pstDate = new Date(now.getTime() + pstOffset);

    const currentDate = pstDate.toISOString().split("T")[0]; // yyyy-mm-dd
    const currentTime = pstDate.toISOString().split("T")[1].split(".")[0]; // hh:mm:ss

    // Log the time-in
    await logTimeIn({
      studentNumber,
      date: currentDate,
      time: currentTime,
    });

    res.status(201).json({
      message: "RFID scan recorded successfully",
      student: {
        studentNumber: student.studentNumber,
        name: student.name,
        date: currentDate,
        time: currentTime,
      },
    });
  } catch (error) {
    console.error("Error logging time-in:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.getAllTimeIns = async (req, res) => {
  try {
    const timeIns = await getAllTimeIns();

    if (!timeIns || timeIns.length === 0) {
      return res.status(404).json({ message: "No time-ins found" });
    }

    res.status(200).json({ timeIns });
  } catch (error) {
    console.error("Error fetching time-ins:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.editStudent = async (req, res) => {
  const { id } = req.params; // Extract student ID from URL params
  const { idNo, name, studentNumber, institute, rfidTag, status } = req.body;

  // Validate required fields
  if (!idNo || !name || !studentNumber || !institute || !rfidTag) {
    return res.status(400).json({
      message:
        "Please provide idNo, name, student number, institute, and RFID tag.",
    });
  }

  // Optional: Validate status field
  const validStatuses = ["Active", "Inactive", "Graduated"];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      message: `Invalid status. Valid statuses are: ${validStatuses.join(
        ", "
      )}`,
    });
  }

  try {
    // Check if the student exists
    const existingStudent = await studentModel.findStudentById(id);
    if (!existingStudent) {
      return res.status(404).json({ message: "Student not found." });
    }

    // Ensure the RFID tag is not already assigned to another student
    if (rfidTag !== existingStudent.rfidTag) {
      const existingRFID = await studentModel.findStudentByRFID(rfidTag);
      if (existingRFID) {
        return res
          .status(400)
          .json({ message: "RFID tag is already registered." });
      }
    }

    // Ensure the student number is not already assigned to another student
    if (studentNumber !== existingStudent.studentNumber) {
      const existingStudentNumber = await studentModel.findStudentByNumber(
        studentNumber
      );
      if (existingStudentNumber) {
        return res
          .status(400)
          .json({ message: "Student number is already registered." });
      }
    }

    // Update student details in the database
    const updatedStudent = {
      id,
      idNo,
      name,
      studentNumber,
      institute,
      rfidTag,
      status: status || "Active", // Default to "Active" if not provided
    };

    const result = await studentModel.editStudent(updatedStudent);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Failed to update student. Student not found." });
    }

    // If the studentNumber has changed, update the time-ins table
    if (existingStudent.studentNumber !== studentNumber) {
      await studentModel.updateTimeInstudentNumber(
        existingStudent.studentNumber,
        studentNumber
      );
    }

    // Respond with success
    res.status(200).json({
      message: "Student updated successfully.",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ message: "Server error." });
  }
};

exports.deleteStudent = async (req, res) => {
  const { id } = req.params; // Extract student ID from URL params

  try {
    // Check if the student exists
    const student = await studentModel.findStudentById(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    // Delete associated time-ins first
    await studentModel.deleteTimeInsByStudentId(student.studentNumber);

    // Delete the student
    const result = await studentModel.deleteStudentById(id);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Failed to delete student. Student not found." });
    }

    res.status(200).json({ message: "Student deleted successfully." });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ message: "Server error." });
  }
};
