import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Inbox,
  RefreshCw,
  Loader2,
} from 'lucide-react';

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  error = null,
  onRetry = null,
  emptyTitle = 'No records found',
  emptyMessage = 'There are no items to display right now.',
  emptyAction = null,
  searchable = true,
  searchPlaceholder = 'Search records...',
  searchKeys = [],
  pagination = true,
  pageSize = 10,
  serverPagination = null, // { page, totalPages, totalItems, onPageChange }
  headerActions = null,
  className = '',
}) {
  const [clientSearch, setClientSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'
  const [clientPage, setClientPage] = useState(1);

  // Client-side filtering
  const filteredData = useMemo(() => {
    if (serverPagination) return data;
    if (!clientSearch.trim()) return data;

    const term = clientSearch.toLowerCase();
    const effectiveKeys =
      searchKeys.length > 0 ? searchKeys : columns.map((col) => col.key);

    return data.filter((row) =>
      effectiveKeys.some((k) => {
        const val = row[k];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(term);
      })
    );
  }, [data, clientSearch, searchKeys, columns, serverPagination]);

  // Client-side sorting
  const sortedData = useMemo(() => {
    if (serverPagination || !sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortDirection, serverPagination]);

  // Client-side pagination
  const totalPages = serverPagination
    ? serverPagination.totalPages
    : Math.max(1, Math.ceil(sortedData.length / pageSize));

  const currentPage = serverPagination ? serverPagination.page : clientPage;

  const paginatedData = useMemo(() => {
    if (serverPagination || !pagination) return sortedData;
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, serverPagination, pagination, currentPage, pageSize]);

  const handleSort = (key) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    if (serverPagination) {
      serverPagination.onPageChange(newPage);
    } else {
      setClientPage(newPage);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Table controls toolbar */}
      {(searchable || headerActions) && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {searchable && (
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setClientPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>
          )}
          {headerActions && (
            <div className="flex items-center gap-2 flex-wrap">{headerActions}</div>
          )}
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {columns.map((col) => {
                  const isSortActive = sortKey === col.key;
                  return (
                    <th
                      key={col.key}
                      className={`px-4 py-3.5 whitespace-nowrap ${col.className || ''}`}
                    >
                      {col.sortable !== false ? (
                        <button
                          type="button"
                          onClick={() => handleSort(col.key)}
                          className="inline-flex items-center gap-1.5 hover:text-slate-900 transition font-bold group"
                        >
                          <span>{col.label}</span>
                          {isSortActive ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-30 group-hover:opacity-70 transition" />
                          )}
                        </button>
                      ) : (
                        col.label
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                      <p className="text-sm font-medium text-slate-500">Loading data...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <p className="text-sm font-semibold text-rose-600">{error}</p>
                      {onRetry && (
                        <button
                          type="button"
                          onClick={onRetry}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Retry
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-16 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                        <Inbox className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-slate-800">{emptyTitle}</h4>
                      <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
                        {emptyMessage}
                      </p>
                      {emptyAction}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => (
                  <tr
                    key={row.id || idx}
                    className="hover:bg-slate-50/80 transition duration-150"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3.5 whitespace-nowrap text-slate-800 ${col.className || ''}`}
                      >
                        {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination && !loading && !error && (
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              {serverPagination ? (
                <span>
                  Showing page <strong className="text-slate-800">{currentPage}</strong> of{' '}
                  <strong className="text-slate-800">{totalPages}</strong> (
                  {serverPagination.totalItems} total items)
                </span>
              ) : (
                <span>
                  Showing{' '}
                  <strong className="text-slate-800">
                    {sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                  </strong>{' '}
                  to{' '}
                  <strong className="text-slate-800">
                    {Math.min(currentPage * pageSize, sortedData.length)}
                  </strong>{' '}
                  of <strong className="text-slate-800">{sortedData.length}</strong> items
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2 font-semibold text-slate-700">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
