import React from "react";

export default function FeatureCard({ title, desc, icon }) {
  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{desc}</p>
        </div>
      </div>
    </div>
  );
}
