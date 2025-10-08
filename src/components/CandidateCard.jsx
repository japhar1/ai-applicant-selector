import React from "react";

export default function CandidateCard({ candidate = {}, onView, onShortlist, onExport }) {
  const score = Math.round(candidate.score ?? 0);
  const initials = candidate.name
    ? candidate.name.split(" ").map(n => n[0]).slice(0, 2).join("")
    : "?";
  const scoreColor = score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-700 flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-medium text-gray-900 truncate">{candidate.name || "Unknown"}</div>
            {candidate.experienceYears != null && (
              <div className="text-xs text-gray-400">· {candidate.experienceYears} yrs</div>
            )}
          </div>
          <div className="text-sm text-gray-500 truncate">{candidate.role ?? candidate.email}</div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right min-w-[88px]">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-white font-semibold ${scoreColor}`}>
            {score}%
          </div>
          <div className="text-xs text-gray-400">Fit score</div>
        </div>

        <div className="w-44">
          <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
            <div className={`${scoreColor} h-full`} style={{ width: `${score}%` }} />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => onView?.(candidate)} className="px-3 py-2 text-sm border rounded hover:bg-gray-50">View</button>
          <button onClick={() => onShortlist?.(candidate)} className="px-3 py-2 text-sm bg-sky-600 text-white rounded hover:opacity-95">Shortlist</button>
          <button onClick={() => onExport?.(candidate)} className="px-3 py-2 text-sm border rounded hover:bg-gray-50">Export</button>
        </div>
      </div>
    </div>
  );
}
