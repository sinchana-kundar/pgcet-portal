import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Home, Bell, Award, BookOpen, ArrowLeft } from 'lucide-react';
import { usePageMeta } from '../hooks/usePageMeta';

export default function NotFound() {
  usePageMeta('404 Page Not Found', 'The requested page was not found on the Karnataka PGCET Portal.');

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-lg space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
          <GraduationCap className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100">
            Error 404
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 font-outfit tracking-tight">
            Page Not Found
          </h1>
          <p className="text-base text-slate-600 max-w-md mx-auto">
            The page you are looking for doesn't exist, has been removed, or has moved to a new URL.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition"
          >
            <Home className="w-4 h-4" />
            <span>Go to Home</span>
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>

        {/* Helpful quick links */}
        <div className="pt-8 border-t border-slate-200 text-left">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 text-center">
            Popular destinations
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Link
              to="/notifications"
              className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition flex items-center gap-2.5 group"
            >
              <Bell className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition" />
              <span className="text-xs font-medium text-slate-700">Notifications</span>
            </Link>
            <Link
              to="/mock-tests"
              className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition flex items-center gap-2.5 group"
            >
              <BookOpen className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition" />
              <span className="text-xs font-medium text-slate-700">Mock Tests</span>
            </Link>
            <Link
              to="/results"
              className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition flex items-center gap-2.5 group"
            >
              <Award className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition" />
              <span className="text-xs font-medium text-slate-700">Rank Lookup</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
