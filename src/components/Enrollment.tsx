// Enrollment.tsx
import { useMemo, useState, useCallback } from "react";
import axios, { AxiosError } from "axios";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../constants/Api_url";
import { Loader2, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Paypal from "../features/checkout/Payal";

/* ===================== TYPES ===================== */
interface Teacher { _id: string; name: string; email: string; }
interface TeacherRoom { _id: string; teacher: Teacher | null; roomName: string; subject: string; }
interface Enrollment { _id: string; teacher: Teacher | null; room: TeacherRoom | null; }

/* ===================== AXIOS ===================== */
const api = axios.create({ baseURL: API_URL, timeout: 8000 });

/* ===================== COMPONENT ===================== */
function Enrollment() {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();

  const [selectedRoom, setSelectedRoom] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState(false); // Toggle PayPal

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  /* ----------------- Fetch Rooms ----------------- */
  const { data: teacherRooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ["teacherRooms"],
    queryFn: async () => {
      const res = await api.get("/teacher-rooms", { headers });
      return res.data.filter((r: TeacherRoom) => r.teacher?._id);
    },
    enabled: !!token,
  });

  /* ----------------- Fetch Enrollments ----------------- */
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["enrollments", user?._id],
    queryFn: async () => {
      const res = await api.get(`/enrollments/student/${user?._id}`, { headers });
      return res.data;
    },
    enabled: !!user?._id && !!token,
  });

  /* ----------------- Derived State ----------------- */
  const selectedTeacherId = useMemo(() => {
    const room = teacherRooms.find((r: TeacherRoom) => r._id === selectedRoom);
    return room?.teacher?._id ?? "";
  }, [selectedRoom, teacherRooms]);

  const alreadyEnrolled = useMemo(
    () => enrollments.some((e: Enrollment) => e.teacher?._id === selectedTeacherId),
    [enrollments, selectedTeacherId]
  );

  /* ----------------- Enroll Mutation ----------------- */
  const enrollMutation = useMutation({
    mutationFn: async () =>
      api.post(
        "/enrollments",
        { studentId: user?._id, teacherId: selectedTeacherId, roomId: selectedRoom },
        { headers }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments", user?._id] });
      setMessage("Enrolled successfully!");
      setError(null);
      setCheckout(false);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      setError(err.response?.data?.message || "Enrollment failed");
    },
  });

  /* ----------------- Payment Success ----------------- */
const handlePaymentSuccess = useCallback(
  async (paymentDetails: any) => {
    try {
      // 1️⃣ Enroll the student
      enrollMutation.mutate();

      // 2️⃣ Get the subject from selected room
      if (!selectedRoom) return;
      const room = teacherRooms.find((r: TeacherRoom) => r._id === selectedRoom);
      const subject = room?.subject ?? "Unknown";

      // 3️⃣ Send payment details to backend
      await axios.post(
        `${API_URL}/payment/create`,
        { payment: paymentDetails, subject },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage("Enrollment & Payment recorded successfully!");
      setError(null);
      setCheckout(false); // close modal

    } catch (err: any) {
      console.error("Payment recording failed:", err);
      setError("Failed to record payment. Please contact support.");
    }
  },
  [enrollMutation, selectedRoom, token, teacherRooms]
);



  /* ----------------- Loading ----------------- */
  if (!user || !token) return <p className="p-6">Loading user...</p>;
  if (roomsLoading || enrollmentsLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  );

  /* ----------------- UI ----------------- */
  return (
    <div className="min-h-screen p-6 flex flex-col md:flex-row gap-6 bg-gradient-to-br from-indigo-50 to-sky-100">

      {/* ----------------- ENROLL ----------------- */}
      <div className="w-full md:w-1/3 bg-white p-6 rounded-2xl shadow">
        <h2 className="text-2xl font-bold text-indigo-700 mb-4">Enroll in a Class</h2>

        <select
          value={selectedRoom}
          onChange={(e) => {
            setSelectedRoom(e.target.value);
            setCheckout(false); // reset PayPal when selecting new room
          }}
          className="w-full border rounded-xl px-4 py-2 mb-4"
        >
          <option value="">Select a class</option>
          {teacherRooms.map(
            (room: TeacherRoom) =>
              room.teacher && (
                <option key={room._id} value={room._id}>
                  {room.teacher.name} — {room.subject}
                </option>
              )
          )}
        </select>

        {/* PayPal / Enroll button */}
        {selectedRoom && !alreadyEnrolled && (
          <div className="mt-2">
            {!checkout ? (
              <button
                onClick={() => setCheckout(true)}
                className="w-full py-3 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Pay $100 & Enroll
              </button>
            ) : null}
          </div>
        )}

        {alreadyEnrolled && (
          <button className="w-full py-3 rounded-xl font-semibold bg-gray-400 text-white cursor-not-allowed mt-2">
            Already Enrolled
          </button>
        )}

        {message && <p className="text-green-600 mt-2">{message}</p>}
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>

      {/* ----------------- ENROLLMENTS ----------------- */}
      <div className="flex-1 bg-white p-6 rounded-2xl shadow overflow-auto">
        <h2 className="text-2xl font-bold text-indigo-700 mb-4">My Enrolled Classes</h2>

        {enrollments.length === 0 ? (
          <p className="text-gray-500">No enrollments yet.</p>
        ) : (
          <ul className="space-y-4">
            {enrollments.map(
              (e: Enrollment) =>
                e.teacher && e.room && (
                  <li key={e._id} className="border p-4 rounded-xl">
                    <p className="font-semibold">{e.teacher.name}</p>
                    <p className="text-sm text-gray-500">{e.teacher.email}</p>
                    <p className="text-sm text-gray-400">{e.room.subject} — {e.room.roomName}</p>
                  </li>
                )
            )}
          </ul>
        )}
      </div>

      {/* ----------------- PAYPAL MODAL ----------------- */}
      {checkout && selectedRoom && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center overflow-auto p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-lg p-6 overflow-auto max-h-[90vh]">
            {/* Close button */}
            <button
              onClick={() => setCheckout(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>

            <h3 className="text-xl font-semibold mb-4">Complete Your Payment</h3>

            <Paypal
              value="100.00"
              description="Enrollment Fee"
              onSuccess={()=>handlePaymentSuccess}
            />
          </div>
        </div>
      )}

    </div>
  );
}

export default Enrollment;
