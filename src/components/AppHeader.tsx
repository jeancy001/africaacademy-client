import { LogOutIcon, Briefcase, LayoutDashboard } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface AppHeaderProps {
  companyName: string;
  onOpenFreelancerModal?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  companyName,
  onOpenFreelancerModal,
}) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-4">
        
        {/* BRAND */}
        <div className="flex items-center gap-3">
          <img
            src="/new_logo.png"
            alt="Bright Africa Academy Logo"
            className="h-12 sm:h-16 w-auto object-contain"
          />
          <span className="text-xl sm:text-2xl font-extrabold text-indigo-700 tracking-tight">
            {companyName}
          </span>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-4 w-full sm:w-auto">
          
          {/* Freelancer */}
          {user?.role !== "teacher" && onOpenFreelancerModal && (
            <button
              onClick={onOpenFreelancerModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm sm:text-base font-medium hover:bg-indigo-700 transition"
            >
              <Briefcase size={18} />
              Work as Freelancer
            </button>
          )}

          {/* Admin Dashboard */}
          {user?.role === "admin" && (
            <a
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm sm:text-base font-medium hover:bg-blue-700 transition"
            >
              <LayoutDashboard size={18} />
              Dashboard
            </a>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white text-sm sm:text-base font-medium hover:bg-red-600 transition"
          >
            <LogOutIcon size={18} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
