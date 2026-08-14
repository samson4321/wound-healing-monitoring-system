import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";

function Patients() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [message, setMessage] = useState("Loading patients...");

  useEffect(() => {
    async function loadPatients() {
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
            headers: {
              Authorization: `Token ${token}`,
            },
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

        if (!response.ok) {
          throw new Error(
            "Could not load patients"
          );
        }

        const data =
          await response.json();

        setPatients(data);
        setMessage("");
      } catch (error) {
        console.error(error);

        setMessage(
          "Could not load patients from the server."
        );
      }
    }

    loadPatients();
  }, [navigate]);

  return (
    <div
      style={{
        padding: "40px",
      }}
    >
      <h1>Patients</h1>

      <p>
        <Link to="/nurse/dashboard">
          ← Back to Nurse Dashboard
        </Link>
      </p>

      <button
        onClick={() =>
          navigate("/patients/add")
        }
      >
        Add New Patient
      </button>

      {message && (
        <p>{message}</p>
      )}

      {!message &&
        patients.length === 0 && (
          <p>No patients found.</p>
        )}

      {patients.length > 0 && (
        <table
          border="1"
          cellPadding="10"
          style={{
            marginTop: "20px",
            borderCollapse: "collapse",
            width: "100%",
          }}
        >
          <thead>
            <tr>
              <th>Patient ID</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Date of Birth</th>
              <th>Sex</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {patients.map(
              (patient) => (
                <tr key={patient.id}>
                  <td>
                    {patient.patient_id}
                  </td>

                  <td>
                    {patient.first_name}
                  </td>

                  <td>
                    {patient.last_name}
                  </td>

                  <td>
                    {patient.date_of_birth}
                  </td>

                  <td>
                    {patient.sex}
                  </td>

                  <td>
                    <button
                      onClick={() =>
                        navigate(
                          `/patients/${patient.id}/assessment`
                        )
                      }
                    >
                      New Assessment
                    </button>

                    <button
                      onClick={() =>
                        navigate(
                          `/patients/${patient.id}/progress`
                        )
                      }
                      style={{
                        marginLeft: "10px",
                      }}
                    >
                      View Progress
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Patients;