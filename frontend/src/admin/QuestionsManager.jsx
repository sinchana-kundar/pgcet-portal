import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { questionsApi, getErrorMessage } from '../api';
import {
  DataTable,
  ConfirmDialog,
  FormField,
  useToast,
} from './components';
import {
  HelpCircle,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Filter,
  Eye,
  Sparkles,
} from 'lucide-react';

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export default function QuestionsManager() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccess, showError } = useToast();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [subjectFilter, setSubjectFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');

  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A',
    explanation: '',
    difficulty: 'medium',
  });
  const [formErrors, setFormErrors] = useState({});

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      subject: '',
      topic: '',
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_option: 'A',
      explanation: '',
      difficulty: 'medium',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await questionsApi.getQuestions({
        subject: subjectFilter,
      });
      setQuestions(data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [subjectFilter]);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      handleOpenCreate();
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);


  // Client-side difficulty filtering
  const displayedQuestions = useMemo(() => {
    if (!difficultyFilter) return questions;
    return questions.filter(
      (q) => q.difficulty?.toLowerCase() === difficultyFilter.toLowerCase()
    );
  }, [questions, difficultyFilter]);

  const handleOpenEdit = (item) => {

    setEditingItem(item);
    setFormData({
      subject: item.subject || '',
      topic: item.topic || '',
      question_text: item.question_text || '',
      option_a: item.option_a || '',
      option_b: item.option_b || '',
      option_c: item.option_c || '',
      option_d: item.option_d || '',
      correct_option: (item.correct_option || 'A').toUpperCase(),
      explanation: item.explanation || '',
      difficulty: item.difficulty || 'medium',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.subject.trim()) errors.subject = 'Subject is required.';
    if (!formData.topic.trim()) errors.topic = 'Topic is required.';
    if (!formData.question_text.trim()) errors.question_text = 'Question text is required.';
    if (!formData.option_a.trim()) errors.option_a = 'Option A is required.';
    if (!formData.option_b.trim()) errors.option_b = 'Option B is required.';
    if (!formData.option_c.trim()) errors.option_c = 'Option C is required.';
    if (!formData.option_d.trim()) errors.option_d = 'Option D is required.';
    if (!['A', 'B', 'C', 'D'].includes(formData.correct_option)) {
      errors.correct_option = 'Select a valid correct option (A, B, C, or D).';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        subject: formData.subject.trim(),
        topic: formData.topic.trim(),
        question_text: formData.question_text.trim(),
        option_a: formData.option_a.trim(),
        option_b: formData.option_b.trim(),
        option_c: formData.option_c.trim(),
        option_d: formData.option_d.trim(),
        correct_option: formData.correct_option,
        explanation: formData.explanation.trim() || undefined,
        difficulty: formData.difficulty,
      };

      if (editingItem) {
        await questionsApi.updateQuestion(editingItem.id, payload);
        showSuccess(`Question #${editingItem.id} updated successfully.`);
      } else {
        await questionsApi.createQuestion(payload);
        showSuccess('New question added to Question Bank.');
      }

      setIsFormOpen(false);
      fetchQuestions();
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await questionsApi.deleteQuestion(deleteTarget.id);
      showSuccess(`Question #${deleteTarget.id} deleted successfully.`);
      setDeleteTarget(null);
      fetchQuestions();
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const getDifficultyBadge = (difficulty) => {
    const diff = (difficulty || 'medium').toLowerCase();
    if (diff === 'easy') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Easy
        </span>
      );
    }
    if (diff === 'hard') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          Hard
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        Medium
      </span>
    );
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      className: 'w-16 font-mono text-xs text-slate-500',
      render: (val) => `#${val}`,
    },
    {
      key: 'question_text',
      label: 'Question',
      render: (val, row) => (
        <div className="max-w-md">
          <p className="font-semibold text-slate-900 line-clamp-2 leading-snug">{val}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
              {row.subject}
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              {row.topic}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'difficulty',
      label: 'Difficulty',
      render: (val) => getDifficultyBadge(val),
    },
    {
      key: 'correct_option',
      label: 'Answer',
      className: 'text-center',
      render: (val) => (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs bg-indigo-600 text-white shadow-xs">
          {val}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      className: 'text-right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
            title="Edit question"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            title="Delete question"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-outfit">
            Question Bank Manager
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Curate questions, set difficulty tiers, and write detailed step-by-step explanations.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs shadow-indigo-600/30 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Question</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0">
          <Filter className="w-3.5 h-3.5 text-indigo-600" />
          <span>Filters:</span>
        </div>

        <input
          type="text"
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          placeholder="Filter by subject (e.g. Mathematics, MCA)..."
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-indigo-500 sm:w-60"
        />

        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Difficulties</option>
          {DIFFICULTIES.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>

        {(subjectFilter || difficultyFilter) && (
          <button
            type="button"
            onClick={() => {
              setSubjectFilter('');
              setDifficultyFilter('');
            }}
            className="text-xs text-rose-600 font-semibold hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={displayedQuestions}
        loading={loading}
        error={error}
        onRetry={fetchQuestions}
        searchPlaceholder="Search question text, subject, or topic..."
        searchKeys={['question_text', 'subject', 'topic', 'explanation']}
        emptyTitle="Question Bank is empty"
        emptyMessage="Add questions to create a rich repository for mock tests and practice mode."
        emptyAction={
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add First Question
          </button>
        }
      />

      {/* Create / Edit Modal with Live Student Preview */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0"
            onClick={() => !submitting && setIsFormOpen(false)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 z-10 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingItem ? `Edit Question #${editingItem.id}` : 'Create New Question'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Fill the question details and inspect the live preview
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                disabled={submitting}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split Grid: Form (Left) & Live Preview (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-5">
              {/* Form Side */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    label="Subject"
                    name="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    error={formErrors.subject}
                    required
                    placeholder="e.g. Mathematics"
                  />

                  <FormField
                    label="Topic"
                    name="topic"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    error={formErrors.topic}
                    required
                    placeholder="e.g. Matrices & Determinants"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    label="Difficulty"
                    name="difficulty"
                    type="select"
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    options={DIFFICULTIES}
                    required
                  />

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Correct Option <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {['A', 'B', 'C', 'D'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setFormData({ ...formData, correct_option: opt })}
                          className={`py-2 text-xs font-bold rounded-xl border transition ${
                            formData.correct_option === opt
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Option {opt}
                        </button>
                      ))}
                    </div>
                    {formErrors.correct_option && (
                      <p className="text-xs text-rose-600 mt-1">{formErrors.correct_option}</p>
                    )}
                  </div>
                </div>

                <FormField
                  label="Question Statement"
                  name="question_text"
                  type="textarea"
                  rows={3}
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  error={formErrors.question_text}
                  required
                  placeholder="Enter the full question prompt..."
                />

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Four Answer Choices
                  </p>
                  <FormField
                    label="Option A"
                    name="option_a"
                    value={formData.option_a}
                    onChange={(e) => setFormData({ ...formData, option_a: e.target.value })}
                    error={formErrors.option_a}
                    required
                    placeholder="Choice A text..."
                  />
                  <FormField
                    label="Option B"
                    name="option_b"
                    value={formData.option_b}
                    onChange={(e) => setFormData({ ...formData, option_b: e.target.value })}
                    error={formErrors.option_b}
                    required
                    placeholder="Choice B text..."
                  />
                  <FormField
                    label="Option C"
                    name="option_c"
                    value={formData.option_c}
                    onChange={(e) => setFormData({ ...formData, option_c: e.target.value })}
                    error={formErrors.option_c}
                    required
                    placeholder="Choice C text..."
                  />
                  <FormField
                    label="Option D"
                    name="option_d"
                    value={formData.option_d}
                    onChange={(e) => setFormData({ ...formData, option_d: e.target.value })}
                    error={formErrors.option_d}
                    required
                    placeholder="Choice D text..."
                  />
                </div>

                <FormField
                  label="Detailed Explanation (Shown in review / practice)"
                  name="explanation"
                  type="textarea"
                  rows={3}
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  placeholder="Step-by-step formula or reasoning for the correct answer..."
                />

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{editingItem ? 'Save Question' : 'Add to Bank'}</span>
                  </button>
                </div>
              </form>

              {/* Live Preview Side */}
              <div className="lg:border-l lg:border-slate-200 lg:pl-6 flex flex-col">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-3">
                  <Eye className="w-4 h-4" />
                  <span>Live Student Preview</span>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-inner flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                      {formData.subject || 'Subject'} &bull; {formData.topic || 'Topic'}
                    </span>
                    {getDifficultyBadge(formData.difficulty)}
                  </div>

                  {/* Question Prompt */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Question Preview
                    </p>
                    <p className="text-sm font-bold text-slate-900 leading-relaxed">
                      {formData.question_text || (
                        <span className="text-slate-400 italic">
                          Question text will appear here as you type...
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Four Options */}
                  <div className="space-y-2">
                    {[
                      { key: 'A', text: formData.option_a },
                      { key: 'B', text: formData.option_b },
                      { key: 'C', text: formData.option_c },
                      { key: 'D', text: formData.option_d },
                    ].map((opt) => {
                      const isCorrect = formData.correct_option === opt.key;
                      return (
                        <div
                          key={opt.key}
                          className={`p-3 rounded-xl border transition flex items-start gap-3 ${
                            isCorrect
                              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium'
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                              isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {opt.key}
                          </span>
                          <span className="text-xs leading-relaxed flex-1 mt-0.5">
                            {opt.text || (
                              <span className="text-slate-300 italic">Option {opt.key} text</span>
                            )}
                          </span>
                          {isCorrect && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                              Correct Key
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Preview */}
                  {formData.explanation && (
                    <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-indigo-950 text-xs space-y-1">
                      <span className="font-bold flex items-center gap-1.5 text-indigo-900">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        Explanation / Solution:
                      </span>
                      <p className="leading-relaxed text-indigo-900/90">
                        {formData.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Question"
        message={`Are you sure you want to permanently delete question #${deleteTarget?.id}?`}
        confirmText="Delete Question"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
