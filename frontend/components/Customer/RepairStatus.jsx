import { useState, useEffect, Fragment } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faHandshake, faWrench, faFlag, faShieldHalved,
    faCar, faChevronDown, faChevronUp, faCalendarDays,
    faClock, faCircleCheck, faCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import { api } from "../../src/services/api";


const FONT = "'Segoe UI', system-ui, sans-serif";

const STATUS_CONFIG = {
    Pending:       { label: "Pending",     color: "#D97706",  bg: "rgba(217,119,6,0.10)",  icon: faClock,        desc: "Your request has been sent. Waiting for the shop to accept." },
    Accepted:      { label: "Accepted",    color: "#2563EB",  bg: "#EDF3FF",               icon: faCircleCheck,  desc: "The shop accepted your request! Go to Notifications to confirm your booking." },
    Confirmed:     { label: "Confirmed",   color: "#16A34A",  bg: "rgba(22, 163, 74,0.10)", icon: faHandshake,    desc: "" },
    "In Progress": { label: "In Progress", color: "#A855F7",  bg: "rgba(168,85,247,0.10)", icon: faWrench,       desc: "Your vehicle is currently being repaired." },
};

const STEPS = [
    { key: "Confirmed",   icon: faHandshake, label: "Confirmed",   desc: "Booking confirmed! The shop will begin work soon."  },
    { key: "In Progress", icon: faWrench,    label: "In Progress", desc: "Your vehicle is currently being repaired."          },
    { key: "Completed",   icon: faFlag,      label: "Completed",   desc: "Your repair is complete and your vehicle is ready!" },
];

const getStepIndex = (status) => {
    const idx = STEPS.findIndex(s => s.key === status);
    return idx === -1 ? 0 : idx;
};

const STEPPER_STATUSES = ["Confirmed", "In Progress"];
const ONGOING_STATUSES = ["Pending", "Accepted", "Confirmed", "In Progress"];

const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;

const formatTime = (d) =>
    d ? new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : null;

const formatRefId = (id, createdAt) => {
    const year = createdAt ? new Date(createdAt).getFullYear() : new Date().getFullYear();
    return `REQ-${year}-${String(id).padStart(5, "0")}`;
};

function InfoRow({ label, value }) {
    return (
        <div className="flex justify-between items-center pb-3.5 border-b border-gray-100">
            <p className="text-[13px] text-gray-500 m-0">{label}</p>
            <p className="text-[13px] font-semibold text-gray-900 m-0">{value || "—"}</p>
        </div>
    );
}

