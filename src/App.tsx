// App.tsx
import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./app/ProtectRoutes";
import AuthPage from "./app/AuthPage";
import VideoMeeting from "./components/VideoMeetings";
import DashBoard from "./dash/DashBoard";
import { Studentdash } from "./dash/students/StudentDash";

function App() {
  const { user,token } = useAuth();
  return (
    <Routes>
      <Route
        path="/register"
        element={user && token ? <Navigate to="/" replace /> : <AuthPage />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <VideoMeeting />
          </ProtectedRoute>
        }
      />

     <Route
        path="/dashboard"
        element={
     
            <DashBoard/>
         
        }
      />

      {/* Optional: fallback 404 */}
      <Route path="*" element={<Navigate to={user && token ? "/" : "/register"} replace />}
       />
       <Route path="/studentdash" element={  <ProtectedRoute> <Studentdash/> </ProtectedRoute>} />
    </Routes>
  );
}

export default App;
