import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass, faCircleCheck, faTriangleExclamation,
  faFileInvoiceDollar, faUserCheck, faSpinner,
  faHourglass, faStore, faPhone, faEnvelope, faClock, faMapPin, faTag, faCar, faRotate, faXmark, faEye
} from "@fortawesome/free-solid-svg-icons";
import { FiUploadCloud, FiCheck, FiX, FiRefreshCw, FiEye, FiClock, FiAlertCircle } from "react-icons/fi";
import { api, UPLOADS_URL } from "../../src/services/api";
import toast from "react-hot-toast";

// ── Shared UI primitives ─────────────────────────────────────────────────────

function PageCard({ children }) {
  return (
    <div className="bg-white rounded-[18px] border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
      {children}
    </div>
  );
}

function PageHeading({ title, sub }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 m-0">{title}</h1>
      {sub && <p className="text-gray-500 mt-1.5 text-sm mb-0">{sub}</p>}
    </div>
  );
}

function TableHeader({ cols, gridCols }) {
  return (
    <div className={`grid gap-4 py-2.5 px-6 bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-[0.05em] ${gridCols}`}>
      {cols.map((c) => <span key={c}>{c}</span>)}
    </div>
  );
}

function Pill({ className, children }) {
  return <span className={`rounded-full py-1 px-3 text-xs font-semibold ${className}`}>{children}</span>;
}

