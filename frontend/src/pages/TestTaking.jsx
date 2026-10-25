import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { mockTestsApi, attemptsApi, getErrorMessage } from '../api';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import {
  Clock,
  AlertTriangle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  RotateCcw,
  Menu,
  X,
  FileQuestion,
} from 'lucide-react';

export default function TestTaking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Test metadata and questions
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Attempt metadata
  const [attempt, setAttempt] = useState(() => {
    // Attempt can come from router state or sessionStorage
    const stateAttempt = location.state?.attempt;
    if (stateAttempt && String(stateAttempt.mock_test_id) === String(id)) {
      return stateAttempt;
    }
    const saved = sessionStorage.getItem('pgcet_active_attempt');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (String(parsed.mock_test_id) === String(id)) {
          return parsed;
        }
      } catch {
        return null;
      }
    }
    return null;
  });

  // Answers: { [question_id]: 'A' | 'B' | 'C' | 'D' }
  const [answers, setAnswers] = useState(() => {
    const attemptId = attempt?.attempt_id;
    if (attemptId) {
      const saved = sessionStorage.getItem(`pgcet_attempt_${attemptId}_answers`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return {};
        }
      }
    }
    return {};
  });

  // Marked for review question IDs: Set<number>
  const [markedForReview, setMarkedForReview] = useState(() => {
    const attemptId = attempt?.attempt_id;
    if (attemptId) {
      const saved = sessionStorage.getItem(`pgcet_attempt_${attemptId}_marked`);
      if (saved) {
        try {
          return new Set(JSON.parse(saved));
        } catch {
          return new Set();
        }
      }
    }
    return new Set();
  });

  // Timer: remaining seconds
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [paletteDrawerOpen, setPaletteDrawerOpen] = useState(false);

  const isSubmittedRef = useRef(false);

  // Save answers & marked state to sessionStorage on every change
  useEffect(() => {
    if (attempt?.attempt_id) {
      sessionStorage.setItem(
        `pgcet_attempt_${attempt.attempt_id}_answers`,
        JSON.stringify(answers)
      );
    }
  }, [answers, attempt?.attempt_id]);

  useEffect(() => {
    if (attempt?.attempt_id) {
      sessionStorage.setItem(
        `pgcet_attempt_${attempt.attempt_id}_marked`,
        JSON.stringify(Array.from(markedForReview))
      );
    }
  }, [markedForReview, attempt?.attempt_id]);

  // Load test details & questions
  useEffect(() => {
    let ignore = false;
    async function loadTestData() {
      setLoading(true);
      setError('');
      try {
        const data = await mockTestsApi.getMockTestById(id);
        if (!ignore) {
          setTest(data);
          setQuestions(data.questions || []);

          // Verify or restore active attempt
          let activeAtt = attempt;
          if (!activeAtt) {
            // If user directly navigated or refreshed without stored attempt, start or redirect
            const savedAttemptStr = sessionStorage.getItem('pgcet_active_attempt');
            if (savedAttemptStr) {
              try {
                const parsed = JSON.parse(savedAttemptStr);
                if (String(parsed.mock_test_id) === String(id)) {
                  activeAtt = parsed;
                  setAttempt(parsed);
                }
              } catch {
                activeAtt = null;
              }
            }
          }

          if (activeAtt) {
            // Compute remaining time from started_at
            const startedAtTime = new Date(activeAtt.started_at).getTime();
            const durationMs = (activeAtt.duration_minutes || data.duration_minutes || 60) * 60 * 1000;
            const targetEndTime = startedAtTime + durationMs;
            const diffSeconds = Math.max(0, Math.floor((targetEndTime - Date.now()) / 1000));
            setRemainingSeconds(diffSeconds);
          } else {
            // No active attempt found, redirect back to instructions
            navigate(`/mock-tests/${id}/instructions`, { replace: true });
            return;
          }
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

    loadTestData();
    return () => {
      ignore = true;
    };
  }, [id, attempt, navigate]);

  // Handle final submission
  const handleSubmitTest = useCallback(
    async (isAutoSubmit = false) => {
      if (isSubmittedRef.current || !attempt?.attempt_id) return;
      isSubmittedRef.current = true;
      setIsSubmitting(true);
      setShowSubmitModal(false);

      try {
        // Format answers for submission: array of { question_id, selected_option }
        const formattedAnswers = questions.map((q) => ({
          question_id: q.id,
          selected_option: answers[q.id] || null,
        }));

        await attemptsApi.submitAttempt(attempt.attempt_id, formattedAnswers);

        // Clean up sessionStorage for this attempt
        sessionStorage.removeItem(`pgcet_attempt_${attempt.attempt_id}_answers`);
        sessionStorage.removeItem(`pgcet_attempt_${attempt.attempt_id}_marked`);
        sessionStorage.removeItem('pgcet_active_attempt');

        // Navigate to the attempt results review screen
        navigate(`/attempts/${attempt.attempt_id}`, {
          replace: true,
          state: { isAutoSubmit },
        });
      } catch (err) {
        isSubmittedRef.current = false;
        setIsSubmitting(false);
        alert(`Submission failed: ${getErrorMessage(err)}. Please try submitting again.`);
      }
    },
    [attempt, questions, answers, navigate]
  );

  // Countdown timer interval
  useEffect(() => {
    if (remainingSeconds === null || isSubmittedRef.current) return;

    if (remainingSeconds <= 0) {
      const timeout = setTimeout(() => {
        handleSubmitTest(true);
      }, 0);
      return () => clearTimeout(timeout);
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => handleSubmitTest(true), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, handleSubmitTest]);

  // Warn on page unload or refresh during active test
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isSubmittedRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Format seconds to MM:SS or HH:MM:SS
  const formatTimer = (totalSec) => {
    if (totalSec === null || totalSec === undefined) return '--:--';
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    const pad = (n) => String(n).padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  const isLowTime = remainingSeconds !== null && remainingSeconds <= 300; // <= 5 minutes

  // Current question data
  const currentQuestion = questions[currentIdx];
  const currentSelectedOption = currentQuestion ? answers[currentQuestion.id] : null;
  const isCurrentMarked = currentQuestion ? markedForReview.has(currentQuestion.id) : false;

  // Answer selection handler
  const handleSelectOption = (optionLetter) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionLetter,
    }));
  };

  // Clear answer
  const handleClearAnswer = () => {
    if (!currentQuestion) return;
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQuestion.id];
      return copy;
    });
  };

  // Toggle mark for review
  const handleToggleMark = () => {
    if (!currentQuestion) return;
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) {
        next.delete(currentQuestion.id);
      } else {
        next.add(currentQuestion.id);
      }
      return next;
    });
  };

  // Palette status calculation
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const markedCount = markedForReview.size;
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);

  if (loading) {
    return <Loader message="Setting up your test environment..." fullScreen />;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-4">
        <ErrorMessage
          title="Could not load test session"
          message={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 pb-16 flex flex-col">
      {/* Top Sticky Test Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Test Info */}
          <div className="flex items-center gap-3 truncate">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              <FileQuestion className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate font-outfit">
                {test?.title || 'Mock Test'}
              </h1>
              <span className="text-[11px] font-medium text-slate-500 uppercase">
                {test?.subject} • Question {currentIdx + 1} of {totalQuestions}
              </span>
            </div>
          </div>

          {/* Timer & Controls */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Timer Badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-mono font-bold transition-colors ${
                isLowTime
                  ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                  : 'bg-slate-50 text-slate-800 border-slate-200'
              }`}
              title="Time remaining"
            >
              <Clock className={`w-4 h-4 ${isLowTime ? 'text-red-600' : 'text-slate-500'}`} />
              <span>{formatTimer(remainingSeconds)}</span>
            </div>

            {/* Mobile Palette Toggle */}
            <button
              type="button"
              onClick={() => setPaletteDrawerOpen(!paletteDrawerOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
              aria-label="Toggle Question Palette"
            >
              {paletteDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Submit Button */}
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Test</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Test Layout (2 Columns on Desktop) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Question Area (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Low Time Alert */}
          {isLowTime && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Warning: Less than 5 minutes remaining! Complete and review your responses.</span>
            </div>
          )}

          {/* Question Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
            {/* Question Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                  {currentIdx + 1}
                </span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Single Choice MCQ • +1 Mark
                </span>
              </div>

              {isCurrentMarked && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-violet-100 text-violet-700 border border-violet-200">
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Marked for Review</span>
                </span>
              )}
            </div>

            {/* Question Statement */}
            <div className="p-5 sm:p-8 space-y-6 flex-1">
              <p className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed whitespace-pre-line font-sans">
                {currentQuestion?.question_text}
              </p>

              {/* 4 Options */}
              <div className="space-y-3 pt-2">
                {[
                  { key: 'A', text: currentQuestion?.option_a },
                  { key: 'B', text: currentQuestion?.option_b },
                  { key: 'C', text: currentQuestion?.option_c },
                  { key: 'D', text: currentQuestion?.option_d },
                ].map((opt) => {
                  const isSelected = currentSelectedOption === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleSelectOption(opt.key)}
                      className={`w-full text-left p-4 rounded-2xl border transition flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 text-slate-800'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-300'
                        }`}
                      >
                        {opt.key}
                      </span>
                      <span className="text-sm sm:text-base leading-relaxed pt-0.5">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleMark}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                    isCurrentMarked
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{isCurrentMarked ? 'Unmark Review' : 'Mark for Review'}</span>
                </button>

                {currentSelectedOption && (
                  <button
                    type="button"
                    onClick={handleClearAnswer}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear Answer</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                  disabled={currentIdx === 0}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                  disabled={currentIdx === questions.length - 1}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Question Palette Sidebar (4 Cols) */}
        <aside
          className={`lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-5 lg:sticky lg:top-20 ${
            paletteDrawerOpen
              ? 'fixed inset-x-4 top-20 z-40 max-h-[85vh] overflow-y-auto block'
              : 'hidden lg:block'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 font-outfit uppercase tracking-wider">
              Question Palette
            </h3>
            <button
              onClick={() => setPaletteDrawerOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Summary Status Badges */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800">
              <span className="font-bold text-base block">{answeredCount}</span>
              <span className="text-[10px] uppercase font-semibold">Answered</span>
            </div>
            <div className="p-2 rounded-xl bg-violet-50 border border-violet-100 text-violet-800">
              <span className="font-bold text-base block">{markedCount}</span>
              <span className="text-[10px] uppercase font-semibold">Review</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700">
              <span className="font-bold text-base block">{unansweredCount}</span>
              <span className="text-[10px] uppercase font-semibold">Skipped</span>
            </div>
          </div>

          {/* Palette Grid */}
          <div className="max-h-[340px] overflow-y-auto pr-1">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isMarked = markedForReview.has(q.id);
                const isCurrent = idx === currentIdx;

                let btnStyle = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
                if (isAnswered && isMarked) {
                  btnStyle = 'bg-violet-600 text-white border-violet-700 shadow-xs ring-2 ring-emerald-400';
                } else if (isAnswered) {
                  btnStyle = 'bg-emerald-600 text-white border-emerald-700 shadow-xs';
                } else if (isMarked) {
                  btnStyle = 'bg-violet-100 text-violet-800 border-violet-300';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      setCurrentIdx(idx);
                      setPaletteDrawerOpen(false);
                    }}
                    className={`h-10 rounded-xl text-xs font-bold border transition flex items-center justify-center relative cursor-pointer ${btnStyle} ${
                      isCurrent ? 'ring-2 ring-indigo-600 ring-offset-2' : ''
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isMarked && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-violet-500 border border-white"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Palette Legends */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-emerald-600 shrink-0"></span>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-violet-100 border border-violet-300 shrink-0"></span>
              <span>Marked for Review</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-violet-600 ring-1 ring-emerald-400 shrink-0"></span>
              <span>Answered & Marked</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-slate-100 border border-slate-300 shrink-0"></span>
              <span>Unanswered</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Confirmation Modal before Final Submission */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 font-outfit">
                Submit Test Attempt?
              </h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to end and submit your exam? Once submitted, you cannot modify your answers.
              </p>
            </div>

            {/* Test Summary Breakdown in Modal */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <span>Total Questions:</span>
                <span className="font-bold text-slate-900">{totalQuestions}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-700">
                <span className="font-semibold">Answered:</span>
                <span className="font-bold">{answeredCount}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Unanswered / Skipped:</span>
                <span className="font-bold">{unansweredCount}</span>
              </div>
              <div className="flex items-center justify-between text-violet-700">
                <span>Marked for Review:</span>
                <span className="font-bold">{markedCount}</span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  You still have <strong>{unansweredCount}</strong> unanswered questions. Unanswered questions receive 0 marks.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                Continue Test
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmitTest(false)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? 'Grading Responses...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
