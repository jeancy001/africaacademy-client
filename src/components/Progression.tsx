import { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle, Lock, CreditCard, Download } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../constants/Api_url";

/* ================= TYPES ================= */
interface Progress {
  _id: string;
  course: {
    subject: string;
    roomName: string;
  };
  progressPercent: number;
  completed: boolean;
  certificateIssued: boolean;
}

export const Progressions = () => {
  const { user, token } = useAuth();
  const [progressData, setProgressData] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // track which course is processing

  /* ================= FETCH PROGRESS ================= */
  useEffect(() => {
    if (!user?._id || !token) return;

    const fetchProgress = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/progress/student/${user._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setProgressData(res.data);
      } catch (err) {
        console.error("Failed to fetch progress", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [user?._id, token]);

  /* ================= HANDLE PAYMENT & CERTIFICATE ================= */
  const handlePayment = async (progressId: string) => {
    if (!token) return;
    try {
      setActionLoading(progressId);
      await axios.put(
        `${API_URL}/progress/${progressId}/payment`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await axios.put(
        `${API_URL}/progress/${progressId}/certificate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // refresh progress data
      const res = await axios.get(
        `${API_URL}/progress/student/${user?._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProgressData(res.data);
    } catch (err) {
      console.error("Payment failed", err);
      alert("Payment failed. Try again.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-sky-100 px-6 py-10">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-extrabold text-indigo-700">
            Learning Progress
          </h1>
          <p className="text-gray-600">
            Track your progress and certificates
          </p>
        </div>

        {/* CONTENT */}
        {loading ? (
          <p className="text-gray-500">Loading progress...</p>
        ) : progressData.length === 0 ? (
          <p className="text-gray-500">
            No progress records yet. Start learning 🚀
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {progressData.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-3xl shadow-lg p-6 space-y-4 hover:shadow-xl transition"
              >
                {/* COURSE INFO */}
                <div>
                  <h2 className="text-lg font-bold text-indigo-600">
                    {item.course.subject}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {item.course.roomName}
                  </p>
                </div>

                {/* PROGRESS BAR */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{item.progressPercent}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full">
                    <div
                      className="h-3 bg-indigo-600 rounded-full transition-all"
                      style={{ width: `${item.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* STATUS */}
                <div className="flex items-center gap-2 text-sm">
                  {item.completed ? (
                    <>
                      <CheckCircle className="text-green-600" size={18} />
                      <span className="text-green-600 font-medium">
                        Course Completed
                      </span>
                    </>
                  ) : (
                    <>
                      <Lock className="text-gray-400" size={18} />
                      <span className="text-gray-500">
                        In Progress
                      </span>
                    </>
                  )}
                </div>

                {/* CERTIFICATE */}
                <div className="border-t pt-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Certificate</p>
                    <p className="text-sm text-gray-500">
                      {item.certificateIssued
                        ? "Available"
                        : item.completed
                        ? "Payment Required"
                        : "Locked"}
                    </p>
                  </div>

                  {item.certificateIssued ? (
                    <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm">
                      <Download size={16} />
                      Download
                    </button>
                  ) : item.completed ? (
                    <button
                      onClick={() => handlePayment(item._id)}
                      disabled={actionLoading === item._id}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm"
                    >
                      <CreditCard size={16} />
                      {actionLoading === item._id ? "Processing..." : "Pay & Get"}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="px-4 py-2 bg-gray-300 text-gray-600 rounded-xl text-sm cursor-not-allowed"
                    >
                      Locked
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
