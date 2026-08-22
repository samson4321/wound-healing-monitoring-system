import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import NurseDashboard from "./pages/NurseDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";

import DoctorPatients from "./pages/DoctorPatients";

import Patients from "./pages/Patients";
import AddPatient from "./pages/AddPatient";
import NewAssessment from "./pages/NewAssessment";
import AssessmentHistory from "./pages/AssessmentHistory";
import PatientProgress from "./pages/PatientProgress";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ========================= */}
        {/* PUBLIC ROUTES */}
        {/* ========================= */}

        {/* Default page */}
        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        {/* Login */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* Registration */}
        <Route
          path="/register"
          element={<Register />}
        />


        {/* ========================= */}
        {/* NURSE ROUTES */}
        {/* ========================= */}

        {/* Nurse Dashboard */}
        <Route
          path="/nurse/dashboard"
          element={
            <ProtectedRoute
              allowedRole="NURSE"
            >
              <NurseDashboard />
            </ProtectedRoute>
          }
        />

        {/* Nurse Patient List */}
        <Route
          path="/patients"
          element={
            <ProtectedRoute
              allowedRole="NURSE"
            >
              <Patients />
            </ProtectedRoute>
          }
        />

        {/* Nurse Add Patient */}
        <Route
          path="/patients/add"
          element={
            <ProtectedRoute
              allowedRole="NURSE"
            >
              <AddPatient />
            </ProtectedRoute>
          }
        />

        {/* Nurse New Assessment */}
        <Route
          path="/patients/:patientId/assessment"
          element={
            <ProtectedRoute
              allowedRole="NURSE"
            >
              <NewAssessment />
            </ProtectedRoute>
          }
        />

        {/* Nurse Patient Progress */}
        <Route
          path="/patients/:patientId/progress"
          element={
            <ProtectedRoute
              allowedRole="NURSE"
            >
              <PatientProgress />
            </ProtectedRoute>
          }
        />

        {/* Nurse Assessment History */}
        <Route
          path="/assessments"
          element={
            <ProtectedRoute
              allowedRole="NURSE"
            >
              <AssessmentHistory />
            </ProtectedRoute>
          }
        />


        {/* ========================= */}
        {/* DOCTOR ROUTES */}
        {/* ========================= */}

        {/* Doctor Dashboard */}
        <Route
          path="/doctor/dashboard"
          element={
            <ProtectedRoute
              allowedRole="DOCTOR"
            >
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Doctor Patient List */}
        <Route
          path="/doctor/patients"
          element={
            <ProtectedRoute
              allowedRole="DOCTOR"
            >
              <DoctorPatients />
            </ProtectedRoute>
          }
        />

        {/* Doctor Patient Progress */}
        <Route
          path="/doctor/patients/:patientId/progress"
          element={
            <ProtectedRoute
              allowedRole="DOCTOR"
            >
              <PatientProgress />
            </ProtectedRoute>
          }
        />

        {/* Doctor Assessment History */}
        <Route
          path="/doctor/assessments"
          element={
            <ProtectedRoute
              allowedRole="DOCTOR"
            >
              <AssessmentHistory />
            </ProtectedRoute>
          }
        />


        {/* ========================= */}
        {/* ADMIN ROUTES */}
        {/* ========================= */}

        {/* Admin Dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute
              allowedRole="ADMIN"
            >
              <AdminDashboard />
            </ProtectedRoute>
          }
        />


        {/* ========================= */}
        {/* UNKNOWN URL */}
        {/* ========================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;