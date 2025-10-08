import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { useState } from "react";
import axios from "axios";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setMessage("");
      await axios.post("https://ai-applicant-selector-production.up.railway.app/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("✅ Upload successful! Processing data...");
    } catch {
      setMessage("❌ Upload failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Nav />
      <div className="max-w-xl mx-auto p-6 mt-10 bg-white shadow-md rounded-lg">
        <h2 className="text-xl font-bold mb-4">Upload Applicant Data</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="file" onChange={(e) => setFile(e.target.files[0])} className="block w-full border p-2 rounded" />
          <button disabled={loading} className="w-full bg-sky-600 text-white py-2 rounded hover:opacity-90">
            {loading ? "Uploading..." : "Upload"}
          </button>
        </form>
        {message && <p className="mt-4 text-center">{message}</p>}
      </div>
      <Footer />
    </>
  );
}
