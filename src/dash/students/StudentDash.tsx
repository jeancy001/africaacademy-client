import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const Studentdash = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <p className="p-6">Loading user info...</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-sky-100 p-6 flex flex-col items-center gap-8">
      <h1 className="text-3xl font-bold text-indigo-700">
        Welcome, {user.username}
      </h1>
      <p className="text-gray-600">This is your student dashboard</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl">
        {/* Meetings Button */}
        <button
          onClick={() => navigate("/")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-6 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-2"
        >
          <span className="text-xl font-bold">Meetings</span>
          <span className="text-sm">Join your class meetings</span>
        </button>

        {/* Other Students Button */}
        <button
          onClick={() => navigate("/students")}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-6 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-2"
        >
          <span className="text-xl font-bold">Students</span>
          <span className="text-sm">See other students</span>
        </button>

        {/* Courses Button */}
        <button
          onClick={() => navigate("/courses")}
          className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-6 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-2"
        >
          <span className="text-xl font-bold">Courses</span>
          <span className="text-sm">View your enrolled courses</span>
        </button>

        {/* Progressions Button */}
        <button
          onClick={() => navigate("/progressions")}
          className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-6 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-2"
        >
          <span className="text-xl font-bold">Progressions</span>
          <span className="text-sm">Check your progress</span>
        </button>
      </div>
    </div>
  );
};
