import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const navigate = useNavigate();

  const firstName =
    localStorage.getItem("firstName");

  const username =
    localStorage.getItem("username");

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
        maxWidth: "1000px",
        margin: "auto",
      }}
    >
      <h1>Admin Dashboard</h1>

      <p>
        Welcome{" "}
        {firstName ||
          username ||
          "Administrator"}{" "}
        to the Wound Healing Monitoring
        System.
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
            window.open(
              `${import.meta.env.VITE_API_URL}/admin/`,
              "_blank"
            )
          }
        >
          Open Django Admin
        </button>

        <button
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      <div
        style={{
          marginTop: "40px",
          border: "1px solid #ccc",
          borderRadius: "10px",
          padding: "20px",
          backgroundColor: "white",
        }}
      >
        <h2>
          Administration
        </h2>

        <p>
          Use this dashboard to manage
          system administration.
        </p>

        <p>
          Staff approval management can
          be added here next.
        </p>
      </div>
    </div>
  );
}

export default AdminDashboard;