function EmptyState({ icon, message }) {
  return (
    <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
      {icon}
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ── Detail row inside the review modal ───────────────────────────────────────
function DetailRow({ icon, label, value }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={icon} className="text-gray-500 text-xs" />
            </div>
            <div>
                <p className="text-[11px] text-gray-400 m-0 font-semibold uppercase tracking-wide">{label}</p>
                <p className="text-sm text-gray-800 m-0 font-medium">{value || "—"}</p>
            </div>
        </div>
    );
}

// ── Modal to review a shop's full details before approving ───────────────────
function ReviewModal({ shop, onClose, onApprove, approving, onPreviewDoc }) {
    if (!shop) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        {shop.profileImageURL ? (
                            <img
                                src={`${UPLOADS_URL}/${shop.profileImageURL}`}
                                alt={shop.shopName}
                                className="w-12 h-12 rounded-xl object-cover border border-gray-200"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-400">
                                {(shop.shopName || "?")[0].toUpperCase()}
                            </div>
                        )}
                        <div>
                            <p className="font-bold text-gray-900 m-0">{shop.shopName}</p>
                            <p className="text-xs text-gray-400 m-0">ID #{shop.id}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 border-none cursor-pointer flex items-center justify-center transition-colors"
                    >
                        <FontAwesomeIcon icon={faXmark} className="text-gray-500" />
                    </button>
                </div>

                {/* Details grid */}
                <div className="px-6 py-5 grid grid-cols-1 gap-4">
                    <DetailRow icon={faStore}    label="Owner"           value={shop.ownerName} />
                    <DetailRow icon={faEnvelope} label="Email"           value={shop.email} />
                    <DetailRow icon={faPhone}    label="Contact"         value={shop.contactNumber} />
                    <DetailRow icon={faMapPin}   label="Address"         value={shop.address} />
                    <DetailRow icon={faTag}      label="Category"        value={shop.category} />
                    <DetailRow icon={faCar}      label="Vehicle Types"   value={shop.vehicleCategories} />
                    <DetailRow icon={faClock}    label="Operating Hours" value={`${shop.openTime} – ${shop.closeTime}`} />
                    {shop.BRN && <DetailRow icon={faTag} label="Business Reg. No." value={shop.BRN} />}

                    {/* Verification Document Section */}
                    <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] text-emerald-800 font-bold uppercase tracking-wide m-0">Business Verification Document</p>
                            <p className="text-xs text-gray-600 m-0 mt-0.5">
                                {shop.verification_document ? "Document provided for verification" : "No document uploaded (Standard Registration)"}
                            </p>
                        </div>
                        {shop.verification_document && (
                            <button
                                type="button"
                                onClick={() => onPreviewDoc && onPreviewDoc(shop.verification_document)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer border-none"
                            >
                                <FontAwesomeIcon icon={faEye} /> View Document
                            </button>
                        )}
                    </div>

                    {shop.description && (
                        <div>
                            <p className="text-[11px] text-gray-400 m-0 mb-1 font-semibold uppercase tracking-wide">Description</p>
                            <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 m-0 leading-relaxed">{shop.description}</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="py-2.5 px-5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors font-sans"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onApprove(shop.id)}
                        disabled={approving}
                        className="py-2.5 px-6 rounded-xl bg-green-600 text-white text-sm font-bold cursor-pointer hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-sans flex items-center gap-2"
                    >
                        {approving && <FontAwesomeIcon icon={faRotate} className="animate-spin" />}
                        {approving ? "Approving…" : "Approve Shop"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Tab 1: Shop Registration Verification ─────────────────────────────────

function VerificationRow({ shop, isLast, onReview, onApprove, approving }) {
    return (
        <div className={`grid gap-4 items-center py-3.5 px-6 [grid-template-columns:2fr_1.5fr_1.2fr_1fr] ${!isLast ? "border-b border-gray-100" : ""}`}>
            {/* Shop name / ID */}
            <div className="flex items-center gap-3">
                {shop.profileImageURL ? (
                    <img
                        src={`${UPLOADS_URL}/${shop.profileImageURL}`}
                        alt={shop.shopName}
                        className="w-[38px] h-[38px] rounded-[10px] object-cover border border-gray-100 shrink-0"
                    />
                ) : (
                    <div className="w-[38px] h-[38px] rounded-[10px] bg-gray-100 flex items-center justify-center text-[13px] font-bold text-gray-500 shrink-0">
                        {(shop.shopName || "?")[0].toUpperCase()}
                    </div>
                )}
                <div>
                    <p className="text-[13px] font-bold text-gray-900 m-0">{shop.shopName}</p>
                    <p className="text-[11px] text-gray-400 m-0">{shop.ownerName} · #{shop.id}</p>
                </div>
            </div>

            {/* Category */}
            <div>
                <p className="text-xs text-gray-600 m-0">{shop.category || "—"}</p>
                {shop.verification_document && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md mt-1">
                        <FontAwesomeIcon icon={faCircleCheck} className="text-[9px]" /> Doc Uploaded
                    </span>
                )}
            </div>

            {/* Email-verified status */}
            <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                <FontAwesomeIcon icon={faCircleCheck} /> Email Verified
            </span>

            {/* Action buttons */}
            <div className="flex gap-2">
                <button
                    onClick={() => onReview(shop)}
                    className="rounded-[10px] bg-white text-gray-700 border border-gray-200 py-2 px-3 text-xs font-bold cursor-pointer font-sans hover:bg-gray-50 transition-colors"
                >
                    Review
                </button>
                <button
                    onClick={() => onApprove(shop.id)}
                    disabled={approving === shop.id}
                    className="rounded-[10px] bg-green-600 text-white border-none py-2 px-3 text-xs font-bold cursor-pointer font-sans hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                    {approving === shop.id && <FontAwesomeIcon icon={faRotate} className="animate-spin text-[10px]" />}
                    Approve
                </button>
            </div>
        </div>
    );
}

// ── Tab 2: Payment Slip Verification ──────────────────────────────────────

const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatLKR(n) {
  return `LKR ${Number(n).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;
}

// Reject Reason Modal
function RejectModal({ invoice, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!reason.trim()) { toast.error("Rejection reason is required."); return; }
    setLoading(true);
    await onConfirm(invoice.id, "reject", reason);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-[18px] shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-[16px] font-bold text-gray-900 mb-1">Reject Payment Slip</h2>
        <p className="text-xs text-gray-500 mb-4">{invoice.invoiceReference} · {invoice.shopName}</p>
        <textarea
          className="w-full border border-gray-200 rounded-[10px] p-3 text-sm outline-none focus:border-red-400 resize-none"
          rows={3}
          placeholder="State the reason for rejection (required)…"
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-[10px] text-sm font-semibold cursor-pointer bg-white hover:bg-gray-50">Cancel</button>
          <button
            onClick={handle}
            disabled={loading}
            className="flex-1 py-2.5 rounded-[10px] bg-red-600 text-white text-sm font-bold border-none cursor-pointer hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? "Rejecting…" : "Confirm Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Slip Preview Modal
function SlipPreviewModal({ url, onClose }) {
  const isImage = /\.(jpe?g|png)$/i.test(url);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-white rounded-[18px] shadow-xl max-w-2xl w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="font-bold text-gray-900 text-sm">Payment Slip Preview</span>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center border-none cursor-pointer hover:bg-gray-200">
            <FiX size={16} />
          </button>
        </div>
        <div className="p-4 max-h-[70vh] overflow-auto flex items-center justify-center bg-gray-50">
          {isImage
            ? <img src={`${UPLOADS_URL}/${url}`} alt="Payment Slip" className="max-w-full rounded-lg" />
            : <iframe src={`${UPLOADS_URL}/${url}`} className="w-full h-[60vh] border-0 rounded-lg" title="Payment Slip PDF" />
          }
        </div>
      </div>
    </div>
  );
}

    // Document Preview Modal (for verification documents)
    function DocumentPreviewModal({ url, onClose }) {
      const isImage = /\\.(jpe?g|png)$/i.test(url);
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
          <div className="bg-white rounded-[18px] shadow-xl max-w-2xl w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="font-bold text-gray-900 text-sm">Verification Document Preview</span>
              <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center border-none cursor-pointer hover:bg-gray-200">
                <FiX size={16} />
              </button>
            </div>
            <div className="p-4 max-h-[70vh] overflow-auto flex items-center justify-center bg-gray-50">
              {isImage
                ? <img src={`${UPLOADS_URL}/${url}`} alt="Verification Document" className="max-w-full rounded-lg" />
                : <iframe src={`${UPLOADS_URL}/${url}`} className="w-full h-[60vh] border-0 rounded-lg" title="Verification Document PDF" />
              }
            </div>
          </div>
        </div>
      );
    }

function PayRow({ inv, isLast, onVerify }) {
  const statusMeta = {
    "Verification Pending": { bg: "bg-amber-50", text: "text-amber-600", icon: <FiClock size={11} /> },
    Overdue:               { bg: "bg-red-50",    text: "text-red-600",   icon: <FiAlertCircle size={11} /> },
  };
  const m = statusMeta[inv.invoiceStatus] || statusMeta["Verification Pending"];
  const initials = (inv.shopName || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className={`grid gap-4 items-center py-4 px-6 [grid-template-columns:2fr_1fr_1fr_1fr_1.5fr] ${!isLast ? "border-b border-gray-100" : ""}`}>
      <div className="flex items-center gap-3">
        <div className="w-[38px] h-[38px] rounded-[10px] bg-green-50 flex items-center justify-center text-[12px] font-bold text-green-600 shrink-0">{initials}</div>
        <div>
          <p className="text-[13px] font-bold text-gray-900 m-0">{inv.shopName}</p>
          <p className="text-[11px] text-gray-400 m-0 font-mono">{inv.invoiceReference}</p>
        </div>
      </div>
      <p className="text-[13px] text-gray-700 m-0">{MONTH_NAMES[Number(inv.billingPeriodMonth)]} {inv.billingPeriodYear}</p>
      <p className="text-[13px] font-bold text-gray-900 m-0">{formatLKR(inv.totalAmount)}</p>
      <span className={`inline-flex items-center gap-1.5 rounded-full py-1 px-2.5 text-xs font-semibold ${m.bg} ${m.text}`}>
        {m.icon} {inv.invoiceStatus}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onVerify("preview", inv)}
          className="rounded-[8px] bg-gray-100 text-gray-600 border-none py-1.5 px-3 text-xs font-semibold cursor-pointer hover:bg-gray-200 flex items-center gap-1"
        >
          <FiEye size={12} /> Slip
        </button>
        <button
          onClick={() => onVerify("approve", inv)}
          className="rounded-[8px] bg-green-600 text-white border-none py-1.5 px-3 text-xs font-bold cursor-pointer hover:bg-green-700 flex items-center gap-1"
        >
          <FiCheck size={12} /> Approve
        </button>
        <button
          onClick={() => onVerify("reject", inv)}
          className="rounded-[8px] bg-white text-red-600 border border-red-200 py-1.5 px-3 text-xs font-bold cursor-pointer hover:bg-red-50 flex items-center gap-1"
        >
          <FiX size={12} /> Reject
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

function VerificationQueue() {
  const [activeTab, setActiveTab] = useState("registration");
  const [search, setSearch] = useState("");

  // Registration tab state
  const [regQueue, setRegQueue] = useState([]);
  const [regLoading, setRegLoading] = useState(false);
  const [reviewShop, setReviewShop] = useState(null);
  const [approving, setApproving] = useState(null);

  // Payment tab state
  const [payQueue, setPayQueue] = useState([]);
  const [payLoading, setPayLoading] = useState(false);

  // Modals
  const [rejectTarget, setRejectTarget] = useState(null);
  const [previewSlip, setPreviewSlip]   = useState(null);
  const [previewDoc, setPreviewDoc]   = useState(null);

  // ── Loaders ──────────────────────────────────────────────────────────────

  const loadRegistrations = async () => {
    setRegLoading(true);
    try {
      const res = await api.get("admin/getPendingShops.php");
      setRegQueue(res.data || []);
    } catch (err) {
      // Endpoint may not exist yet — silently show empty state
      setRegQueue([]);
    } finally {
      setRegLoading(false);
    }
  };

  const loadPayments = async () => {
    setPayLoading(true);
    try {
      const res = await api.get("admin/getPendingVerifications.php");
      setPayQueue(res.data || []);
    } catch {
      toast.error("Failed to load payment verification queue.");
    } finally {
      setPayLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
    loadPayments();
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleApproveShop = async (shopId) => {
    setApproving(shopId);
    try {
      await api.post("admin/approveShop.php", { shopId });
      toast.success("Shop approved and activated.");
      setRegQueue((prev) => prev.filter((s) => s.id !== shopId));
      if (reviewShop?.id === shopId) setReviewShop(null);
    } catch (err) {
      toast.error(err.message || "Approval failed.");
    } finally {
      setApproving(null);
    }
  };

  const handleVerifyPayment = async (invoiceId, action, reason = null) => {
    try {
      await api.post("admin/processVerification.php", { invoiceId, action, reason });
      toast.success(`Invoice ${action === "approve" ? "approved" : "rejected"} successfully.`);
      loadPayments();
    } catch (err) {
      toast.error(err.message || "Action failed.");
    }
  };

  // Filtered lists
  const filteredReg = regQueue.filter(s =>
    (s.shopName || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.email || "").toLowerCase().includes(search.toLowerCase())
  );
  const filteredPay = payQueue.filter(s =>
    (s.shopName || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.invoiceReference || "").toLowerCase().includes(search.toLowerCase())
  );

  const tabs = [
    { id: "registration", label: "Shop Registration", icon: <FontAwesomeIcon icon={faUserCheck} />, count: regQueue.length },
    { id: "payment",      label: "Payment Slips",     icon: <FontAwesomeIcon icon={faFileInvoiceDollar} />, count: payQueue.length },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        title="Verification Queue"
        sub="Review shop credentials and payment slips before activation."
      />

      {/* Tabs + search */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearch(""); }}
              className={`flex items-center gap-2 py-2 px-4 rounded-[10px] text-sm font-semibold border-none cursor-pointer transition-all ${
                activeTab === tab.id
                  ? "bg-white text-gray-900 shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
                  : "bg-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <span className="bg-[#FF6B1A] text-white rounded-full text-[10px] font-bold py-0.5 px-2 min-w-[18px] text-center">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl py-2.5 px-4 text-sm shadow-[0_1px_4px_rgba(0,0,0,0.04)] w-full max-w-[280px]">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-gray-400" />
            <input
              className="flex-1 border-none outline-none text-sm text-gray-700 bg-transparent font-sans"
              placeholder={activeTab === "registration" ? "Search by shop or email…" : "Search by shop or ref…"}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={activeTab === "registration" ? loadRegistrations : loadPayments}
            className="flex items-center gap-2 py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-50 shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
          >
            <FiRefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Registration Tab ──────────────────────────────────── */}
      {activeTab === "registration" && (
        <>
          <PageCard>
            <TableHeader
              cols={["Shop / Owner", "Category", "Status", "Actions"]}
              gridCols="[grid-template-columns:2fr_1.5fr_1.2fr_1fr]"
            />
            {regLoading ? (
              <EmptyState icon={<FontAwesomeIcon icon={faRotate} spin className="text-3xl text-green-500" />} message="Loading pending shops…" />
            ) : filteredReg.length === 0 ? (
              <EmptyState icon={<FontAwesomeIcon icon={faHourglass} className="text-3xl text-gray-300" />} message={regQueue.length === 0 ? "No shops are pending approval right now." : "No results match your search."} />
            ) : (
              filteredReg.map((shop, idx) => (
                <VerificationRow
                  key={shop.id}
                  shop={shop}
                  isLast={idx === filteredReg.length - 1}
                  onApprove={handleApproveShop}
                  onReview={setReviewShop}
                  approving={approving}
                />
              ))
            )}
          </PageCard>

            <ReviewModal
              shop={reviewShop}
              onClose={() => setReviewShop(null)}
              onApprove={handleApproveShop}
              approving={approving === reviewShop?.id}
              onPreviewDoc={(docUrl) => setPreviewDoc(docUrl)}
            />
        </>
      )}

      {/* ── Payment Slip Tab ──────────────────────────────────── */}
      {activeTab === "payment" && (
        <>
          {payQueue.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-[12px] px-5 py-3 flex items-center gap-3 text-sm text-amber-800">
              <FontAwesomeIcon icon={faFileInvoiceDollar} />
              <span>
                <strong>{payQueue.length}</strong> payment slip{payQueue.length !== 1 ? "s" : ""} awaiting verification.
                Approving restores shop access; rejecting keeps the shop suspended.
              </span>
            </div>
          )}

          <PageCard>
            <TableHeader
              cols={["Shop / Reference", "Period", "Amount", "Status", "Actions"]}
              gridCols="[grid-template-columns:2fr_1fr_1fr_1fr_1.5fr]"
            />
            {payLoading ? (
              <EmptyState icon={<FontAwesomeIcon icon={faSpinner} spin className="text-3xl" />} message="Loading…" />
            ) : filteredPay.length === 0 ? (
              <EmptyState icon={<FiCheck size={36} className="text-green-400" />} message="No payment slips awaiting review." />
            ) : (
              filteredPay.map((inv, idx) => (
                <PayRow
                  key={inv.id}
                  inv={inv}
                  isLast={idx === filteredPay.length - 1}
                  onVerify={(action, invoice) => {
                    if (action === "preview") setPreviewSlip(invoice.paymentSlipUrl);
                    else if (action === "approve") handleVerifyPayment(invoice.id, "approve");
                    else if (action === "reject") setRejectTarget(invoice);
                  }}
                />
              ))
            )}
          </PageCard>
        </>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <RejectModal
          invoice={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={async (id, action, reason) => {
            await handleVerifyPayment(id, action, reason);
            setRejectTarget(null);
          }}
        />
      )}

      {/* Slip Preview Modal */}
      {previewSlip && (
        <SlipPreviewModal url={previewSlip} onClose={() => setPreviewSlip(null)} />
      )}
      {previewDoc && (
        <DocumentPreviewModal url={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  );
}

export default VerificationQueue;
