import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  API_BASE_URL,
  clearAuth,
} from "../api";

function AdminDashboard() {
  const navigate = useNavigate();

  const firstName =
    localStorage.getItem("firstName");

  const username =
    localStorage.getItem("username");

  const [staff, setStaff] =
    useState([]);

  const [message, setMessage] =
    useState(
      "Loading staff accounts..."
    );

  const [actionMessage, setActionMessage] =
    useState("");

  const [loadingId, setLoadingId] =
    useState(null);

  useEffect(() => {
    async function loadStaff() {
      try {
        const token =
          localStorage.getItem(
            "authToken"
          );

        if (!token) {
          clearAuth();

          navigate("/login", {
            replace: true,
          });

          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/api/accounts/staff/`,
          {
            headers: {
              Authorization:
                `Token ${token}`,
            },
          }
        );

        if (response.status === 401) {
          clearAuth();

          navigate("/login", {
            replace: true,
          });

          return;
        }

        if (response.status === 403) {
          setMessage(
            "Administrator access is required."
          );

          return;
        }

        if (!response.ok) {
          throw new Error(
            "Could not load staff accounts"
          );
        }

        const data =
          await response.json();

        setStaff(data);
        setMessage("");
      } catch (error) {
        console.error(
          "Admin staff error:",
          error
        );

        setMessage(
          "Could not load staff accounts from the server."
        );
      }
    }

    loadStaff();
  }, [navigate]);

  function handleLogout() {
    clearAuth();

    navigate("/login", {
      replace: true,
    });
  }

  async function handleApproval(
    profileId,
    newApprovalValue
  ) {
    const token =
      localStorage.getItem(
        "authToken"
      );

    if (!token) {
      clearAuth();

      navigate("/login", {
        replace: true,
      });

      return;
    }

    setLoadingId(profileId);
    setActionMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/accounts/staff/${profileId}/approval/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Token ${token}`,
          },
          body: JSON.stringify({
            is_approved:
              newApprovalValue,
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
        setActionMessage(
          data.message ||
            "Could not update staff approval."
        );

        return;
      }

      setStaff(
        (previousStaff) =>
          previousStaff.map(
            (profile) =>
              profile.id === profileId
                ? data.staff
                : profile
          )
      );

      setActionMessage(
        data.message ||
          "Staff account updated."
      );
    } catch (error) {
      console.error(
        "Approval error:",
        error
      );

      setActionMessage(
        "Could not connect to the server."
      );
    } finally {
      setLoadingId(null);
    }
  }

  const pendingCount =
    staff.filter(
      (profile) =>
        !profile.is_approved
    ).length;

  const approvedCount =
    staff.filter(
      (profile) =>
        profile.is_approved
    ).length;

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "1200px",
        margin: "auto",
      }}
    >
      <h1>Admin Dashboard</h1>

      <p>
        Welcome{" "}
        {firstName ||
          username ||
          "Administrator"}{" "}
        to the Wound Healing
        Monitoring System.
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
              `${API_BASE_URL}/admin/`,
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
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          marginTop: "40px",
        }}
      >
        <div
          style={{
            flex: "1",
            minWidth: "220px",
            border:
              "1px solid #ccc",
            borderRadius: "10px",
            padding: "20px",
            backgroundColor:
              "white",
          }}
        >
          <h2>Total Staff</h2>

          <p
            style={{
              fontSize: "32px",
              fontWeight: "bold",
            }}
          >
            {staff.length}
          </p>
        </div>

        <div
          style={{
            flex: "1",
            minWidth: "220px",
            border:
              "1px solid #ccc",
            borderRadius: "10px",
            padding: "20px",
            backgroundColor:
              "white",
          }}
        >
          <h2>Pending Approval</h2>

          <p
            style={{
              fontSize: "32px",
              fontWeight: "bold",
            }}
          >
            {pendingCount}
          </p>
        </div>

        <div
          style={{
            flex: "1",
            minWidth: "220px",
            border:
              "1px solid #ccc",
            borderRadius: "10px",
            padding: "20px",
            backgroundColor:
              "white",
          }}
        >
          <h2>Approved Staff</h2>

          <p
            style={{
              fontSize: "32px",
              fontWeight: "bold",
            }}
          >
            {approvedCount}
          </p>
        </div>
      </div>

      <div
        style={{
          marginTop: "40px",
          border:
            "1px solid #ccc",
          borderRadius: "10px",
          padding: "20px",
          backgroundColor:
            "white",
        }}
      >
        <h2>
          Staff Approval Management
        </h2>

        <p>
          Review registered staff
          accounts and approve access to
          the system.
        </p>

        {message && (
          <p>{message}</p>
        )}

        {actionMessage && (
          <p
            style={{
              marginTop: "15px",
            }}
          >
            {actionMessage}
          </p>
        )}

        {!message &&
          staff.length === 0 && (
            <p>
              No staff accounts found.
            </p>
          )}

        {!message &&
          staff.length > 0 && (
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                border="1"
                cellPadding="10"
                style={{
                  width: "100%",
                  borderCollapse:
                    "collapse",
                  marginTop: "20px",
                }}
              >
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Staff ID</th>
                    <th>
                      Department
                    </th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {staff.map(
                    (profile) => (
                      <tr
                        key={
                          profile.id
                        }
                      >
                        <td>
                          {profile.first_name}{" "}
                          {profile.last_name}
                        </td>

                        <td>
                          {
                            profile.username
                          }
                        </td>

                        <td>
                          {
                            profile.email
                          }
                        </td>

                        <td>
                          {
                            profile.role
                          }
                        </td>

                        <td>
                          {
                            profile.staff_id
                          }
                        </td>

                        <td>
                          {profile.department ||
                            "Not provided"}
                        </td>

                        <td>
                          {profile.is_approved
                            ? "Approved"
                            : "Pending"}
                        </td>

                        <td>
                          <button
                            type="button"
                            disabled={
                              loadingId ===
                              profile.id
                            }
                            onClick={() =>
                              handleApproval(
                                profile.id,
                                !profile.is_approved
                              )
                            }
                          >
                            {loadingId ===
                            profile.id
                              ? "Saving..."
                              : profile.is_approved
                              ? "Revoke Approval"
                              : "Approve"}
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}

export default AdminDashboard;