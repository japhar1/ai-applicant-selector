export default function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
      <div>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
          Smarter, Faster, Fairer <span className="text-sky-600">Applicant Selection</span>
        </h1>
        <p className="mt-4 text-gray-600 text-lg">
          Harness AI to evaluate resumes, assess skills, and generate ranked shortlists —
          empowering organizations to make data-driven hiring decisions.
        </p>

        <div className="mt-6 flex gap-3">
          <a href="/upload" className="bg-sky-600 text-white px-5 py-3 rounded-lg font-semibold shadow hover:opacity-90">Try Demo</a>
          <a href="/dashboard" className="px-5 py-3 rounded-lg border">View Results</a>
        </div>
      </div>

      <div className="rounded-xl bg-gray-50 p-6">
        <img src="/screenshots/dashboard.png" alt="Dashboard Preview" className="rounded-lg shadow-lg"/>
      </div>
    </section>
  );
}
