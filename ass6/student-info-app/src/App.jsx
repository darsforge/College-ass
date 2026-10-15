import { useState } from "react";
import StudentForm from "./components/StudentForm.jsx";
import StudentDetails from "./components/StudentDetails.jsx";

export default function App() {
  // The list of submitted students lives here so both components can use it:
  // StudentForm adds to it, StudentDetails displays each entry.
  const [students, setStudents] = useState([]);

  const addStudent = (student) => {
    setStudents((current) => [student, ...current]); // newest first
  };

  const removeStudent = (id) => {
    setStudents((current) => current.filter((s) => s.id !== id));
  };

  return (
    <main className="app">
      <header className="app-header">
        <h1>Student information</h1>
        <p>Add a student on the left. Each submission appears as a record card on the right.</p>
      </header>

      <div className="app-layout">
        <StudentForm
          onAddStudent={addStudent}
          existingRollNumbers={students.map((s) => s.rollNo.toLowerCase())}
        />

        <section className="records" aria-labelledby="records-title">
          <h2 id="records-title">Submitted students ({students.length})</h2>

          {students.length === 0 ? (
            <p className="empty">
              No students yet. Fill in the form and choose "Submit details" to see the record here.
            </p>
          ) : (
            <div className="record-list">
              {students.map((student) => (
                <StudentDetails
                  key={student.id}
                  student={student}
                  onRemove={removeStudent}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
