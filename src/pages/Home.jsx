import Nav from "../components/Nav";
import Hero from "../components/Hero";
import FeatureCard from "../components/FeatureCard";
import Footer from "../components/Footer";
import { Brain, FileUp, ListOrdered, BarChart } from "lucide-react";

export default function Home() {
  const features = [
    { title: "AI Resume Screening", desc: "Automatically analyze and score resumes based on role criteria.", icon: <Brain className="text-sky-600" /> },
    { title: "Smart Uploads", desc: "Upload multiple resumes or CSVs for instant analysis.", icon: <FileUp className="text-sky-600" /> },
    { title: "Candidate Ranking", desc: "Generate ranked shortlists with AI confidence scores.", icon: <ListOrdered className="text-sky-600" /> },
    { title: "Insights Dashboard", desc: "Visualize candidate data with intuitive charts.", icon: <BarChart className="text-sky-600" /> },
  ];

  return (
    <>
      <Nav />
      <Hero />
      <section className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, i) => <FeatureCard key={i} {...f} />)}
      </section>
      <Footer />
    </>
  );
}
