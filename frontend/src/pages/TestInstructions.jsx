import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { mockTestsApi, getErrorMessage } from '../api';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import {
  Clock,
  Award,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

export default function TestInstructions() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function loadTest() {
      try {
        const data = await mockTestsApi.getMockTestById(id);
        if (!ignore) {
          setTest(data);
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
    loadTest();
    return () => {
      ignore = true;
    };
  }, [id]);

  const handleBegin = async () => {
    if (!agreed) return;

    setStarting(true);
    setError('');

    try {
      const attemptData = await mockTestsApi.startAttempt(id);
      // attemptData: { attempt_id, mock_test_id, mock_test_title, duration_minutes, total_questions, started_at }

      // Store in sessionStorage to back up active test state
      sessionStorage.setItem('pgcet_active_attempt', JSON.stringify(attemptData));

      // Navigate to the test taking screen
      navigate(`/mock-tests/${id}/take`, { state: { attempt: attemptData } });
    } catch (err) {
      setError(getErrorMessage(err));
      setStarting(false);
    }
  };

  if (loading) {
    return <Loader message="Loading test details & instructions..." fullScreen />;
  }

  if (error && !test) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
        <Link
          to="/mock-tests"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Mock Tests</span>
        </Link>
        <ErrorMessage
          title="Could not load test details"
          message={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/mock-tests"
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Mock Tests</span>
        </Link>
      </div>

      {/* Header Info Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                {test?.subject}
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                Official Exam Pattern
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit">
              {test?.title}
            </h1>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-center sm:min-w-[100px]">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">Duration</span>
              <span className="text-lg font-bold text-slate-900 block mt-0.5">
                {test?.duration_minutes} Mins
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-center sm:min-w-[100px]">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">Questions</span>
              <span className="text-lg font-bold text-indigo-600 block mt-0.5">
                {test?.total_questions} MCQs
              </span>
            </div>
          </div>
        </div>

        {error && (
          <ErrorMessage
            title="Failed to start test"
            message={error}
          />
        )}

        {/* General Exam Instructions */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <span>Important Test Instructions & Rules</span>
          </h2>

          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <Clock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800">Timer & Automatic Submission</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  The countdown timer starts as soon as you click <strong>Begin Test</strong>. The timer turns red during the final 5 minutes. When time expires, your responses will be submitted automatically.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <Award className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800">Scoring & Marking Scheme</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Each question carries <strong>1 mark</strong>. There is <strong>no negative marking</strong> for incorrect or unanswered questions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <RotateCcw className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800">Question Palette & Reviewing</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  You can jump to any question using the question palette. You can change your choice anytime before final submission or tag questions using <em>Mark for Review</em>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800">Accidental Refresh Safety</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your selected answers and the ongoing countdown timer are backed up in your browser session. If you accidentally reload the page, you can continue smoothly without losing your work.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Declaration and Begin Button */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-xs sm:text-sm text-slate-700 font-medium">
              I have read and understood all the exam rules and instructions. I am ready to begin my timed test attempt.
            </span>
          </label>

          <button
            type="button"
            onClick={handleBegin}
            disabled={!agreed || starting}
            className="w-full sm:w-auto sm:min-w-[220px] inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {starting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                <span>Initializing Attempt...</span>
              </>
            ) : (
              <>
                <span>Begin Test</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
