import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ExternalLink, ShieldCheck } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  const currentYear = CURRENT_YEAR;

  return (
    <footer className="w-full bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white font-outfit">
                PGCET<span className="text-indigo-400">.in</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Dedicated preparation and counseling companion for Karnataka Post Graduate Common Entrance Test (PGCET) aspirants.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Official Syllabus & Pattern Compliant</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Portal Navigation
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-slate-400 hover:text-white transition">
                  Home Overview
                </Link>
              </li>
              <li>
                <Link to="/notifications" className="text-slate-400 hover:text-white transition">
                  Official Notifications
                </Link>
              </li>
              <li>
                <Link to="/study-materials" className="text-slate-400 hover:text-white transition">
                  Study Materials & Notes
                </Link>
              </li>
              <li>
                <Link to="/downloads" className="text-slate-400 hover:text-white transition">
                  Syllabus & Downloads
                </Link>
              </li>
              <li>
                <Link to="/results" className="text-slate-400 hover:text-white transition">
                  Candidate Results Lookup
                </Link>
              </li>
            </ul>
          </div>

          {/* Programs Covered */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Entrance Programs
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                <span>Master of Computer Applications (MCA)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                <span>Master of Business Administration (MBA)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                <span>M.Tech / M.Arch (Engineering)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                <span>General Mathematics & Quantitative Aptitude</span>
              </li>
            </ul>
          </div>

          {/* Disclaimer & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Important Disclaimer
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              This portal is designed for student revision, practice tests, and quick reference. For official seat matrix, verification schedules, and allotment orders, always refer to the official Karnataka Examination Authority (KEA) website.
            </p>
            <div className="pt-2">
              <a
                href="https://cetonline.karnataka.gov.in"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
              >
                <span>Visit Official KEA Website</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {currentYear} Karnataka PGCET Student Portal. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built for Karnataka Post Graduate Aspirants
          </p>
        </div>
      </div>
    </footer>
  );
}
