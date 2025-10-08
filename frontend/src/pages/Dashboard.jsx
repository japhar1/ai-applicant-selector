import React, { useState } from "react";
import Upload from "./Upload";

const Dashboard = () => {
  const [applicants, setApplicants] = useState([]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">AI Applicant Ranking Dashboard</h1>

      <Upload onUploadSuccess={setApplicants} />

      {applicants.length > 0 ? (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {applicants.map((a) => (
            <div
              key={a.id}
              className="p-4 bg-white shadow rounded-xl border border-gray-100 hover:shadow-md transition"
            >
              <div className="font-semibold text-gray-800 text-lg">{a.name}</div>
              <div className="text-sm text-gray-500 mt-1">{a.email}</div>

              <div className="mt-3">
                <p className="text-xs text-gray-400 uppercase mb-1">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {a.skills.map((s, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-600">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-3">
                <p className="text-xs text-gray-400 uppercase mb-1">Score</p>
                <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
                  <div
                    className={`h-2.5 rounded-full ${a.score > 75 ? "bg-green-500" : a.score > 50 ? "bg-yellow-500" : "bg-red-500"}`}
                    style={{ width: `${a.score}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-700">{a.score}%</span>
              </div>

              <p className="text-xs text-gray-500 mt-2 italic">{a.summary}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-10 text-center text-gray-500 italic">
          Upload a CSV to view ranked applicants.
        </div>
      )}
    </div>
  );
};

export default Dashboard;
