import { useEffect, useRef, useState,type ChangeEvent } from "react";
import {
  User,
  Mail,
  Image,
  Loader2,
  LogOutIcon,
  X,
  BookOpen,
  Video,
  CalendarCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../constants/Api_url";
import axios, { AxiosError } from "axios";
import Enrollment from "./Enrollment";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";

interface TeacherRoom {
  _id: string;
  teacher: { _id: string; name: string; email: string };
  roomName: string;
  subject: string;
  description?: string;
}

interface ZoomMeetingResponse {
  meetingId: number;
  join_url: string;
  start_url?: string;
  moderator: boolean;
  role: string;
  roomName: string;
  topic: string;
}

interface EnrollmentType {
  _id: string;
  teacher: { _id: string; name: string; email: string } | null;
  room: TeacherRoom | null;
}

const COMPANY_NAME = "BrightAfrica Academy";

const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "English",
  "Economics",
];

const VideoMeeting: React.FC = () => {
  const { user, token, logout } = useAuth();
  const disconnectTimer = useRef<number | null>(null);
  const navigate = useNavigate();

  const [teacherRooms, setTeacherRooms] = useState<TeacherRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [zoomMeetingData, setZoomMeetingData] = useState<ZoomMeetingResponse | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subject, setSubject] = useState("");
  const [name, setName] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatar, setAvatar] = useState(user?.profileUrl || "");

  // ---------------- FETCH TEACHER ROOMS ----------------
  useEffect(() => {
    if (!token) return;

    const fetchRooms = async () => {
      try {
        const res = await axios.get(`${API_URL}/teacher-rooms/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeacherRooms(res.data);
        if (res.data.length && !selectedRoomId) setSelectedRoomId(res.data[0]._id);
      } catch (err) {
        console.error(err);
        toast.error("Unable to fetch rooms");
      }
    };
    fetchRooms();
  }, [token]);

  // ---------------- FETCH ENROLLMENTS ----------------
  useEffect(() => {
    if (!token || !user?._id) return;

    const fetchEnrollments = async () => {
      try {
        const res = await axios.get(`${API_URL}/enrollments/student/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEnrollments(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Unable to fetch your enrollments");
      }
    };
    fetchEnrollments();
  }, [token, user?._id]);

  // ---------------- JOIN ZOOM MEETING ----------------
  const joinMeeting = async () => {
    if (!name || !email || !selectedRoomId) {
      toast.error("Missing user info or room selection");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post<ZoomMeetingResponse>(
        `${API_URL}/zoom/token`,
        { teacherRoomId: selectedRoomId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = res.data;
      setZoomMeetingData(data);

      disconnectTimer.current = window.setTimeout(() => {
        setZoomMeetingData(null);
        toast.info("Class ended after 45 minutes");
      }, 45 * 60 * 1000);

      const meetingUrl = data.moderator && data.start_url ? data.start_url : data.join_url;
      window.open(meetingUrl, "_blank");
    } catch (err) {
      console.error("Failed to join Zoom meeting:", err);
      toast.error("Unable to join meeting");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- LOGOUT ----------------
  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------- SUBJECT HANDLING ----------------
  const handleSubjectChange = (e: ChangeEvent<HTMLInputElement>) => setSubject(e.target.value);

  const submitRequestToBecomeTeacher = async () => {
    if (!subject) return toast.error("Please select a subject");

    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/auth/request-teacher`,
        { subjects: [subject] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Teacher request submitted");
      setSubject("");
      setShowSubjectModal(false);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      toast.error(error.response?.data?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (disconnectTimer.current) clearTimeout(disconnectTimer.current);
    };
  }, []);

  const isEnrolled = enrollments.length > 0;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-blue-50 to-sky-100 flex flex-col">
{/* HEADER */}
{/* HEADER */}
<header className="w-full bg-white/90 backdrop-blur-md shadow-md sticky top-0 z-50">
  <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 lg:px-8 py-4 gap-3 sm:gap-0">
    
    {/* LOGO AND BRAND */}
    <div className="flex items-center gap-3">
      <img src="/logo.png" alt="Logo" className="h-12 sm:h-16 w-auto" />
      <span className="text-xl sm:text-2xl font-extrabold text-indigo-700">
        {COMPANY_NAME}
      </span>
    </div>

    {/* ACTION BUTTONS */}
    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-0 justify-center sm:justify-end w-full sm:w-auto">
      {user?.role !== "teacher" && (
        <button
          onClick={() => setShowSubjectModal(true)}
          className="flex-1 sm:flex-none text-center px-3 sm:px-4 py-2 bg-indigo-600 text-white text-sm sm:text-base rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Work as Freelancer
        </button>
      )}

      {user?.role === "admin" && (
        <a
          href="/dashboard"
          className="flex-1 sm:flex-none text-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 transition-colors"
        >
          Dashboard
        </a>
      )}

      <button
        onClick={handleLogout}
        className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-red-500 text-white text-sm sm:text-base rounded-lg hover:bg-red-600 transition-colors"
      >
        <LogOutIcon size={16} className="sm:w-4 sm:h-4" />
        <span>Logout</span>
      </button>
    </div>
  </div>
</header>



      {/* MAIN DASHBOARD */}
      <main className="flex-1 p-6 flex flex-col md:flex-row gap-6">
        {/* LEFT PANEL: STUDENT DASHBOARD */}
        <div className="md:w-1/4 bg-white rounded-2xl shadow-lg p-6 space-y-6">
          <div className="flex flex-col items-center text-center gap-2">
            <img
              src={avatar || "/default-avatar.png"}
              alt="Avatar"
              className="w-20 h-20 rounded-full border-2 border-indigo-600"
            />
            <h3 className="text-xl font-bold">{name}</h3>
            <p className="text-gray-500">{email}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate("/studentdash")}
              className="flex items-center gap-2 w-full px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700"
            >
              <BookOpen size={20} />
              My Dashboard
            </button>

            <button
              onClick={() => navigate("/meetings")}
              className="flex items-center gap-2 w-full px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
            >
              <Video size={20} />
              My Classes
            </button>

            <button
              onClick={() => navigate("/enrollments")}
              className="flex items-center gap-2 w-full px-4 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600"
            >
              <CalendarCheck size={20} />
              Enroll in Class
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: CONTENT */}
        <div className="flex-1">
          {!isEnrolled ? (
            <Enrollment />
          ) : !zoomMeetingData ? (
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-xl w-full space-y-4 mx-auto">
              <h2 className="text-2xl font-bold text-indigo-700 mb-4 text-center">
                Join Your Class
              </h2>

              <Input icon={User} value={name} setValue={setName} placeholder="Full name" />
              <Input icon={Mail} value={email} setValue={setEmail} placeholder="Email" />
              <Input icon={Image} value={avatar} setValue={setAvatar} placeholder="Avatar URL" />

              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full border rounded-lg p-3 mt-2"
              >
                {teacherRooms.map((room) => (
                  <option key={room._id} value={room._id}>
                    {room.roomName} – {room.teacher.name} ({room.subject})
                  </option>
                ))}
              </select>

              <button
                onClick={joinMeeting}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl mt-4 hover:bg-indigo-700"
              >
                {loading ? <Loader2 className="animate-spin mx-auto" /> : "Join Class"}
              </button>
            </div>
          ) : (
            <p className="text-lg font-semibold text-center text-indigo-600">
              Zoom meeting opened in a new tab
            </p>
          )}
        </div>
      </main>

      {/* SUBJECT MODAL */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md relative">
            <button
              onClick={() => setShowSubjectModal(false)}
              className="absolute top-4 right-4"
            >
              <X />
            </button>
            <h2 className="text-xl font-bold mb-4">Select Subject</h2>

            {SUBJECTS.map((s) => (
              <label key={s} className="flex items-center gap-2 mb-2">
                <input
                  type="radio"
                  name="subject"
                  value={s}
                  checked={subject === s}
                  onChange={handleSubjectChange}
                />
                {s}
              </label>
            ))}

            <button
              onClick={submitRequestToBecomeTeacher}
              disabled={loading}
              className="w-full mt-4 bg-indigo-600 text-white py-2 rounded-lg"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

const Input: React.FC<{
  icon: React.FC<any>;
  value: string;
  setValue: (v: string) => void;
  placeholder?: string;
}> = ({ icon: Icon, value, setValue, placeholder }) => (
  <div className="flex items-center border rounded-xl px-4 py-3 bg-gray-50">
    <Icon className="mr-3 text-gray-500" />
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-transparent outline-none"
    />
  </div>
);

export default VideoMeeting;
