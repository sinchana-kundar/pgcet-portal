import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { mockTestsApi, getErrorMessage } from '../api';
import Card, { CardHeader, CardTitle, CardContent } from '../components/Card';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import {
  FileQuestion,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle,
  Sparkles,
  Zap,
} from 'lucide-react';

const COMMON_SUBJECTS = [
  'All Subjects',
  'MCA',
  'MBA',
  'Computer Science',
  'Mathematics',
  'Quantitative Aptitude',
  'General Knowledge',
];

export default function MockTests() {
  const [tests, setTests] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTests = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await mockTestsApi.getMockTests();
      setTests(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await mockTestsApi.getMockTests();
        if (!ignore) {
          setTests(data);
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
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const filteredTests = tests.filter((t) => {
    if (!selectedSubject || selectedSubject === 'All Subjects') return true;
    return t.subject?.toLowerCase().includes(selectedSubject.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-violet-950 text-white p-6 sm:p-10 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Karnataka PGCET Mock Exam Simulator</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-outfit">
            Full-Length Timed Mock Tests
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Practice with authentic entrance pattern tests. Features an interactive countdown timer, question palette, review tags, and instant score breakdowns.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>1 Mark per Question</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>No Negative Marking</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Instant Scorecard & Solutions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Mode Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Subject Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            Subject:
          </span>
          {COMMON_SUBJECTS.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedSubject === sub
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* Practice Mode Link */}
        <Link
          to="/practice"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold transition shrink-0 border border-violet-200"
        >
          <Zap className="w-3.5 h-3.5 text-violet-600" />
          <span>Switch to Untimed Practice Mode</span>
        </Link>
      </div>

      {/* Tests Grid */}
      {loading ? (
        <Loader message="Loading available mock tests..." fullScreen />
      ) : error ? (
        <ErrorMessage
          title="Could not load mock tests"
          message={error}
          onRetry={fetchTests}
        />
      ) : filteredTests.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 space-y-3">
          <FileQuestion className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No mock tests found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {selectedSubject !== 'All Subjects'
              ? `There are currently no mock tests listed under "${selectedSubject}".`
              : 'Mock tests have not been published yet. Please check back soon.'}
          </p>
          {selectedSubject !== 'All Subjects' && (
            <button
              onClick={() => setSelectedSubject('All Subjects')}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
            >
              Show All Subjects
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test) => (
            <Card key={test.id} hover className="flex flex-col justify-between">
              <div>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {test.subject}
                    </span>
                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {test.duration_minutes} Mins
                    </span>
                  </div>

                  <CardTitle className="text-lg leading-snug line-clamp-2">
                    {test.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block">Questions</span>
                      <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                        {test.total_questions} MCQs
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block">Max Marks</span>
                      <span className="text-sm font-bold text-indigo-600 mt-0.5 block">
                        {test.total_questions} Marks
                      </span>
                    </div>
                  </div>
                </CardContent>
              </div>

              <div className="p-5 pt-0 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl mt-auto">
                <Link
                  to={`/mock-tests/${test.id}/instructions`}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition cursor-pointer"
                >
                  <span>Start Test</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
