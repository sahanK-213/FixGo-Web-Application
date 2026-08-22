import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faSpinner, faFileInvoiceDollar } from "@fortawesome/free-solid-svg-icons";
import { api } from "../../../src/services/api";
import toast from "react-hot-toast";
import { PageCard } from "./RevenueShared";
import { MONTH_NAMES, STATUS_STYLES } from "./RevenueConstants";

const PAGE_SIZE = 10;

function InvoiceLedgerTable({ refreshKey }) {
  const [invoices, setInvoices] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [page, setPage] = useState(1);

  // Filters
  const thisYear  = new Date().getFullYear();
  const [filterStatus, setFilterStatus] = useState("");
  const [filterYear,   setFilterYear]   = useState(thisYear.toString());
  const [filterMonth,  setFilterMonth]  = useState((new Date().getMonth() + 1).toString());

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterYear)   params.year   = filterYear;
      if (filterMonth)  params.month  = filterMonth;
      const res = await api.get("admin/getAllInvoices.php", params);
      setInvoices(res.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load ledger.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); setPage(1); }, [filterStatus, filterYear, filterMonth, refreshKey]);

  // CSV export
  const exportCSV = () => {
    if (!invoices.length) return;
    const headers = ["Invoice Ref", "Shop", "Category", "Period", "Requests", "Rate (LKR)", "Amount (LKR)", "Status", "Due Date"];
    const rows = invoices.map(inv => [
      inv.invoiceReference,
      `"${inv.shopName}"`,
      inv.shopCategory,
      `${MONTH_NAMES[Number(inv.billingPeriodMonth)]} ${inv.billingPeriodYear}`,
      inv.completedRequests,
      Number(inv.rateSnapshot).toFixed(2),
      Number(inv.totalAmount).toFixed(2),
      inv.invoiceStatus,
      inv.dueDate || "",
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `fixgo_ledger_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const months = ["", ...Array.from({ length: 12 }, (_, i) => MONTH_NAMES[i + 1])];
  const years  = ["", thisYear - 1, thisYear, thisYear + 1];
  const statuses = ["", "Draft", "Dispatched", "Verification Pending", "Paid", "Overdue", "Ignored"];

  return (
    <PageCard
      title="Invoice Ledger — All Shops"
      action={
        <button
          onClick={exportCSV}
          disabled={!invoices.length}
          className="flex items-center gap-1.5 py-2 px-3.5 rounded-[10px] border-none bg-gray-900 text-sm font-semibold text-white cursor-pointer hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FontAwesomeIcon icon={faDownload} className="text-[11px]" /> Export CSV
        </button>
      }
    >
      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-4 px-6 py-5 border-b border-gray-100 bg-gradient-to-br from-slate-50 to-gray-50/60">
        <div>
          <label className="block text-[10px] font-extrabold text-blue-600 uppercase tracking-widest mb-2">Status</label>
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className={`border-2 rounded-xl py-2.5 px-4 text-sm font-semibold outline-none cursor-pointer shadow-sm transition-colors ${
              filterStatus ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-800"
            }`}
          >
            <option value="">All Statuses</option>
            {statuses.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-extrabold text-blue-600 uppercase tracking-widest mb-2">Year</label>
          <select
            value={filterYear}
            onChange={e => { setFilterYear(e.target.value); setPage(1); }}
            className={`border-2 rounded-xl py-2.5 px-4 text-sm font-semibold outline-none cursor-pointer shadow-sm transition-colors ${
              filterYear ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-800"
            }`}
          >
            <option value="">All Years</option>
            {years.filter(Boolean).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-extrabold text-blue-600 uppercase tracking-widest mb-2">Month</label>
          <select
            value={filterMonth}
            onChange={e => { setFilterMonth(e.target.value); setPage(1); }}
            className={`border-2 rounded-xl py-2.5 px-4 text-sm font-semibold outline-none cursor-pointer shadow-sm transition-colors ${
              filterMonth ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-800"
            }`}
          >
            <option value="">All Months</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{MONTH_NAMES[i + 1]}</option>
            ))}
          </select>
        </div>
        {(filterStatus || filterYear || filterMonth) && (
          <div className="self-end">
            <button
              onClick={() => { setFilterStatus(""); setFilterYear(""); setFilterMonth(""); setPage(1); }}
              className="py-2.5 px-5 rounded-xl border-2 border-red-200 bg-white text-red-500 text-sm font-bold cursor-pointer hover:bg-red-50 hover:border-red-300 active:scale-95 transition-all duration-150 shadow-sm"
            >
              ✕ Clear
            </button>
          </div>
        )}
        <div className="ml-auto self-end">
          <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-[12px] font-bold rounded-full px-3.5 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
            {invoices.length} records
          </span>
        </div>
      </div>

      {/* Table header */}
      <div className="grid gap-3 py-2.5 px-6 bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-[0.05em] [grid-template-columns:2.5fr_1fr_1fr_1fr_1fr_1fr]">
        {["Shop / Reference", "Period", "Category", "Requests", "Amount", "Status"].map(c => <span key={c}>{c}</span>)}
      </div>

      {/* Rows */}
      {loading ? (
        <div className="py-14 flex justify-center text-gray-400">
          <FontAwesomeIcon icon={faSpinner} spin className="text-3xl" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="py-14 flex flex-col items-center gap-2 text-gray-400">
          <FontAwesomeIcon icon={faFileInvoiceDollar} className="text-3xl" />
          <p className="text-sm">No invoices found for the selected filters.</p>
        </div>
      ) : (
        <>
          {invoices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((inv, idx, arr) => {
            const initials = (inv.shopName || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
            const isUrgentStatus = inv.invoiceStatus === "Overdue" || inv.invoiceStatus === "Verification Pending";
            return (
              <div
                key={inv.id}
                className={`grid gap-3 items-center py-3.5 px-6 [grid-template-columns:2.5fr_1fr_1fr_1fr_1fr_1fr] ${
                  idx < arr.length - 1 ? "border-b border-gray-100" : ""
                } hover:bg-gray-50/60 transition-colors`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-[11px] font-bold text-green-600 shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-gray-900 m-0 truncate">{inv.shopName}</p>
                    <p className="text-[11px] text-gray-400 m-0 font-mono">{inv.invoiceReference}</p>
                  </div>
                </div>
                <p className="text-[13px] text-gray-700 m-0">
                  {MONTH_NAMES[Number(inv.billingPeriodMonth)]} {inv.billingPeriodYear}
                </p>
                <p className="text-[12px] text-gray-500 m-0">{inv.shopCategory}</p>
                <p className="text-[13px] text-gray-700 m-0">{inv.completedRequests}</p>
                <p className="text-[13px] font-bold text-gray-900 m-0">
                  LKR {Number(inv.totalAmount).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                </p>
                <span className={`inline-flex items-center gap-1.5 rounded-full py-1 px-2.5 text-xs font-semibold ${STATUS_STYLES[inv.invoiceStatus] || ""}` }>
                  {isUrgentStatus && (
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block"
                      style={{ background: inv.invoiceStatus === "Overdue" ? "#dc2626" : "#d97706" }} />
                  )}
                  {inv.invoiceStatus}
                </span>
              </div>
            );
          })}
          {/* Pagination */}
          {invoices.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/40">
              <span className="text-xs text-gray-400">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, invoices.length)} of {invoices.length} records
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="py-1.5 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 bg-white cursor-pointer hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >Previous</button>
                <span className="text-xs text-gray-500 font-medium">Page {page} of {Math.ceil(invoices.length / PAGE_SIZE)}</span>
                <button
                  disabled={page >= Math.ceil(invoices.length / PAGE_SIZE)}
                  onClick={() => setPage(p => p + 1)}
                  className="py-1.5 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 bg-white cursor-pointer hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </PageCard>
  );
}

export default InvoiceLedgerTable;
