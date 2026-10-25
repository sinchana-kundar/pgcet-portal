import React, { useEffect, useState } from 'react';
import { downloadsApi, getErrorMessage, getFileUrl } from '../api';
import Card, { CardHeader, CardTitle } from '../components/Card';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { usePageMeta } from '../hooks/usePageMeta';
import {
  FileDown,
  FileText,
  FolderDown,
} from 'lucide-react';

const CATEGORIES = [
  { id: '', label: 'All Resources' },
  { id: 'previous_year_paper', label: 'Previous Year Papers' },
  { id: 'syllabus', label: 'Official Syllabus' },
  { id: 'brochure', label: 'Brochure & Guidelines' },
  { id: 'answer_key', label: 'Answer Keys' },
];

export default function Downloads() {
  usePageMeta(
    'Question Papers & Syllabus Downloads',
    'Download authentic previous year question papers, official syllabus PDFs, exam brochures, and answer keys for Karnataka PGCET.'
  );

  const [downloads, setDownloads] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDownloads = async (category = selectedCategory) => {
    setLoading(true);
    setError('');
    try {
      const data = await downloadsApi.getDownloads({
        category: category ? category : undefined,
      });
      setDownloads(data);
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
        const data = await downloadsApi.getDownloads({
          category: selectedCategory ? selectedCategory : undefined,
        });
        if (!ignore) {
          setDownloads(data);
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
  }, [selectedCategory]);

  const formatCategory = (cat) => {
    if (!cat) return 'General';
    return cat
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
          <FolderDown className="w-3.5 h-3.5" />
          <span>Official Documents & Papers</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-outfit">
          PGCET Downloads Repository
        </h1>
        <p className="text-sm text-slate-500 max-w-2xl">
          Direct downloads for previous year question papers, official syllabus PDFs, eligibility brochures, and candidate reference documents.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                  : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Downloads Grid */}
      {loading ? (
        <Loader message="Loading downloads repository..." fullScreen />
      ) : error ? (
        <ErrorMessage
          title="Could not load downloads"
          message={error}
          onRetry={() => fetchDownloads(selectedCategory)}
        />
      ) : downloads.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No documents found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {selectedCategory
              ? `There are currently no downloads listed under the category "${formatCategory(selectedCategory)}".`
              : 'The downloads repository is currently empty.'}
          </p>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory('')}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
            >
              View All Downloads
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {downloads.map((item) => {
            const fileUrl = getFileUrl(item.file_url);

            return (
              <Card key={item.id} hover className="flex flex-col justify-between">
                <div>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {formatCategory(item.category)}
                      </span>
                    </div>

                    <CardTitle className="text-base leading-snug line-clamp-2">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                </div>

                <div className="p-5 pt-0 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl mt-auto">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition"
                  >
                    <FileDown className="w-4 h-4 text-indigo-600" />
                    <span>Download Resource</span>
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
