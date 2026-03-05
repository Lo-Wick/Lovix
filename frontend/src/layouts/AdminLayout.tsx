import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { Link, useNavigate, Outlet } from "react-router-dom";
import { LayoutDashboard, FileUp, Files, LogOut } from "lucide-react";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axios.get("/auth/me");
        setLoading(false);
      } catch (err) {
        navigate("/login");
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await axios.post("/auth/logout");
    navigate("/login");
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <aside className="fixed inset-y-0 left-0 w-64 border-r bg-white shadow-sm lg:relative">
        <div className="flex h-16 items-center border-b px-6">
          <span className="text-xl font-bold text-blue-600">Admin</span>
        </div>
        <nav className="space-y-1 px-3 py-4">
          <Link to="/admin/dashboard" className="flex items-center rounded-md px-3 py-2 hover:bg-gray-100">
            <LayoutDashboard className="mr-3 h-5 w-5" /> Dashboard
          </Link>
          <Link to="/admin/upload" className="flex items-center rounded-md px-3 py-2 hover:bg-gray-100">
            <FileUp className="mr-3 h-5 w-5" /> Uploader
          </Link>
          <Link to="/admin/files" className="flex items-center rounded-md px-3 py-2 hover:bg-gray-100">
            <Files className="mr-3 h-5 w-5" /> Fichiers
          </Link>
        </nav>
        <div className="absolute bottom-0 w-full p-4">
          <button onClick={handleLogout} className="flex w-full items-center rounded-md px-3 py-2 text-red-600 hover:bg-red-50">
            <LogOut className="mr-3 h-5 w-5" /> Déconnexion
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
