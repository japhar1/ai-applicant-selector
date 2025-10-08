import React from "react";

export default function Footer() {
  return (
    <footer className="mt-12 border-t bg-white">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="font-bold text-lg text-sky-700">AI Applicant Selector</div>
          <div className="text-sm text-gray-500">Built for PLP / LSETF Hackathon — demo prototype</div>
        </div>
        <div className="flex gap-6 text-sm text-gray-600">
          <a href="/privacy" className="hover:underline">Privacy</a>
          <a href="/terms" className="hover:underline">Terms</a>
          <a href="mailto:team@yourapp.com" className="hover:underline">Contact</a>
        </div>
        <div className="text-sm text-gray-400">&copy; {new Date().getFullYear()} AI Applicant Selector</div>
      </div>
    </footer>
  );
}
