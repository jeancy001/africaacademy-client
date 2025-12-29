import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../constants/Api_url";

type Subject = string | { name: string; approved?: boolean };

interface ITeacherRequest {
  _id: string;
  username: string;
  email: string;
  profileUrl?: string;
  subjects?: Subject[];
}

function RequestTeachers() {
  const { token, logout } = useAuth();

  const [requests, setRequests] = useState<ITeacherRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const api = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });

  // Normalize subjects
  const getSubjects = (subjects?: Subject[]) => {
    if (!subjects || subjects.length === 0) return [];
    return subjects.map((s) =>
      typeof s === "string" ? { name: s, approved: false } : s
    );
  };

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/auth/teacher-requests");
      setRequests(res.data ?? []);
    } catch (err: any) {
      if (err.response?.status === 401) {
        await logout();
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to fetch teacher requests"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const approveTeacher = async (userId: string) => {
    setApprovingId(userId);
    try {
      const res = await api.put(`/auth/approve-teacher/${userId}`, {
        subjects: requests.find((r) => r._id === userId)?.subjects?.map(s => (typeof s === "string" ? s : s.name)) ?? [],
      });
      if (res.status === 201 || res.status === 200) {
        // Mark the approved subjects as approved
        setRequests((prev) =>
          prev.map((r) =>
            r._id === userId
              ? {
                  ...r,
                  subjects: getSubjects(r.subjects).map((s) => ({
                    ...s,
                    approved: true,
                  })),
                }
              : r
          )
        );
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        await logout();
      } else {
        setError(
          err.response?.data?.message || err.message || "Approval failed"
        );
      }
    } finally {
      setApprovingId(null);
    }
  };

  useEffect(() => {
    if (token) fetchRequests();
  }, [token]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Pending Teacher Requests</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">{error}</div>
      )}

      {loading && <p className="text-gray-500">Loading requests...</p>}

      {!loading && requests.length === 0 && (
        <p className="text-gray-500">No pending teacher requests.</p>
      )}

      <ul className="space-y-4">
        {requests.map((req) => {
          const subjects = getSubjects(req.subjects);

          return (
            <li
              key={req._id}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white rounded-xl shadow hover:shadow-lg transition"
            >
              {/* User Info */}
              <div className="flex items-start gap-4">
                <img
                  src={req.profileUrl || "/user.png"}
                  alt={req.username}
                  className="w-14 h-14 rounded-full object-cover"
                />

                <div>
                  <p className="font-semibold text-lg">{req.username}</p>
                  <p className="text-sm text-gray-500">{req.email}</p>

                  {/* Subjects */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {subjects.length > 0 ? (
                      subjects.map((sub, index) => (
                        <span
                          key={index}
                          className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                            sub.approved
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              sub.approved ? "bg-green-600" : "bg-gray-400"
                            }`}
                          />
                          {sub.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        No subjects provided
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => approveTeacher(req._id)}
                disabled={approvingId === req._id}
                className={`px-5 py-2 rounded-md text-white font-semibold transition ${
                  approvingId === req._id
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {approvingId === req._id ? "Approving..." : "Approve"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default RequestTeachers;
