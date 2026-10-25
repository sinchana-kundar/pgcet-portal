import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { notificationsApi, getErrorMessage, getFileUrl } from '../api';
import Card from '../components/Card';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { usePageMeta } from '../hooks/usePageMeta';
import {
  ArrowLeft,
  Calendar,
  FileDown,
  ExternalLink,
  CheckCircle2,
  Copy,
} from 'lucide-react';

export default function NotificationDetail() {
  const { id } = useParams();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  usePageMeta(
    notification?.title ? notification.title : 'Notification Circular',
    notification?.description ? notification.description.slice(0, 150) : 'Official notification details on Karnataka PGCET portal.'
  );

  const fetchDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await notificationsApi.getNotificationById(id);
      setNotification(data);
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
        const data = await notificationsApi.getNotificationById(id);
        if (!ignore) {
          setNotification(data);
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
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <Loader message="Loading notification details..." fullScreen />;
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
        <Link
          to="/notifications"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all notifications</span>
        </Link>
        <ErrorMessage
          title="Notification not found"
          message={error}
          onRetry={fetchDetail}
        />
      </div>
    );
  }

  const pdfFullUrl = notification?.pdf_url ? getFileUrl(notification.pdf_url) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/notifications"
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Notifications List</span>
        </Link>
      </div>

      {/* Main Detail Card */}
      <Card className="p-6 sm:p-10 space-y-6">
        <div className="space-y-3 pb-6 border-b border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(notification.published_at)}
            </span>

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 transition"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit tracking-tight leading-tight">
            {notification.title}
          </h1>
        </div>

        {/* Content body */}
        <div className="prose prose-slate max-w-none text-slate-700 text-base leading-relaxed whitespace-pre-line">
          {notification.description}
        </div>

        {/* PDF Attachment Section */}
        {pdfFullUrl && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="rounded-2xl bg-indigo-50/70 border border-indigo-100 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <FileDown className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Official Document Attached</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Download or open the official PDF release from Karnataka Examination Authority.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={pdfFullUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xs transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open PDF in Tab</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
