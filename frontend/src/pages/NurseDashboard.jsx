import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function NurseDashboard() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [message, setMessage] = useState(
    "Loading dashboard..."
  );

  useEffect(() => {
    async function loadDashboard() {
      try {
        const token =
          localStorage.getItem("authToken");

        if (!token) {
          navigate("/login", {
            replace: true,
          });

          return;
        }

        const patientResponse = await fetch(
          "http://127.0.0.1:8000/api/patients/",
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );

        const assessmentResponse = await fetch(
          "http://127.0.0.1:8000/api/assessments/",
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );

        if (
          patientResponse.status === 401 ||
          assessmentResponse.status === 401
        ) {
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

        if (
          !patientResponse.ok ||
          !assessmentResponse.ok
        ) {
          throw new Error(
            "Could not load dashboard data"
          );
        }

        const patientData =
          await patientResponse.json();

        const assessmentData =
          await assessmentResponse.json();

        setPatients(patientData);
        setAssessments(assessmentData);
        setMessage("");
      } catch (error) {
        console.error(error);

        setMessage(
          "Could not load dashboard data."
        );
      }
    }

    loadDashboard();
  }, [navigate]);

  const completedAnalyses =
    assessments.filter(
      (assessment) =>
        assessment.analysis_status ===
        "COMPLETED"
    ).length;

  const pendingAnalyses =
    assessments.filter(
      (assessment) =>
        assessment.analysis_status ===
        "PENDING"
    ).length;

  const failedAnalyses =
    assessments.filter(
      (assessment) =>
        assessment.analysis_status ===
        "FAILED"
    ).length;

  const recentAssessments =
    [...assessments]
      .sort((a, b) => {
        return (
          new Date(b.created_at) -
          new Date(a.created_at)
        );
      })
      .slice(0, 5);

  function getPatientName(patientId) {
    const patient = patients.find(
      (item) =>
        Number(item.id) ===
        Number(patientId)
    );

    if (!patient) {
      return `Patient ${patientId}`;
    }

    return `${patient.first_name} ${patient.last_name}`;
  }

  function handleLogout() {
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
  }

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "1200px",
        margin: "auto",
      }}
    >
      <h1>Nurse Dashboard</h1>

      <p>
        Welcome to the Wound Healing
        Monitoring System.
      </p>

      {message && <p>{message}</p>}

      {!message && (
        <>
          <div
            style={{
              display: "flex",
              gap: "20px",
              flexWrap: "wrap",
              marginTop: "30px",
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                flex: "1",
                minWidth: "200px",
                border: "1px solid #ccc",
                borderRadius: "10px",
                padding: "20px",
                backgroundColor: "white",
              }}
            >
              <h2>Total Patients</h2>

              <p
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                }}
              >
                {patients.length}
              </p>
            </div>

            <div
              style={{
                flex: "1",
                minWidth: "200px",
                border: "1px solid #ccc",
                borderRadius: "10px",
                padding: "20px",
                backgroundColor: "white",
              }}
            >
              <h2>
                Total Assessments
              </h2>

              <p
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                }}
              >
                {assessments.length}
              </p>
            </div>

            <div
              style={{
                flex: "1",
                minWidth: "200px",
                border: "1px solid #ccc",
                borderRadius: "10px",
                padding: "20px",
                backgroundColor: "white",
              }}
            >
              <h2>
                Completed Analyses
              </h2>

              <p
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                }}
              >
                {completedAnalyses}
              </p>
            </div>

            <div
              style={{
                flex: "1",
                minWidth: "200px",
                border: "1px solid #ccc",
                borderRadius: "10px",
                padding: "20px",
                backgroundColor: "white",
              }}
            >
              <h2>
                Pending Analyses
              </h2>

              <p
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                }}
              >
                {pendingAnalyses}
              </p>
            </div>

            <div
              style={{
                flex: "1",
                minWidth: "200px",
                border: "1px solid #ccc",
                borderRadius: "10px",
                padding: "20px",
                backgroundColor: "white",
              }}
            >
              <h2>
                Failed Analyses
              </h2>

              <p
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                }}
              >
                {failedAnalyses}
              </p>
            </div>
          </div>

          <div
            style={{
              marginBottom: "35px",
            }}
          >
            <button
              onClick={() =>
                navigate("/patients")
              }
              style={{
                marginRight: "10px",
              }}
            >
              Patients
            </button>

            <button
              onClick={() =>
                navigate("/patients")
              }
              style={{
                marginRight: "10px",
              }}
            >
              New Wound Assessment
            </button>

            <button
              onClick={() =>
                navigate("/assessments")
              }
              style={{
                marginRight: "10px",
              }}
            >
              Assessment History
            </button>

            <button
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>

          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: "10px",
              padding: "20px",
              backgroundColor: "white",
            }}
          >
            <h2>
              Recent Assessments
            </h2>

            {recentAssessments.length ===
            0 ? (
              <p>
                No assessments found.
              </p>
            ) : (
              <table
                border="1"
                cellPadding="10"
                style={{
                  width: "100%",
                  borderCollapse:
                    "collapse",
                  marginTop: "15px",
                }}
              >
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Model</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {recentAssessments.map(
                    (assessment) => (
                      <tr
                        key={
                          assessment.id
                        }
                      >
                        <td>
                          {getPatientName(
                            assessment.patient
                          )}
                        </td>

                        <td>
                          {
                            assessment.assessment_date
                          }
                        </td>

                        <td>
                          {
                            assessment.analysis_status
                          }
                        </td>

                        <td>
                          {assessment.model_version ||
                            "Not available"}
                        </td>

                        <td>
                          <button
                            onClick={() =>
                              navigate(
                                `/patients/${assessment.patient}/progress`
                              )
                            }
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
        </>
      )}
    </div>
  );
}

export default NurseDashboard;