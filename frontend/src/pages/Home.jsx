import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="text-center py-24">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">
        Welcome to AI Applicant Selector
      </h1>
      <p className="text-gray-600 mb-6">
        Upload, analyze, and rank candidates using AI-powered scoring.
      </p>
      <Link
        to="/dashboard"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
      >
        Go to Dashboard
      </Link>
    </div>
  );
};

export default Home;
