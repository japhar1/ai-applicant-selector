import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();
  const active = (path) => (location.pathname === path ? "text-blue-600 font-semibold" : "");

  return (
    <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      <Link to="/" className="text-2xl font-bold text-gray-800">
        AI Selector
      </Link>
      <div className="flex gap-4 text-gray-700">
        <Link to="/" className={active("/")}>Home</Link>
        <Link to="/dashboard" className={active("/dashboard")}>Dashboard</Link>
      </div>
    </nav>
  );
};

export default Navbar;
