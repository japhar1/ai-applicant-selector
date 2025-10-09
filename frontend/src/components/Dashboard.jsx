import React, { useState, useEffect } from "react";
import axios from "axios";
import { Loader2, Upload, CheckCircle2 } from "lucide-react";

const Dashboard = () => {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [files, setFiles] = useState([]);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("lastRanked") || "[]");
    if (stored.length) setResults(stored);
  }, []);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.length) return setMessage("Attach resumes first.");
    if (!jobDescription.trim()) return setMessage("Enter a job description.");

    try {
      setLoading(true);
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      formData.append("job_description", jobDescription);

      const res = await axios.post(`${BASE_URL}/api/score-resumes`, formData);
      setResults(res.data.ranked_applicants);
      localStorage.setItem("lastRanked", JSON.stringify(res.data.ranked_applicants));
      setMessage("✅ Scoring complete!");
    } catch (err) {
      console.error(err);
      setMessage("Error scoring resumes.");
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    localStorage.removeItem("lastRanked");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-2xl p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">AI Applicant Selector</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="file"
            accept=".pdf,.docx,.csv,.txt"
            multiple
            onChange={handleFileChange}
            className="border p-2 rounded-md w-full"
          />

          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste job description or target role here..."
            className="border p-2 rounded-md w-full h-24"
          />

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
            {loading ? "Scoring..." : "Upload & Score"}
          </button>
        </form>

        {message && (
          <div className="flex items-center gap-2 mt-3 text-blue-700">
            <CheckCircle2 size={18} />
            <span>{message}</span>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold">Ranked Applicants</h2>
              <button onClick={clearResults} className="text-sm text-red-500 hover:underline">
                Clear
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">#</th>
                    <th className="p-2 border">Name</th>
                    <th className="p-2 border">Score</th>
                    <th className="p-2 border">Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="p-2 border">{i + 1}</td>
                      <td className="p-2 border font-medium">{r.name}</td>
                      <td className="p-2 border">{r.score}</td>
                      <td className="p-2 border text-sm text-gray-600">{r.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
