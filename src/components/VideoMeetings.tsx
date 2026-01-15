import { useEffect, useRef, useState } from "react";
import {
  User,
  Mail,
  Image as ImageIcon,
  Loader2,
  X,
  BookOpen,
  Video,
  CalendarCheck,
} from "lucide-react";
import axios, { AxiosError } from "axios";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { API_URL } from "../constants/Api_url";
import AppHeader from "./AppHeader";
import Enrollment from "./Enrollment";
import Paypal from "../features/checkout/Payal";

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

interface TeacherRoom {
  _id: string;
  teacher: { _id: string; name: string; email: string };
  roomName: string;
  subject: string;
}

interface ZoomMeetingResponse {
  meetingId: number;
  join_url: string;
  start_url?: string;
  moderator: boolean;
}

interface EnrollmentType {
  _id: string;
  teacher: { _id: string; name: string; email: string } | null;
  room: TeacherRoom | null;
}

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

const COMPANY_NAME = "Okapi Junior Academia.";
const TEACHER_FEE = 50;

const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "English",
  "Economics",
];

/* -------------------------------------------------------------------------- */
/*                               MAIN COMPONENT                               */
/* -------------------------------------------------------------------------- */

const VideoMeeting: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const disconnectTimer = useRef<number | null>(null);

  /* --------------------------------- STATE --------------------------------- */

  const [teacherRooms, setTeacherRooms] = useState<TeacherRoom[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentType[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");

  const [loading, setLoading] = useState(false);

  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subject, setSubject] = useState("");
  const [checkout, setCheckout] = useState(false);

  const [name, setName] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatar, setAvatar] = useState(user?.profileUrl || "");

  const isEnrolled = enrollments.length > 0;

  /* -------------------------------------------------------------------------- */
  /*                               DATA FETCHING                                */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (!token) return;

    axios
      .get(`${API_URL}/teacher-rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setTeacherRooms(res.data);
        if (res.data.length) setSelectedRoomId(res.data[0]._id);
      })
      .catch(() => toast.error("Unable to fetch rooms"));
  }, [token]);

  useEffect(() => {
    if (!token || !user?._id) return;

    axios
      .get(`${API_URL}/enrollments/student/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setEnrollments(res.data))
      .catch(() => toast.error("Unable to fetch enrollments"));
  }, [token, user?._id, enrollments]);

  /* -------------------------------------------------------------------------- */
  /*                               JOIN MEETING                                 */
  /* -------------------------------------------------------------------------- */

  const joinMeeting = async () => {
    if (!name || !email || !selectedRoomId) {
      toast.error("Please complete your profile");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post<ZoomMeetingResponse>(
        `${API_URL}/zoom/token`,
        { teacherRoomId: selectedRoomId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      disconnectTimer.current = window.setTimeout(() => {
        toast.info("Class ended after 45 minutes");
      }, 45 * 60 * 1000);

      window.open(res.data.start_url || res.data.join_url, "_blank");
    } catch {
      toast.error("Unable to join meeting");
    } finally {
      setLoading(false);
    }
  };




useEffect(() => {
  if (showSubjectModal) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }

  return () => {
    document.body.style.overflow = "auto";
  };
}, [showSubjectModal,enrollments]);

  /* -------------------------------------------------------------------------- */
  /*                              PAYMENT SUCCESS                               */
  /* -------------------------------------------------------------------------- */

  const handlePaymentSuccess = async (paymentDetails: any) => {
    if (!subject) {
      toast.error("Please select a subject");
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        `${API_URL}/auth/request-teacher`,
        { subjects: [subject] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await axios.post(
        `${API_URL}/payment/create`,
        { payment: paymentDetails, subject },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await axios.post(
        `${API_URL}/subscription/create`,
        {
          paypalSubscriptionId: paymentDetails.id,
          amount: TEACHER_FEE,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Payment successful! You are now a teacher 🎉");
      setShowSubjectModal(false);
      setCheckout(false);
      setSubject("");
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      toast.error(error.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                   RENDER                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-sky-100">
      <AppHeader
        companyName={COMPANY_NAME}
        onOpenFreelancerModal={() => setShowSubjectModal(true)}
      />

      <main className="flex flex-col lg:flex-row gap-6 p-6">
        {/* PROFILE SIDEBAR */}
        <aside className="w-full lg:w-1/4 bg-white rounded-2xl shadow-xl p-6">
          <div className="flex flex-col items-center">
            <img
              src={avatar || "/user.png"}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-indigo-100"
            />
            <h3 className="mt-4 font-semibold text-lg">{name}</h3>
            <p className="text-sm text-gray-500">{email}</p>
          </div>

          <div className="mt-8 space-y-3">
            <SidebarButton
              icon={BookOpen}
              label="Dashboard"
              onClick={() => navigate("/studentdash")}
              color="bg-emerald-600"
            />
            <SidebarButton
              icon={Video}
              label="Classes"
              onClick={() => navigate("/")}
              color="bg-indigo-600"
            />
            <SidebarButton
              icon={CalendarCheck}
              label="Enrollments"
              onClick={() => navigate("/enrollments")}
              color="bg-amber-500"
            />
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <section className="flex-1">
          {!isEnrolled ? (
            <Enrollment />
          ) : (
            <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-xl font-semibold mb-6">
                Profile Information
              </h2>

              <ProfileInput icon={User} label="Full Name" value={name} onChange={setName} />
              <ProfileInput icon={Mail} label="Email" value={email} onChange={setEmail} />
              <ProfileInput icon={ImageIcon} label="Avatar URL" value={avatar} onChange={setAvatar} />

              <label className="text-sm font-medium text-gray-700 mt-4 block">
                Select Class
              </label>
              <select
                className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
              >
                {teacherRooms.map((room) => (
                  <option key={room._id} value={room._id}>
                    {room.roomName} — {room.teacher.name}
                  </option>
                ))}
              </select>

              <button
                onClick={joinMeeting}
                disabled={loading}
                className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin mx-auto" /> : "Join Class"}
              </button>
            </div>
          )}
        </section>
      </main>

{showSubjectModal && (
  <div
    className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm
               flex items-center justify-center px-4"
  >
    <div
      className={`bg-white w-full max-w-lg rounded-2xl shadow-2xl
                  flex flex-col
                  ${checkout ? "h-[90vh]" : "max-h-[90vh]"}`}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
        <h2 className="text-lg font-semibold text-gray-800">
          Become a Teacher
        </h2>
        <button
          onClick={() => {
            setShowSubjectModal(false);
            setCheckout(false);
          }}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* BODY (THIS IS THE KEY PART) */}
      <div
        className={`px-6 py-5 flex-1
                    overflow-y-auto overscroll-contain
                    ${checkout ? "pb-10" : ""}`}
      >
        {!checkout && (
          <>
<div className="mb-6 space-y-4 text-sm leading-relaxed text-gray-700">
  <p className="text-gray-600">
    Select the subject you wish to teach and complete the one-time subscription
    payment to get started.
  </p>

  <p>
    To become a teacher on our platform, a one-time subscription fee is required.
    At this stage, teachers work as independent freelancers until the company
    begins its official hiring process.
  </p>

  <p>
    The total subscription fee is{" "}
    <span className="font-semibold text-gray-900">$50</span>. This is the only
    payment required. After successful payment, your teacher room or class will
    be created by the administrator within{" "}
    <span className="font-medium">24 hours</span>.
  </p>

  <p>
    Payments earned from the students you teach will be forwarded directly to
    you through your{" "}
    <span className="font-medium">PayPal account or bank account</span>, based on
    your selected payout method.
  </p>

  <div className="rounded-md border border-indigo-200 bg-indigo-50 p-4 text-indigo-800">
    <p className="font-semibold mb-1">Important Notice:</p>
    <p>
      Okapi Junior Academia will begin officially hiring teachers soon. Once
      hiring starts, updated contracts and payment structures will be
      communicated to all active teachers.
    </p>
  </div>
</div>

            <div className="grid grid-cols-2 gap-3">
              {SUBJECTS.map((s) => (
                <label
                  key={s}
                  className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition
                    ${
                      subject === s
                        ? "border-indigo-600 bg-indigo-50"
                        : "hover:border-gray-400"
                    }`}
                >
                  <input
                    type="radio"
                    name="subject"
                    value={s}
                    checked={subject === s}
                    onChange={(e) => setSubject(e.target.value)}
                    className="accent-indigo-600"
                  />
                  <span className="text-sm font-medium">{s}</span>
                </label>
              ))}
            </div>
          </>
        )}

        {/* PAYPAL SECTION (SCROLLS CORRECTLY) */}
        {checkout && (
          <div className="mt-2">
            <Paypal
              value={TEACHER_FEE.toFixed(2)}
              description={subject}
              onSuccess={()=>handlePaymentSuccess}
            />
          </div>
        )}
      </div>

      {/* FOOTER (ONLY WHEN NOT IN CHECKOUT) */}
      {!checkout && (
        <div className="px-6 py-4 border-t shrink-0 bg-white">
          <button
            disabled={!subject}
            onClick={() => setCheckout(true)}
            className="w-full rounded-lg bg-indigo-600 py-3 text-white font-semibold
                       hover:bg-indigo-700 transition disabled:opacity-50"
          >
            Pay ${TEACHER_FEE} & Activate
          </button>
        </div>
      )}
    </div>
  </div>
)}


      <ToastContainer />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               HELPER COMPONENTS                            */
/* -------------------------------------------------------------------------- */

const SidebarButton = ({ icon: Icon, label, onClick, color }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium transition ${color}`}
  >
    <Icon size={18} />
    {label}
  </button>
);

const ProfileInput = ({ icon: Icon, label, value, onChange }: any) => (
  <div className="mb-4">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <div className="mt-1 flex items-center border rounded-lg p-3 focus-within:ring-2 focus-within:ring-indigo-500">
      <Icon size={18} className="text-gray-400 mr-2" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full outline-none text-sm"
        placeholder={label}
      />
    </div>
  </div>
);

export default VideoMeeting;
