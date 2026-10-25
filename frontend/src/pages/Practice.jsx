import React, { useEffect, useState } from 'react';
import { practiceApi, getErrorMessage } from '../api';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import {
  Zap,
  BookOpen,
  Filter,
  CheckCircle2,
  XCircle,
  Send,
  Lightbulb,
} from 'lucide-react';

const COMMON_PRACTICE_TOPICS = {
  MCA: ['Data Structures', 'C Programming', 'Computer Awareness', 'Boolean Algebra', 'Algorithms'],
  MBA: ['Quantitative Aptitude', 'Data Interpretation', 'Logical Reasoning', 'General English', 'General Knowledge'],
  Mathematics: ['Calculus', 'Matrices & Determinants', 'Coordinate Geometry', 'Trigonometry', 'Probability'],
  'Computer Science': ['Operating Systems', 'Database Management', 'Computer Networks', 'Software Engineering'],
};

export default function Practice() {
  const [selectedSubject, setSelectedSubject] = useState('MCA');
  const [selectedTopic, setSelectedTopic] = useState('Data Structures');
  const [customTopic, setCustomTopic] = useState('');

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Selected options per question: { [question_id]: 'A' | 'B' | 'C' | 'D' }
  const [userSelections, setUserSelections] = useState({});

  // Verified check responses: { [question_id]: { is_correct: bool, correct_option: string, explanation: string|null, checking: bool } }
  const [checkedResults, setCheckedResults] = useState({});

  const activeTopic = customTopic.trim() || selectedTopic;

  const fetchQuestions = async (sub = selectedSubject, top = activeTopic) => {
    if (!sub || !top) return;
    setLoading(true);
    setError('');
    setUserSelections({});
    setCheckedResults({});

    try {
      const data = await practiceApi.getPracticeQuestions({
        subject: sub,
        topic: top,
      });
      setQuestions(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!selectedSubject || !activeTopic) return;
      setLoading(true);
      setError('');
      try {
        const data = await practiceApi.getPracticeQuestions({
          subject: selectedSubject,
          topic: activeTopic,
        });
        if (!ignore) {
          setQuestions(data);
          setUserSelections({});
          setCheckedResults({});
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
  }, [selectedSubject, activeTopic]);

  const handleSelectOption = (questionId, optionLetter) => {
    setUserSelections((prev) => ({
      ...prev,
      [questionId]: optionLetter,
    }));
  };

  const handleCheckAnswer = async (questionId) => {
    const selectedOption = userSelections[questionId];
    if (!selectedOption) return;

    setCheckedResults((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], checking: true },
    }));

    try {
      const res = await practiceApi.checkAnswer({
        questionId,
        selectedOption,
      });
      setCheckedResults((prev) => ({
        ...prev,
        [questionId]: {
          is_correct: res.is_correct,
          correct_option: res.correct_option,
          explanation: res.explanation,
          checking: false,
        },
      }));
    } catch (err) {
      alert(`Could not check answer: ${getErrorMessage(err)}`);
      setCheckedResults((prev) => ({
        ...prev,
        [questionId]: { ...prev[questionId], checking: false },
      }));
    }
  };

  // Practice session metrics
  const checkedCount = Object.keys(checkedResults).length;
  const correctCount = Object.values(checkedResults).filter((r) => r.is_correct).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-semibold mb-2">
            <Zap className="w-3.5 h-3.5 text-violet-600" />
            <span>Untimed Topic-Wise Practice</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-outfit">
            Practice Question Bank
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Solve questions topic-by-topic at your own pace with instant answer checks and complete solutions.
          </p>
        </div>

        {/* Live Score Counter */}
        {questions.length > 0 && checkedCount > 0 && (
          <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4 shrink-0">
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Checked</span>
              <span className="text-base font-bold text-slate-900">{checkedCount}</span>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase text-emerald-600 block">Correct</span>
              <span className="text-base font-bold text-emerald-600">{correctCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* Subject & Topic Selectors */}
      <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
          <Filter className="w-4 h-4 text-violet-600" />
          <span>Choose Practice Topic</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Subject select */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                const suggestedTopics = COMMON_PRACTICE_TOPICS[e.target.value] || [];
                if (suggestedTopics.length > 0) {
                  setSelectedTopic(suggestedTopics[0]);
                  setCustomTopic('');
                }
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition cursor-pointer"
            >
              {Object.keys(COMMON_PRACTICE_TOPICS).map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Preset Topic select */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Select Preset Topic
            </label>
            <select
              value={selectedTopic}
              onChange={(e) => {
                setSelectedTopic(e.target.value);
                setCustomTopic('');
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition cursor-pointer"
            >
              {(COMMON_PRACTICE_TOPICS[selectedSubject] || []).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Or Search Custom Topic */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Or Custom Topic / Unit Keyword
            </label>
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="e.g. Trees, Algebra, Grammar"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition"
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <Loader message={`Loading practice questions for ${activeTopic}...`} fullScreen />
      ) : error ? (
        <ErrorMessage
          title="Could not load practice questions"
          message={error}
          onRetry={() => fetchQuestions(selectedSubject, activeTopic)}
        />
      ) : questions.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No practice questions found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            No questions matched "{selectedSubject} - {activeTopic}". Try selecting another topic from the dropdown.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Showing {questions.length} question{questions.length !== 1 ? 's' : ''} for <strong>{activeTopic}</strong>
            </span>
            <span className="capitalize">Difficulty: Standard PGCET</span>
          </div>

          {questions.map((q, idx) => {
            const selectedOpt = userSelections[q.id];
            const resultInfo = checkedResults[q.id];
            const isChecked = !!resultInfo;

            return (
              <div
                key={q.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-5 transition"
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {q.subject} • {q.topic}
                    </span>
                  </div>

                  {isChecked && (
                    <div>
                      {resultInfo.is_correct ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Correct Answer</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Incorrect</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Question statement */}
                <p className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed whitespace-pre-line">
                  {q.question_text}
                </p>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {[
                    { key: 'A', text: q.option_a },
                    { key: 'B', text: q.option_b },
                    { key: 'C', text: q.option_c },
                    { key: 'D', text: q.option_d },
                  ].map((opt) => {
                    const isSelected = selectedOpt === opt.key;
                    const isCorrect = isChecked && resultInfo.correct_option === opt.key;
                    const isWrongSelection = isChecked && isSelected && !resultInfo.is_correct;

                    let optStyle = 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100';
                    let badgeStyle = 'bg-white text-slate-700 border border-slate-300';

                    if (isCorrect) {
                      optStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-500';
                      badgeStyle = 'bg-emerald-600 text-white font-bold';
                    } else if (isWrongSelection) {
                      optStyle = 'border-red-400 bg-red-50 text-red-950 font-bold ring-1 ring-red-400';
                      badgeStyle = 'bg-red-600 text-white font-bold';
                    } else if (isSelected) {
                      optStyle = 'border-violet-600 bg-violet-50 text-violet-950 ring-2 ring-violet-500/20';
                      badgeStyle = 'bg-violet-600 text-white font-bold';
                    }

                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleSelectOption(q.id, opt.key)}
                        className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition cursor-pointer ${optStyle}`}
                      >
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs ${badgeStyle}`}>
                          {opt.key}
                        </span>
                        <span className="text-xs sm:text-sm leading-snug pt-0.5">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Action button */}
                <div className="pt-2 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    {selectedOpt ? `Selected: Option ${selectedOpt}` : 'Select an option to verify'}
                  </div>

                  <button
                    type="button"
                    disabled={!selectedOpt || resultInfo?.checking}
                    onClick={() => handleCheckAnswer(q.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {resultInfo?.checking ? (
                      <span>Checking...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Check Answer</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Explanation Card */}
                {isChecked && resultInfo.explanation && (
                  <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1.5 animate-in fade-in duration-200">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <span>Explanation & Solution Logic</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line pt-1">
                      {resultInfo.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
