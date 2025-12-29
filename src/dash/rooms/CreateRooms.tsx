import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { BookOpen, User, FileText, Loader2, CheckCircle } from "lucide-react";
import { API_URL } from "../../constants/Api_url";
import { useAuth } from "../../context/AuthContext";

interface Teacher {
  _id: string;
  name: string;
  email: string;
  subjects: string[];
  hasRoom: boolean; // always boolean from server
  room?: {
    roomName: string;
    subject: string;
    isLive: boolean;
  };
}

const CreateRoom = () => {
  const { token } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch teachers
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await axios.get(`${API_URL}/auth/approved-teachers`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Make sure hasRoom is boolean
        const data: Teacher[] = res.data.map((t: any) => ({
          ...t,
          hasRoom: !!t.hasRoom || !!t.room,
        }));

        setTeachers(data);
      } catch (error) {
        console.error("Failed to fetch teachers", error);
        setMessage("Unable to load teachers");
      }
    };

    fetchTeachers();
  }, [token]);

  // Auto-select first subject when teacher changes
  useEffect(() => {
    if (!teacherId) return;
    const selectedTeacher = teachers.find((t) => t._id === teacherId);
    setSubject(selectedTeacher?.subjects?.[0] || "");
  }, [teacherId, teachers]);

  const handleCreateRoom = async () => {
    if (!teacherId || !subject) {
      setMessage("Please fill all required fields");
      return;
    }

    setLoading(true);
    setMessage(null);
    setSuccess(false);

    try {
      await axios.post(
        `${API_URL}/teacher-rooms/create-room`,
        { teacherId, subject, description },
        {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        }
      );

      // Update local state: mark teacher as hasRoom
      setTeachers((prev) =>
        prev.map((t) =>
          t._id === teacherId
            ? {
                ...t,
                hasRoom: true,
                room: { roomName: `${t.name}-${subject}`, subject, isLive: false },
              }
            : t
        )
      );

      setMessage("Teacher room created successfully");
      setSuccess(true);
      setTeacherId(null);
      setSubject("");
      setDescription("");
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      setMessage(err.response?.data?.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  // Separate lists
  const teachersWithoutRoom = teachers.filter((t) => !t.hasRoom); // strictly those without room
  const teachersWithRoom = teachers.filter((t) => t.hasRoom);

  return (
    <div className="w-full max-w-5xl mx-auto p-6 space-y-12">
      <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
        <BookOpen className="w-7 h-7 text-indigo-600" /> Teacher Rooms
      </h2>

      {message && (
        <p
          className={`text-center text-sm flex items-center justify-center gap-2 ${
            success ? "text-green-600" : "text-red-500"
          }`}
        >
          {success && <CheckCircle className="w-4 h-4" />}
          {message}
        </p>
      )}

      {/* Teachers Without Room */}
      <section>
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Available Teachers</h3>
        {teachersWithoutRoom.length === 0 ? (
          <p className="text-gray-500 italic">All approved teachers already have rooms.</p>
        ) : (
          <ul className="space-y-4">
            {teachersWithoutRoom.map((t) => (
              <li
                key={t._id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white rounded-2xl shadow hover:shadow-lg transition"
              >
                <div className="flex items-center gap-4">
                  <User className="w-10 h-10 text-indigo-500" />
                  <div>
                    <p className="font-semibold text-gray-800">{t.name}</p>
                    <p className="text-sm text-gray-500">{t.email}</p>
                    <p className="text-xs text-gray-600 mt-1">{t.subjects.join(", ")}</p>
                  </div>
                </div>
                <button
                  onClick={() => setTeacherId(t._id)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
                >
                  Select
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Teachers With Room */}
      {teachersWithRoom.length > 0 && (
        <section>
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Teachers With Rooms</h3>
          <ul className="space-y-4">
            {teachersWithRoom.map((t) => (
              <li
                key={t._id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-gray-50 rounded-2xl shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <User className="w-10 h-10 text-gray-400" />
                  <div>
                    <p className="font-semibold text-gray-800">{t.name}</p>
                    <p className="text-sm text-gray-500">{t.email}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {t.subjects.join(", ")} | Room: {t.room?.roomName} ({t.room?.subject})
                    </p>
                  </div>
                </div>
                <span className="text-sm text-gray-500 italic">{t.room?.isLive ? "Live" : "Room created"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Room Creation Form */}
      {teacherId && (
        <section className="mt-6 p-6 bg-white rounded-3xl shadow-lg space-y-5">
          <h3 className="text-lg font-semibold text-gray-700">Create Room for Selected Teacher</h3>

          {/* Subject Dropdown */}
          <div className="flex items-center border rounded-xl px-4 py-3 bg-gray-50">
            <BookOpen className="w-5 h-5 text-gray-500 mr-3" />
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-transparent outline-none"
            >
              <option value="">Select Subject</option>
              {teachers.find((t) => t._id === teacherId)?.subjects?.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="flex items-start border rounded-xl px-4 py-3 bg-gray-50">
            <FileText className="w-5 h-5 text-gray-500 mr-3 mt-1" />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Room description (optional)"
              className="w-full bg-transparent outline-none resize-none"
              rows={3}
            />
          </div>

          <button
            onClick={handleCreateRoom}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold disabled:opacity-60 transition"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Create Room"}
          </button>
        </section>
      )}
    </div>
  );
};

export default CreateRoom;
