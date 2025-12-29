import React, { useState } from "react";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  BookOpen,
  Settings,
  LogOut,
  PlusSquare,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import CreateRoom from "./rooms/CreateRooms";
import RequestTeachers from "./teachers/RequestTeachers";
import { useNavigate } from "react-router-dom";


const DashBoard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const navigate = useNavigate()

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard /> },
    { id: "teacher-requests", label: "Teacher Requests", icon: <UserCheck /> },
     { id: "create-room", label: "Create Room", icon: <PlusSquare /> },
    { id: "students", label: "Students", icon: <Users /> },
    { id: "teachers", label: "Teachers", icon: <Users /> },
    { id: "classes", label: "Classes", icon: <BookOpen /> },
    { id: "settings", label: "Settings", icon: <Settings /> },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white shadow-md flex flex-col">
        
        <div className="flex items-center gap-3 px-6 py-5 bg-indigo-600">
          <button  onClick={()=>navigate("/")}className="">
          <ArrowLeft size={30} className="text-gray-100 hover:text-gray-500 hover:duration-300 "/>
          </button>
          <img
            src="/logo.png"
            alt="Logo"
            className="w-10 h-10 object-contain"
          />
          <span className="text-white font-bold text-xl">Admin Panel</span>
        </div>

        <div className="flex-1 flex flex-col mt-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-6 py-3 hover:bg-indigo-50 transition-colors ${
                activeTab === item.id ? "bg-indigo-100 font-semibold" : ""
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="px-6 py-4 border-t mt-auto">
          <div className="flex items-center gap-3">
            <img
              src={user?.profileUrl || "/user.png"}
              alt={user?.username}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex flex-col text-gray-700 text-sm">
              <span className="font-semibold">{user?.username}</span>
              <span>{user?.email}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full mt-3 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-10">
        {activeTab === "dashboard" && <h1 className="text-3xl font-bold">Dashboard</h1>}
        {activeTab === "teacher-requests" && <RequestTeachers/>}
        {activeTab === "create-room" && <CreateRoom/>}
        {activeTab === "students" && <h1 className="text-3xl font-bold">Students</h1>}
        {activeTab === "teachers" && <h1 className="text-3xl font-bold">Teachers</h1>}
        {activeTab === "classes" && <h1 className="text-3xl font-bold">Classes</h1>}
        {activeTab === "settings" && <h1 className="text-3xl font-bold">Settings</h1>}
      </main>
    </div>
  );
};

export default DashBoard;
