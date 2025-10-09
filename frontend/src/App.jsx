import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";

const App = () => {
  return (
    <Router>
      {/* ✅ Simple Navbar */}
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-semibold text-blue-600">
          AI Applicant Selector
        </Link>
        <div className="space-x-4">
          <Link to="/" className="text-gray-700 hover:text-blue-600">
            Home
          </Link>
          <Link to="/dashboard" className="text-gray-700 hover:text-blue-600">
            Dashboard
          </Link>
        </div>
      </nav>

      <main className="p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </Router>
  );
};

export default App;