export default function RepairStatus({targetRequestId }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [expanded, setExpanded] = useState(null);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const data = await api.get("customer/getCustomerRequest.php");
                if (data.success) {
                    const ongoing = (data.data || []).filter(r =>
                        ONGOING_STATUSES.includes(r.status)
                    );
                    setRequests(ongoing);

                    if (targetRequestId) {
                        const rawId = parseInt(targetRequestId.split("-")[2]);
                        const match = ongoing.find(r => r.id === rawId);
                        setExpanded(match ? match.id : ongoing[0]?.id);
                    } else {
                        if (ongoing.length > 0 && !expanded) setExpanded(ongoing[0].id);
                    }
                }
            } catch (err) {
                console.error("RepairStatus fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
        const interval = setInterval(fetchRequests, 30000);
        return () => clearInterval(interval);
    }, [targetRequestId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <FontAwesomeIcon icon={faWrench} className="text-4xl text-green-600 opacity-30" />
                    <p className="text-[13px] text-gray-500" style={{ fontFamily: FONT }}>Loading repair status…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5" style={{ fontFamily: FONT }}>

            <div
                className="rounded-[18px] p-6 border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.04)] flex justify-between items-center"
                style={{ background: "linear-gradient(180deg, #EEF7F0, #FFFFFF)" }}
            >
                <div>
                    <h1 className="text-[28px] font-bold text-gray-900 m-0">Repair Status</h1>
                    <p className="text-gray-500 mt-1.5 mb-0 text-sm">
                        Track the progress of your active service requests.
                    </p>
                </div>
                <div className="text-sm font-semibold text-gray-700 bg-white py-2.5 px-4 rounded-xl border border-gray-200 flex items-center gap-2">
                    {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    <FontAwesomeIcon icon={faCalendarDays} className="text-gray-400" />
                </div>
            </div>

            {requests.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-[18px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-12 flex flex-col items-center gap-3 text-center">
                    <FontAwesomeIcon icon={faCar} className="text-5xl text-gray-200" />
                    <p className="text-[15px] font-semibold text-gray-900 m-0">No active repairs</p>
                    <p className="text-[13px] text-gray-500 m-0">
                        You have no ongoing repairs right now. Completed repairs can be found in Service History.
                    </p>
                </div>
            ) : (
                requests.map((req) => {
                    const cfg         = STATUS_CONFIG[req.status] || STATUS_CONFIG["Pending"];
                    const isOpen      = expanded === req.id;
                    const showStepper = STEPPER_STATUSES.includes(req.status);
                    const currentIdx  = getStepIndex(req.status);
                    const hasTow      = req.requires_tow == 1;

                    return (
                        <div key={req.id} className="bg-white border border-gray-200 rounded-[18px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">

                            <div className="py-5 px-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center"
                                        style={{ background: cfg.bg }}
                                    >
                                        <FontAwesomeIcon icon={cfg.icon} className="text-[22px]" style={{ color: cfg.color }} />
                                    </div>
                                    <div>
                                        <p className="text-[15px] font-bold text-gray-900 m-0">
                                            {req.vehicle_brand || "Your Vehicle"}
                                            {req.vehicle_color ? ` · ${req.vehicle_color}` : ""}
                                        </p>
                                        <p className="text-[13px] text-gray-500 mt-1 mb-0">
                                            Shop: <span className="font-semibold text-gray-700">{req.shop_name || "—"}</span>
                                        </p>
                                        <p className="text-[13px] text-gray-500 mt-0.5 mb-0">
                                            <span className="font-semibold text-gray-700">{formatRefId(req.id, req.created_at)}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2.5">
                                    <span
                                        className="rounded-full py-1 px-3.5 text-xs font-bold"
                                        style={{ background: cfg.bg, color: cfg.color }}
                                    >
                                        {cfg.label}
                                    </span>
                                    <button
                                        onClick={() => setExpanded(isOpen ? null : req.id)}
                                        className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center cursor-pointer text-gray-400 transition-colors duration-150 hover:bg-[rgba(22,163,74,0.08)]"
                                    >
                                        <FontAwesomeIcon icon={isOpen ? faChevronUp : faChevronDown} className="text-xs" />
                                    </button>
                                </div>
                            </div>

                            {isOpen && (
                                <div className="p-6 flex flex-col gap-5">

                                    {/* ── TOW TRUCK BANNER (Confirmed + requires_tow) ── */}
                                    {hasTow && req.status === "Confirmed" && (
                                        <div
                                            className="flex items-center gap-3.5 border rounded-2xl py-4 px-5"
                                            style={{
                                                background: "linear-gradient(135deg, rgba(22, 163, 74,0.08) 0%, rgba(22,163,74,0.06) 100%)",
                                                borderColor: "rgba(22, 163, 74,0.30)",
                                            }}
                                        >
                                            <div
                                                className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center"
                                                style={{ background: "rgba(22, 163, 74,0.12)" }}
                                            >
                                                <span className="text-[22px]">🚛</span>
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-bold m-0" style={{ color: "#16A34A" }}>
                                                    Your tow truck is on the way!
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5 mb-0">
                                                    Sit tight — the driver will arrive at your location shortly to pick up your vehicle.
                                                </p>
                                            </div>
                                            <span
                                                className="ml-auto flex-shrink-0 rounded-full py-1 px-3 text-[11px] font-bold"
                                                style={{ background: "rgba(22, 163, 74,0.12)", color: "#16A34A" }}
                                            >
                                                En Route
                                            </span>
                                        </div>
                                    )}

                                    {!showStepper && (
                                        <div
                                            className="flex items-center gap-4 rounded-2xl py-4 px-5"
                                            style={{ background: cfg.bg, border: `1px solid ${cfg.color}33` }}
                                        >
                                            <div
                                                className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center"
                                                style={{ background: `${cfg.color}18` }}
                                            >
                                                <FontAwesomeIcon icon={cfg.icon} className="text-lg" style={{ color: cfg.color }} />
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-bold m-0" style={{ color: cfg.color }}>
                                                    {cfg.label}
                                                </p>
                                                <p className="text-[13px] text-gray-500 mt-0.5 mb-0">
                                                    {cfg.desc}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── STEPPER ── */}
                                    {showStepper && (
                                        <div
                                            className="grid items-center bg-gray-50 rounded-2xl border border-gray-200"
                                            style={{ gridTemplateColumns: "1fr 40px 1fr 40px 1fr", gap: 0, padding: "24px 16px" }}
                                        >
                                            {STEPS.map((step, idx) => {
                                                const done         = idx < currentIdx;
                                                const active       = idx === currentIdx;
                                                const iconColor    = done ? "#16A34A" : active ? "#16A34A" : "#CBD5E1";
                                                const circleBg     = done ? "rgba(22,163,74,0.08)" : active ? "rgba(22, 163, 74,0.10)" : "#FFFFFF";
                                                const circleBorder = done ? "#16A34A" : active ? "#16A34A" : "#E5E7EB";

                                                const stepDesc = active
                                                    ? (step.key === "Confirmed"
                                                        ? (hasTow
                                                            ? "Your tow truck is on the way to pick up your vehicle. Sit tight!"
                                                            : "Please bring your vehicle to the shop. The shop will begin work once your vehicle arrives.")
                                                        : step.desc)
                                                    : done ? "Done" : "Upcoming";

                                                return (
                                                    <Fragment key={step.key}>
                                                        <div className="flex flex-col items-center gap-3">
                                                            <div
                                                                className="w-16 h-16 rounded-full flex items-center justify-center relative"
                                                                style={{
                                                                    background: circleBg,
                                                                    border: `2.5px solid ${circleBorder}`,
                                                                    boxShadow: active ? "0 0 0 6px rgba(22, 163, 74,0.10)" : "none",
                                                                }}
                                                            >
                                                                <FontAwesomeIcon icon={step.icon} className="text-[22px]" style={{ color: iconColor }} />
                                                                {done && (
                                                                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-600 text-white text-[10px] flex items-center justify-center font-bold">
                                                                        ✓
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-center">
                                                                <p
                                                                    className="text-[13px] font-bold m-0"
                                                                    style={{ color: active ? "#16A34A" : done ? "#16A34A" : "#9CA3AF" }}
                                                                >
                                                                    {step.label}
                                                                </p>
                                                                <p
                                                                    className="text-[11px] mt-1 mb-0 leading-snug"
                                                                    style={{ color: active ? "#6B7280" : "#9CA3AF" }}
                                                                >
                                                                    {stepDesc}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {idx < STEPS.length - 1 && (
                                                            <div
                                                                className="h-[3px] rounded-full mb-9"
                                                                style={{ background: idx < currentIdx ? "#16A34A" : "#E5E7EB" }}
                                                            />
                                                        )}
                                                    </Fragment>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {showStepper && (
                                        <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50 py-4 px-5">
                                            <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(22,163,74,0.08)" }}>
                                                <FontAwesomeIcon icon={faShieldHalved} className="text-base text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-bold text-gray-900 m-0">Sit back and relax!</p>
                                                <p className="text-[13px] text-gray-500 mt-0.5 mb-0">
                                                    We'll keep you updated at every step of the way.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                                        <h3 className="text-[15px] font-bold text-gray-900 mb-4 mt-0">
                                            Request Details
                                        </h3>
                                        <div className="flex flex-col gap-3.5">
                                            <InfoRow label="Reference ID"   value={formatRefId(req.id, req.created_at)} />
                                            <InfoRow label="Issue"          value={req.issue_category || req.description} />
                                            <InfoRow label="Workshop"       value={req.shop_name} />
                                            <InfoRow label="Vehicle"        value={`${req.vehicle_brand || "—"} · ${req.vehicle_color || "—"}`} />
                                            <InfoRow label="Submitted On"   value={`${formatDate(req.created_at)} · ${formatTime(req.created_at)}`} />
                                            <InfoRow label="Preferred Date" value={req.preferred_date ? formatDate(req.preferred_date) : null} />
                                            <InfoRow label="Current Status" value={cfg.label} />
                                        </div>
                                    </div>

                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}