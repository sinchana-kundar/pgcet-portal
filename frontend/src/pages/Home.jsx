import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { notificationsApi, getErrorMessage, getFileUrl } from '../api';
import Card, { CardContent, CardHeader, CardTitle } from '../components/Card';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { usePageMeta } from '../hooks/usePageMeta';
import {
  Bell,
  BookOpen,
  Award,
  FileQuestion,
  FileDown,
  ArrowRight,
  Calendar,
  FileText,
  CheckCircle,
  Sparkles,
} from 'lucide-react';

export default function Home() {
  usePageMeta(
    'Karnataka PGCET Preparation & Mock Test Portal',
    'Official preparation portal for Karnataka PGCET aspirants featuring full-length CBT mock tests, curated study materials, syllabus downloads, and live result lookup.'
  );

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLatestNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await notificationsApi.getNotifications();
      setNotifications(data.slice(0, 3));
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
          setNotifications(data.slice(0, 3));
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

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-900 via-indigo-950 to-slate-950 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-500 blur-3xl"></div>
          <div className="absolute top-20 right-10 w-96 h-96 rounded-full bg-violet-500 blur-3xl"></div>
        </div>

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs sm:text-sm font-semibold backdrop-blur-xs">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Karnataka PGCET 2026 Aspirants Portal</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-outfit leading-tight text-white">
            Ace Your Karnataka PGCET <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-violet-300 to-pink-300">
              MCA & MBA Entrance
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Your single destination for real-time exam notifications, subject-wise study notes, syllabus downloads, mock exams, and instant rank results lookup.
          </p>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-4">
            <Link
              to="/study-materials"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-600/40 transition hover:scale-[1.02] cursor-pointer"
            >
              <BookOpen className="w-5 h-5" />
              <span>Browse Study Materials</span>
            </Link>

            <Link
              to="/results"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm sm:text-base border border-white/20 backdrop-blur-md transition hover:scale-[1.02] cursor-pointer"
            >
              <Award className="w-5 h-5 text-amber-300" />
              <span>Check Results & Rank</span>
            </Link>

            <Link
              to="/mock-tests"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-sm sm:text-base border border-slate-700 transition"
            >
              <FileQuestion className="w-5 h-5 text-violet-400" />
              <span>Mock Tests</span>
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto border-t border-indigo-900/60 mt-8">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <p className="text-2xl sm:text-3xl font-extrabold text-white font-outfit">100%</p>
              <p className="text-xs text-slate-400 mt-1">Official Syllabus Covered</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <p className="text-2xl sm:text-3xl font-extrabold text-white font-outfit">Real-Time</p>
              <p className="text-xs text-slate-400 mt-1">KEA Notifications</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <p className="text-2xl sm:text-3xl font-extrabold text-white font-outfit">Free</p>
              <p className="text-xs text-slate-400 mt-1">Downloads & Papers</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <p className="text-2xl sm:text-3xl font-extrabold text-white font-outfit">Instant</p>
              <p className="text-xs text-slate-400 mt-1">Rank & Marks Lookup</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Latest Notifications Section */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600" />
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-outfit">
                  Latest Official Notifications
                </h2>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Stay updated with the latest circulars, counseling schedules, and announcements.
              </p>
            </div>

            <Link
              to="/notifications"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition group self-start sm:self-auto"
            >
              <span>View All Notifications</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <Loader message="Loading latest notifications..." />
          ) : error ? (
            <ErrorMessage
              title="Could not load notifications"
              message={error}
              onRetry={fetchLatestNotifications}
            />
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-white border border-slate-200">
              <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-600 font-medium">No official notifications published yet.</p>
              <p className="text-xs text-slate-400 mt-1">Check back later for exam updates.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {notifications.map((item) => (
                <Card key={item.id} hover className="flex flex-col justify-between">
                  <div>
                    <CardHeader>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                        <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(item.published_at)}
                        </span>
                        {item.pdf_url && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            <FileText className="w-3 h-3" />
                            PDF Available
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-base line-clamp-2 leading-snug">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                        {item.description}
                      </p>
                    </CardContent>
                  </div>

                  <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-50 mt-auto">
                    <Link
                      to={`/notifications/${item.id}`}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition inline-flex items-center gap-1"
                    >
                      <span>Read More</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {item.pdf_url && (
                      <a
                        href={getFileUrl(item.pdf_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 hover:underline"
                      >
                        <FileDown className="w-3.5 h-3.5 text-slate-500" />
                        <span>Download PDF</span>
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Quick Access Feature Cards */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-outfit">
              Everything You Need for PGCET
            </h2>
            <p className="text-sm text-slate-500">
              Comprehensive tools designed specifically for Karnataka entrance exam candidates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 pt-4">
            {/* Feature 1: Study Materials */}
            <Card className="p-6 sm:p-8 flex flex-col justify-between hover:shadow-lg transition">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 font-outfit">
                  Study Materials & Notes
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Subject-wise structured learning resources covering MCA (Computer Awareness, Analytical Ability, Mathematics) and MBA (Quantitative, General Knowledge, English).
                </p>
                <ul className="text-xs text-slate-500 space-y-1.5 pt-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Curated high-yield notes & formula sheets</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Filterable by subject and specific topic</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <Link
                  to="/study-materials"
                  className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition group"
                >
                  <span>Explore Study Materials</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </Card>

            {/* Feature 2: Mock Tests */}
            <Card className="p-6 sm:p-8 flex flex-col justify-between hover:shadow-lg transition">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                  <FileQuestion className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900 font-outfit">
                    Interactive Mock Tests
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Live Simulator
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Practice timed simulated mock tests matching the latest Karnataka PGCET exam pattern with instant evaluation, question palette, and detailed explanations.
                </p>
                <ul className="text-xs text-slate-500 space-y-1.5 pt-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Full-length timed simulated exams</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Topic-wise practice question banks</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <Link
                  to="/mock-tests"
                  className="inline-flex items-center gap-2 text-sm font-bold text-violet-600 hover:text-violet-800 transition group"
                >
                  <span>Start Mock Tests</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </Card>

            {/* Feature 3: Results Lookup */}
            <Card className="p-6 sm:p-8 flex flex-col justify-between hover:shadow-lg transition">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 font-outfit">
                  Results & Rank Lookup
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Enter your official registration number and date of birth to instantly retrieve your verified state merit rank, marks obtained, and category allotment eligibility.
                </p>
                <ul className="text-xs text-slate-500 space-y-1.5 pt-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Secure verification with DOB</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Printable candidate scorecard</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <Link
                  to="/results"
                  className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 hover:text-amber-900 transition group"
                >
                  <span>Lookup Results Now</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </Card>
          </div>
        </section>

        {/* Exam Pattern & Tips Banner */}
        <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 sm:p-10 shadow-lg">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Quick Exam Reference
              </span>
              <h3 className="text-xl sm:text-2xl font-bold font-outfit">
                Karnataka PGCET Examination Highlights
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs text-slate-400">Total Questions</p>
                <p className="text-xl sm:text-2xl font-bold mt-1">100 MCQs</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs text-slate-400">Total Duration</p>
                <p className="text-xl sm:text-2xl font-bold mt-1">120 Mins</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs text-slate-400">Negative Marking</p>
                <p className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">None (0)</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs text-slate-400">Total Marks</p>
                <p className="text-xl sm:text-2xl font-bold mt-1">100 Marks</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10 text-xs sm:text-sm text-slate-300">
              <p>Download previous year question papers and official brochures in the Downloads section.</p>
              <Link
                to="/downloads"
                className="inline-flex items-center gap-1.5 font-bold text-indigo-300 hover:text-white transition"
              >
                <span>Browse Downloads</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
