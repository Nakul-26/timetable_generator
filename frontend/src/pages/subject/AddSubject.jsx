import React, { useState } from "react";
import axios from "../../api/axios";

function AddSubject() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [singleError, setSingleError] = useState("");
  const [singleSuccess, setSingleSuccess] = useState("");
  const [bulkError, setBulkError] = useState("");
  const [bulkSuccess, setBulkSuccess] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [sem, setSem] = useState("");
  const [credits, setCredits] = useState("");
  const [type, setType] = useState("theory");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadFailures, setUploadFailures] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") setName(value);
    if (name === "code") setCode(value);
    if (name === "sem") setSem(value);
    if (name === "credits") setCredits(value);
    if (name === "type") setType(value);
  };

  const validate = () => {
    if (!name.trim()) return "Subject name is required.";
    if (!code.trim()) return "Subject code is required.";
    if (!sem.trim()) return "Semester is required.";
    if (!credits.trim()) return "Credits are required.";
    if (!type.trim()) return "subject type are required";
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
      const res = await axios.post("/subjects", {
        name,
        id: code,
        sem,
        no_of_hours_per_week: credits,
        type: type,
      });
      // console.log("res:",res);
      setSingleSuccess("Subject added successfully!");
      setName("");
      setCode("");
      setSem("");
      setCredits("");
      setType("theory");
    } catch (err) {
      setSingleError("Failed to add subject.");
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
      const res = await axios.post("/subjects/bulk-upload", {
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
      const response = await axios.get("/subjects/template", {
        responseType: "arraybuffer",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "subject-template.xlsx";
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
       <div className="form-group">
        <label>Subject Type</label>
        <select
          name="type"
          onChange={handleChange}
          required
          defaultValue="theory"
        >
          <option value="theory">Theory</option>
          <option value="lab">Lab</option>
        </select>
      </div>
        <button type="submit" disabled={loading} className="primary-btn">
          {loading ? "Adding..." : "Add Subject"}
        </button>
      </form>
      {singleError && <div className="error-message">{singleError}</div>}
      {singleSuccess && <div className="success-message">{singleSuccess}</div>}
      <div className="styled-form" style={{ marginTop: "16px" }}>
        <h3>Bulk Upload (Excel)</h3>
        <p>Use columns: Name, Subject Code, Semester, Credits, Type in the first sheet.</p>
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
}

export default AddSubject;
