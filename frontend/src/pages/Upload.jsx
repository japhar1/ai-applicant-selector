import React, { useState } from "react";
import axios from "axios";
import { Loader2, Upload as UploadIcon, CheckCircle2 } from "lucide-react";

const Upload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [skills, setSkills] = useState("Python,Data Analysis,Machine Learning");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage("");
  };

  console.log("API Base URL:", BASE_URL);

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

      const response = await axios.post(`${BASE_URL}/api/score`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage("Upload & Scoring Complete ✅");
      onUploadSuccess(response.data.ranked_applicants);
    } catch (err) {
      console.error(err);
      setMessage("Error uploading or scoring applicants.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl shadow-sm">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Upload Applicant CSV</h2>

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
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <UploadIcon size={20} />}
          {loading ? "Scoring Applicants..." : "Upload & Score"}
        </button>
      </form>

      {message && (
        <div className="flex items-center gap-2 mt-4 text-green-600">
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      )}
    </div>
  );
};

export default Upload;
