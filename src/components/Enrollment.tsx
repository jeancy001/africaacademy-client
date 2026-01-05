import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../constants/Api_url";
import { Loader2 } from "lucide-react";

/* ===================== TYPES ===================== */
interface Teacher {
  _id: string;
  name: string;
  email: string;
}

interface TeacherRoom {
  _id: string;
  teacher: Teacher | null;
  roomName: string;
  subject: string;
}

interface Enrollment {
  _id: string;
  teacher: Teacher | null;
  room: TeacherRoom | null;
}

/* ===================== COMPONENT ===================== */
function Enrollment() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [teacherRooms, setTeacherRooms] = useState<TeacherRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const selectedTeacherId = useMemo(() => {
    const room = teacherRooms.find((r) => r._id === selectedRoom);
    return room?.teacher?._id ?? "";
  }, [selectedRoom, teacherRooms]);

  const alreadyEnrolled = useMemo(() => {
    return enrollments.some((e) => e.teacher?._id === selectedTeacherId);
  }, [enrollments, selectedTeacherId]);

  /* ===================== FETCH TEACHER ROOMS ===================== */
  useEffect(() => {
    if (!token) return;

    const fetchTeacherRooms = async () => {
      try {
        const res = await axios.get(`${API_URL}/teacher-rooms`, { headers });
        const validRooms = res.data.filter(
          (room: TeacherRoom) => room.teacher && room.teacher._id
        );
        setTeacherRooms(validRooms);
        if (validRooms.length > 0) setSelectedRoom(validRooms[0]._id);
      } catch (err) {
        console.error("Failed to fetch teacher rooms:", err);
        setError("Failed to load teacher rooms");
      }
    };

    fetchTeacherRooms();
  }, [token, headers]);

  /* ===================== FETCH ENROLLMENTS ===================== */
  const fetchEnrollments = async () => {
    if (!user?._id || !token) return;
    try {
      const res = await axios.get(`${API_URL}/enrollments/student/${user._id}`, { headers });
      setEnrollments(res.data);
    } catch (err) {
      console.error("Failed to fetch enrollments:", err);
      setError("Failed to load enrollments");
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [user?._id, token]);

  /* ===================== ENROLL ===================== */
  const handleEnroll = async () => {
    if (!user?._id || !selectedRoom || !selectedTeacherId) return;

    if (alreadyEnrolled) {
      setMessage("You are already enrolled with this teacher.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await axios.post(
        `${API_URL}/enrollments`,
        {
          studentId: user._id,
          teacherId: selectedTeacherId,
          roomId: selectedRoom,
        },
        { headers }
      );

      await fetchEnrollments();
      setMessage("Enrolled successfully!");
      // ❌ Do NOT navigate automatically
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || "Enrollment failed");
    } finally {
      setLoading(false);
    }
  };

  /* ===================== GUARDS ===================== */
  if (!user || !token) return <p className="p-6">Loading user info...</p>;
  if (initialLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
      </div>
    );

  /* ===================== UI ===================== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-sky-100 p-6 flex flex-col md:flex-row gap-6">
      {/* ENROLL FORM */}
      <div className="w-full md:w-1/3 bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-5">
        <h2 className="text-2xl font-bold text-indigo-700">Enroll in a Class</h2>

        <select
          value={selectedRoom}
          onChange={(e) => setSelectedRoom(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500"
        >
          {teacherRooms.map(
            (room) =>
              room.teacher && (
                <option key={room._id} value={room._id}>
                  {room.teacher.name} — {room.subject}
                </option>
              )
          )}
        </select>

        <button
          onClick={handleEnroll}
          disabled={loading || alreadyEnrolled}
          className={`w-full font-semibold py-3 rounded-xl flex justify-center items-center gap-2
            ${
              alreadyEnrolled
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
        >
          {loading ? (
            <Loader2 className="animate-spin w-5 h-5" />
          ) : alreadyEnrolled ? (
            "Already Enrolled"
          ) : (
            "Enroll Now"
          )}
        </button>

        {message && <p className="text-sm font-medium text-green-600">{message}</p>}
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        {/* ✅ Show dashboard & meetings buttons if user has any enrollment */}
        {enrollments.length > 0 && (
          <div className="flex flex-col gap-3 mt-2">
            <button
              onClick={() => navigate("/studentdash")}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl"
            >
              Go to Dashboard
            </button>

            <button
              onClick={() => navigate("/meetings")}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl"
            >
              Go to Meetings
            </button>
          </div>
        )}
      </div>

      {/* ENROLLED CLASSES */}
      <div className="flex-1 bg-white rounded-2xl shadow-lg p-6 overflow-auto">
        <h2 className="text-2xl font-bold text-indigo-700 mb-4">My Enrolled Classes</h2>

        {enrollments.length === 0 ? (
          <p className="text-gray-500">You are not enrolled in any classes yet.</p>
        ) : (
          <ul className="space-y-4">
            {enrollments.map(
              (enroll) =>
                enroll.teacher &&
                enroll.room && (
                  <li
                    key={enroll._id}
                    className="p-4 border rounded-xl flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold">{enroll.teacher.name}</p>
                      <p className="text-sm text-gray-500">{enroll.teacher.email}</p>
                      <p className="text-sm text-gray-400">Subject: {enroll.room.subject}</p>
                    </div>
                    <span className="text-indigo-600 font-medium">{enroll.room.roomName}</span>
                  </li>
                )
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Enrollment;
