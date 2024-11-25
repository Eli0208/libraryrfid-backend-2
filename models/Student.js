const db = require("../config/db");

// Add a new student
const addStudent = async ({
  idNo,
  name,
  studentNumber,
  institute,
  rfidTag,
  status,
}) => {
  const query = `
    INSERT INTO Student (idNo, name, studentNumber, institute, rfidTag, status) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const [result] = await db.execute(query, [
    idNo,
    name,
    studentNumber,
    institute,
    rfidTag,
    status,
  ]);
  return result;
};

// Find student by RFID tag
const findStudentByRFID = async (rfidTag) => {
  const query = "SELECT * FROM Student WHERE rfidTag = ?";
  const [rows] = await db.execute(query, [rfidTag]);
  return rows[0];
};

// Find student by student number
const findStudentByNumber = async (studentNumber) => {
  const query = "SELECT * FROM Student WHERE studentNumber = ?";
  const [rows] = await db.execute(query, [studentNumber]);
  return rows[0];
};

// Find student by ID
const findStudentById = async (id) => {
  const query = "SELECT * FROM Student WHERE id = ?";
  const [rows] = await db.execute(query, [id]);
  return rows[0];
};

// Find all students
const getAllStudents = async () => {
  const query = "SELECT * FROM Student";
  const [rows] = await db.execute(query);
  return rows;
};

// Edit an existing student
const editStudent = async ({
  id,
  idNo,
  name,
  studentNumber,
  institute,
  rfidTag,
  status,
}) => {
  console.log("triggered");
  // Fetch the existing student details
  const existingStudent = await findStudentById(id);
  if (!existingStudent) {
    throw new Error(`Student with ID ${id} not found.`);
  }

  // Check for changes
  const updates = {};
  if (idNo !== undefined && idNo !== existingStudent.idNo) updates.idNo = idNo;
  if (name !== undefined && name !== existingStudent.name) updates.name = name;
  if (
    studentNumber !== undefined &&
    studentNumber !== existingStudent.studentNumber
  )
    updates.studentNumber = studentNumber;
  if (institute !== undefined && institute !== existingStudent.institute)
    updates.institute = institute;
  if (rfidTag !== undefined && rfidTag !== existingStudent.rfidTag)
    updates.rfidTag = rfidTag;
  if (status !== undefined && status !== existingStudent.status)
    updates.status = status;

  // If no changes detected, skip update
  if (Object.keys(updates).length === 0) {
    console.log("No changes detected. Update skipped.");
    return { affectedRows: 0 }; // Indicate no changes were made
  }

  const connection = await db.getConnection();

  try {
    // Temporarily disable foreign key checks
    await connection.execute("SET foreign_key_checks = 0");

    // Build dynamic update query
    const setClause = Object.keys(updates)
      .map((field) => `${field} = ?`)
      .join(", ");
    const query = `UPDATE Student SET ${setClause} WHERE id = ?`;
    const values = [...Object.values(updates), id];

    // Execute the update query
    const [result] = await connection.execute(query, values);

    // Update related TimeIns table if studentNumber was changed
    if (updates.studentNumber) {
      const updateTimeInQuery = `
        UPDATE TimeIns 
        SET studentNumber = ? 
        WHERE studentNumber = ?
      `;
      await connection.execute(updateTimeInQuery, [
        updates.studentNumber,
        existingStudent.studentNumber,
      ]);
    }

    // Commit transaction
    await connection.commit();
    return result;
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      console.error("Unique constraint violation:", error.message);
      throw new Error("Duplicate studentNumber or RFID tag detected.");
    }
    // Rollback transaction in case of error
    await connection.rollback();
    console.error("Error updating student:", error);
    throw error;
  } finally {
    // Re-enable foreign key checks
    await connection.execute("SET foreign_key_checks = 1");
    connection.release();
  }
};

// Update TimeIns with the new studentNumber
const updateTimeInstudentNumber = async (id, newStudentNumber) => {
  const query = `
    UPDATE TimeIns 
    SET studentNumber = ? 
    WHERE studentNumber = (SELECT studentNumber FROM Student WHERE id = ?)
  `;
  await db.execute(query, [newStudentNumber, id]);
};

// Delete student by ID
const deleteStudentById = async (id) => {
  const connection = await db.getConnection();

  try {
    // Temporarily disable foreign key checks
    await connection.execute("SET foreign_key_checks = 0");

    // Delete the student record
    const query = "DELETE FROM Student WHERE id = ?";
    const [result] = await connection.execute(query, [id]);

    // Commit the transaction
    await connection.commit();
    return result;
  } catch (error) {
    console.error("Error deleting student:", error);
    // Rollback the transaction if an error occurs
    await connection.rollback();
    throw error;
  } finally {
    // Re-enable foreign key checks
    await connection.execute("SET foreign_key_checks = 1");
    connection.release();
  }
};

// Delete related time-ins by student ID
const deleteTimeInsByStudentId = async (studentNumber) => {
  const query = "DELETE FROM TimeIns WHERE studentNumber = ?";
  const [result] = await db.execute(query, [studentNumber]);
  return result;
};

module.exports = {
  editStudent,
  addStudent,
  findStudentByRFID,
  findStudentByNumber,
  findStudentById, // Added here
  getAllStudents,
  updateTimeInstudentNumber,
  deleteStudentById,
  deleteTimeInsByStudentId,
};
