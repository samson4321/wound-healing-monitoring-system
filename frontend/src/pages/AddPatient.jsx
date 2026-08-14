import { useState } from "react";
import { useNavigate } from "react-router-dom";

function AddPatient() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    patient_id: "",
    date_of_birth: "",
    sex: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
      const token =
        localStorage.getItem("authToken");

      if (!token) {
        navigate("/login", {
          replace: true,
        });

        return;
      }

      const response = await fetch(
        "http://127.0.0.1:8000/api/patients/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.status === 401) {
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

        navigate("/login", {
          replace: true,
        });

        return;
      }

      const data =
        await response.json();

      console.log(
        "Patient response:",
        data
      );

      if (response.ok) {
        setMessage(
          "Patient added successfully."
        );

        setTimeout(() => {
          navigate("/patients");
        }, 1000);
      } else {
        if (data.patient_id) {
          setMessage(
            `Patient ID: ${data.patient_id[0]}`
          );
        } else {
          setMessage(
            "Could not add patient."
          );
        }
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "Could not connect to the Django server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "600px",
        margin: "auto",
      }}
    >
      <h1>Add New Patient</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>First Name</label>
          <br />

          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
          />
        </div>

        <br />

        <div>
          <label>Last Name</label>
          <br />

          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            required
          />
        </div>

        <br />

        <div>
          <label>Patient ID</label>
          <br />

          <input
            type="text"
            name="patient_id"
            value={formData.patient_id}
            onChange={handleChange}
            required
          />
        </div>

        <br />

        <div>
          <label>Date of Birth</label>
          <br />

          <input
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleChange}
            required
          />
        </div>

        <br />

        <div>
          <label>Sex</label>
          <br />

          <select
            name="sex"
            value={formData.sex}
            onChange={handleChange}
            required
          >
            <option value="">
              Select sex
            </option>

            <option value="Male">
              Male
            </option>

            <option value="Female">
              Female
            </option>

            <option value="Other">
              Other
            </option>
          </select>
        </div>

        <br />

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Saving..."
            : "Add Patient"}
        </button>

        <button
          type="button"
          onClick={() =>
            navigate("/patients")
          }
          style={{
            marginLeft: "10px",
          }}
        >
          Cancel
        </button>

        {message && (
          <p
            style={{
              marginTop: "20px",
            }}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}

export default AddPatient;