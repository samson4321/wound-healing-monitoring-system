import { useNavigate } from "react-router-dom";

function DoctorDashboard() {
  const navigate = useNavigate();

  const firstName =
    localStorage.getItem("firstName");

  const username =
    localStorage.getItem("username");

  function handleLogout() {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");
    localStorage.removeItem("firstName");
    localStorage.removeItem("authToken");

    navigate("/login", {
      replace: true,
    });
  }

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "1000px",
        margin: "auto",
      }}
    >
      <h1>Doctor Dashboard</h1>

      <p>
        Welcome{" "}
        {firstName || username || "Doctor"} to the
        Wound Healing Monitoring System.
      </p>

      <div
        style={{
          display: "flex",
          gap: "15px",
          flexWrap: "wrap",
          marginTop: "30px",
        }}
      >
        <button
          onClick={() =>
            navigate("/doctor/patients")
          }
        >
          View Patients
        </button>

        <button
          onClick={() =>
            navigate("/doctor/assessments")
          }
        >
          Assessment History
        </button>

        <button
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default DoctorDashboard;