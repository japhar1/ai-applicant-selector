import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 text-center px-4">
      <h1 className="text-4xl font-bold mb-4 text-gray-800">AI Applicant Selector</h1>
      <p className="text-gray-600 max-w-2xl mb-6">
        Upload resumes and let our AI rank applicants automatically based on job requirements.
      </p>
      <Link
        to="/dashboard"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
      >
        Go to Dashboard
      </Link>
    </div>
  );
};

export default Home;
