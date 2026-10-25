import React, { useState } from 'react';
import { resultsApi, getErrorMessage } from '../api';
import { usePageMeta } from '../hooks/usePageMeta';
import {
  Award,
  Search,
  Calendar,
  Hash,
  AlertCircle,
  CheckCircle2,
  Printer,
  ShieldCheck,
  RotateCcw,
  Trophy,
} from 'lucide-react';

export default function ResultsLookup() {
  usePageMeta(
    'PGCET Rank & Score Card Lookup',
    'Check your Karnataka PGCET scores, percentile rank, and subject breakdown using your registration number and date of birth.'
  );

  const [regNumber, setRegNumber] = useState('');
  const [dob, setDob] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFoundMessage, setNotFoundMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!regNumber.trim() || !dob.trim()) {
      setErrorMessage('Please provide both Registration Number and Date of Birth.');
      return;
    }

    setLoading(true);
    setResult(null);
    setNotFoundMessage('');
    setErrorMessage('');

    try {
      const data = await resultsApi.lookupResult({
        regNumber: regNumber.trim(),
        dob: dob.trim(),
      });
      setResult(data);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setNotFoundMessage(
          'No result found for the provided registration number and date of birth. Please ensure both details match your official admit card / hall ticket.'
        );
      } else {
        setErrorMessage(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setNotFoundMessage('');
    setErrorMessage('');
    setRegNumber('');
    setDob('');
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDisplayDob = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-amber-500/25">
          <Award className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-outfit">
          PGCET Candidate Results & Rank Lookup
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          Verify your official Karnataka PGCET state rank, total marks, and category classification. Both Registration Number and Date of Birth are required for verification.
        </p>
      </div>

      {/* Form Card */}
      {!result && (
        <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/40 p-6 sm:p-8">
          {notFoundMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Result Record Not Found</p>
                <p className="text-xs text-amber-800 mt-1">{notFoundMessage}</p>
                <div className="mt-3 text-[11px] text-amber-700 space-y-0.5">
                  <p>• Verify your candidate registration number (case-insensitive).</p>
                  <p>• Ensure your Date of Birth matches your registered application form.</p>
                </div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Registration Number */}
            <div>
              <label
                htmlFor="regNumber"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Candidate Registration Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Hash className="w-4 h-4" />
                </div>
                <input
                  id="regNumber"
                  type="text"
                  required
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. 24MCA001 or REG12345"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono uppercase text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Found on your Karnataka PGCET Admission Ticket / Hall Ticket.
              </p>
            </div>

            {/* Date of Birth */}
            <div>
              <label
                htmlFor="dob"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Date of Birth
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  id="dob"
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Format: YYYY-MM-DD as per official candidate records.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition shadow-md disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                  <span>Verifying Records...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Lookup Candidate Result</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Result Card State */}
      {result && (
        <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl border-2 border-amber-300/80 shadow-2xl shadow-amber-500/10 overflow-hidden print:border-none print:shadow-none">
            {/* Header Ribbon */}
            <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 text-white p-6 text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>Verified Official Candidate Scorecard</span>
              </div>
              <h2 className="text-2xl font-black font-outfit tracking-tight">
                Karnataka PGCET Examination
              </h2>
              <p className="text-xs text-amber-100 font-medium">
                Post Graduate Common Entrance Test Merit Result
              </p>
            </div>

            {/* Scorecard Body */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Highlight Rank Trophy */}
              <div className="text-center p-6 rounded-2xl bg-gradient-to-b from-amber-50/80 to-yellow-50/40 border border-amber-200/80 space-y-2">
                <div className="w-14 h-14 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto shadow-md shadow-amber-500/30">
                  <Trophy className="w-7 h-7" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Karnataka State Merit Rank
                </p>
                <div className="text-4xl sm:text-5xl font-black text-amber-900 font-outfit tracking-tight">
                  #{result.rank}
                </div>
                <p className="text-xs text-slate-500">
                  All-Karnataka Rank in Entrance Merit List
                </p>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Registration Number
                  </p>
                  <p className="text-lg font-mono font-bold text-slate-900">
                    {result.reg_number}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Date of Birth
                  </p>
                  <p className="text-base font-semibold text-slate-900">
                    {formatDisplayDob(result.dob)}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Total Marks Obtained
                  </p>
                  <p className="text-2xl font-bold text-indigo-700 font-outfit">
                    {result.marks}{' '}
                    <span className="text-xs font-normal text-slate-500">/ 100</span>
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Admission Category
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-900">
                      {result.category}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                      Eligible
                    </span>
                  </div>
                </div>
              </div>

              {/* Verified Footer note */}
              <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  This scorecard is generated from verified centralized database records for the Post Graduate Common Entrance Test.
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Lookup Another Result</span>
              </button>

              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Scorecard</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
