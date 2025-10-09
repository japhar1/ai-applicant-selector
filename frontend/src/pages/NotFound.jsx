import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="h-screen flex flex-col items-center justify-center text-center bg-gray-50">
    <h1 className="text-5xl font-bold text-gray-800 mb-4">404</h1>
    <p className="text-gray-600 mb-6">Oops! The page you’re looking for doesn’t exist.</p>
    <Link
      to="/"
      className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
    >
      Back to Home
    </Link>
  </div>
);

export default NotFound;
