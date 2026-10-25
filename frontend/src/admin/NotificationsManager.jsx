import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { notificationsApi, getFileUrl, getErrorMessage } from '../api';
import {
  DataTable,
  ConfirmDialog,
  FormField,
  FileUpload,
  useToast,
} from './components';
import {
  Bell,
  Plus,
  Pencil,
  Trash2,
  FileText,
  ExternalLink,
  X,
  Loader2,
  Calendar,
} from 'lucide-react';

export default function NotificationsManager() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccess, showError } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pdf_url: '',
    file: null,
  });
  const [formErrors, setFormErrors] = useState({});

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationsApi.getNotifications();
      setNotifications(data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      description: '',
      pdf_url: '',
      file: null,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Check URL search params for ?action=new
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      handleOpenCreate();
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);


  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title || '',
      description: item.description || '',
      pdf_url: item.pdf_url || '',
      file: null,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = 'Title is required.';
    }
    if (!formData.description.trim()) {
      errors.description = 'Description is required.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('title', formData.title.trim());
      payload.append('description', formData.description.trim());

      if (formData.file) {
        payload.append('file', formData.file);
      } else if (formData.pdf_url.trim()) {
        payload.append('pdf_url', formData.pdf_url.trim());
      }

      if (editingItem) {
        await notificationsApi.updateNotification(editingItem.id, payload);
        showSuccess('Notification updated successfully.');
      } else {
        await notificationsApi.createNotification(payload);
        showSuccess('Notification created and published.');
      }

      setIsFormOpen(false);
      fetchNotifications();
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
      await notificationsApi.deleteNotification(deleteTarget.id);
      showSuccess(`Notification #${deleteTarget.id} deleted successfully.`);
      setDeleteTarget(null);
      fetchNotifications();
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Notification Title',
      render: (val, row) => (
        <div className="max-w-xs sm:max-w-md">
          <p className="font-bold text-slate-900 line-clamp-1">{val}</p>
          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{row.description}</p>
        </div>
      ),
    },
    {
      key: 'published_at',
      label: 'Date Published',
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
      key: 'pdf_url',
      label: 'Attachment',
      sortable: false,
      render: (val) => {
        if (!val) {
          return <span className="text-xs text-slate-400">None</span>;
        }
        return (
          <a
            href={getFileUrl(val)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View PDF</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        );
      },
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
            className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
            title="Edit notification"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            title="Delete notification"
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
            Notifications Manager
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Create, update, or remove official announcements and circulars.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs shadow-indigo-600/30 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Notification</span>
        </button>
      </div>

      {/* Notifications Table */}
      <DataTable
        columns={columns}
        data={notifications}
        loading={loading}
        error={error}
        onRetry={fetchNotifications}
        searchPlaceholder="Search notifications by title or description..."
        searchKeys={['title', 'description']}
        emptyTitle="No notifications yet"
        emptyMessage="Publish announcements, exam date circulars, and updates for students."
        emptyAction={
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Create First Notification
          </button>
        }
      />

      {/* Create / Edit Modal */}
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
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingItem ? 'Edit Notification' : 'Create Notification'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingItem
                      ? `Updating notification ID #${editingItem.id}`
                      : 'Publish announcement to students'}
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
                label="Headline / Title"
                name="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                error={formErrors.title}
                required
                placeholder="e.g. Karnataka PGCET 2026 Revised Exam Schedule"
              />

              <FormField
                label="Notification Description"
                name="description"
                type="textarea"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                error={formErrors.description}
                required
                placeholder="Detailed notice body and instructions for candidates..."
              />

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <FileUpload
                  label="Attach PDF Document (Optional)"
                  accept=".pdf"
                  maxSizeMB={20}
                  file={formData.file}
                  onFileSelect={(selectedFile) =>
                    setFormData({ ...formData, file: selectedFile })
                  }
                  hint="Upload an official circular or gazette notice in PDF format."
                />

                {editingItem?.pdf_url && !formData.file && (
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg">
                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Current file attached:</span>
                    <a
                      href={getFileUrl(editingItem.pdf_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-indigo-600 hover:underline"
                    >
                      View existing PDF
                    </a>
                  </div>
                )}

                <FormField
                  label="Or Direct PDF URL (Optional)"
                  name="pdf_url"
                  value={formData.pdf_url}
                  onChange={(e) => setFormData({ ...formData, pdf_url: e.target.value })}
                  placeholder="https://kea.kar.nic.in/pgcet-notice.pdf"
                  hint="Alternatively provide an external link if not uploading a local file."
                />
              </div>

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
                  <span>{editingItem ? 'Save Changes' : 'Publish Notification'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Notification"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"? Any attached PDF will also be removed.`}
        confirmText="Delete Notification"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
