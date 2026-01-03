import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { User, Mail, Image, Loader2, LogOutIcon, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../constants/Api_url";
import axios, { AxiosError } from "axios";
import Enrollment from "./Enrollment";
import { toast, ToastContainer } from "react-toastify";

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

  const [teacherRooms, setTeacherRooms] = useState<TeacherRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [zoomMeetingData, setZoomMeetingData] =
    useState<ZoomMeetingResponse | null>(null);

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
        if (res.data.length && !selectedRoomId) {
          setSelectedRoomId(res.data[0]._id);
        }
      } catch (err) {
        console.error(err);
        toast.error("Unable to fetch rooms");
      }
    };

    fetchRooms();
  }, [token]);

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

      // ⏱ Auto-disconnect after 45 minutes
      disconnectTimer.current = window.setTimeout(() => {
        setZoomMeetingData(null);
        toast.info("Class ended after 45 minutes");
      }, 45 * 60 * 1000);

      // 🎯 Teachers/Admins start the meeting, others join
      const meetingUrl =
        data.moderator && data.start_url ? data.start_url : data.join_url;

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
  const handleSubjectChange = (e: ChangeEvent<HTMLInputElement>) =>
    setSubject(e.target.value);

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
      if (disconnectTimer.current) {
        clearTimeout(disconnectTimer.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-blue-50 to-sky-100 flex flex-col">
      {/* HEADER */}
      <header className="w-full flex items-center justify-between px-6 py-5 bg-white/70 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-4">
          <img src="/logo.png" className="h-20" />
          <span className="text-2xl font-extrabold">{COMPANY_NAME}</span>
        </div>

        <div className="flex items-center gap-4">
          {user?.role !== "teacher" && (
            <button
              onClick={() => setShowSubjectModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
            >
              Work as Freelancer
            </button>
          )}
          {user?.role === "admin" && (
            <a
              href="/dashboard"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Dashboard
            </a>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            <LogOutIcon size={18} />
            Logout
          </button>
        </div>
      </header>

      {/* MAIN */}
      <div className="flex-1 flex items-center justify-center px-4">
        {user?.role === "student" ? (
          <Enrollment />
        ) : !zoomMeetingData ? (
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-lg w-full space-y-4">
            <Input icon={User} value={name} setValue={setName} placeholder="Full name" />
            <Input icon={Mail} value={email} setValue={setEmail} placeholder="Email" />
            <Input icon={Image} value={avatar} setValue={setAvatar} placeholder="Avatar URL" />

            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full border rounded-lg p-3"
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
              className="w-full bg-indigo-600 text-white py-3 rounded-xl"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" /> : "Join Class"}
            </button>
          </div>
        ) : (
          <p className="text-lg font-semibold">
            Zoom meeting opened in a new tab
          </p>
        )}
      </div>

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
