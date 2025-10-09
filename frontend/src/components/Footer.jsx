import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-100 text-center py-4 text-gray-600 text-sm mt-10">
      © {new Date().getFullYear()} AI Applicant Selector · Built for PLP Hackathon
    </footer>
  );
};

export default Footer;
