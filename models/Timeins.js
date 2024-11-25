const studentModel = require("../models/Student");
const db = require("../config/db");

const logTimeIn = async ({ studentNumber, date, time }) => {
  const query = `
    INSERT INTO TimeIns (studentNumber, date, time) 
    VALUES (?, ?, ?)
  `;
  const [result] = await db.execute(query, [studentNumber, date, time]);
  return result;
};

const editStudent = async ({
  id,
  idNo,
  name,
  studentNumber,
  institute,
  rfidTag,
  status,
}) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Update the student record
    const studentUpdateQuery = `
      UPDATE Student 
      SET idNo = ?, name = ?, studentNumber = ?, institute = ?, rfidTag = ?, status = ? 
      WHERE id = ?
    `;
    await connection.execute(studentUpdateQuery, [
      idNo,
      name,
      studentNumber,
      institute,
      rfidTag,
      status,
      id,
    ]);

    // If studentNumber has changed, update the related TimeIns records
    if (studentNumber) {
      await studentModel.updateTimeInStudentNumber(
        oldStudentNumber, // old student number should be tracked from your data
        studentNumber // new student number
      );
    }

    await connection.commit();
    return { message: "Student updated successfully!" };
  } catch (error) {
    await connection.rollback();
    console.error("Error updating student:", error);
    throw error;
  } finally {
    connection.release();
  }
};

const getAllTimeIns = async () => {
  const query = `
    SELECT 
      TimeIns.id, 
      TimeIns.studentNumber, 
      TimeIns.date, 
      TimeIns.time, 
      Student.name,
      Student.institute -- Include the institute column
    FROM TimeIns
    JOIN Student ON TimeIns.studentNumber = Student.studentNumber
    ORDER BY TimeIns.date DESC, TimeIns.time DESC
  `;
  const [rows] = await db.execute(query);
  return rows;
};

module.exports = {
  logTimeIn,
  editStudent,
  getAllTimeIns,
};
