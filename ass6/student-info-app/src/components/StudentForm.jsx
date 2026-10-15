import { useState } from "react";

const DEPARTMENTS = [
  "Computer Science",
  "Information Technology",
  "Electronics",
  "Mechanical",
  "Civil",
  "Commerce",
  "Arts",
];

const EMPTY_FORM = { name: "", rollNo: "", department: "", marks: "" };

export default function StudentForm({ onAddStudent, existingRollNumbers }) {
  const [values, setValues] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  // Returns an error message for one field, or "" when the value is valid.
  const checkField = (field, value) => {
    const text = value.trim();

    switch (field) {
      case "name":
        if (!text) return "Enter the student's name.";
        if (text.length < 2) return "Name must have at least 2 characters.";
        if (!/^[\p{L}][\p{L} .'-]*$/u.test(text))
          return "Use letters, spaces, dots, hyphens or apostrophes only.";
        return "";

      case "rollNo":
        if (!text) return "Enter a roll number.";
        if (!/^[A-Za-z0-9-]{1,12}$/.test(text))
          return "Use up to 12 letters, digits or hyphens.";
        if (existingRollNumbers.includes(text.toLowerCase()))
          return "This roll number is already added.";
        return "";

      case "department":
        return value ? "" : "Select a department.";

      case "marks": {
        if (!text) return "Enter the marks obtained.";
        const n = Number(text);
        if (Number.isNaN(n)) return "Marks must be a number.";
        if (n < 0 || n > 100) return "Marks must be between 0 and 100.";
        return "";
      }

      default:
        return "";
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    // Once a field has shown an error, re-check it on every keystroke
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: checkField(name, value) }));
    }
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    setErrors((current) => ({ ...current, [name]: checkField(name, value) }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const newErrors = {};
    Object.keys(EMPTY_FORM).forEach((field) => {
      newErrors[field] = checkField(field, values[field]);
    });
    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) return;

    onAddStudent({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: values.name.trim().replace(/\s+/g, " "),
      rollNo: values.rollNo.trim(),
      department: values.department,
      marks: Number(values.marks),
    });
    setValues(EMPTY_FORM);
    setErrors({});
  };

  // Small helper so every field renders its label, input and error the same way
  const fieldProps = (name) => ({
    id: name,
    name,
    value: values[name],
    onChange: handleChange,
    onBlur: handleBlur,
    "aria-invalid": errors[name] ? "true" : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  const renderError = (name) => (
    <p className="error" id={`${name}-error`}>
      {errors[name]}
    </p>
  );

  return (
    <form className="panel form" onSubmit={handleSubmit} noValidate>
      <h2>Student details</h2>

      <div className={`field ${errors.name ? "invalid" : ""}`}>
        <label htmlFor="name">Name</label>
        <input type="text" placeholder="e.g. Aarav Patil" maxLength={50} {...fieldProps("name")} />
        {renderError("name")}
      </div>

      <div className={`field ${errors.rollNo ? "invalid" : ""}`}>
        <label htmlFor="rollNo">Roll number</label>
        <input type="text" placeholder="e.g. CS101" maxLength={12} {...fieldProps("rollNo")} />
        {renderError("rollNo")}
      </div>

      <div className={`field ${errors.department ? "invalid" : ""}`}>
        <label htmlFor="department">Department</label>
        <select {...fieldProps("department")}>
          <option value="">Select department</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        {renderError("department")}
      </div>

      <div className={`field ${errors.marks ? "invalid" : ""}`}>
        <label htmlFor="marks">Marks (out of 100)</label>
        <input type="number" inputMode="decimal" min="0" max="100" step="any" placeholder="e.g. 78" {...fieldProps("marks")} />
        {renderError("marks")}
      </div>

      <button type="submit" className="primary">
        Submit details
      </button>
    </form>
  );
}
