import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";

function Login() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/accounts/login/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      console.log("Login response:", data);

      if (response.ok) {
        // Store authentication state
        localStorage.setItem(
          "isAuthenticated",
          "true"
        );

        localStorage.setItem(
          "userRole",
          data.role || ""
        );

        localStorage.setItem(
          "username",
          data.username || formData.username
        );

        // Store API token returned by Django
        if (data.token) {
          localStorage.setItem(
            "authToken",
            data.token
          );
        }

        if (data.first_name) {
          localStorage.setItem(
            "firstName",
            data.first_name
          );
        }

        // Redirect according to role
        if (data.role === "NURSE") {
          navigate("/nurse/dashboard");
        } else if (data.role === "DOCTOR") {
          navigate("/doctor/dashboard");
        } else if (data.role === "ADMIN") {
          navigate("/admin/dashboard");
        } else {
          // Remove stored login information
          localStorage.removeItem(
            "isAuthenticated"
          );

          localStorage.removeItem(
            "userRole"
          );

          localStorage.removeItem(
            "username"
          );

          localStorage.removeItem(
            "firstName"
          );

          localStorage.removeItem(
            "authToken"
          );

          setMessage(
            `Login successful, but role "${data.role}" does not have a dashboard yet.`
          );
        }
      } else {
        setMessage(
          data.message ||
            "Login failed. Check your username and password."
        );
      }
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setMessage(
        "Could not connect to the Django server. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>
          Wound Healing Monitoring System
        </h1>

        <h2>Login</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Username
            </label>

            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>
              Password
            </label>

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            className="login-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Login"}
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
            Don't have an account?{" "}
            <Link to="/register">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;