import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { api } from "../../src/services/api";

import {
    faArrowRight, faCalendarDays, faChevronDown,
    faClockRotateLeft, faMapPin, faWrench,
    faXmark, faCar, faClock, faCircleCheck,
    faHandshake, faFlag, faCircleXmark,
} from "@fortawesome/free-solid-svg-icons";

const FONT = "'Segoe UI', system-ui, sans-serif";

const STATUS_CONFIG = {
    Pending:       { label: "Pending",     color: "#D97706", bg: "rgba(217,119,6,0.10)",  icon: faClock       },
    Accepted:      { label: "Accepted",    color: "#2563EB", bg: "#EDF3FF",               icon: faCircleCheck },
    Confirmed:     { label: "Confirmed",   color: "#16A34A", bg: "rgba(22, 163, 74,0.10)", icon: faHandshake   },
    "In Progress": { label: "In Progress", color: "#A855F7", bg: "rgba(168,85,247,0.10)", icon: faWrench      },
    Completed:     { label: "Completed",   color: "#16A34A", bg: "rgba(22,163,74,0.08)",  icon: faFlag        },
    Cancelled:     { label: "Cancelled",   color: "#DC2626", bg: "#FEF2F2",               icon: faCircleXmark },
};

const ACCENT_CYCLE = ["green", "teal", "blue", "violet", "yellow"];
const ACCENT = {
    green:  { iconBg: "#EDF9F0", iconColor: "#16A34A", badgeBg: "#EDF9F0", badgeColor: "#16A34A" },
    teal:   { iconBg: "rgba(22, 163, 74,0.10)", iconColor: "#16A34A", badgeBg: "rgba(22, 163, 74,0.10)", badgeColor: "#16A34A" },
    blue:   { iconBg: "#EDF3FF", iconColor: "#2563EB", badgeBg: "#EDF3FF", badgeColor: "#2563EB" },
    violet: { iconBg: "#F5EDFF", iconColor: "#A855F7", badgeBg: "#F5EDFF", badgeColor: "#A855F7" },
    yellow: { iconBg: "rgba(217,119,6,0.10)", iconColor: "#D97706", badgeBg: "rgba(217,119,6,0.10)", badgeColor: "#D97706" },
};

const FILTERS = ["All Time", "Last 3 Months", "Last 6 Months", "This Year"];

const isWithinFilter = (dateStr, filter) => {
    if (filter === "All Time" || !dateStr) return true;
    const date = new Date(dateStr);
    const now  = new Date();
    if (filter === "This Year") {
        // From 1 Jan of this calendar year
        return date >= new Date(now.getFullYear(), 0, 1);
    }
    const months = filter === "Last 3 Months" ? 3 : 6; // "Last 3 Months" or "Last 6 Months"
    const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
    return date >= cutoff;
};

const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

const formatTime = (d) =>
    d ? new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : "";

const formatRefId = (id, createdAt) => {
    const year = createdAt ? new Date(createdAt).getFullYear() : new Date().getFullYear();
    return `REQ-${year}-${String(id).padStart(5, "0")}`;
};

function DetailRow({ label, value }) {
    return (
        <div className="flex justify-between items-start gap-4 pb-3.5 border-b border-gray-100">
            <p className="text-[13px] text-gray-500 m-0 flex-shrink-0">{label}</p>
            <p className="text-[13px] font-semibold text-gray-900 m-0 text-right">
                {value || "—"}
            </p>
        </div>
    );
}

