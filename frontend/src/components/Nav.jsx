import React from "react";
import { LogIn } from "lucide-react";

export default function Nav() {
  return (
    <nav className="w-full py-4 px-6 md:px-12 flex items-center justify-between bg-white shadow-sm sticky top-0 z-50">
      <a href="/" className="text-xl font-extrabold text-sky-700">AI Applicant Selector</a>
      <div className="flex items-center gap-4">
        <a href="/upload" className="text-sm font-medium hover:text-sky-600">Upload</a>
        <a href="/dashboard" className="text-sm font-medium hover:text-sky-600">Dashboard</a>
        <a href="/login" className="flex items-center gap-1 border px-3 py-2 rounded-lg hover:bg-gray-50">
          <LogIn size={16}/> Login
        </a>
      </div>
    </nav>
  );
}
