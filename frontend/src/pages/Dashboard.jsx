import Nav from "../components/Nav";
import Footer from "../components/Footer";
import CandidateCard from "../components/CandidateCard";
import { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const [candidates, setCandidates] = useState([]);
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  
  useEffect(() => {
    axios.get(`${BASE_URL}/api/applicants`)
      .then((res) => setCandidates(res.data))
      .catch(() => console.error("Failed to fetch candidates"));
  }, []);

  return (
    <>
      <Nav />
      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">AI-Generated Candidate Rankings</h2>
        <div className="space-y-4">
          {candidates.map((c) => (
            <CandidateCard key={c.id} candidate={c} />
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
