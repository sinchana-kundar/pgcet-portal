import React, { useEffect, useState } from 'react';
import { studyMaterialsApi, getErrorMessage, getFileUrl } from '../api';
import Card, { CardContent, CardHeader, CardTitle } from '../components/Card';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { usePageMeta } from '../hooks/usePageMeta';
import {
  BookOpen,
  Filter,
  FileDown,
  Calendar,
  RotateCcw,
  BookMarked,
} from 'lucide-react';

const COMMON_SUBJECTS = [
  'All Subjects',
  'MCA',
  'MBA',
  'Computer Science',
  'Mathematics',
  'Quantitative Aptitude',
  'Logical Reasoning',
  'General English',
];

export default function StudyMaterials() {
  usePageMeta(
    'Study Materials & Subject Notes',
    'Curated study notes, formulas, reference guides, and chapter notes organized by subject for Karnataka PGCET aspirants.'
  );

  const [materials, setMaterials] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMaterials = async (subject = selectedSubject, topic = selectedTopic) => {
    setLoading(true);
    setError('');
    try {
      const data = await studyMaterialsApi.getStudyMaterials({
        subject: subject && subject !== 'All Subjects' ? subject : undefined,
        topic: topic ? topic : undefined,
      });
      setMaterials(data);
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
        const data = await studyMaterialsApi.getStudyMaterials({
          subject: selectedSubject && selectedSubject !== 'All Subjects' ? selectedSubject : undefined,
          topic: selectedTopic ? selectedTopic : undefined,
        });
        if (!ignore) {
          setMaterials(data);
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
  }, [selectedSubject, selectedTopic]);

  const handleResetFilters = () => {
    setSelectedSubject('');
    setSelectedTopic('');
  };

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
      {/* Header */}
      <div className="space-y-2 border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Curated Prep Materials</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-outfit">
          PGCET Study Materials & Notes
        </h1>
        <p className="text-sm text-slate-500 max-w-2xl">
          High-yield chapter notes, formulas, syllabus outlines, and solved examples organized by subject and topic.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>Filter Materials</span>
          </div>
          {(selectedSubject || selectedTopic) && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Subject Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Select Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition cursor-pointer"
            >
              <option value="">All Subjects</option>
              {COMMON_SUBJECTS.filter((s) => s !== 'All Subjects').map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Topic Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Filter by Topic / Keyword
            </label>
            <div className="relative">
              <input
                type="text"
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                placeholder="e.g. Data Structures, Algebra, Reasoning"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
              {selectedTopic && (
                <button
                  onClick={() => setSelectedTopic('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Summary */}
          <div className="flex sm:items-end">
            <div className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="font-medium">Found:</span>
              <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                {loading ? '...' : `${materials.length} material${materials.length !== 1 ? 's' : ''}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Materials List */}
      {loading ? (
        <Loader message="Loading study materials from backend..." fullScreen />
      ) : error ? (
        <ErrorMessage
          title="Could not load study materials"
          message={error}
          onRetry={() => fetchMaterials(selectedSubject, selectedTopic)}
        />
      ) : materials.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 space-y-3">
          <BookMarked className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No study materials match your filter</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Try choosing a different subject or clearing your topic search to see all available study resources.
          </p>
          {(selectedSubject || selectedTopic) && (
            <button
              onClick={handleResetFilters}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((item) => {
            const fileUrl = getFileUrl(item.file_url);

            return (
              <Card key={item.id} hover className="flex flex-col justify-between">
                <div>
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {item.subject}
                      </span>
                      <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[160px]">
                        {item.topic}
                      </span>
                    </div>

                    <CardTitle className="text-base leading-snug line-clamp-2">
                      {item.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Uploaded {formatDate(item.uploaded_at)}</span>
                    </div>
                  </CardContent>
                </div>

                <div className="p-5 pt-0 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl mt-auto">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Download / View Resource</span>
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