// ── Details Modal ─────────────────────────────────────────────────────────────
function DetailsModal({ record, onClose }) {
    const cfg = STATUS_CONFIG[record.status] || STATUS_CONFIG["Completed"];

    const handleBackdrop = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    return (
        <div
            onClick={handleBackdrop}
            className="fixed inset-0 z-[1000] bg-black/45 flex items-center justify-center p-5"
            style={{ backdropFilter: "blur(2px)" }}
        >
            <div
                className="bg-white rounded-[20px] w-full max-w-[520px] max-h-[90vh] overflow-y-auto flex flex-col"
                style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.18)", fontFamily: FONT }}
            >
                {/* ── Modal header ── */}
                <div
                    className="py-5 px-6 border-b border-gray-100 flex items-center justify-between rounded-t-[20px]"
                    style={{ background: "linear-gradient(180deg, #EEF7F0, #FFFFFF)" }}
                >
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: cfg.bg }}>
                            <FontAwesomeIcon icon={cfg.icon} className="text-xl" style={{ color: cfg.color }} />
                        </div>
                        <div>
                            <h2 className="text-[17px] font-bold text-gray-900 m-0">
                                {formatRefId(record.id, record.created_at)}
                            </h2>
                            <p className="text-[13px] text-gray-500 mt-0.5 mb-0">
                                {record.vehicle_brand || "Vehicle"}{record.vehicle_color ? ` · ${record.vehicle_color}` : ""}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center cursor-pointer text-gray-500 flex-shrink-0 transition-colors duration-150 hover:bg-gray-100"
                    >
                        <FontAwesomeIcon icon={faXmark} className="text-sm" />
                    </button>
                </div>

                {/* ── Modal body ── */}
                <div className="p-6 flex flex-col gap-5">

                    {/* Status badge */}
                    <div
                        className="flex items-center gap-3 rounded-xl py-3 px-4"
                        style={{ background: cfg.bg, border: `1px solid ${cfg.color}33` }}
                    >
                        <FontAwesomeIcon icon={cfg.icon} className="text-base" style={{ color: cfg.color }} />
                        <span className="text-[13px] font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                    </div>

                    {/* Request info */}
                    <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5">
                        <h3 className="text-[11px] font-bold text-gray-700 mb-4 mt-0 uppercase tracking-[0.05em]">
                            Request Information
                        </h3>
                        <div className="flex flex-col gap-3.5">
                            <DetailRow label="Reference ID"     value={formatRefId(record.id, record.created_at)} />
                            <DetailRow label="Issue / Service"  value={record.issue_category || record.description} />
                            <DetailRow label="Workshop"         value={record.shop_name} />
                            <DetailRow label="Vehicle"          value={`${record.vehicle_brand || "—"} · ${record.vehicle_color || "—"}`} />
                            <DetailRow label="Preferred Date"   value={record.preferred_date ? formatDate(record.preferred_date) : null} />
                        </div>
                    </div>

                    {/* Timestamps */}
                    <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5">
                        <h3 className="text-[11px] font-bold text-gray-700 mb-4 mt-0 uppercase tracking-[0.05em]">
                            Timeline
                        </h3>
                        <div className="flex flex-col gap-3.5">
                            <DetailRow
                                label="Submitted On"
                                value={record.created_at ? `${formatDate(record.created_at)} · ${formatTime(record.created_at)}` : null}
                            />
                            {record.completed_at && (
                                <DetailRow
                                    label="Completed On"
                                    value={`${formatDate(record.completed_at)} · ${formatTime(record.completed_at)}`}
                                />
                            )}
                            {record.cancellation_reason && (
                                <DetailRow label="Cancellation Reason" value={record.cancellation_reason} />
                            )}
                        </div>
                    </div>

                    {/* Description if available */}
                    {record.description && record.issue_category && (
                        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5">
                            <h3 className="text-[11px] font-bold text-gray-700 mb-2.5 mt-0 uppercase tracking-[0.05em]">
                                Description
                            </h3>
                            <p className="text-[13px] text-gray-700 m-0 leading-relaxed">
                                {record.description}
                            </p>
                        </div>
                    )}
                </div>

                {/* ── Modal footer ── */}
                <div className="py-4 px-6 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="py-2.5 px-6 rounded-[10px] bg-green-600 text-white border-none text-[13px] font-semibold cursor-pointer transition-opacity duration-150 hover:opacity-[0.88]"
                        style={{ fontFamily: FONT }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ServiceHistory( ) {
    const [history,       setHistory]       = useState([]);
    const [loading,       setLoading]       = useState(true);
    const [filter,        setFilter]        = useState("All Time");
    const [selectedRecord, setSelectedRecord] = useState(null);  // modal

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await api.get("customer/getCustomerRequest.php");
                if (data.success) {
                    const finished = (data.data || []).filter(r =>
                        ["Completed", "Cancelled"].includes(r.status)
                    );
                    setHistory(finished);
                }
            } catch (err) {
                console.error("ServiceHistory fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);


    const filtered = history.filter(r => isWithinFilter(r.created_at, filter));

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <FontAwesomeIcon icon={faClockRotateLeft} className="text-4xl text-green-600 opacity-30" />
                    <p className="text-[13px] text-gray-500" style={{ fontFamily: FONT }}>Loading service history…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5" style={{ fontFamily: FONT }}>

            {/* ── Details modal ── */}
            {selectedRecord && (
                <DetailsModal
                    record={selectedRecord}
                    onClose={() => setSelectedRecord(null)}
                />
            )}

            {/* ── Page heading ── */}
            <div
                className="rounded-[18px] p-6 border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.04)] flex justify-between items-center flex-wrap gap-4"
                style={{ background: "linear-gradient(180deg, #EEF7F0, #FFFFFF)" }}
            >
                <div>
                    <h1 className="text-[28px] font-bold text-gray-900 m-0">Service History</h1>
                    <p className="text-gray-500 mt-1.5 mb-0 text-sm">
                        View all your vehicle service requests and their details.
                    </p>
                </div>

                {/* Filter dropdown — invisible select covers full pill, custom UI on top */}
                <div className="relative flex items-center gap-2 bg-white border border-gray-200 rounded-xl py-2.5 px-4 text-sm shadow-[0_1px_4px_rgba(0,0,0,0.04)] cursor-pointer">
                    {/* Custom visual display */}
                    <FontAwesomeIcon icon={faCalendarDays} className="text-gray-400 flex-shrink-0 pointer-events-none" />
                    <span className="text-sm text-gray-700 pointer-events-none" style={{ fontFamily: FONT }}>{filter}</span>
                    <FontAwesomeIcon icon={faChevronDown} className="text-[11px] text-gray-400 pointer-events-none flex-shrink-0" />
                    {/* Invisible select stretches over entire wrapper */}
                    <select
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        style={{ fontFamily: FONT }}
                    >
                        {FILTERS.map(f => <option key={f}>{f}</option>)}
                    </select>
                </div>
            </div>

            {/* ── Empty state ── */}
            {filtered.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-[18px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-12 flex flex-col items-center gap-3 text-center">
                    <FontAwesomeIcon icon={faClockRotateLeft} className="text-5xl text-gray-200" />
                    <p className="text-[15px] font-semibold text-gray-900 m-0">No service history yet</p>
                    <p className="text-[13px] text-gray-500 m-0">
                        {filter !== "All Time" ? "Try a different time range." : "Your completed and cancelled repairs will appear here."}
                    </p>
                </div>
            ) : (
                /* ── History list card ── */
                <div className="bg-white border border-gray-200 rounded-[18px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
                    {filtered.map((record, idx) => {
                        const a       = ACCENT[ACCENT_CYCLE[idx % ACCENT_CYCLE.length]];
                        const isLast  = idx === filtered.length - 1;
                        const cfg     = STATUS_CONFIG[record.status] || STATUS_CONFIG["Pending"];

                        return (
                            <div
                                key={record.id}
                                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 sm:py-5 px-4 sm:px-6 ${!isLast ? "border-b border-gray-100" : "border-b-0"}`}
                            >
                                {/* Status Icon */}
                                <div
                                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex-shrink-0 flex items-center justify-center"
                                    style={{ background: cfg.bg }}
                                >
                                    <FontAwesomeIcon icon={cfg.icon} className="text-lg" style={{ color: cfg.color }} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-semibold text-gray-900 m-0">
                                            {record.issue_category || record.description || "Service Request"}
                                        </p>
                                        <span
                                            className="rounded-full py-[3px] px-2.5 text-[11px] font-bold"
                                            style={{ background: cfg.bg, color: cfg.color }}
                                        >
                                            {cfg.label}
                                        </span>
                                    </div>
                                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                        <span className="flex items-center gap-1.5">
                                            <FontAwesomeIcon icon={faCalendarDays} className="text-gray-400 text-[11px]" />
                                            {formatDate(record.created_at)}
                                            {formatTime(record.created_at) && ` · ${formatTime(record.created_at)}`}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <FontAwesomeIcon icon={faMapPin} className="text-gray-400 text-[11px]" />
                                            {record.shop_name || "—"}
                                        </span>
                                    </div>
                                    {record.vehicle_brand && (
                                        <p className="mt-1 text-xs text-gray-400 m-0">
                                            {record.vehicle_brand}{record.vehicle_color ? ` · ${record.vehicle_color}` : ""}
                                        </p>
                                    )}
                                </div>

                                {/* View Details button */}
                                <button
                                    onClick={() => setSelectedRecord(record)}
                                    className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 rounded-[10px] py-2 px-3.5 text-[13px] font-semibold bg-transparent cursor-pointer transition-colors duration-150"
                                    style={{ border: `1px solid ${cfg.color}`, color: cfg.color }}
                                    onMouseEnter={e => e.currentTarget.style.background = cfg.bg}
                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                >
                                    View Details <FontAwesomeIcon icon={faArrowRight} className="text-[11px]" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}