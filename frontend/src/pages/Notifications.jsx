import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { notificationsApi, getErrorMessage, getFileUrl } from '../api';
import Card from '../components/Card';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { usePageMeta } from '../hooks/usePageMeta';
import {
  Bell,
  Calendar,
  FileDown,
  Search,
  ArrowRight,
  FileText,
  FilterX,
} from 'lucide-react';

export default function Notifications() {
  usePageMeta(
    'Exam Notifications & Circulars',
    'Stay updated with the latest official Karnataka PGCET notifications, exam dates, admit cards, and counselling circulars.'
  );

  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await notificationsApi.getNotifications();
      setNotifications(data);
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
        const data = await notificationsApi.getNotifications();
        if (!ignore) {
          setNotifications(data);
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
  }, []);

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

  const filteredNotifications = notifications.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.title?.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
            <Bell className="w-3.5 h-3.5" />
            <span>Official Announcements</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-outfit">
            PGCET Exam Notifications
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Official circulars, timetable schedules, admit card updates, and counseling instructions published for Karnataka PGCET aspirants.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search circulars..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Content State */}
      {loading ? (
        <Loader message="Fetching official notifications..." fullScreen />
      ) : error ? (
        <ErrorMessage
          title="Could not load notifications"
          message={error}
          onRetry={fetchNotifications}
        />
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 space-y-3">
          <FilterX className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No notifications found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {searchTerm
              ? `No announcements match the search keyword "${searchTerm}". Try a different keyword.`
              : 'There are currently no active notifications.'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
            >
              Reset Search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 px-1">
            <span>Showing {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}</span>
            <span>Ordered newest first</span>
          </div>

          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className="p-5 sm:p-6 hover:border-indigo-200 transition duration-150"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(notification.published_at)}
                    </span>
                    {notification.pdf_url && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        <FileText className="w-3 h-3" />
                        Official PDF
                      </span>
                    )}
                  </div>

                  <h2 className="text-lg font-bold text-slate-900 font-outfit leading-snug">
                    <Link
                      to={`/notifications/${notification.id}`}
                      className="hover:text-indigo-600 transition"
                    >
                      {notification.title}
                    </Link>
                  </h2>

                  <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                    {notification.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <Link
                    to={`/notifications/${notification.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/60 hover:bg-indigo-100 px-3 py-2 rounded-xl transition"
                  >
                    <span>Read Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {notification.pdf_url && (
                    <a
                      href={getFileUrl(notification.pdf_url)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition"
                    >
                      <FileDown className="w-3.5 h-3.5 text-slate-600" />
                      <span>Download PDF</span>
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
