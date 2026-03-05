import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Files from "./pages/Files";
import PublicFile from "./pages/PublicFile";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/f/:slug" element={<PublicFile />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="upload" element={<Upload />} />
          <Route path="files" element={<Files />} />
        </Route>
        <Route path="/" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
