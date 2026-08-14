import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function NewAssessment() {
  const navigate = useNavigate();
  const { patientId } = useParams();

  const [formData, setFormData] = useState({
    patient: patientId || "",
    assessment_date: "",
    notes: "",
    wound_image: null,
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

  function handleImageChange(event) {
    const file = event.target.files[0];

    setFormData({
      ...formData,
      wound_image: file,
    });
  }

  function clearLoginData() {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");
    localStorage.removeItem("firstName");
    localStorage.removeItem("authToken");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      // Get authentication token
      const token = localStorage.getItem("authToken");

      // If there is no token, send user back to login
      if (!token) {
        clearLoginData();

        navigate("/login", {
          replace: true,
        });

        return;
      }

      // Prepare multipart form data
      const dataToSend = new FormData();

      dataToSend.append(
        "patient",
        formData.patient
      );

      dataToSend.append(
        "assessment_date",
        formData.assessment_date
      );

      dataToSend.append(
        "notes",
        formData.notes
      );

      if (formData.wound_image) {
        dataToSend.append(
          "wound_image",
          formData.wound_image
        );
      }

      // Send assessment to Django
      const response = await fetch(
        "http://127.0.0.1:8000/api/assessments/",
        {
          method: "POST",

          headers: {
            Authorization: `Token ${token}`,
          },

          body: dataToSend,
        }
      );

      // Token is invalid or expired
      if (response.status === 401) {
        clearLoginData();

        navigate("/login", {
          replace: true,
        });

        return;
      }

      const data = await response.json();

      console.log(
        "Assessment response:",
        data
      );

      // Assessment successfully created
      if (response.ok) {
        setMessage(
          "Assessment saved successfully."
        );

        // After saving, return to this patient's
        // wound progress page
        setTimeout(() => {
          navigate(
            `/patients/${patientId}/progress`
          );
        }, 1000);
      } else {
        console.error(
          "Assessment save failed:",
          data
        );

        // Show useful Django error if available
        if (data.detail) {
          setMessage(data.detail);
        } else if (data.wound_image) {
          setMessage(
            `Wound image: ${data.wound_image[0]}`
          );
        } else if (data.patient) {
          setMessage(
            `Patient: ${data.patient[0]}`
          );
        } else if (data.assessment_date) {
          setMessage(
            `Assessment date: ${data.assessment_date[0]}`
          );
        } else {
          setMessage(
            "Could not save assessment."
          );
        }
      }
    } catch (error) {
      console.error(
        "Assessment error:",
        error
      );

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
        maxWidth: "650px",
        margin: "auto",
      }}
    >
      <h1>
        New Wound Assessment
      </h1>

      <form onSubmit={handleSubmit}>

        {/* Patient */}
        <div>
          <label>
            Patient Database ID
          </label>

          <br />

          <input
            type="number"
            name="patient"
            value={formData.patient}
            readOnly
          />
        </div>

        <br />

        {/* Assessment Date */}
        <div>
          <label>
            Assessment Date
          </label>

          <br />

          <input
            type="date"
            name="assessment_date"
            value={formData.assessment_date}
            onChange={handleChange}
            required
          />
        </div>

        <br />

        {/* Wound Image */}
        <div>
          <label>
            Wound Image
          </label>

          <br />

          <input
            type="file"
            name="wound_image"
            accept="image/*"
            onChange={handleImageChange}
            required
          />
        </div>

        <br />

        {/* Notes */}
        <div>
          <label>
            Notes
          </label>

          <br />

          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="5"
          />
        </div>

        <br />

        {/* Save */}
        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Saving..."
            : "Save Assessment"}
        </button>

        {/* Cancel */}
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

        {/* Message */}
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

export default NewAssessment;