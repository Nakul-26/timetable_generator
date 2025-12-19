import React, { useState } from "react";
import axios from "../../api/axios";

const AddAdmin = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") setName(value);
    if (name === "email") setEmail(value);
    if (name === "password") setPassword(value);
  };

  const validate = () => {
    if (!name.trim()) return "Admin name is required.";
    if (!email.trim()) return "Email is required.";
    if (!password.trim()) return "Password is required.";
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
      const res = await axios.post(`/admins`, {
        name: name,
        email: email,
        password: password,
      });

      setSuccess("Admin added successfully!");
      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      if (err.response) {
        setError(err.response.data.error || "Failed to add admin.");
      } else if (err.request) {
        setError("No response from server. Check your network connection.");
      } else {
        setError("Error: " + err.message);
      }
    }
    setLoading(false);
  };

  return (
    <div className="form-container">
      <h2>Add Admin</h2>
      <form onSubmit={handleSubmit} className="styled-form">
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            name="name"
            placeholder="Admin Name"
            value={name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="Admin Email"
            value={email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Admin Password"
            value={password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" disabled={loading} className="primary-btn">
          {loading ? "Adding..." : "Add Admin"}
        </button>
      </form>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
    </div>
  );
};

export default AddAdmin;
