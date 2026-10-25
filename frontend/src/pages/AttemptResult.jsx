import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { attemptsApi, getErrorMessage } from '../api';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import {
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  BookOpen,
  Check,
  X,
  LayoutDashboard,
} from 'lucide-react';

export default function AttemptResult() {
  const { attemptId } = useParams();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'correct' | 'incorrect' | 'skipped'

  useEffect(() => {
    let ignore = false;
    async function loadAttemptResult() {
      try {
        const data = await attemptsApi.getAttemptDetail(attemptId);
        if (!ignore) {
          setResult(data);
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
    loadAttemptResult();
    return () => {
      ignore = true;
    };
  }, [attemptId]);

  if (loading) {
    return <Loader message="Analyzing your test results & scorecard..." fullScreen />;
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-4">
        <ErrorMessage
          title="Could not load attempt review"
          message={error}
          onRetry={() => window.location.reload()}
        />
        <div className="text-center pt-4">
          <Link
            to="/mock-tests"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-xs"
          >
            <span>Return to Mock Tests</span>
          </Link>
        </div>
      </div>
    );
  }

  const breakdown = result?.breakdown || [];
  const correctCount = breakdown.filter((q) => q.is_correct).length;
  const incorrectCount = breakdown.filter((q) => q.selected_option && !q.is_correct).length;
  const skippedCount = breakdown.filter((q) => !q.selected_option).length;

  const filteredQuestions = breakdown.filter((q) => {
    if (activeFilter === 'correct') return q.is_correct;
    if (activeFilter === 'incorrect') return q.selected_option && !q.is_correct;
    if (activeFilter === 'skipped') return !q.selected_option;
    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Top Scorecard Hero */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
        {/* Ribbon Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 text-white p-6 sm:p-10 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
            <Award className="w-8 h-8 text-amber-300" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
            Official Mock Exam Scorecard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit">
            {result?.mock_test_title}
          </h1>
          <p className="text-xs text-slate-400">
            Submitted on {formatDate(result?.submitted_at)}
          </p>
        </div>

        {/* Score Metrics Grid */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">Total Score</span>
              <span className="text-3xl font-extrabold text-indigo-700 block font-outfit">
                {result?.score}{' '}
                <span className="text-sm font-normal text-slate-500">/ {result?.total_questions}</span>
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">Percentage</span>
              <span className="text-3xl font-extrabold text-slate-900 block font-outfit">
                {result?.percentage}%
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center space-y-1">
              <span className="text-[11px] font-bold uppercase text-emerald-700 block">Correct</span>
              <span className="text-3xl font-extrabold text-emerald-800 block font-outfit">
                {correctCount}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-red-50/70 border border-red-100 text-center space-y-1">
              <span className="text-[11px] font-bold uppercase text-red-700 block">Incorrect</span>
              <span className="text-3xl font-extrabold text-red-800 block font-outfit">
                {incorrectCount}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Go to Student Dashboard</span>
            </Link>

            <Link
              to="/mock-tests"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xs transition"
            >
              <span>Take Another Mock Test</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Tabs for Question Breakdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-outfit tracking-tight">
            Question-by-Question Solution Review
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare your selections with verified solutions and detailed explanations.
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: `All (${breakdown.length})` },
            { id: 'correct', label: `Correct (${correctCount})` },
            { id: 'incorrect', label: `Incorrect (${incorrectCount})` },
            { id: 'skipped', label: `Skipped (${skippedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Questions Breakdown List */}
      <div className="space-y-6">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-3xl border border-slate-200">
            <p className="text-sm font-semibold text-slate-600">No questions match this filter.</p>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const isCorrect = q.is_correct;
            const isSkipped = !q.selected_option;

            return (
              <div
                key={q.question_id}
                className={`bg-white rounded-3xl border shadow-xs overflow-hidden transition ${
                  isCorrect
                    ? 'border-emerald-200/90'
                    : isSkipped
                    ? 'border-slate-200'
                    : 'border-red-200/90'
                }`}
              >
                {/* Question Item Header */}
                <div
                  className={`p-4 sm:p-5 flex items-center justify-between gap-3 border-b ${
                    isCorrect
                      ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900'
                      : isSkipped
                      ? 'bg-slate-50 border-slate-100 text-slate-700'
                      : 'bg-red-50/50 border-red-100 text-red-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-800 shadow-2xs">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Question #{idx + 1}
                    </span>
                  </div>

                  <div>
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <Check className="w-3.5 h-3.5" />
                        <span>Correct (+1)</span>
                      </span>
                    ) : isSkipped ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-200/70 text-slate-700">
                        <span>Skipped (0)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                        <X className="w-3.5 h-3.5" />
                        <span>Incorrect (0)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Body */}
                <div className="p-5 sm:p-6 space-y-5">
                  <p className="text-base text-slate-900 font-medium whitespace-pre-line leading-relaxed">
                    {q.question_text}
                  </p>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {[
                      { key: 'A', text: q.option_a },
                      { key: 'B', text: q.option_b },
                      { key: 'C', text: q.option_c },
                      { key: 'D', text: q.option_d },
                    ].map((opt) => {
                      const isOptionCorrect = q.correct_option === opt.key;
                      const isOptionSelected = q.selected_option === opt.key;

                      let style = 'border-slate-200 bg-slate-50 text-slate-700';
                      let badge = 'bg-white text-slate-600 border border-slate-200';

                      if (isOptionCorrect) {
                        style = 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-semibold ring-1 ring-emerald-500';
                        badge = 'bg-emerald-600 text-white font-bold';
                      } else if (isOptionSelected && !isOptionCorrect) {
                        style = 'border-red-400 bg-red-50 text-red-950 font-semibold ring-1 ring-red-400';
                        badge = 'bg-red-600 text-white font-bold';
                      }

                      return (
                        <div
                          key={opt.key}
                          className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs sm:text-sm ${style}`}
                        >
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs ${badge}`}>
                            {opt.key}
                          </span>
                          <div className="flex-1 leading-snug">
                            <span>{opt.text}</span>
                            {isOptionSelected && (
                              <span className="block text-[10px] font-bold mt-1 text-slate-500 uppercase">
                                [Your Answer]
                              </span>
                            )}
                          </div>
                          {isOptionCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          )}
                          {isOptionSelected && !isOptionCorrect && (
                            <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Section */}
                  {q.explanation && (
                    <div className="mt-4 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Solution & Explanation</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line pt-1">
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
