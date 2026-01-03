import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../constants/Api_url";
import { Loader2 } from "lucide-react";

interface TeacherRoom {
  _id: string;
  teacher: { _id: string; name: string; email: string } | null;
  roomName: string;
  subject: string;
}

interface Enrollment {
  _id: string;
  teacher: { _id: string; name: string; email: string } | null;
  room: TeacherRoom | null;
}

function Enrollment() {
  const { user, token } = useAuth();

  const [teacherRooms, setTeacherRooms] = useState<TeacherRoom[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(""); // Track room id
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // 🔹 Fetch teacher rooms when token is ready
  useEffect(() => {
    if (!token) return;

    const fetchTeacherRooms = async () => {
      try {
        const res = await axios.get(`${API_URL}/teacher-rooms`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const validRooms = res.data.filter(
          (room: TeacherRoom) => room.teacher && room.teacher._id
        );

        setTeacherRooms(validRooms);

        if (validRooms.length > 0) {
          setSelectedTeacher(validRooms[0].teacher!._id);
          setSelectedRoom(validRooms[0]._id); // default selected room
        }
      } catch (err) {
        console.error("Failed to fetch teacher rooms:", err);
      }
    };

    fetchTeacherRooms();
  }, [token]);

  // 🔹 Fetch student enrollments when user and token are ready
  useEffect(() => {
    if (!user?.id || !token) return;

    const fetchEnrollments = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/enrollments/student/${user.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setEnrollments(res.data);
        console.log("Fetched enrollments:", res.data);
      } catch (err) {
        console.error("Failed to fetch enrollments:", err);
      }
    };

    fetchEnrollments();
  }, [user?.id, token]);

  // 🔹 Enroll student to teacher
  const handleEnroll = async () => {
    if (!user?.id || !selectedTeacher || !selectedRoom) {
      console.warn("Cannot enroll: user or selections not ready");
      return;
    }

    console.log("Enrollment data:", {
      studentId: user.id,
      teacherId: selectedTeacher,
      roomId: selectedRoom,
    });

    setLoading(true);
    setMessage(null);

    try {
      const res = await axios.post(
        `${API_URL}/enrollments`,
        {
          studentId: user.id,
          teacherId: selectedTeacher,
          roomId: selectedRoom,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Enrollment response:", res.data);

      await axios.get(`${API_URL}/enrollments/student/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => setEnrollments(res.data));

      setMessage("Enrolled successfully!");
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      console.error("Enrollment failed:", error.response?.data);
      setMessage(error.response?.data?.message || "Enrollment failed");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Render loading if user not ready
  if (!user || !token) {
    return <p className="p-6">Loading user info...</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-sky-100 p-6 flex flex-col md:flex-row gap-6">
      {/* Enrollment Form */}
      <div className="w-full md:w-1/3 bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-5">
        <h2 className="text-2xl font-bold text-indigo-700">
          Enroll in a Class
        </h2>

        <select
          value={selectedRoom}
          onChange={(e) => {
            const room = teacherRooms.find((r) => r._id === e.target.value);
            if (room && room.teacher) {
              setSelectedRoom(room._id);
              setSelectedTeacher(room.teacher._id);
            }
          }}
          className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500"
        >
          {teacherRooms.map(
            (room) =>
              room.teacher && (
                <option key={room._id} value={room._id}>
                  {room.teacher.name} – {room.subject}
                </option>
              )
          )}
        </select>

        <button
          onClick={handleEnroll}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl flex justify-center items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Enroll Now"}
        </button>

        {message && (
          <p className="text-sm font-medium text-green-600">{message}</p>
        )}
      </div>

      {/* Enrolled Classes */}
      <div className="flex-1 bg-white rounded-2xl shadow-lg p-6 overflow-auto">
        <h2 className="text-2xl font-bold text-indigo-700 mb-4">
          My Enrolled Classes
        </h2>

        {enrollments.length === 0 ? (
          <p className="text-gray-500">
            You are not enrolled in any classes yet.
          </p>
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
