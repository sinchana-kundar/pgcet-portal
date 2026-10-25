import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { downloadsApi, getFileUrl, getErrorMessage } from '../api';
import {
  DataTable,
  ConfirmDialog,
  FormField,
  FileUpload,
  useToast,
} from './components';
import {
  FileDown,
  Plus,
  Trash2,
  FileText,
  ExternalLink,
  X,
  Loader2,
  Filter,
} from 'lucide-react';

const COMMON_CATEGORIES = [
  { value: 'brochure', label: 'Information Brochure' },
  { value: 'previous_year_paper', label: 'Previous Year Question Paper' },
  { value: 'syllabus', label: 'Syllabus & Exam Pattern' },
  { value: 'answer_key', label: 'Official Answer Key' },
  { value: 'guidelines', label: 'Counselling Guidelines' },
  { value: 'seat_matrix', label: 'Seat Matrix & Cutoffs' },
];

export default function DownloadsManager() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccess, showError } = useToast();

  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    category: 'brochure',
    customCategory: '',
    file: null,
    file_url: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDownloads = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await downloadsApi.getDownloads({
        category: categoryFilter,
      });
      setDownloads(data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      category: 'brochure',
      customCategory: '',
      file: null,
      file_url: '',
    });
    setUploadProgress(0);
    setFormErrors({});
    setIsFormOpen(true);
  };

  useEffect(() => {
    fetchDownloads();
  }, [categoryFilter]);

  // Check URL search params for ?action=new
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      handleOpenCreate();
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);


  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Title is required.';
    const finalCategory =
      formData.category === 'other'
        ? formData.customCategory.trim()
        : formData.category.trim();
    if (!finalCategory) errors.category = 'Category is required.';
    if (!formData.file && !formData.file_url.trim()) {
      errors.file = 'Please upload a resource file or provide a URL.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const finalCategory =
      formData.category === 'other'
        ? formData.customCategory.trim()
        : formData.category.trim();

    setSubmitting(true);
    setUploadProgress(10);
    try {
      const payload = new FormData();
      payload.append('title', formData.title.trim());
      payload.append('category', finalCategory);

      if (formData.file) {
        payload.append('file', formData.file);
      } else if (formData.file_url.trim()) {
        payload.append('file_url', formData.file_url.trim());
      }

      await downloadsApi.createDownload(payload, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      showSuccess('Download resource uploaded successfully.');
      setIsFormOpen(false);
      fetchDownloads();
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
      await downloadsApi.deleteDownload(deleteTarget.id);
      showSuccess(`"${deleteTarget.title}" deleted successfully.`);
      setDeleteTarget(null);
      fetchDownloads();
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Resource Title',
      render: (val, row) => (
        <div className="max-w-xs sm:max-w-md">
          <p className="font-bold text-slate-900 line-clamp-1">{val}</p>
          <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-800 capitalize">
            {row.category?.replace(/_/g, ' ')}
          </span>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (val) => (
        <span className="text-xs font-semibold text-slate-600 capitalize">
          {val?.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'file_url',
      label: 'File',
      sortable: false,
      render: (val) => (
        <a
          href={getFileUrl(val)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 transition"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Download</span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </a>
      ),
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
          title="Delete download"
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
            Downloads Manager
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage brochures, question papers, syllabus PDFs, and candidate forms.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs shadow-indigo-600/30 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Download</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0">
          <Filter className="w-3.5 h-3.5 text-cyan-600" />
          <span>Category:</span>
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Categories</option>
          {COMMON_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>

        {categoryFilter && (
          <button
            type="button"
            onClick={() => setCategoryFilter('')}
            className="text-xs text-rose-600 font-semibold hover:underline"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={downloads}
        loading={loading}
        error={error}
        onRetry={fetchDownloads}
        searchPlaceholder="Search downloads by title or category..."
        searchKeys={['title', 'category']}
        emptyTitle="No downloads available"
        emptyMessage="Upload previous year papers, syllabi, or informational brochures."
        emptyAction={
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Upload First Resource
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
                <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <FileDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Upload Downloadable Resource
                  </h3>
                  <p className="text-xs text-slate-500">
                    Publish brochures, papers, and forms for public access
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
              <FormField
                label="Resource Title"
                name="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                error={formErrors.title}
                required
                placeholder="e.g. Karnataka PGCET 2025 MCA Official Question Paper with Key"
              />

              <div className="space-y-2">
                <FormField
                  label="Category"
                  name="category"
                  type="select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  error={formErrors.category}
                  required
                  options={[
                    ...COMMON_CATEGORIES,
                    { value: 'other', label: 'Other (Enter custom category)' },
                  ]}
                />

                {formData.category === 'other' && (
                  <FormField
                    name="customCategory"
                    value={formData.customCategory}
                    onChange={(e) =>
                      setFormData({ ...formData, customCategory: e.target.value })
                    }
                    placeholder="Enter custom category name..."
                    required
                  />
                )}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <FileUpload
                  label="Resource File"
                  accept=".pdf,.doc,.docx,.zip,.xls,.xlsx"
                  maxSizeMB={30}
                  file={formData.file}
                  onFileSelect={(selectedFile) =>
                    setFormData({ ...formData, file: selectedFile })
                  }
                  progress={uploadProgress}
                  error={formErrors.file}
                  required={!formData.file_url}
                  hint="Supported formats: PDF, Word, Excel, ZIP archives (max 30MB)."
                />
              </div>

              <FormField
                label="Or Direct File URL (Optional)"
                name="file_url"
                value={formData.file_url}
                onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                placeholder="https://cetonline.karnataka.gov.in/pgcet-brochure.pdf"
                hint="Alternatively provide an external URL."
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
        title="Delete Download Resource"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"?`}
        confirmText="Delete Resource"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
