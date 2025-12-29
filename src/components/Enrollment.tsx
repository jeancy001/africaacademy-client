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
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>(""); // Track room id
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isStudentEnrolled, setIsStudentEnrolled] = useState<boolean>(false);

  // Fetch teacher rooms safely
  useEffect(() => {
    const fetchTeacherRooms = async () => {
      try {
        const res = await axios.get(`${API_URL}/teacher-rooms/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const validRooms = res.data.filter((room: TeacherRoom) => room.teacher && room.teacher._id);
        setTeacherRooms(validRooms);

        if (validRooms.length > 0) {
          setSelectedTeacher(validRooms[0].teacher!._id);
          setSelectedRoom(validRooms[0]._id); // Set initial room
        }
        console.log("Teachers: ",validRooms[0].teacher!._id)
        console.log("Rooms: ",validRooms[0]._id)
      } catch (err) {
        console.error(err);
      }
    };

    fetchTeacherRooms();
  }, [token]);

  // Fetch student's enrollments
  const fetchEnrollments = async () => {
    if (!user?.id) return;
    try {
      const res = await axios.get(`${API_URL}/enrollments/student/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEnrollments(res.data);
      console.log("Students", res.data)
      setIsStudentEnrolled(res.data.length > 0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [user?.id, token]);

  // Handle student enrollment
  const handleEnroll = async () => {
    if (!selectedTeacher || !selectedRoom || !user?.id) return;

    setLoading(true);
    setMessage(null);

    try {
      // Send studentId, teacherId, and roomId
      await axios.post(
        `${API_URL}/enrollments/`,
        { studentId: user.id, teacherId: selectedTeacher, room: selectedRoom },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchEnrollments();
      setMessage("Enrolled successfully!");
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setMessage(error.response?.data?.message || "Enrollment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-sky-100 p-4 sm:p-6 md:p-10 flex flex-col md:flex-row gap-6 md:gap-8">
      {/* Enrollment Form */}
      <div className="w-full md:w-1/3 bg-white rounded-2xl shadow-lg p-5 sm:p-6 flex flex-col gap-5">
        <h2 className="text-xl sm:text-2xl font-bold text-indigo-700">Enroll in a Class</h2>
        <p className="text-gray-600 text-sm sm:text-base">
          {isStudentEnrolled
            ? "Select a teacher and subject to join a live class."
            : "You must enroll first before selecting a teacher."}
        </p>

        <select
          value={selectedRoom}
          onChange={(e) => {
            const room = teacherRooms.find((r) => r._id === e.target.value);
            if (room && room.teacher) {
              setSelectedRoom(room._id);
              setSelectedTeacher(room.teacher._id);
            }
          }}
          className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-gray-700"
          disabled={!isStudentEnrolled}
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
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-md transition flex justify-center items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Enroll Now"}
        </button>

        {message && <p className="text-sm text-green-600 font-medium">{message}</p>}
      </div>

      {/* Enrolled Teachers */}
      <div className="flex-1 bg-white rounded-2xl shadow-lg p-5 sm:p-6 flex flex-col gap-5 overflow-auto max-h-[80vh]">
        <h2 className="text-xl sm:text-2xl font-bold text-indigo-700">My Enrolled Classes</h2>
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
                    className="p-4 border border-gray-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center hover:shadow-md transition"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">{enroll.teacher.name}</p>
                      <p className="text-gray-500 text-sm">{enroll.teacher.email}</p>
                      <p className="text-gray-400 text-sm">Subject: {enroll.room.subject}</p>
                    </div>
                    <span className="mt-2 sm:mt-0 text-indigo-600 font-medium">{enroll.room.roomName}</span>
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
