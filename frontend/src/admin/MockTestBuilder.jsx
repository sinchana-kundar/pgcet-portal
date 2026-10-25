import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { mockTestsApi, questionsApi, getErrorMessage } from '../api';
import {
  DataTable,
  FormField,
  useToast,
} from './components';
import {
  Plus,
  CheckCircle2,
  Clock,
  HelpCircle,
  Search,
  CheckSquare,
  Square,
  Loader2,
  Eye,
  Calendar,
  Sparkles,
} from 'lucide-react';


export default function MockTestBuilder() {
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState('builder'); // 'builder' | 'list'

  // Existing tests state
  const [existingTests, setExistingTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [testsError, setTestsError] = useState(null);

  // Question bank state for picker
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Form state
  const [submitting, setSubmitting] = useState(false);
  const [testForm, setTestForm] = useState({
    title: '',
    subject: '',
    duration_minutes: 60,
  });
  const [selectedQuestionIds, setSelectedQuestionIds] = useState(new Set());
  const [formErrors, setFormErrors] = useState({});

  // Question picker filters
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerSubject, setPickerSubject] = useState('');
  const [pickerDifficulty, setPickerDifficulty] = useState('');

  const fetchExistingTests = async () => {
    setLoadingTests(true);
    setTestsError(null);
    try {
      const data = await mockTestsApi.getMockTests();
      setExistingTests(data || []);
    } catch (err) {
      setTestsError(getErrorMessage(err));
    } finally {
      setLoadingTests(false);
    }
  };

  const fetchQuestionsForPicker = async () => {
    setLoadingQuestions(true);
    try {
      const data = await questionsApi.getQuestions();
      setAvailableQuestions(data || []);
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    fetchExistingTests();
    fetchQuestionsForPicker();
  }, []);

  // Filter available questions in picker
  const filteredPickerQuestions = useMemo(() => {
    return availableQuestions.filter((q) => {
      if (pickerSubject && q.subject?.toLowerCase() !== pickerSubject.toLowerCase()) {
        return false;
      }
      if (
        pickerDifficulty &&
        q.difficulty?.toLowerCase() !== pickerDifficulty.toLowerCase()
      ) {
        return false;
      }
      if (pickerSearch.trim()) {
        const term = pickerSearch.toLowerCase();
        const matchesText = q.question_text?.toLowerCase().includes(term);
        const matchesTopic = q.topic?.toLowerCase().includes(term);
        const matchesSub = q.subject?.toLowerCase().includes(term);
        if (!matchesText && !matchesTopic && !matchesSub) return false;
      }
      return true;
    });
  }, [availableQuestions, pickerSearch, pickerSubject, pickerDifficulty]);

  const toggleQuestionSelection = (id) => {
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      filteredPickerQuestions.forEach((q) => next.add(q.id));
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedQuestionIds(new Set());
  };

  const validateTestForm = () => {
    const errors = {};
    if (!testForm.title.trim()) errors.title = 'Test title is required.';
    if (!testForm.subject.trim()) errors.subject = 'Subject is required.';
    if (!testForm.duration_minutes || testForm.duration_minutes < 5) {
      errors.duration_minutes = 'Duration must be at least 5 minutes.';
    }
    if (selectedQuestionIds.size === 0) {
      errors.questions = 'Select at least one question to include in the mock test.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateMockTest = async (e) => {
    e.preventDefault();
    if (!validateTestForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        title: testForm.title.trim(),
        subject: testForm.subject.trim(),
        duration_minutes: Number(testForm.duration_minutes),
        question_ids: Array.from(selectedQuestionIds),
      };

      await mockTestsApi.createMockTest(payload);
      showSuccess(`Mock Test "${payload.title}" created with ${payload.question_ids.length} questions!`);

      // Reset form
      setTestForm({
        title: '',
        subject: '',
        duration_minutes: 60,
      });
      setSelectedQuestionIds(new Set());
      setFormErrors({});

      // Refresh list and switch to list view
      fetchExistingTests();
      setActiveTab('list');
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const existingTestColumns = [
    {
      key: 'id',
      label: 'Test ID',
      className: 'w-20 font-mono text-xs text-slate-500',
      render: (val) => `#${val}`,
    },
    {
      key: 'title',
      label: 'Mock Test Title',
      render: (val, row) => (
        <div>
          <p className="font-bold text-slate-900 leading-snug">{val}</p>
          <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
            {row.subject}
          </span>
        </div>
      ),
    },
    {
      key: 'duration_minutes',
      label: 'Duration',
      render: (val) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          {val} mins
        </span>
      ),
    },
    {
      key: 'total_questions',
      label: 'Questions',
      render: (val) => (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
          <HelpCircle className="w-3.5 h-3.5" />
          {val} Questions
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created Date',
      render: (val) => {
        if (!val) return '—';
        const date = new Date(val);
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {date.toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Student View',
      sortable: false,
      className: 'text-right',
      render: (_, row) => (
        <Link
          to={`/mock-tests/${row.id}/instructions`}
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 transition"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Preview Test</span>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-outfit">
            Mock Test Builder
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Assemble multi-question exams from the question bank with custom time limits.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-200/70 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('builder')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'builder'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create New Test
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'list'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Existing Tests</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700">
              {existingTests.length}
            </span>
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        /* Existing Tests Table */
        <div className="space-y-4">
          <DataTable
            columns={existingTestColumns}
            data={existingTests}
            loading={loadingTests}
            error={testsError}
            onRetry={fetchExistingTests}
            searchPlaceholder="Search mock tests by title or subject..."
            searchKeys={['title', 'subject']}
            emptyTitle="No mock tests created yet"
            emptyMessage="Build your first mock test by picking questions from the question bank."
            emptyAction={
              <button
                type="button"
                onClick={() => setActiveTab('builder')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Build First Test
              </button>
            }
          />
        </div>
      ) : (
        /* Builder View */
        <form onSubmit={handleCreateMockTest} className="space-y-6">
          {/* Test Metadata Parameters Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Test Specifications</span>
              </h2>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{selectedQuestionIds.size} Questions Selected</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                label="Mock Test Title"
                name="title"
                value={testForm.title}
                onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                error={formErrors.title}
                required
                placeholder="e.g. Karnataka PGCET 2026 MCA Full Mock Test 1"
              />

              <FormField
                label="Subject / Stream"
                name="subject"
                value={testForm.subject}
                onChange={(e) => setTestForm({ ...testForm, subject: e.target.value })}
                error={formErrors.subject}
                required
                placeholder="e.g. MCA or Mathematics"
              />

              <FormField
                label="Duration (Minutes)"
                name="duration_minutes"
                type="number"
                min={5}
                max={300}
                step={5}
                value={testForm.duration_minutes}
                onChange={(e) =>
                  setTestForm({ ...testForm, duration_minutes: Number(e.target.value) })
                }
                error={formErrors.duration_minutes}
                required
                hint="Default is 60 minutes"
              />
            </div>

            {formErrors.questions && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {formErrors.questions}
              </div>
            )}
          </div>

          {/* Question Picker Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Question Bank Picker
                </h3>
                <p className="text-xs text-slate-500">
                  Select questions from the bank below to include in this test.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  disabled={filteredPickerQuestions.length === 0}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer disabled:opacity-50"
                >
                  Select Filtered ({filteredPickerQuestions.length})
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={selectedQuestionIds.size === 0}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            {/* Picker Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Filter question text or topic..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <input
                type="text"
                value={pickerSubject}
                onChange={(e) => setPickerSubject(e.target.value)}
                placeholder="Filter by subject..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500"
              />

              <select
                value={pickerDifficulty}
                onChange={(e) => setPickerDifficulty(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Questions List */}
            {loadingQuestions ? (
              <div className="py-12 text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                <p className="text-xs text-slate-500">Loading questions from bank...</p>
              </div>
            ) : filteredPickerQuestions.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-bold text-slate-700">No questions match filters</p>
                <p className="text-xs text-slate-400 mt-1">
                  Adjust filters or add new questions in the Question Bank manager.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto border border-slate-200 rounded-xl">
                {filteredPickerQuestions.map((q) => {
                  const isSelected = selectedQuestionIds.has(q.id);
                  return (
                    <div
                      key={q.id}
                      onClick={() => toggleQuestionSelection(q.id)}
                      className={`p-3.5 flex items-start gap-3 cursor-pointer transition ${
                        isSelected
                          ? 'bg-indigo-50/60 hover:bg-indigo-50'
                          : 'hover:bg-slate-50 bg-white'
                      }`}
                    >
                      <button
                        type="button"
                        className="mt-0.5 text-indigo-600 shrink-0"
                        aria-label={isSelected ? 'Deselect question' : 'Select question'}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 fill-indigo-100" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-[11px] text-slate-400">
                            #{q.id}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {q.subject}
                          </span>
                          <span className="text-[10px] font-medium text-slate-500">
                            {q.topic}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${
                              q.difficulty === 'easy'
                                ? 'bg-emerald-100 text-emerald-800'
                                : q.difficulty === 'hard'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {q.difficulty || 'medium'}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 leading-snug">
                          {q.question_text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-600">
                <strong className="text-indigo-600 font-bold">{selectedQuestionIds.size}</strong>{' '}
                questions selected for this test
              </span>

              <button
                type="submit"
                disabled={submitting || selectedQuestionIds.size === 0}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Create & Publish Mock Test</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
