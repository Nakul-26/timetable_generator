import React, { useState } from "react";
import axios from "../../api/axios";

const AddClass = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [singleError, setSingleError] = useState("");
  const [singleSuccess, setSingleSuccess] = useState("");
  const [bulkError, setBulkError] = useState("");
  const [bulkSuccess, setBulkSuccess] = useState("");
  const [classId, setClassId] = useState("");
  const [semester, setSemester] = useState("");
  const [section, setSection] = useState("");
  const [name, setName] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadFailures, setUploadFailures] = useState([]);

  const validate = () => {
    if (!name.trim()) return "Class name is required.";
    if (!classId.trim()) return "Class ID is required.";
    if (!semester.trim()) return "Semester is required.";
    if (!section.trim()) return "Section is required.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSingleError("");
    setSingleSuccess("");
    const validationError = validate();
    if (validationError) {
      setSingleError(validationError);
      return;
    }
    setLoading(true);
    try {
      await axios.post("/classes", { 
        id: classId, 
        sem: semester,
        name, 
        section, 
        days_per_week: daysPerWeek
      });
      setSingleSuccess("Class added successfully!");
      setClassId("");
      setName("");
      setSemester("");
      setSection("");
      setDaysPerWeek(5);
    } catch (err) {
      setSingleError("Failed to add class.");
    }
    setLoading(false);
  };

  const arrayBufferToBase64 = (buffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      setBulkError("Please choose an Excel file first.");
      setBulkSuccess("");
      setUploadFailures([]);
      return;
    }

    setUploading(true);
    setBulkError("");
    setBulkSuccess("");
    setUploadFailures([]);
    try {
      const buffer = await uploadFile.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);
      const res = await axios.post("/classes/bulk-upload", {
        fileData: base64,
      });

      const {
        insertedCount = 0,
        totalRows = 0,
        duplicateInDatabase = [],
        duplicateInFile = [],
        invalidRows = [],
      } = res.data || {};

      const failures = [
        ...duplicateInDatabase.map((item) => ({
          id: item.id || "-",
          row: item.row || "-",
          reason: item.reason || "ID already exists",
        })),
        ...duplicateInFile.map((item) => ({
          id: item.id || "-",
          row: item.row || "-",
          reason: item.reason || "Duplicate ID in upload file",
        })),
        ...invalidRows.map((item) => ({
          id: item.id || "-",
          row: item.row || "-",
          reason: item.reason || "Invalid row",
        })),
      ];

      const skipped = failures.length;
      const inserted = insertedCount || 0;
      if (skipped > 0 && inserted > 0) {
        setBulkError(
          `Uploaded partially. Inserted ${inserted} of ${totalRows} rows. Failed ${skipped} rows.`
        );
      } else if (skipped > 0 && inserted === 0) {
        setBulkError(`Upload failed. Failed ${skipped} of ${totalRows} rows.`);
      } else {
        setBulkSuccess(`Upload complete. Inserted ${inserted} of ${totalRows} rows.`);
      }
      setUploadFailures(failures);
      setUploadFile(null);
    } catch (err) {
      setBulkError(
        err?.response?.data?.details
          ? `${err?.response?.data?.error} (${err?.response?.data?.details})`
          : err?.response?.data?.error || "Failed to upload Excel file."
      );
      setUploadFailures([]);
    }
    setUploading(false);
  };

  const handleDownloadTemplate = async () => {
    setBulkError("");
    setBulkSuccess("");
    try {
      const response = await axios.get("/classes/template", {
        responseType: "arraybuffer",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "class-template.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setBulkSuccess("Template downloaded successfully.");
    } catch {
      setBulkError("Failed to download template.");
    }
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
            type="number"
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
        <div className="form-group">
          <label>Days Per Week</label>
          <input
            type="number"
            name="daysPerWeek"
            placeholder="Days per week (e.g. 5)"
            value={daysPerWeek}
            onChange={(e) => setDaysPerWeek(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading} className="primary-btn">
          {loading ? "Adding..." : "Add Class"}
        </button>
      </form>
      {singleError && <div className="error-message">{singleError}</div>}
      {singleSuccess && <div className="success-message">{singleSuccess}</div>}
      <div className="styled-form" style={{ marginTop: "16px" }}>
        <h3>Bulk Upload (Excel)</h3>
        <p>Use columns: Class ID, Name, Semester, Section, Days Per Week in the first sheet.</p>
        <button
          type="button"
          className="secondary-btn"
          onClick={handleDownloadTemplate}
          style={{ marginBottom: "12px" }}
        >
          Download Empty Template
        </button>
        <div className="form-group">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
          />
        </div>
        <button
          type="button"
          disabled={uploading}
          className="primary-btn"
          onClick={handleUpload}
        >
          {uploading ? "Uploading..." : "Upload Excel"}
        </button>
      </div>
      {bulkError && <div className="error-message">{bulkError}</div>}
      {bulkSuccess && <div className="success-message">{bulkSuccess}</div>}
      {uploadFailures.length > 0 && (
        <div className="styled-form" style={{ marginTop: "12px" }}>
          <h3>Failed Rows</h3>
          <div className="table-responsive">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>ID</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {uploadFailures.map((item, index) => (
                  <tr key={`${item.row}-${item.id}-${index}`}>
                    <td>{item.row}</td>
                    <td>{item.id}</td>
                    <td>{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddClass;
