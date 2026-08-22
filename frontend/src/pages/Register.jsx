import { API_BASE_URL } from "../api";
import { useState } from "react";
import { Link } from "react-router-dom";
import "../App.css";

function Register() {
  // Stores everything the user types into the registration form
  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "NURSE",
    staff_id: "",
    department: "",
  });

  // Stores messages we want to show to the user
  const [message, setMessage] = useState("");

  // Used to disable the button while registration is happening
  const [loading, setLoading] = useState(false);

  // Runs whenever the user types into an input
  function handleChange(event) {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  // Runs when the Register button is clicked
  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/accounts/register/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      console.log("Server response:", data);

      if (response.ok) {
        setMessage(
          "Registration successful. Your account is waiting for administrator approval."
        );

        // Clear the form after successful registration
        setFormData({
          username: "",
          first_name: "",
          last_name: "",
          email: "",
          password: "",
          role: "NURSE",
          staff_id: "",
          department: "",
        });
      } else {
        // Show errors returned by Django
        console.error("Registration error:", data);

        if (data.username) {
          setMessage(`Username: ${data.username[0]}`);
        } else if (data.staff_id) {
          setMessage(`Staff ID: ${data.staff_id[0]}`);
        } else if (data.email) {
          setMessage(`Email: ${data.email[0]}`);
        } else if (data.message) {
          setMessage(data.message);
        } else {
          setMessage(
            "Registration failed. Please check your information."
          );
        }
      }
    } catch (error) {
      console.error("Connection error:", error);

      setMessage(
        "Could not connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Wound Healing Monitoring System</h1>

        <h2>Staff Registration</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>

            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>First Name</label>

            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Last Name</label>

            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Role</label>

            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="NURSE">
                Nurse / Wound Assessor
              </option>

              <option value="DOCTOR">
                Doctor / Clinician
              </option>
            </select>
          </div>

          <div className="form-group">
            <label>Staff ID</label>

            <input
              type="text"
              name="staff_id"
              value={formData.staff_id}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Department</label>

            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="Example: Wound Care"
            />
          </div>

          <button
            className="login-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>

          {message && (
            <p
              style={{
                textAlign: "center",
                marginTop: "20px",
              }}
            >
              {message}
            </p>
          )}

          <p
            style={{
              textAlign: "center",
              marginTop: "20px",
            }}
          >
            Already have an account?{" "}
            <Link to="/login">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;