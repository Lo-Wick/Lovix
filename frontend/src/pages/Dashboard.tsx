import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { Files, Download } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({ fileCount: 0, totalDownloads: 0 });

  useEffect(() => {
    axios.get("/files/stats").then((res) => setStats(res.data));
  }, []);

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-blue-100 p-3 text-blue-600"><Files /></div>
            <div>
              <p className="text-sm text-gray-500">Total Fichiers</p>
              <h3 className="text-2xl font-bold">{stats.fileCount}</h3>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-green-100 p-3 text-green-600"><Download /></div>
            <div>
              <p className="text-sm text-gray-500">Total Téléchargements</p>
              <h3 className="text-2xl font-bold">{stats.totalDownloads}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
