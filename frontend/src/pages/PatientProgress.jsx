import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { apiFetch, clearAuth } from "../api";

function PatientProgress() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const userRole =
    localStorage.getItem("userRole");

  const [patient, setPatient] =
    useState(null);

  const [assessments, setAssessments] =
    useState([]);

  const [message, setMessage] =
    useState(
      "Loading patient progress..."
    );

  const [reviewComments, setReviewComments] =
    useState({});

  const [reviewMessages, setReviewMessages] =
    useState({});

  const [reviewLoading, setReviewLoading] =
    useState({});

  useEffect(() => {
    async function loadPatientProgress() {
      try {
        const patientResponse =
          await apiFetch(
            "http://127.0.0.1:8000/api/patients/"
          );

        const assessmentResponse =
          await apiFetch(
            "http://127.0.0.1:8000/api/assessments/"
          );

        if (
          patientResponse.status === 401 ||
          assessmentResponse.status === 401
        ) {
          clearAuth();

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
            "Could not load patient progress"
          );
        }

        const patientData =
          await patientResponse.json();

        const assessmentData =
          await assessmentResponse.json();

        const selectedPatient =
          patientData.find(
            (item) =>
              Number(item.id) ===
              Number(patientId)
          );

        const patientAssessments =
          assessmentData.filter(
            (assessment) =>
              Number(
                assessment.patient
              ) ===
              Number(patientId)
          );

        patientAssessments.sort(
          (a, b) =>
            new Date(
              a.assessment_date
            ) -
            new Date(
              b.assessment_date
            )
        );

        setPatient(
          selectedPatient || null
        );

        setAssessments(
          patientAssessments
        );

        const existingComments = {};

        patientAssessments.forEach(
          (assessment) => {
            existingComments[
              assessment.id
            ] =
              assessment.doctor_comment ||
              "";
          }
        );

        setReviewComments(
          existingComments
        );

        setMessage("");
      } catch (error) {
        console.error(
          "Patient progress error:",
          error
        );

        setMessage(
          "Could not load patient wound progress from the server."
        );
      }
    }

    loadPatientProgress();
  }, [patientId, navigate]);

  function handleBack() {
    if (userRole === "DOCTOR") {
      navigate("/doctor/patients");
    } else {
      navigate("/patients");
    }
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

  function getMeasurementSourceLabel(
    source
  ) {
    if (
      source ===
      "SEGMENTATION_PIXELS"
    ) {
      return "Segmentation measurement in pixels²";
    }

    if (
      source ===
      "MANUAL_CM2"
    ) {
      return "Manual measurement in cm²";
    }

    if (
      source ===
      "CALIBRATED_CM2"
    ) {
      return "Calibrated image measurement in cm²";
    }

    return "Unknown / legacy";
  }

  async function handleSubmitReview(
    assessmentId
  ) {
    const doctorComment =
      (
        reviewComments[
          assessmentId
        ] || ""
      ).trim();

    if (!doctorComment) {
      setReviewMessages(
        (previous) => ({
          ...previous,
          [assessmentId]:
            "Please enter a doctor comment before submitting.",
        })
      );

      return;
    }

    setReviewLoading(
      (previous) => ({
        ...previous,
        [assessmentId]: true,
      })
    );

    setReviewMessages(
      (previous) => ({
        ...previous,
        [assessmentId]: "",
      })
    );

    try {
      const response =
        await apiFetch(
          `http://127.0.0.1:8000/api/assessments/${assessmentId}/review/`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              doctor_comment:
                doctorComment,
            }),
          }
        );

      if (response.status === 401) {
        clearAuth();

        navigate("/login", {
          replace: true,
        });

        return;
      }

      const data =
        await response.json();

      if (!response.ok) {
        setReviewMessages(
          (previous) => ({
            ...previous,
            [assessmentId]:
              data.message ||
              "Could not save doctor review.",
          })
        );

        return;
      }

      setAssessments(
        (previousAssessments) =>
          previousAssessments.map(
            (assessment) =>
              assessment.id ===
              assessmentId
                ? data
                : assessment
          )
      );

      setReviewComments(
        (previous) => ({
          ...previous,
          [assessmentId]:
            data.doctor_comment ||
            "",
        })
      );

      setReviewMessages(
        (previous) => ({
          ...previous,
          [assessmentId]:
            "Review saved successfully.",
        })
      );
    } catch (error) {
      console.error(
        "Doctor review error:",
        error
      );

      setReviewMessages(
        (previous) => ({
          ...previous,
          [assessmentId]:
            "Could not connect to the server.",
        })
      );
    } finally {
      setReviewLoading(
        (previous) => ({
          ...previous,
          [assessmentId]: false,
        })
      );
    }
  }

  function formatReviewedAt(
    value
  ) {
    if (!value) {
      return "Not reviewed yet";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleString();
  }

  const comparableAssessments =
    assessments.filter(
      (assessment) =>
        assessment.wound_area_pixels !==
          null &&
        assessment.wound_area_pixels !==
          undefined &&
        assessment.model_version ===
          "baseline-v4-grabcut"
    );

  const chartData =
    comparableAssessments.map(
      (assessment, index) => ({
        assessment: `A${index + 1}`,
        date:
          assessment.assessment_date,
        area: Number(
          assessment.wound_area_pixels
        ),
      })
    );

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "1100px",
        margin: "auto",
      }}
    >
      <h1>
        Patient Wound Progress
      </h1>

      <button
        onClick={handleBack}
        style={{
          marginBottom: "25px",
        }}
      >
        ← Back to Patients
      </button>

      {message && (
        <p>{message}</p>
      )}

      {!message && patient && (
        <div
          style={{
            border:
              "1px solid #ccc",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "30px",
            backgroundColor:
              "white",
          }}
        >
          <h2>
            {patient.first_name}{" "}
            {patient.last_name}
          </h2>

          <p>
            <strong>
              Patient ID:
            </strong>{" "}
            {patient.patient_id}
          </p>

          <p>
            <strong>
              Date of Birth:
            </strong>{" "}
            {
              patient.date_of_birth
            }
          </p>

          <p>
            <strong>
              Sex:
            </strong>{" "}
            {patient.sex}
          </p>

          <p>
            <strong>
              Total Assessments:
            </strong>{" "}
            {assessments.length}
          </p>

          {userRole === "NURSE" && (
            <button
              onClick={() =>
                navigate(
                  `/patients/${patientId}/assessment`
                )
              }
            >
              + New Assessment
            </button>
          )}

          {userRole === "DOCTOR" && (
            <p
              style={{
                marginTop:
                  "15px",
              }}
            >
              Doctor view —
              assessment records are
              read-only except for
              clinical review comments.
            </p>
          )}
        </div>
      )}

      {!message &&
        !patient && (
          <p>
            Patient not found.
          </p>
        )}

      {!message &&
        patient &&
        chartData.length > 0 && (
          <div
            style={{
              border:
                "1px solid #ccc",
              borderRadius:
                "10px",
              padding: "20px",
              marginBottom:
                "30px",
              backgroundColor:
                "white",
            }}
          >
            <h2>
              Segmented Wound Area
              Trend
            </h2>

            <p>
              Comparable measurements
              from{" "}
              <strong>
                baseline-v4-grabcut
              </strong>{" "}
              only.
            </p>

            <p>
              Experimental image-space
              measurement in pixels².
              This is not yet calibrated
              to cm².
            </p>

            <div
              style={{
                width: "100%",
                height: "350px",
              }}
            >
              <ResponsiveContainer>
                <LineChart
                  data={chartData}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="assessment"
                  />

                  <YAxis />

                  <Tooltip
                    formatter={(
                      value
                    ) => [
                      `${value} pixels²`,
                      "Segmented Area",
                    ]}
                    labelFormatter={(
                      label,
                      payload
                    ) => {
                      if (
                        payload &&
                        payload.length >
                          0
                      ) {
                        return `${label} - ${payload[0].payload.date}`;
                      }

                      return label;
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="area"
                    strokeWidth={2}
                    dot
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      {!message &&
        patient &&
        chartData.length === 0 && (
          <p>
            No comparable GrabCut
            measurements are available
            for the progress chart yet.
          </p>
        )}

      {!message &&
        patient &&
        assessments.length ===
          0 && (
          <p>
            No wound assessments have
            been recorded for this
            patient.
          </p>
        )}

      {!message &&
        assessments.map(
          (
            assessment,
            index
          ) => {
            const previousAssessment =
              index > 0
                ? assessments[
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
                    "10px",
                  padding:
                    "25px",
                  marginBottom:
                    "30px",
                  backgroundColor:
                    "white",
                }}
              >
                <h2>
                  Assessment{" "}
                  {index + 1}
                </h2>

                <p>
                  <strong>
                    Assessment ID:
                  </strong>{" "}
                  {assessment.id}
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
                    "Not analyzed"}
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
                    Measurement Source:
                  </strong>{" "}
                  {getMeasurementSourceLabel(
                    assessment.measurement_source
                  )}
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
                        Previous Raw Wound Area:
                      </strong>{" "}
                      {previousAssessment.wound_area_pixels !=
                      null
                        ? `${previousAssessment.wound_area_pixels} pixels²`
                        : "Not available"}
                    </p>

                    <p>
                      <strong>
                        Segmented Area Change:
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
                      Progress Comparison:
                    </strong>{" "}
                    Baseline assessment
                  </p>
                )}

                <div
                  style={{
                    display:
                      "flex",
                    gap: "25px",
                    flexWrap:
                      "wrap",
                    marginTop:
                      "25px",
                  }}
                >
                  {assessment.wound_image && (
                    <div
                      style={{
                        flex: "1",
                        minWidth:
                          "300px",
                      }}
                    >
                      <h3>
                        Original Wound
                        Image
                      </h3>

                      <img
                        src={
                          assessment.wound_image
                        }
                        alt={`Wound assessment ${assessment.id}`}
                        style={{
                          width:
                            "100%",
                          maxWidth:
                            "450px",
                          borderRadius:
                            "8px",
                          border:
                            "1px solid #ccc",
                        }}
                      />
                    </div>
                  )}

                  {assessment.wound_mask && (
                    <div
                      style={{
                        flex: "1",
                        minWidth:
                          "300px",
                      }}
                    >
                      <h3>
                        Segmentation
                        Mask
                      </h3>

                      <img
                        src={
                          assessment.wound_mask
                        }
                        alt={`Segmentation mask ${assessment.id}`}
                        style={{
                          width:
                            "100%",
                          maxWidth:
                            "450px",
                          borderRadius:
                            "8px",
                          border:
                            "1px solid #ccc",
                        }}
                      />
                    </div>
                  )}
                </div>

                <div
                  style={{
                    marginTop:
                      "25px",
                    borderTop:
                      "1px solid #ddd",
                    paddingTop:
                      "20px",
                  }}
                >
                  <h3>
                    Doctor Review
                  </h3>

                  <p>
                    <strong>
                      Review Status:
                    </strong>{" "}
                    {assessment.review_status ||
                      "PENDING"}
                  </p>

                  <p>
                    <strong>
                      Reviewed By:
                    </strong>{" "}
                    {assessment.reviewed_by ||
                      "Not reviewed yet"}
                  </p>

                  <p>
                    <strong>
                      Reviewed At:
                    </strong>{" "}
                    {formatReviewedAt(
                      assessment.reviewed_at
                    )}
                  </p>

                  {userRole ===
                    "NURSE" && (
                    <p>
                      <strong>
                        Doctor Comment:
                      </strong>{" "}
                      {assessment.doctor_comment ||
                        "No doctor review yet."}
                    </p>
                  )}

                  {userRole ===
                    "DOCTOR" && (
                    <>
                      <label>
                        <strong>
                          Clinical Comment
                        </strong>
                      </label>

                      <br />

                      <textarea
                        rows="4"
                        value={
                          reviewComments[
                            assessment.id
                          ] || ""
                        }
                        onChange={(
                          event
                        ) =>
                          setReviewComments(
                            (
                              previous
                            ) => ({
                              ...previous,
                              [assessment.id]:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        style={{
                          width:
                            "100%",
                          maxWidth:
                            "700px",
                          marginTop:
                            "8px",
                          padding:
                            "10px",
                        }}
                      />

                      <br />

                      <button
                        type="button"
                        disabled={
                          reviewLoading[
                            assessment.id
                          ] === true
                        }
                        onClick={() =>
                          handleSubmitReview(
                            assessment.id
                          )
                        }
                        style={{
                          marginTop:
                            "10px",
                        }}
                      >
                        {reviewLoading[
                          assessment.id
                        ]
                          ? "Saving Review..."
                          : assessment.review_status ===
                            "REVIEWED"
                          ? "Update Review"
                          : "Submit Review"}
                      </button>

                      {reviewMessages[
                        assessment.id
                      ] && (
                        <p
                          style={{
                            marginTop:
                              "10px",
                          }}
                        >
                          {
                            reviewMessages[
                              assessment.id
                            ]
                          }
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          }
        )}
    </div>
  );
}

export default PatientProgress;