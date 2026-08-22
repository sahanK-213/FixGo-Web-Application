import { useState, useEffect, useRef } from "react";
import { api, UPLOADS_URL } from "../../src/services/api";
import toast from "react-hot-toast";
import {
  FiFileText, FiUploadCloud, FiClock, FiCheckCircle, FiAlertCircle,
  FiDollarSign, FiX, FiDownload, FiRefreshCw, FiChevronRight
} from "react-icons/fi";

// ── Helpers ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatLKR(amount) {
  return `LKR ${Number(amount).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;
}

function monthLabel(year, month) {
  return `${MONTH_NAMES[Number(month)]} ${year}`;
}

// ── Status Badge ───────────────────────────────────────────────────────────

const STATUS_META = {
  Dispatched:            { bg: "bg-blue-50",   text: "text-blue-600",   icon: FiClock,       label: "Dispatched" },
  "Verification Pending":{ bg: "bg-amber-50",  text: "text-amber-600",  icon: FiClock,       label: "Under Review" },
  Paid:                  { bg: "bg-green-50",  text: "text-green-600",  icon: FiCheckCircle, label: "Paid" },
  Overdue:               { bg: "bg-red-50",    text: "text-red-600",    icon: FiAlertCircle, label: "Overdue" },
  Draft:                 { bg: "bg-gray-100",  text: "text-gray-500",   icon: FiFileText,    label: "Draft" },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META["Draft"];
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full py-1 px-3 text-xs font-semibold ${m.bg} ${m.text}`}>
      <Icon size={12} />
      {m.label}
    </span>
  );
}

// ── Payment Slip Upload Modal ───────────────────────────────────────────────

