import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context';
import { attemptsApi, getErrorMessage } from '../api';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import {
  Award,
  BookOpen,
  FileQuestion,
  Zap,
  ArrowRight,
  Sparkles,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    async function loadDashboard() {
      try {
        const data = await attemptsApi.getMyAttempts();
        if (!ignore) {
          setAttempts(data);
          setError('');
        }
      } catch (err) {
        if (!ignore) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    loadDashboard();
    return () => {
      ignore = true;
    };
  }, []);

  const totalAttempts = attempts.length;
  const submittedAttempts = attempts.filter((a) => a.submitted_at);
  const avgPercentage =
    submittedAttempts.length > 0
      ? Math.round(
          submittedAttempts.reduce((acc, curr) => acc + curr.percentage, 0) /
            submittedAttempts.length
        )
      : 0;

  const highestScore =
    submittedAttempts.length > 0
      ? Math.max(...submittedAttempts.map((a) => a.percentage))
      : 0;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 text-white p-6 sm:p-10 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Candidate Portal Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-outfit">
            Welcome back, {user?.name || 'Candidate'}!
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Track your mock test results, continue topic-wise practice, and prepare efficiently for the Karnataka PGCET entrance examination.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
            <FileQuestion className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Tests Attempted
          </span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 font-outfit block">
            {totalAttempts}
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Average Score
          </span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-600 font-outfit block">
            {avgPercentage}%
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
            <Award className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Best Score
          </span>
          <span className="text-2xl sm:text-3xl font-black text-amber-600 font-outfit block">
            {highestScore}%
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-2">
            <Zap className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Practice Mode
          </span>
          <span className="text-sm font-bold text-slate-900 block pt-1">
            Topic-Wise Active
          </span>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/mock-tests"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
            <FileQuestion className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 font-outfit group-hover:text-indigo-600 transition">
            Take a Mock Test
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Simulate a timed 100-mark entrance exam.
          </p>
        </Link>

        <Link
          to="/practice"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-violet-300 hover:shadow-md transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center mb-3">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 font-outfit group-hover:text-violet-600 transition">
            Topic Practice
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Solve questions with instant answer checks.
          </p>
        </Link>

        <Link
          to="/study-materials"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 font-outfit group-hover:text-emerald-600 transition">
            Study Materials
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Subject-wise revision notes & formulas.
          </p>
        </Link>

        <Link
          to="/results"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 hover:shadow-md transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 font-outfit group-hover:text-amber-600 transition">
            Results & Rank
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Lookup your official merit rank scorecard.
          </p>
        </Link>
      </div>

      {/* Recent Attempts History Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 font-outfit tracking-tight">
              My Mock Test Attempts
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review your completed exam scores, percentages, and solution breakdowns.
            </p>
          </div>

          <Link
            to="/mock-tests"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition inline-flex items-center gap-1"
          >
            <span>Start New Test</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <Loader message="Loading your attempt history..." />
        ) : error ? (
          <ErrorMessage
            title="Could not load attempt history"
            message={error}
          />
        ) : attempts.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <FileQuestion className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No mock test attempts recorded yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Start your first full-length timed mock test to evaluate your preparation level and state rank readiness.
            </p>
            <Link
              to="/mock-tests"
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-xs"
            >
              <span>Explore Available Tests</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-3 pr-4">Mock Test</th>
                  <th className="pb-3 px-4">Subject</th>
                  <th className="pb-3 px-4">Date</th>
                  <th className="pb-3 px-4">Score</th>
                  <th className="pb-3 px-4">Percentage</th>
                  <th className="pb-3 pl-4 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attempts.map((att) => {
                  const isSubmitted = !!att.submitted_at;
                  return (
                    <tr key={att.attempt_id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 pr-4">
                        <span className="font-bold text-slate-900 block font-outfit">
                          {att.mock_test_title}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {att.total_questions} Questions
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {att.subject}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-xs text-slate-500">
                        {formatDate(att.started_at)}
                      </td>

                      <td className="py-4 px-4 font-bold text-slate-900">
                        {isSubmitted ? `${att.score} / ${att.total_questions}` : 'In Progress'}
                      </td>

                      <td className="py-4 px-4">
                        {isSubmitted ? (
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              att.percentage >= 70
                                ? 'bg-emerald-100 text-emerald-800'
                                : att.percentage >= 40
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {att.percentage}%
                          </span>
                        ) : (
                          <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-semibold">
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="py-4 pl-4 text-right">
                        {isSubmitted ? (
                          <Link
                            to={`/attempts/${att.attempt_id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                          >
                            <span>View Solutions</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <Link
                            to={`/mock-tests/${att.mock_test_id}/take`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900 transition"
                          >
                            <span>Resume Test</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
