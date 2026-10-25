import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { studyMaterialsApi, getFileUrl, getErrorMessage } from '../api';
import {
  DataTable,
  ConfirmDialog,
  FormField,
  FileUpload,
  useToast,
} from './components';
import {
  BookOpen,
  Plus,
  Trash2,
  FileText,
  ExternalLink,
  X,
  Loader2,
  Calendar,
  Filter,
} from 'lucide-react';

const COMMON_SUBJECTS = [
  'MCA',
  'MBA',
  'M.Tech',
  'Mathematics',
  'Computer Science',
  'Logical Reasoning',
  'General Knowledge',
];

export default function StudyMaterialsManager() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccess, showError } = useToast();

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [subjectFilter, setSubjectFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('');

  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    title: '',
    file: null,
    file_url: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMaterials = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await studyMaterialsApi.getStudyMaterials({
        subject: subjectFilter,
        topic: topicFilter,
      });
      setMaterials(data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      subject: '',
      topic: '',
      title: '',
      file: null,
      file_url: '',
    });
    setUploadProgress(0);
    setFormErrors({});
    setIsFormOpen(true);
  };

  useEffect(() => {
    fetchMaterials();
  }, [subjectFilter, topicFilter]);

  // Check URL search params for ?action=new
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      handleOpenCreate();
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);


  const validateForm = () => {
    const errors = {};
    if (!formData.subject.trim()) errors.subject = 'Subject is required.';
    if (!formData.topic.trim()) errors.topic = 'Topic is required.';
    if (!formData.title.trim()) errors.title = 'Title is required.';
    if (!formData.file && !formData.file_url.trim()) {
      errors.file = 'Please upload a document or provide a file URL.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setUploadProgress(10);
    try {
      const payload = new FormData();
      payload.append('subject', formData.subject.trim());
      payload.append('topic', formData.topic.trim());
      payload.append('title', formData.title.trim());

      if (formData.file) {
        payload.append('file', formData.file);
      } else if (formData.file_url.trim()) {
        payload.append('file_url', formData.file_url.trim());
      }

      await studyMaterialsApi.createStudyMaterial(payload, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      showSuccess('Study material uploaded successfully.');
      setIsFormOpen(false);
      fetchMaterials();
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await studyMaterialsApi.deleteStudyMaterial(deleteTarget.id);
      showSuccess(`"${deleteTarget.title}" deleted successfully.`);
      setDeleteTarget(null);
      fetchMaterials();
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Material Title',
      render: (val, row) => (
        <div className="max-w-xs sm:max-w-md">
          <p className="font-bold text-slate-900 line-clamp-1">{val}</p>
          <div className="flex items-center gap-2 mt-1">
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
      key: 'file_url',
      label: 'Document',
      sortable: false,
      render: (val) => (
        <a
          href={getFileUrl(val)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Open File</span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </a>
      ),
    },
    {
      key: 'uploaded_at',
      label: 'Uploaded On',
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
      label: 'Actions',
      sortable: false,
      className: 'text-right',
      render: (_, row) => (
        <button
          type="button"
          onClick={() => setDeleteTarget(row)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
          title="Delete material"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-outfit">
            Study Materials Manager
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Organize notes, subject modules, and study guides for candidate preparation.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs shadow-indigo-600/30 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Material</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0">
          <Filter className="w-3.5 h-3.5 text-indigo-600" />
          <span>Filters:</span>
        </div>

        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Subjects</option>
          {COMMON_SUBJECTS.map((sub) => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          placeholder="Filter by topic (e.g. Data Structures)..."
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-indigo-500 sm:w-64"
        />

        {(subjectFilter || topicFilter) && (
          <button
            type="button"
            onClick={() => {
              setSubjectFilter('');
              setTopicFilter('');
            }}
            className="text-xs text-rose-600 font-semibold hover:underline shrink-0"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={materials}
        loading={loading}
        error={error}
        onRetry={fetchMaterials}
        searchPlaceholder="Search materials by title or topic..."
        searchKeys={['title', 'topic', 'subject']}
        emptyTitle="No study materials found"
        emptyMessage="Upload reference PDFs, topic breakdowns, and syllabus notes."
        emptyAction={
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Upload Study Material
          </button>
        }
      />

      {/* Upload Modal */}
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

          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Upload Study Material
                  </h3>
                  <p className="text-xs text-slate-500">
                    Register notes and lecture documents for students
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

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <FormField
                    label="Subject"
                    name="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    error={formErrors.subject}
                    required
                    placeholder="e.g. MCA or Mathematics"
                  />
                  <div className="mt-1 flex flex-wrap gap-1">
                    {['MCA', 'MBA', 'Mathematics'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormData({ ...formData, subject: s })}
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        +{s}
                      </button>
                    ))}
                  </div>
                </div>

                <FormField
                  label="Topic / Unit"
                  name="topic"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  error={formErrors.topic}
                  required
                  placeholder="e.g. Computer Networks"
                />
              </div>

              <FormField
                label="Document Title"
                name="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                error={formErrors.title}
                required
                placeholder="e.g. OSI Model & TCP/IP Protocol Suite Summary"
              />

              <div className="pt-2 border-t border-slate-100">
                <FileUpload
                  label="Document File"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                  maxSizeMB={25}
                  file={formData.file}
                  onFileSelect={(selectedFile) =>
                    setFormData({ ...formData, file: selectedFile })
                  }
                  progress={uploadProgress}
                  error={formErrors.file}
                  required={!formData.file_url}
                  hint="Supported: PDF, Word, PowerPoint, Text (max 25MB)."
                />
              </div>

              <FormField
                label="Or Direct File URL (Optional)"
                name="file_url"
                value={formData.file_url}
                onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                placeholder="https://example.com/materials/networks.pdf"
                hint="Alternatively specify an external URL if the file is hosted elsewhere."
              />

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{submitting ? 'Uploading...' : 'Save & Publish'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Study Material"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"? The uploaded file will be deleted from the server.`}
        confirmText="Delete Material"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
