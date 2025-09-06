import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
// import "./AddSubject.css"; // Assuming you will create this CSS file for styles

function AddSubject() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // const [teachers, setTeachers] = useState([]);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [sem, setSem] = useState("");
  const [credits, setCredits] = useState("");
  // const [selectedTeachers, setSelectedTeachers] = useState([]);
  // const [type, setType] = useState("");

  // useEffect(() => {
  //   const fetchTeachers = async () => {
  //     setLoading(true);
  //     try {
  //       const res = await axios.get("/faculties");
  //       console.log("Teachers fetched:", res.data);        
  //       setTeachers(res.data);
  //     } catch (err) {
  //       setError("Failed to fetch teachers.");
  //       console.error("Fetch error:", err);
  //     }
  //     setLoading(false);
  //   };
  //   fetchTeachers();
  // }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") setName(value);
    if (name === "code") setCode(value);
    if (name === "sem") setSem(value);
    if (name === "credits") setCredits(value);
    // if (name === "selectedTeachers") setSelectedTeachers(value);
    // if (name === "type") setType(value);
  };

  // const handleSelectTeachers = (e) => {
  //   const { options } = e.target;
  //   const values = [];
  //   for (let i = 0; i < options.length; i++) {
  //     if (options[i].selected) {
  //       values.push(options[i].value);
  //     }
  //   }
  //   setSelectedTeachers(values);
  // };

  const validate = () => {
    if (!name.trim()) return "Subject name is required.";
    if (!code.trim()) return "Subject code is required.";
    if (!sem.trim()) return "Semester is required.";
    if (!credits.trim()) return "Credits are required.";
    // if (selectedTeachers.length === 0) return "At least one teacher is required.";
    // if (!type) return "Subject type is required.";
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
      const res = await axios.post("/subjects", {
        name,
        id: code,
        sem,
        no_of_hours_per_week: credits,
        // faculty: selectedTeachers,
        // type
      });
      console.log("response is", res);
      setSuccess("Subject added successfully!");
      setName("");
      setCode("");
      setSem("");
      setCredits("");
      // setSelectedTeachers([]);
      // setType("");
    } catch (err) {
      setError("Failed to add subject.");
    }
    setLoading(false);
  };

  return (
    <div className="form-container">
      <h2>Add Subject</h2>
      <form onSubmit={handleSubmit} className="styled-form">
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            name="name"
            placeholder="Subject Name"
            value={name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Subject Code</label>
          <input
            type="text"
            name="code"
            placeholder="Subject Code"
            value={code}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Semester</label>
          <input
            type="text"
            name="sem"
            placeholder="Semester"
            value={sem}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Credits</label>
          <input
            type="number"
            name="credits"
            placeholder="Credits"
            value={credits}
            onChange={handleChange}
            required
          />
        </div>
        {/* <div className="form-group">
          <label>Teachers</label>
          <select
            name="selectedTeachers"
            multiple
            value={selectedTeachers}
            onChange={handleSelectTeachers}
            required
          >
            {teachers.map((teacher) => (
              <option key={teacher._id} value={teacher._id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </div> */}
        {/* <div className="form-group">
          <label>Type</label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            required
          >
            <option value="">Select Type</option>
            <option value="theory">Theory</option>
            <option value="lab">Lab</option>
          </select>
        </div> */}
        <button type="submit" disabled={loading} className="primary-btn">
          {loading ? "Adding..." : "Add Subject"}
        </button>
      </form>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
    </div>
  );
}

export default AddSubject;
