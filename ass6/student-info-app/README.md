# Student Information Application (React)

A small React app with two components:

- **StudentForm** collects name, roll number, department and marks, validates them, and passes the data up through the `onAddStudent` prop.
- **StudentDetails** receives one `student` object as a prop and shows it as a formatted record card (initials, department, roll number, marks, grade, pass/fail and a marks bar).

`App` keeps the list of students in state and connects the two components.

## Run it

You need Node.js 18 or newer.

    npm install
    npm run dev

Open the address Vite prints (usually http://localhost:5173).

## Structure

    src/
      main.jsx                    entry point
      App.jsx                     holds the students state
      App.css                     all styling
      components/
        StudentForm.jsx           form + validation
        StudentDetails.jsx        one student's record card

## Rules used

- Marks are out of 100. A student passes with 35 or more.
- Grades: A+ 90, A 80, B+ 70, B 60, C 50, D below 50, F when failed.
- Roll numbers must be unique.
