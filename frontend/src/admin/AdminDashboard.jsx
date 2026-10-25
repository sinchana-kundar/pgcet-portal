import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  notificationsApi,
  studyMaterialsApi,
  downloadsApi,
  questionsApi,
  mockTestsApi,
  attemptsApi,
  resultsApi,
  getErrorMessage,
} from '../api';
import {
  Bell,
  BookOpen,
  FileDown,
  HelpCircle,
  ClipboardList,
  Award,
  Users,
  Plus,
  ArrowRight,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [counts, setCounts] = useState({
    notifications: 0,
    materials: 0,
    downloads: 0,
    questions: 0,
    mockTests: 0,
    attempts: 0,
    results: 0,
  });

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        notificationsRes,
        materialsRes,
        downloadsRes,
        questionsRes,
        mockTestsRes,
        attemptsRes,
        resultsRes,
      ] = await Promise.allSettled([
        notificationsApi.getNotifications(),
        studyMaterialsApi.getStudyMaterials(),
        downloadsApi.getDownloads(),
        questionsApi.getQuestions(),
        mockTestsApi.getMockTests(),
        attemptsApi.getAttemptsCount(),
        resultsApi.getAdminResults({ limit: 1 }),
      ]);

      setCounts({
        notifications:
          notificationsRes.status === 'fulfilled' ? notificationsRes.value?.length || 0 : 0,
        materials:
          materialsRes.status === 'fulfilled' ? materialsRes.value?.length || 0 : 0,
        downloads:
          downloadsRes.status === 'fulfilled' ? downloadsRes.value?.length || 0 : 0,
        questions:
          questionsRes.status === 'fulfilled' ? questionsRes.value?.length || 0 : 0,
        mockTests:
          mockTestsRes.status === 'fulfilled' ? mockTestsRes.value?.length || 0 : 0,
        attempts:
          attemptsRes.status === 'fulfilled' ? attemptsRes.value?.total || 0 : 0,
        results:
          resultsRes.status === 'fulfilled' ? resultsRes.value?.total || 0 : 0,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const summaryCards = [
    {
      title: 'Notifications',
      count: counts.notifications,
      icon: Bell,
      color: 'from-blue-600 to-indigo-600',
      bgLight: 'bg-blue-50 text-blue-700 border-blue-200',
      link: '/admin/notifications',
      description: 'Official announcements & alerts',
    },
    {
      title: 'Study Materials',
      count: counts.materials,
      icon: BookOpen,
      color: 'from-emerald-600 to-teal-600',
      bgLight: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      link: '/admin/study-materials',
      description: 'Subject notes and module PDFs',
    },
    {
      title: 'Downloads',
      count: counts.downloads,
      icon: FileDown,
      color: 'from-cyan-600 to-blue-600',
      bgLight: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      link: '/admin/downloads',
      description: 'Brochures, syllabi & previous papers',
    },
    {
      title: 'Question Bank',
      count: counts.questions,
      icon: HelpCircle,
      color: 'from-violet-600 to-purple-600',
      bgLight: 'bg-violet-50 text-violet-700 border-violet-200',
      link: '/admin/questions',
      description: 'Active multiple-choice questions',
    },
    {
      title: 'Mock Tests',
      count: counts.mockTests,
      icon: ClipboardList,
      color: 'from-amber-600 to-orange-600',
      bgLight: 'bg-amber-50 text-amber-700 border-amber-200',
      link: '/admin/mock-tests',
      description: 'Published student mock exams',
    },
    {
      title: 'Student Attempts',
      count: counts.attempts,
      icon: Users,
      color: 'from-pink-600 to-rose-600',
      bgLight: 'bg-pink-50 text-pink-700 border-pink-200',
      link: '/admin/mock-tests',
      description: 'Total mock test submissions',
    },
    {
      title: 'Exam Results',
      count: counts.results,
      icon: Award,
      color: 'from-indigo-600 to-violet-600',
      bgLight: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      link: '/admin/results',
      description: 'Candidate rank & score records',
    },
  ];

  const quickActions = [
    {
      label: 'Post Notification',
      desc: 'Publish a new circular or notice with optional PDF',
      link: '/admin/notifications?action=new',
      icon: Bell,
      color: 'bg-indigo-600 hover:bg-indigo-700',
    },
    {
      label: 'Add Question',
      desc: 'Add a question with 4 options to the bank',
      link: '/admin/questions?action=new',
      icon: HelpCircle,
      color: 'bg-violet-600 hover:bg-violet-700',
    },
    {
      label: 'Build Mock Test',
      desc: 'Select questions and assemble a timed test',
      link: '/admin/mock-tests',
      icon: ClipboardList,
      color: 'bg-amber-600 hover:bg-amber-700',
    },
    {
      label: 'Upload Study Material',
      desc: 'Upload subject notes, syllabus, or guides',
      link: '/admin/study-materials?action=new',
      icon: BookOpen,
      color: 'bg-emerald-600 hover:bg-emerald-700',
    },
    {
      label: 'Import Results CSV',
      desc: 'Bulk import state merit ranks and marks',
      link: '/admin/results',
      icon: Award,
      color: 'bg-rose-600 hover:bg-rose-700',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-indigo-100 text-indigo-800 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Admin Overview
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-outfit">
            Portal Control Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time management for notifications, questions, tests, downloads, and examination results.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchStats}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 shadow-xs transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.link}
              className="group bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {card.title}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${card.bgLight}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {loading ? (
                      <span className="inline-block w-8 h-7 bg-slate-200 rounded animate-pulse" />
                    ) : (
                      card.count
                    )}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{card.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
                <span>Manage</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions Shortcuts */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-1">
          Quick Workflows
        </h2>
        <p className="text-xs text-slate-500 mb-5">
          Common operational tasks you can initiate with a single click.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                to={action.link}
                className="flex items-start gap-3.5 p-4 rounded-xl border border-slate-200/70 hover:border-indigo-200 hover:bg-slate-50/70 transition group"
              >
                <div
                  className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs ${action.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition flex items-center gap-1">
                    {action.label}
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {action.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
