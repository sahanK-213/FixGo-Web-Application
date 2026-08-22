import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation, faSpinner, faCheckCircle, faXmark, faFileInvoiceDollar, faLock, faTrash } from "@fortawesome/free-solid-svg-icons";
import { api } from "../../../src/services/api";
import toast from "react-hot-toast";
import { PageCard } from "./RevenueShared";
import { MONTH_NAMES } from "./RevenueConstants";

function ConfirmModal({ 
  title, 
  icon,
  iconColor,
  iconBg,
  children,
  confirmText,
  confirmColorClass,
  confirmIcon,
  onCancel, 
  onConfirm, 
  loading 
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
            <FontAwesomeIcon icon={icon} className={iconColor} />
          </div>
          <h3 className="text-[17px] font-bold text-gray-900 m-0">{title}</h3>
        </div>
        <div className="text-sm text-gray-600 leading-relaxed mb-6">
          {children}
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="py-2 px-5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold border-none cursor-pointer hover:bg-gray-200">Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className={`py-2 px-5 rounded-xl text-white text-sm font-bold border-none cursor-pointer disabled:opacity-50 flex items-center gap-2 ${confirmColorClass}`}>
            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={confirmIcon} />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function DraftReviewModal({ drafts, onClose, onDispatch, onClear }) {
  const total = drafts.reduce((s, d) => s + Number(d.totalAmount || 0), 0);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col" style={{ maxHeight: "80vh" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-[17px] font-bold text-gray-900 m-0">Review Drafts ({drafts.length})</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center border-none cursor-pointer hover:bg-gray-200">
            <FontAwesomeIcon icon={faXmark} className="text-gray-500" />
          </button>
        </div>
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
          <p className="text-sm text-blue-800 m-0 font-semibold">
            Total: LKR {total.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="overflow-y-auto flex-1">
          <div className="grid gap-4 py-2.5 px-6 bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-[0.05em] [grid-template-columns:2fr_1fr_1fr_1fr]">
            {["Shop", "Category", "Requests", "Amount"].map(c => <span key={c}>{c}</span>)}
          </div>
          {drafts.map((d, idx) => (
            <div key={d.id} className={`grid gap-4 items-center py-3 px-6 [grid-template-columns:2fr_1fr_1fr_1fr] ${idx < drafts.length - 1 ? "border-b border-gray-100" : ""}`}>
              <p className="text-[13px] font-semibold text-gray-900 m-0 truncate">{d.shopName}</p>
              <p className="text-[12px] text-gray-500 m-0">{d.categoryName}</p>
              <p className="text-[13px] text-gray-700 m-0">{d.completedRequests}</p>
              <p className="text-[13px] font-bold text-gray-900 m-0">LKR {Number(d.totalAmount).toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-100">
          <button onClick={onClear} className="py-2 px-5 rounded-xl bg-red-50 text-red-600 text-sm font-semibold border-none cursor-pointer hover:bg-red-100 mr-auto flex items-center gap-2 transition-colors">
            <FontAwesomeIcon icon={faTrash} /> Clear Drafts
          </button>
          <button onClick={onClose} className="py-2 px-5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold border-none cursor-pointer hover:bg-gray-200">Close</button>
          <button onClick={onDispatch} className="py-2 px-5 rounded-xl bg-green-600 text-white text-sm font-bold border-none cursor-pointer hover:bg-green-700 flex items-center gap-2">
            <FontAwesomeIcon icon={faCheckCircle} /> Dispatch All
          </button>
        </div>
      </div>
    </div>
  );
}

function BillingActions({ analytics, onRefresh }) {
  const [year, setYear]   = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState("");
  const [drafts, setDrafts]   = useState([]);
  const [showReview,  setShowReview]  = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const loadDrafts = async () => {
    try {
      const res = await api.get("admin/getDraftInvoices.php", { year, month });
      setDrafts(res.data || []);
    } catch { /* silent */ }
  };

  useEffect(() => { loadDrafts(); }, [year, month]);

  const doGenerate = async () => {
    setLoading("generate");
    try {
      const res = await api.post("admin/generateDraftInvoices.php", { year, month });
      toast.success(`${res.invoicesCreated} draft invoice(s) generated.`);
      loadDrafts();
      if (onRefresh) onRefresh();
    } catch (err) { toast.error(err.message || "Action failed."); }
    finally { setLoading(""); }
  };

  const doDispatch = async () => {
    setLoading("dispatch");
    try {
      const res = await api.post("admin/dispatchInvoices.php", { year, month });
      toast.success(`${res.dispatched} invoice(s) dispatched. ${res.emailsSent} email(s) sent.`);
      setShowConfirm(false); setShowReview(false);
      loadDrafts();
      if (onRefresh) onRefresh();
    } catch (err) { toast.error(err.message || "Action failed."); }
    finally { setLoading(""); }
  };

  const doClearDrafts = async () => {
    setLoading("clear");
    try {
      const res = await api.post("admin/clearDrafts.php", { year, month });
      toast.success(res.message || "Draft invoices cleared.");
      setShowClearConfirm(false);
      setShowReview(false);
      loadDrafts();
      if (onRefresh) onRefresh();
    } catch (err) { toast.error(err.message || "Action failed."); }
    finally { setLoading(""); }
  };

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years  = [new Date().getFullYear() - 1, new Date().getFullYear()];
  const draftList     = drafts.filter(d => d.invoiceStatus === "Draft");
  const hasDrafts     = draftList.length > 0;
  const hasDispatched = drafts.some(d => d.invoiceStatus !== "Draft");

  // Stepper state: 1=done, 2=active|done, 3=locked|active
  const step2Done   = hasDrafts || hasDispatched;
  const step3Active = hasDrafts;

  const StepDot = ({ n, done, active, locked }) => (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
        done   ? "bg-green-100 text-green-600" :
        active ? "bg-blue-600 text-white" :
        locked ? "bg-gray-100 text-gray-400" : "bg-gray-100 text-gray-400"
      }`}>
        {done ? <FontAwesomeIcon icon={faCheckCircle} /> : locked ? <FontAwesomeIcon icon={faLock} className="text-[10px]" /> : n}
      </div>
      <span className={`text-xs font-semibold ${
        done ? "text-green-600" : active ? "text-blue-600" : "text-gray-400"
      }`}>{n === 1 ? "Select Period" : n === 2 ? "Generate Drafts" : "Dispatch"}</span>
    </div>
  );

  return (
    <>
      {showConfirm && (
        <ConfirmModal loading={loading === "dispatch"} onCancel={() => setShowConfirm(false)} onConfirm={doDispatch}
          title="Confirm Dispatch" icon={faTriangleExclamation} iconColor="text-amber-500" iconBg="bg-amber-100"
          confirmText="Confirm Dispatch" confirmColorClass="bg-green-600 hover:bg-green-700" confirmIcon={faCheckCircle}>
          <p className="m-0">
            You are about to dispatch <span className="font-bold text-gray-900">{draftList.length}</span> invoice(s).
            Shop owners will receive email notifications and due dates will be locked in.
            <span className="block mt-1 text-red-500 font-semibold">This cannot be undone.</span>
          </p>
        </ConfirmModal>
      )}
      {showClearConfirm && (
        <ConfirmModal loading={loading === "clear"} onCancel={() => { setShowClearConfirm(false); setShowReview(true); }} onConfirm={doClearDrafts}
          title="Clear Drafts" icon={faTrash} iconColor="text-red-500" iconBg="bg-red-100"
          confirmText="Clear Drafts" confirmColorClass="bg-red-600 hover:bg-red-700" confirmIcon={faTrash}>
          <p className="m-0">
            You are about to securely delete <span className="font-bold text-gray-900">{draftList.length}</span> draft invoice(s). 
            No emails have been sent, and you can freely regenerate these drafts later.
          </p>
        </ConfirmModal>
      )}
      {showReview && (
        <DraftReviewModal drafts={draftList} onClose={() => setShowReview(false)}
          onDispatch={() => { setShowReview(false); setShowConfirm(true); }}
          onClear={() => { setShowReview(false); setShowClearConfirm(true); }} />
      )}
      <PageCard title="Billing Cycle Actions">
        {/* Stepper */}
        <div className="flex items-center gap-2 px-6 pt-4 pb-3 border-b border-gray-100">
          <StepDot n={1} done />
          <div className="flex-1 h-px bg-gray-200" />
          <StepDot n={2} done={hasDispatched} active={!hasDispatched} />
          <div className="flex-1 h-px bg-gray-200" />
          <StepDot n={3} done={hasDispatched} active={step3Active && !hasDispatched} locked={!step3Active && !hasDispatched} />
        </div>
        <div className="px-6 py-5 bg-gradient-to-br from-slate-50 to-blue-50/40 border-b border-gray-100">
          <div className="flex flex-wrap items-end gap-4">
            {/* Period selectors */}
            <div className="flex gap-3">
              <div>
                <label className="block text-[10px] font-extrabold text-blue-600 uppercase tracking-widest mb-2">Year</label>
                <select value={year} onChange={e => setYear(Number(e.target.value))}
                  className="border-2 border-gray-200 focus:border-blue-400 rounded-xl py-2.5 px-4 text-sm font-semibold text-gray-800 outline-none bg-white shadow-sm transition-colors cursor-pointer">
                  {years.map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-blue-600 uppercase tracking-widest mb-2">Month</label>
                <select value={month} onChange={e => setMonth(Number(e.target.value))}
                  className="border-2 border-gray-200 focus:border-blue-400 rounded-xl py-2.5 px-4 text-sm font-semibold text-gray-800 outline-none bg-white shadow-sm transition-colors cursor-pointer">
                  {months.map(m => <option key={m} value={m}>{MONTH_NAMES[m]}</option>)}
                </select>
              </div>
            </div>
            {/* Divider */}
            <div className="w-px h-9 bg-gray-200 self-center hidden sm:block" />
            {/* Generate Drafts */}
            <button disabled={!!loading || hasDispatched} onClick={doGenerate}
              className="py-2.5 px-6 rounded-xl bg-blue-600 text-white text-sm font-bold border-none cursor-pointer hover:bg-blue-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-[0_4px_14px_rgba(37,99,235,0.35)] transition-all duration-150">
              {loading === "generate" ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faFileInvoiceDollar} />}
              Generate Drafts
            </button>
            {/* Review Drafts */}
            {hasDrafts && (
              <button onClick={() => setShowReview(true)}
                className="py-2.5 px-6 rounded-xl bg-white text-blue-700 text-sm font-bold border-2 border-blue-200 cursor-pointer hover:bg-blue-50 hover:border-blue-300 active:scale-95 flex items-center gap-2 shadow-sm transition-all duration-150">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-extrabold">{draftList.length}</span>
                Review Drafts
              </button>
            )}
            {/* Dispatch */}
            <button disabled={!!loading || !hasDrafts} onClick={() => setShowConfirm(true)}
              className="py-2.5 px-6 rounded-xl bg-green-600 text-white text-sm font-bold border-none cursor-pointer hover:bg-green-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-[0_4px_14px_rgba(22,163,74,0.35)] transition-all duration-150">
              <FontAwesomeIcon icon={faCheckCircle} /> Dispatch Invoices
            </button>
          </div>
        </div>
      </PageCard>
    </>
  );
}

export default BillingActions;
