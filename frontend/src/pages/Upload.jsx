import React, { useState } from "react";
import axios from "axios";
import { Loader2, Upload as UploadIcon, CheckCircle2 } from "lucide-react";

const Upload = () => {
  const [file, setFile] = useState(null);
  const [skills, setSkills] = useState("Python,Data Analysis,Machine Learning");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [results, setResults] = useState([]); // ✅ store scored applicants

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please upload a CSV file first.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("target_skills", skills);

      const response = await axios.post(`${BASE_URL}/api/score`, formData);
      console.log("Response:", response.data);

      setMessage("Upload & Scoring Complete ✅");
      setResults(response.data.ranked_applicants || []); // ✅ display results below
    } catch (err) {
      console.error("Upload error:", err);
      setMessage("Error uploading or scoring applicants.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">
        AI Applicant Scoring
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="border border-gray-300 p-2 rounded-md w-full"
        />

        <input
          type="text"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          placeholder="Enter target skills (comma separated)"
          className="border border-gray-300 p-2 rounded-md w-full"
        />

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <UploadIcon size={20} />
          )}
          {loading ? "Scoring Applicants..." : "Upload & Score"}
        </button>
      </form>

      {message && (
        <div className="flex items-center gap-2 mt-4 text-green-600">
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      )}

      {/* ✅ Results Section */}
      {results.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">
            Ranked Applicants
          </h3>

          <div className="space-y-3">
            {results.map((a, i) => (
              <div
                key={a.id}
                className="border rounded-lg p-4 bg-gray-50 flex items-center justify-between shadow-sm"
              >
                <div>
                  <h4 className="font-medium text-gray-900">
                    {i + 1}. {a.name}
                  </h4>
                  <p className="text-sm text-gray-600">{a.email}</p>
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>Skills:</strong> {a.skills.join(", ")}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-blue-600">
                    Score: {a.score.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">{a.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;
