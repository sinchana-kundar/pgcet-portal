import React, { useState, useEffect, useCallback } from 'react';
import { resultsApi, getErrorMessage } from '../api';
import {
  DataTable,
  ConfirmDialog,
  FormField,
  FileUpload,
  useToast,
} from './components';
import {
  Award,
  Upload,
  Plus,
  Trash2,
  Download,
  CheckCircle2,
  X,
  Loader2,
  FileSpreadsheet,
  AlertTriangle,
  Search,
} from 'lucide-react';


const COMMON_CATEGORIES = ['GM', '2A', '2B', '3A', '3B', 'SC', 'ST', 'CAT-1'];

export default function ResultsManager() {
  const { showSuccess, showError, showWarning } = useToast();

  const [resultsData, setResultsData] = useState({
    items: [],
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and filter
  const [searchReg, setSearchReg] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Single Result Form Modal
  const [isSingleAddOpen, setIsSingleAddOpen] = useState(false);
  const [submittingSingle, setSubmittingSingle] = useState(false);
  const [singleForm, setSingleForm] = useState({
    reg_number: '',
    dob: '',
    rank: '',
    marks: '',
    category: 'GM',
  });
  const [singleErrors, setSingleErrors] = useState({});

  // CSV Import Modal
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importSummary, setImportSummary] = useState(null);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchResults = useCallback(async (targetPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await resultsApi.getAdminResults({
        page: targetPage,
        limit: 25,
        category: categoryFilter,
        search: searchReg,
      });

      setResultsData({
        items: data.items || [],
        total: data.total || 0,
        page: data.page || 1,
        limit: data.limit || 25,
        totalPages: data.total_pages || 1,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, searchReg]);

  useEffect(() => {
    fetchResults(1);
  }, [fetchResults]);

  // Client-side sample CSV generation and download
  const handleDownloadSampleCsv = () => {
    const csvContent =
      'reg_number,rank,marks,category,dob\n' +
      'PGCET2026001,1,94.5,GM,2001-05-15\n' +
      'PGCET2026002,2,91.0,2A,2000-11-20\n' +
      'PGCET2026003,3,89.5,SC,2002-03-10\n' +
      'PGCET2026004,4,87.0,3B,2001-08-25\n' +
      'PGCET2026005,5,85.5,ST,2000-12-05\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_pgcet_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showSuccess('Sample CSV downloaded.');
  };

  // Single Add handlers
  const validateSingleForm = () => {
    const errors = {};
    if (!singleForm.reg_number.trim()) {
      errors.reg_number = 'Registration number is required.';
    }
    if (!singleForm.dob.trim()) {
      errors.dob = 'Date of birth is required.';
    }
    if (!singleForm.rank || Number(singleForm.rank) <= 0) {
      errors.rank = 'Rank must be a positive integer.';
    }
    if (singleForm.marks === '' || Number(singleForm.marks) < 0) {
      errors.marks = 'Marks must be a positive number.';
    }
    if (!singleForm.category.trim()) {
      errors.category = 'Category is required.';
    }
    setSingleErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (!validateSingleForm()) return;

    setSubmittingSingle(true);
    try {
      const payload = {
        reg_number: singleForm.reg_number.trim().toUpperCase(),
        dob: singleForm.dob.trim(),
        rank: parseInt(singleForm.rank, 10),
        marks: parseFloat(singleForm.marks),
        category: singleForm.category.trim().toUpperCase(),
      };

      await resultsApi.createResult(payload);
      showSuccess(`Result record for ${payload.reg_number} created successfully.`);

      setIsSingleAddOpen(false);
      setSingleForm({
        reg_number: '',
        dob: '',
        rank: '',
        marks: '',
        category: 'GM',
      });
      fetchResults(1);
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setSubmittingSingle(false);
    }
  };

  // CSV Import handlers
  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) {
      showWarning('Please select a CSV file to import.');
      return;
    }

    setImporting(true);
    setImportSummary(null);
    try {
      const summary = await resultsApi.importResultsCsv(importFile);
      setImportSummary(summary);

      if (summary.imported > 0) {
        showSuccess(`Successfully imported ${summary.imported} results.`);
        fetchResults(1);
      } else {
        showWarning('No new results were imported. Please check skipped row reasons.');
      }
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await resultsApi.deleteResult(deleteTarget.id);
      showSuccess(`Result for ${deleteTarget.reg_number} deleted.`);
      setDeleteTarget(null);
      fetchResults(resultsData.page);
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'reg_number',
      label: 'Registration No.',
      render: (val) => (
        <span className="font-mono font-bold text-slate-900 tracking-wide text-xs">
          {val}
        </span>
      ),
    },
    {
      key: 'rank',
      label: 'State Merit Rank',
      render: (val) => (
        <span className="inline-flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md text-xs">
          <Award className="w-3.5 h-3.5" />
          Rank #{val}
        </span>
      ),
    },
    {
      key: 'marks',
      label: 'Marks Scored',
      render: (val) => <span className="font-semibold text-slate-900">{val} / 100</span>,
    },
    {
      key: 'category',
      label: 'Category',
      render: (val) => (
        <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
          {val}
        </span>
      ),
    },
    {
      key: 'dob',
      label: 'Date of Birth',
      render: (val) => (
        <span className="text-xs text-slate-500 font-mono">
          {val ? String(val).split('T')[0] : '—'}
        </span>
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
          title="Delete candidate result"
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
            Candidate Results Manager
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Bulk import examination merit lists, add single entries, and audit rankings.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setImportSummary(null);
              setImportFile(null);
              setIsImportOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition cursor-pointer shadow-xs"
          >
            <Upload className="w-4 h-4" />
            <span>Bulk CSV Import</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSingleErrors({});
              setIsSingleAddOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs shadow-indigo-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Single Result</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchReg}
              onChange={(e) => setSearchReg(e.target.value)}
              placeholder="Search by registration number..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Categories</option>
            {COMMON_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {(searchReg || categoryFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchReg('');
                setCategoryFilter('');
              }}
              className="text-xs text-rose-600 font-semibold hover:underline shrink-0"
            >
              Clear
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleDownloadSampleCsv}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Sample CSV Template</span>
        </button>
      </div>

      {/* Paginated DataTable */}
      <DataTable
        columns={columns}
        data={resultsData.items}
        loading={loading}
        error={error}
        onRetry={() => fetchResults(resultsData.page)}
        searchable={false}
        pagination={true}
        serverPagination={{
          page: resultsData.page,
          totalPages: resultsData.totalPages,
          totalItems: resultsData.total,
          onPageChange: (newPage) => fetchResults(newPage),
        }}
        emptyTitle="No results in database"
        emptyMessage="Upload candidate scores via bulk CSV or add single test results."
        emptyAction={
          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            Import Results CSV
          </button>
        }
      />

      {/* Single Result Add Modal */}
      {isSingleAddOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0"
            onClick={() => !submittingSingle && setIsSingleAddOpen(false)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 z-10">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Add Candidate Result
                  </h3>
                  <p className="text-xs text-slate-500">
                    Register a single student result record
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSingleAddOpen(false)}
                disabled={submittingSingle}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSingleSubmit} className="mt-5 space-y-3.5">
              <FormField
                label="Registration Number"
                name="reg_number"
                value={singleForm.reg_number}
                onChange={(e) =>
                  setSingleForm({ ...singleForm, reg_number: e.target.value.toUpperCase() })
                }
                error={singleErrors.reg_number}
                required
                placeholder="e.g. PGCET2026101"
              />

              <FormField
                label="Date of Birth"
                name="dob"
                type="date"
                value={singleForm.dob}
                onChange={(e) => setSingleForm({ ...singleForm, dob: e.target.value })}
                error={singleErrors.dob}
                required
                hint="Used for student verification during rank lookup"
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="State Merit Rank"
                  name="rank"
                  type="number"
                  min={1}
                  value={singleForm.rank}
                  onChange={(e) => setSingleForm({ ...singleForm, rank: e.target.value })}
                  error={singleErrors.rank}
                  required
                  placeholder="e.g. 142"
                />

                <FormField
                  label="Marks Scored"
                  name="marks"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={singleForm.marks}
                  onChange={(e) => setSingleForm({ ...singleForm, marks: e.target.value })}
                  error={singleErrors.marks}
                  required
                  placeholder="e.g. 78.5"
                />
              </div>

              <FormField
                label="Reservation Category"
                name="category"
                type="select"
                value={singleForm.category}
                onChange={(e) => setSingleForm({ ...singleForm, category: e.target.value })}
                error={singleErrors.category}
                required
                options={COMMON_CATEGORIES.map((c) => ({ value: c, label: c }))}
              />

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSingleAddOpen(false)}
                  disabled={submittingSingle}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSingle}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {submittingSingle && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Result</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Bulk Import Modal */}
      {isImportOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0"
            onClick={() => !importing && setIsImportOpen(false)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 z-10 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Bulk Import Results CSV
                  </h3>
                  <p className="text-xs text-slate-500">
                    Upload official state merit ranks with automatic validation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                disabled={importing}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="mt-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <p className="font-semibold text-slate-800">CSV Column Format Requirements:</p>
                <p>
                  Your file must have headers:{' '}
                  <code className="px-1.5 py-0.5 rounded bg-slate-200 font-mono text-indigo-700">
                    reg_number, rank, marks, category, dob
                  </code>
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadSampleCsv}
                    className="inline-flex items-center gap-1 text-indigo-600 font-bold hover:underline"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Sample CSV template
                  </button>
                </div>
              </div>

              <FileUpload
                label="Select CSV File"
                accept=".csv"
                maxSizeMB={15}
                file={importFile}
                onFileSelect={(f) => setImportFile(f)}
                required
                hint="UTF-8 or UTF-8 with BOM encoded CSV file."
              />

              {/* Import Summary Audit Box */}
              {importSummary && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 animate-in fade-in">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Import Audit Summary
                  </h4>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-white border border-slate-200">
                      <p className="text-xs text-slate-500">Total Rows</p>
                      <p className="text-base font-extrabold text-slate-900">
                        {importSummary.total_rows}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                      <p className="text-xs text-emerald-700">Imported</p>
                      <p className="text-base font-extrabold text-emerald-800">
                        {importSummary.imported}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-200">
                      <p className="text-xs text-rose-700">Skipped</p>
                      <p className="text-base font-extrabold text-rose-800">
                        {importSummary.skipped}
                      </p>
                    </div>
                  </div>

                  {importSummary.errors && importSummary.errors.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <p className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Skipped Rows Breakdown ({importSummary.errors.length}):</span>
                      </p>
                      <div className="max-h-40 overflow-y-auto divide-y divide-rose-100 border border-rose-200 rounded-lg bg-white text-xs">
                        {importSummary.errors.map((err, idx) => (
                          <div key={idx} className="p-2 flex items-start gap-2">
                            <span className="font-mono font-bold text-rose-600 shrink-0">
                              Row #{err.row}
                            </span>
                            <span className="text-slate-600">
                              {err.reg_number ? `[${err.reg_number}] ` : ''}
                              {err.reason}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  disabled={importing}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  {importSummary ? 'Close' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={importing || !importFile}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {importing && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{importing ? 'Processing CSV...' : 'Start Import'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Candidate Result"
        message={`Are you sure you want to permanently delete the score record for registration number "${deleteTarget?.reg_number}"?`}
        confirmText="Delete Record"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
