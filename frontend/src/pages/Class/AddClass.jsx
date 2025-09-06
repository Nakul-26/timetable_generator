import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";

const AddClass = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [classId, setClassId] = useState("");
  const [semester, setSemester] = useState("");
  const [section, setSection] = useState("");
  const [name, setName] = useState("");

  const validate = () => {
    if (!name.trim()) return "Class name is required.";
    if (!classId.trim()) return "Class ID is required.";
    if (!semester.trim()) return "Semester is required.";
    if (!section.trim()) return "Section is required.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    try {
      await axios.post("/classes", { 
        id: classId, 
        sem: semester,
        name, 
        section 
      });
      setSuccess("Class added successfully!");
      setClassId("");
      setName("");
      setSemester("");
      setSection("");
    } catch (err) {
      setError("Failed to add class.");
    }
    setLoading(false);
  };

  return (
    <div className="form-container">
      <h2>Add Class</h2>
      <form onSubmit={handleSubmit} className="styled-form">
        <div className="form-group">
          <label>Class ID</label>
          <input
            type="text"
            name="classId"
            placeholder="Class ID"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            name="name"
            placeholder="Class Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Semester</label>
          <input
            type="text"
            name="semester"
            placeholder="Semester (e.g. Fall)"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Section</label>
          <input
            type="text"
            name="section"
            placeholder="Section (e.g. A)"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading} className="primary-btn">
          {loading ? "Adding..." : "Add Class"}
        </button>
      </form>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
    </div>
  );
};

export default AddClass;
