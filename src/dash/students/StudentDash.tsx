import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Video,
  Users,
  BookOpen,
  TrendingUp,
  Award,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../constants/Api_url";

/* ================= TYPES ================= */
interface Teacher {
  name: string;
  email: string;
}

interface TeacherRoom {
  subject: string;
  roomName: string;
}

interface Enrollment {
  _id: string;
  teacher: Teacher | null;
  room: TeacherRoom | null;
}

export const Studentdash = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH ENROLLMENTS ================= */
  useEffect(() => {
    if (!user?._id || !token) return;

    const fetchEnrollments = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/enrollments/student/${user._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setEnrollments(res.data);
      } catch (err) {
        console.error("Failed to fetch enrollments", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [user?._id, token]);

  if (!user) return <p className="p-6">Loading user info...</p>;

  /* ================= SIMPLE STATS ================= */
  const totalCourses = enrollments.length;
  const inProgressCourses = enrollments.length; // replace later with real progress logic
  const completedCourses = 0; // backend progress will update this

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-sky-100 px-6 py-10">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* ================= HEADER ================= */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-indigo-700">
            Welcome back, {user.username} 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Track your learning, progress, and certifications
          </p>
        </div>

        {/* ================= PROGRESS SUMMARY ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <SummaryCard title="Total Courses" value={totalCourses} />
          <SummaryCard title="In Progress" value={inProgressCourses} />
          <SummaryCard title="Completed" value={completedCourses} />
        </div>

        {/* ================= QUICK ACTIONS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <DashboardCard
            icon={<Video />}
            title="Meetings"
            subtitle="Join live classes"
            color="indigo"
            onClick={() => navigate("/")}
          />
          <DashboardCard
            icon={<Users />}
            title="Students"
            subtitle="Connect with peers"
            color="green"
            onClick={() => navigate("/students")}
          />
          <DashboardCard
            icon={<BookOpen />}
            title="Courses"
            subtitle="Your enrolled subjects"
            color="yellow"
            onClick={() => navigate("/courses")}
          />
          <DashboardCard
            icon={<TrendingUp />}
            title="Progress"
            subtitle="Track learning"
            color="pink"
            onClick={() => navigate("/progressions")}
          />
          <DashboardCard
            icon={<Award />}
            title="Certifications"
            subtitle="Earn certificates"
            color="indigo"
            onClick={() => navigate("/progressions")}
          />
        </div>

        {/* ================= MY COURSES ================= */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-indigo-700 mb-4">
            My Enrolled Courses
          </h2>

          {loading ? (
            <p className="text-gray-500">Loading courses...</p>
          ) : enrollments.length === 0 ? (
            <p className="text-gray-500">
              You are not enrolled in any courses yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enrollments.map(
                (enroll) =>
                  enroll.room &&
                  enroll.teacher && (
                    <div
                      key={enroll._id}
                      className="border rounded-2xl p-5 hover:shadow-md transition"
                    >
                      <h3 className="text-lg font-bold text-indigo-600">
                        {enroll.room.subject}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Teacher: {enroll.teacher.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Room: {enroll.room.roomName}
                      </p>

                      <button
                        onClick={() => navigate("/")}
                        className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-sm font-semibold"
                      >
                        Join Class
                      </button>
                    </div>
                  )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ================= SUMMARY CARD ================= */
const SummaryCard = ({ title, value }: { title: string; value: number }) => (
  <div className="bg-white rounded-2xl shadow-md p-6 text-center">
    <p className="text-gray-500 text-sm">{title}</p>
    <p className="text-3xl font-extrabold text-indigo-700 mt-2">
      {value}
    </p>
  </div>
);

/* ================= DASHBOARD CARD ================= */
const DashboardCard = ({
  icon,
  title,
  subtitle,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: "indigo" | "green" | "yellow" | "pink";
  onClick: () => void;
}) => {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-600 hover:bg-indigo-700",
    green: "bg-green-600 hover:bg-green-700",
    yellow: "bg-yellow-600 hover:bg-yellow-700",
    pink: "bg-pink-600 hover:bg-pink-700",
  };

  return (
    <button
      onClick={onClick}
      className={`${colors[color]} text-white rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center gap-3 transition`}
    >
      <div className="w-12 h-12 flex items-center justify-center bg-white/20 rounded-full">
        {icon}
      </div>
      <div className="text-center">
        <p className="text-lg font-bold">{title}</p>
        <p className="text-sm opacity-90">{subtitle}</p>
      </div>
    </button>
  );
};
