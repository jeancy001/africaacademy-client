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

const TENANT = "vpaas-magic-cookie-203c5ced07c248b7b6c3da6d10038b93";
const JITSI_DOMAIN = `${TENANT}.8x8.vc`;
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
  const jaasRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);

  const { user, token, logout } = useAuth();

  const [teacherRooms, setTeacherRooms] = useState<TeacherRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subject, setSubject] = useState("");

  const [name, setName] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatar, setAvatar] = useState(user?.profileUrl || "");

  /** ---------------- FETCH TEACHER ROOMS ---------------- */
  useEffect(() => {
    const fetchTeacherRooms = async () => {
      try {
        const res = await axios.get(`${API_URL}/teacher-rooms/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data: TeacherRoom[] = res.data;
        setTeacherRooms(data);
        if (data.length && !selectedRoomId) setSelectedRoomId(data[0]._id);
      } catch (err) {
        console.error("Failed to fetch teacher rooms:", err);
        toast.error("Unable to fetch rooms");
      }
    };
    fetchTeacherRooms();
  }, [token, selectedRoomId]);

  /** ---------------- LOAD JITSI SCRIPT ---------------- */
  const loadJitsiScript = () =>
    new Promise<void>((resolve, reject) => {
      if ((window as any).JitsiMeetExternalAPI) return resolve();
      const script = document.createElement("script");
      script.src = `https://${JITSI_DOMAIN}/external_api.js`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject("Failed to load Jitsi API");
      document.body.appendChild(script);
    });

  /** ---------------- JOIN MEETING ---------------- */
  const joinMeeting = async () => {
    if (!name || !email || !selectedRoomId) {
      toast.error("Missing user info or room selection");
      return;
    }

    try {
      setLoading(true);
      await loadJitsiScript();

      const res = await axios.post(
        `${API_URL}/jitsi/token`,
        { teacherRoomId: selectedRoomId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setJwtToken(res.data.token);
    } catch (err) {
      console.error("Failed to get Jitsi token:", err);
      toast.error("Unable to join meeting");
    } finally {
      setLoading(false);
    }
  };

  /** ---------------- INIT JITSI MEETING ---------------- */
useEffect(() => {
  if (!jwtToken || !jaasRef.current) return;
  const roomObj = teacherRooms.find((r) => r._id === selectedRoomId);
  if (!roomObj) return;

  const roomName = `${TENANT}/${roomObj.roomName}`;
  const isModerator = user?.role === "teacher" || user?.role === "admin";

  const initJitsi = async () => {
    if (apiRef.current) {
      // Already initialized, just return
      return;
    }

    try {
      // Request camera and microphone
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch {
      toast.info("Camera disabled or microphone access required.");
    }

    apiRef.current = new (window as any).JitsiMeetExternalAPI(JITSI_DOMAIN, {
      roomName,
      parentNode: jaasRef.current,
      jwt: jwtToken,
      width: "100%",
      height: "100%",
      userInfo: { displayName: name, email, avatarURL: avatar || undefined },
      configOverwrite: {
        prejoinPageEnabled: false,
        enableWelcomePage: false,
        disableDeepLinking: true,
        startWithAudioMuted: false, // <-- allow toggling freely
        startWithVideoMuted: false, // <-- allow toggling freely
        enableUserRolesBasedOnToken: true,
        enableFeaturesBasedOnToken: true,
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_BRAND_WATERMARK: false,
        TOOLBAR_BUTTONS: isModerator
          ? [
              "microphone",
              "camera",
              "desktop",
              "raisehand",
              "participants-pane",
              "chat",
              "recording",
              "tileview",
              "hangup",
            ]
          : ["microphone", "camera", "desktop", "raisehand", "participants-pane", "chat", "tileview", "hangup"],
      },
    });

    // Listen for Jitsi events
    apiRef.current.addEventListener("videoConferenceJoined", () => {
      console.log("Joined meeting successfully!");
    });

    apiRef.current.addEventListener("readyToClose", () => {
      apiRef.current?.dispose();
      apiRef.current = null;
      setJwtToken(null);
    });

    // Auto end after 45 mins
    timerRef.current = window.setTimeout(() => {
      apiRef.current?.dispose();
      apiRef.current = null;
      setJwtToken(null);
      toast.info("Class ended after 45 minutes");
    }, 45 * 60 * 1000);
  };

  initJitsi();

  return () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    apiRef.current?.dispose();
    apiRef.current = null;
  };
}, [jwtToken, selectedRoomId, teacherRooms, name, email, avatar, user?.role]);

  /** ---------------- SUBJECT HANDLING ---------------- */
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

  /** ---------------- LOGOUT ---------------- */
  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    }
  };

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
            <a href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
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
        ) : !jwtToken ? (
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
          <div ref={jaasRef} className="w-full h-[90vh]" />
        )}
      </div>

      {/* SUBJECT MODAL */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md relative">
            <button onClick={() => setShowSubjectModal(false)} className="absolute top-4 right-4">
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
