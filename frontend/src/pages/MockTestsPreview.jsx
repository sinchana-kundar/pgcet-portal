import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Clock, CheckCircle2, ArrowRight, Sparkles, BookOpen } from 'lucide-react';

export default function MockTestsPreview() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/40 p-8 sm:p-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center mx-auto shadow-md shadow-violet-500/20">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Test Engine — Scheduled for Phase 6</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-outfit tracking-tight">
            Timed Mock Exams & Question Bank
          </h1>
          <p className="max-w-xl mx-auto text-sm sm:text-base text-slate-500 leading-relaxed">
            We are fine-tuning the interactive test simulator. In the next phase, you will be able to take full 100-mark mock exams with an interactive timer, question palette, and instant score analysis.
          </p>
        </div>

        {/* Feature previews */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-4 text-left">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2">
              <Clock className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Real Exam Timer</h4>
            <p className="text-xs text-slate-500 mt-1">120-minute countdown with automatic submission and pause safety.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Instant Evaluation</h4>
            <p className="text-xs text-slate-500 mt-1">Get your score, accuracy rate, and question-by-question explanations.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
              <BookOpen className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">MCA & MBA Banks</h4>
            <p className="text-xs text-slate-500 mt-1">Verified questions covering Mathematics, Computer Awareness, and Aptitude.</p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/study-materials"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition"
          >
            <BookOpen className="w-4 h-4" />
            <span>Revise Study Materials</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition"
          >
            <span>Return to Home</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