function PaymentSlipModal({ invoice, bankDetails, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowed.includes(f.type)) {
      toast.error("Only JPEG, PNG, or PDF files are allowed.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5 MB.");
      return;
    }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { toast.error("Please select a payment slip."); return; }
    if (!reference.trim()) { toast.error("Please enter the payment reference."); return; }

    const fd = new FormData();
    fd.append("invoiceId", invoice.id);
    fd.append("paymentReference", reference.trim());
    fd.append("paymentSlip", file);

    setLoading(true);
    try {
      await api.post("shop/submitPaymentSlip.php", fd);
      toast.success("Payment slip submitted! We'll review it shortly.");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[18px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-[16px] font-bold text-gray-900 m-0">Submit Payment Slip</h2>
            <p className="text-xs text-gray-500 mt-0.5">{invoice.invoiceReference} · {monthLabel(invoice.billingPeriodYear, invoice.billingPeriodMonth)}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 border-none cursor-pointer">
            <FiX size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Amount due */}
          <div className="bg-green-50 border border-green-100 rounded-[12px] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <FiDollarSign size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 m-0">Amount Due</p>
              <p className="text-xl font-bold text-gray-900 m-0">{formatLKR(invoice.totalAmount)}</p>
            </div>
          </div>

          {/* Bank details */}
          {bankDetails && (
            <div className="bg-gray-50 rounded-[12px] p-4 text-sm">
              <p className="font-semibold text-gray-700 mb-2">Bank Transfer Details</p>
              <div className="grid grid-cols-2 gap-y-1 text-xs text-gray-600">
                <span className="font-medium text-gray-500">Bank</span>     <span>{bankDetails.bankName}</span>
                <span className="font-medium text-gray-500">Account</span>  <span>{bankDetails.accountName}</span>
                <span className="font-medium text-gray-500">Number</span>   <span className="font-mono">{bankDetails.accountNumber}</span>
                <span className="font-medium text-gray-500">Branch</span>   <span>{bankDetails.branch}</span>
              </div>
            </div>
          )}

          {/* Payment reference */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Payment Reference / Transaction ID</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. TRX-12345678"
              className="w-full border border-gray-200 rounded-[10px] py-2.5 px-3.5 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-50 transition-all font-mono"
            />
          </div>

          {/* File drop zone */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Payment Slip (JPEG, PNG, or PDF · max 5 MB)</label>
            <div
              className={`border-2 border-dashed rounded-[12px] p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                dragOver ? "border-green-400 bg-green-50" : file ? "border-green-400 bg-green-50/50" : "border-gray-200 hover:border-gray-300"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current.click()}
            >
              <FiUploadCloud size={28} className={file ? "text-green-500" : "text-gray-400"} />
              {file ? (
                <div className="text-center">
                  <p className="text-sm font-semibold text-green-600 m-0">{file.name}</p>
                  <p className="text-xs text-gray-400 m-0">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 m-0">Drag &amp; drop or <span className="text-green-600 underline">choose file</span></p>
                  <p className="text-xs text-gray-400 m-0 mt-0.5">JPEG, PNG, PDF up to 5 MB</p>
                </div>
              )}
              <input ref={fileRef} type="file" className="hidden" accept="image/jpeg,image/png,application/pdf" onChange={(e) => handleFile(e.target.files[0])} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-[10px] border border-gray-200 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-[10px] bg-green-600 text-white text-sm font-bold border-none cursor-pointer hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><FiRefreshCw size={14} className="animate-spin" /> Submitting…</>
              ) : (
                <><FiUploadCloud size={14} /> Submit Slip</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Invoice Row ─────────────────────────────────────────────────────────────

function InvoiceRow({ invoice, isLast, onPayNow }) {
  const canPay = invoice.invoiceStatus === "Dispatched" || invoice.invoiceStatus === "Overdue";
  const isPending = invoice.invoiceStatus === "Verification Pending";
  const isPaid = invoice.invoiceStatus === "Paid";

  return (
    <div
      className={`grid gap-4 items-center py-4 px-6 [grid-template-columns:2fr_1fr_1fr_1fr_1fr] ${
        !isLast ? "border-b border-gray-100" : ""
      }`}
    >
      {/* Period + reference */}
      <div>
        <p className="text-[13px] font-bold text-gray-900 m-0">
          {monthLabel(invoice.billingPeriodYear, invoice.billingPeriodMonth)}
        </p>
        <p className="text-[11px] text-gray-400 m-0 font-mono">{invoice.invoiceReference}</p>
      </div>

      {/* Completed requests */}
      <p className="text-[13px] text-gray-700 m-0">{invoice.completedRequests} req.</p>

      {/* Amount */}
      <p className="text-[13px] font-bold text-gray-900 m-0">{formatLKR(invoice.totalAmount)}</p>

      {/* Status */}
      <StatusBadge status={invoice.invoiceStatus} />

      {/* Action */}
      <div>
        {canPay && (
          <button
            onClick={() => onPayNow(invoice)}
            className="rounded-[10px] bg-green-600 text-white border-none py-2 px-4 text-xs font-bold cursor-pointer hover:bg-green-700 transition-colors flex items-center gap-1.5"
          >
            <FiUploadCloud size={12} /> Pay Now
          </button>
        )}
        {isPending && (
          <span className="text-xs text-amber-600 font-semibold flex items-center gap-1.5">
            <FiClock size={12} /> Awaiting Review
          </span>
        )}
        {isPaid && (
          <span className="text-xs text-green-600 font-semibold flex items-center gap-1.5">
            <FiCheckCircle size={12} /> Settled
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main Billing Component ─────────────────────────────────────────────────

function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [bankDetails, setBankDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get("shop/getMyInvoices.php");
      setInvoices(res.data || []);
      setBankDetails(res.bankDetails || null);
    } catch (err) {
      toast.error("Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInvoices(); }, []);

  // Derived KPIs
  const totalPaid    = invoices.filter(i => i.invoiceStatus === "Paid").reduce((s, i) => s + Number(i.totalAmount), 0);
  const totalPending = invoices.filter(i => ["Dispatched", "Verification Pending", "Overdue"].includes(i.invoiceStatus))
                               .reduce((s, i) => s + Number(i.totalAmount), 0);
  const overdueCount = invoices.filter(i => i.invoiceStatus === "Overdue").length;

  return (
    <div className="flex flex-col gap-5">
      {/* Page heading */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 m-0">Billing &amp; Invoices</h1>
          <p className="text-gray-500 mt-1.5 text-sm mb-0">Your platform subscription invoices and payment history.</p>
        </div>
        <button
          onClick={loadInvoices}
          className="flex items-center gap-2 py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
        >
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
        <div className="bg-white rounded-[18px] border border-[#E7EFE8] py-5 px-6 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3">
            <FiCheckCircle className="text-green-600" size={18} />
          </div>
          <p className="text-[13px] text-gray-500 m-0">Total Paid</p>
          <p className="text-[26px] font-bold text-gray-900 my-1">{formatLKR(totalPaid)}</p>
          <p className="text-xs text-green-600 font-semibold m-0">{invoices.filter(i => i.invoiceStatus === "Paid").length} invoice(s)</p>
        </div>

        <div className="bg-white rounded-[18px] border border-[#E7EFE8] py-5 px-6 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mb-3">
            <FiClock className="text-amber-500" size={18} />
          </div>
          <p className="text-[13px] text-gray-500 m-0">Pending Payment</p>
          <p className="text-[26px] font-bold text-gray-900 my-1">{formatLKR(totalPending)}</p>
          <p className="text-xs text-amber-500 font-semibold m-0">{invoices.filter(i => i.invoiceStatus !== "Paid" && i.invoiceStatus !== "Draft").length} invoice(s)</p>
        </div>

        {overdueCount > 0 && (
          <div className="bg-white rounded-[18px] border border-red-100 py-5 px-6 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-3">
              <FiAlertCircle className="text-red-500" size={18} />
            </div>
            <p className="text-[13px] text-gray-500 m-0">Overdue Invoices</p>
            <p className="text-[26px] font-bold text-red-600 my-1">{overdueCount}</p>
            <p className="text-xs text-red-500 font-semibold m-0">Pay immediately to restore access</p>
          </div>
        )}
      </div>

      {/* Invoice table */}
      <div className="bg-white rounded-[18px] border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="flex items-center justify-between py-4 px-6 border-b border-gray-100">
          <h2 className="text-[15px] font-bold text-gray-900 m-0 flex items-center gap-2">
            <FiFileText size={16} className="text-gray-400" /> Invoice History
          </h2>
        </div>

        {/* Table header */}
        <div className="grid gap-4 py-2.5 px-6 bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-[0.05em] [grid-template-columns:2fr_1fr_1fr_1fr_1fr]">
          {["Period", "Requests", "Amount", "Status", "Action"].map(c => <span key={c}>{c}</span>)}
        </div>

        {/* Rows */}
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
            <FiRefreshCw size={28} className="animate-spin" />
            <p className="text-sm">Loading invoices…</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
            <FiFileText size={36} />
            <p className="text-sm font-medium">No invoices yet</p>
            <p className="text-xs text-gray-400">Your billing history will appear here once invoices are issued.</p>
          </div>
        ) : (
          invoices.map((inv, idx) => (
            <InvoiceRow
              key={inv.id}
              invoice={inv}
              isLast={idx === invoices.length - 1}
              onPayNow={(invoice) => { setSelectedInvoice(invoice); setIsModalOpen(true); }}
            />
          ))
        )}
      </div>

      {/* Payment Slip Upload Modal */}
      {isModalOpen && selectedInvoice && (
        <PaymentSlipModal
          invoice={selectedInvoice}
          bankDetails={bankDetails}
          onClose={() => { setIsModalOpen(false); setSelectedInvoice(null); }}
          onSuccess={loadInvoices}
        />
      )}
    </div>
  );
}

export default Billing;
