import { API_BASE_URL } from "../api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function AssessmentHistory() {
  const navigate = useNavigate();

  const userRole =
    localStorage.getItem("userRole");

  const [assessments, setAssessments] =
    useState([]);

  const [patients, setPatients] =
    useState([]);

  const [message, setMessage] =
    useState(
      "Loading assessments..."
    );

  useEffect(() => {
    async function loadData() {
      try {
        const token =
          localStorage.getItem(
            "authToken"
          );

        if (!token) {
          navigate("/login", {
            replace: true,
          });

          return;
        }

        const headers = {
          Authorization:
            `Token ${token}`,
        };

        const assessmentResponse =
          await fetch(
            `${API_BASE_URL}/api/assessments/`,
            {
              headers,
            }
          );

        const patientResponse =
          await fetch(
            `${API_BASE_URL}/api/patients/`,
            {
              headers,
            }
          );

        if (
          assessmentResponse.status ===
            401 ||
          patientResponse.status ===
            401
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
          !assessmentResponse.ok ||
          !patientResponse.ok
        ) {
          throw new Error(
            "Could not load data"
          );
        }

        const assessmentData =
          await assessmentResponse.json();

        const patientData =
          await patientResponse.json();

        setAssessments(
          assessmentData
        );

        setPatients(
          patientData
        );

        setMessage("");
      } catch (error) {
        console.error(error);

        setMessage(
          "Could not load assessment history from the server."
        );
      }
    }

    loadData();
  }, [navigate]);

  function handleBack() {
    if (userRole === "DOCTOR") {
      navigate(
        "/doctor/dashboard"
      );
    } else {
      navigate(
        "/nurse/dashboard"
      );
    }
  }

  function getPatientName(
    patientDatabaseId
  ) {
    const patient =
      patients.find(
        (item) =>
          Number(item.id) ===
          Number(
            patientDatabaseId
          )
      );

    if (!patient) {
      return `Patient ${patientDatabaseId}`;
    }

    return `${patient.first_name} ${patient.last_name}`;
  }

  function calculatePixelAreaChange(
    currentArea,
    previousArea
  ) {
    if (
      currentArea === null ||
      previousArea === null ||
      currentArea === undefined ||
      previousArea === undefined
    ) {
      return null;
    }

    const current =
      Number(currentArea);

    const previous =
      Number(previousArea);

    if (
      Number.isNaN(current) ||
      Number.isNaN(previous) ||
      previous <= 0
    ) {
      return null;
    }

    return (
      ((current - previous) /
        previous) *
      100
    );
  }

  function getChangeDescription(
    change
  ) {
    if (change === null) {
      return "Not available";
    }

    const absoluteChange =
      Math.abs(change).toFixed(1);

    if (change < -5) {
      return `${absoluteChange}% decrease in segmented wound area`;
    }

    if (change > 5) {
      return `${absoluteChange}% increase in segmented wound area`;
    }

    return `${absoluteChange}% change — approximately stable`;
  }

  function groupAssessmentsByPatient() {
    const grouped = {};

    assessments.forEach(
      (assessment) => {
        const patientId =
          assessment.patient;

        if (!grouped[patientId]) {
          grouped[patientId] =
            [];
        }

        grouped[
          patientId
        ].push(assessment);
      }
    );

    Object.keys(
      grouped
    ).forEach(
      (patientId) => {
        grouped[
          patientId
        ].sort(
          (a, b) =>
            new Date(
              a.assessment_date
            ) -
            new Date(
              b.assessment_date
            )
        );
      }
    );

    return grouped;
  }

  const groupedAssessments =
    groupAssessmentsByPatient();

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "1200px",
        margin: "auto",
      }}
    >
      <h1>
        Assessment History
      </h1>

      <button
        onClick={handleBack}
        style={{
          marginBottom: "15px",
        }}
      >
        {userRole === "DOCTOR"
          ? "← Back to Doctor Dashboard"
          : "← Back to Nurse Dashboard"}
      </button>

      {userRole === "DOCTOR" && (
        <p
          style={{
            marginBottom:
              "25px",
          }}
        >
          Doctor view —
          assessment records are
          read-only.
        </p>
      )}

      {message && (
        <p>{message}</p>
      )}

      {!message &&
        assessments.length ===
          0 && (
          <p>
            No wound assessments
            found.
          </p>
        )}

      {!message &&
        Object.entries(
          groupedAssessments
        ).map(
          ([
            patientId,
            patientAssessments,
          ]) => (
            <div
              key={patientId}
              style={{
                marginBottom:
                  "50px",
              }}
            >
              <h2>
                {getPatientName(
                  Number(
                    patientId
                  )
                )}
              </h2>

              <p>
                Total Assessments:{" "}
                {
                  patientAssessments.length
                }
              </p>

              {patientAssessments.map(
                (
                  assessment,
                  index
                ) => {
                  const previousAssessment =
                    index > 0
                      ? patientAssessments[
                          index - 1
                        ]
                      : null;

                  const sameModelAsPrevious =
                    previousAssessment &&
                    assessment.model_version &&
                    previousAssessment.model_version &&
                    assessment.model_version ===
                      previousAssessment.model_version;

                  const pixelAreaChange =
                    previousAssessment &&
                    sameModelAsPrevious
                      ? calculatePixelAreaChange(
                          assessment.wound_area_pixels,
                          previousAssessment.wound_area_pixels
                        )
                      : null;

                  return (
                    <div
                      key={
                        assessment.id
                      }
                      style={{
                        border:
                          "1px solid #ccc",
                        borderRadius:
                          "12px",
                        padding:
                          "24px",
                        marginBottom:
                          "30px",
                        backgroundColor:
                          "white",
                      }}
                    >
                      <h3>
                        Assessment{" "}
                        {index + 1}
                      </h3>

                      <p>
                        <strong>
                          Assessment ID:
                        </strong>{" "}
                        {
                          assessment.id
                        }
                      </p>

                      <p>
                        <strong>
                          Date:
                        </strong>{" "}
                        {
                          assessment.assessment_date
                        }
                      </p>

                      <p>
                        <strong>
                          Notes:
                        </strong>{" "}
                        {assessment.notes ||
                          "No notes"}
                      </p>

                      <p>
                        <strong>
                          Analysis Status:
                        </strong>{" "}
                        {assessment.analysis_status ||
                          "Unknown"}
                      </p>

                      <p>
                        <strong>
                          Model Version:
                        </strong>{" "}
                        {assessment.model_version ||
                          "Not available"}
                      </p>

                      <p>
                        <strong>
                          Raw Wound Area:
                        </strong>{" "}
                        {assessment.wound_area_pixels !=
                        null
                          ? `${assessment.wound_area_pixels} pixels²`
                          : "Not available"}
                      </p>

                      <p>
                        <strong>
                          Calibrated Wound Area:
                        </strong>{" "}
                        {assessment.wound_area !=
                        null
                          ? `${assessment.wound_area} cm²`
                          : "Not available yet"}
                      </p>

                      {previousAssessment && (
                        <>
                          <p>
                            <strong>
                              Previous Raw
                              Wound Area:
                            </strong>{" "}
                            {previousAssessment.wound_area_pixels !=
                            null
                              ? `${previousAssessment.wound_area_pixels} pixels²`
                              : "Not available"}
                          </p>

                          <p>
                            <strong>
                              Segmented Area
                              Change:
                            </strong>{" "}
                            {!sameModelAsPrevious
                              ? "Not comparable — different analysis model versions"
                              : getChangeDescription(
                                  pixelAreaChange
                                )}
                          </p>
                        </>
                      )}

                      {!previousAssessment && (
                        <p>
                          <strong>
                            Progress
                            Comparison:
                          </strong>{" "}
                          Baseline
                          assessment
                        </p>
                      )}

                      <div
                        style={{
                          display:
                            "flex",
                          gap: "24px",
                          flexWrap:
                            "wrap",
                          marginTop:
                            "20px",
                        }}
                      >
                        {assessment.wound_image && (
                          <div>
                            <h4>
                              Original Wound
                              Image
                            </h4>

                            <img
                              src={
                                assessment.wound_image
                              }
                              alt={`Original wound assessment ${assessment.id}`}
                              style={{
                                maxWidth:
                                  "350px",
                                width:
                                  "100%",
                                borderRadius:
                                  "8px",
                                border:
                                  "1px solid #ccc",
                              }}
                            />
                          </div>
                        )}

                        {assessment.wound_mask && (
                          <div>
                            <h4>
                              Segmentation
                              Mask
                            </h4>

                            <img
                              src={
                                assessment.wound_mask
                              }
                              alt={`Segmentation mask ${assessment.id}`}
                              style={{
                                maxWidth:
                                  "350px",
                                width:
                                  "100%",
                                borderRadius:
                                  "8px",
                                border:
                                  "1px solid #ccc",
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {!assessment.wound_mask && (
                        <p
                          style={{
                            marginTop:
                              "20px",
                          }}
                        >
                          <strong>
                            Segmentation
                            Mask:
                          </strong>{" "}
                          Not available for
                          this assessment.
                        </p>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )
        )}
    </div>
  );
}

export default AssessmentHistory;