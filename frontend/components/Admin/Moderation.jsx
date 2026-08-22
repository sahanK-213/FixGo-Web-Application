import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
    faFlag, 
    faUsers, 
    faShieldHalved, 
    faArrowRight, 
    faArrowTrendUp, 
    faArrowTrendDown,
    faXmark,
    faCheck,
    faSpinner,
    faCircleExclamation,
    faFilter
} from "@fortawesome/free-solid-svg-icons";
import { api } from "../../src/services/api";

// Maps each accent name to its matching background/icon/text Tailwind classes
const ACCENT_STYLES = {
    green:  { iconBg: "bg-green-50",  iconColor: "text-green-600",  metaColor: "text-green-600" },
    orange: { iconBg: "bg-[#FFF4EE]", iconColor: "text-[#FF6B1A]",  metaColor: "text-[#FF6B1A]" },
    violet: { iconBg: "bg-[#F5EDFF]", iconColor: "text-purple-500", metaColor: "text-purple-500" },
};

// Reusable stat card used for the 3 top summary numbers
function AdminSummaryCard({ accent, icon, title, count, meta, metaPositive }) {
    const s = ACCENT_STYLES[accent] || ACCENT_STYLES.green;
    return (
        <div className="bg-white rounded-[18px] border border-gray-200 py-5 px-6 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            <div className="flex items-start gap-4">
                <div className={`w-[52px] h-[52px] rounded-full flex items-center justify-center shrink-0 ${s.iconBg}`}>
                    <FontAwesomeIcon icon={icon} className={`text-xl ${s.iconColor}`} />
                </div>
                <div>
                    <p className="text-[13px] text-gray-500 m-0 font-medium">{title}</p>
                    <p className="text-[28px] font-bold text-gray-900 my-1 leading-tight">{count}</p>
                    {meta && (
                        <p className={`text-xs font-semibold m-0 flex items-center gap-1 ${s.metaColor}`}>
                            <FontAwesomeIcon icon={metaPositive ? faArrowTrendUp : faArrowTrendDown} className="text-[10px]" />
                            {meta}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// Simple page title + subtitle block
function PageHeading({ title, sub }) {
    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 m-0">{title}</h1>
            {sub && <p className="text-gray-500 mt-1.5 text-sm mb-0">{sub}</p>}
        </div>
    );
}

// Maps each alert type to badge/border Tailwind classes
const ALERT_TYPE_STYLES = {
    "REVIEW REPORT": { badge: "text-[#FF6B1A] bg-[#FFF4EE]", border: "border-l-4 border-l-[#FF6B1A]" },
    "PROFILE FLAG":  { badge: "text-blue-600 bg-[#EDF3FF]",  border: "border-l-4 border-l-blue-500" },
    "FRAUD SIGNAL":  { badge: "text-purple-600 bg-[#F5EDFF]", border: "border-l-4 border-l-purple-500" },
};
const DEFAULT_ALERT_TYPE_STYLE = { badge: "text-gray-500 bg-gray-100", border: "border-l-4 border-l-gray-300" };

// Renders one row in the moderation alert feed
function ModerationAlertCard({ alert, onSelectAction }) {
    const ts = ALERT_TYPE_STYLES[alert.type] || DEFAULT_ALERT_TYPE_STYLE;
    const isDismissed = alert.status === "dismissed";

    return (
        <div className={`py-4 px-6 border-b border-gray-100 transition-colors hover:bg-gray-50/50 ${ts.border} ${isDismissed ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                    <span className={`rounded-full py-0.5 px-2.5 text-[11px] font-bold ${ts.badge}`}>{alert.type}</span>
                    <span className="text-[11px] text-gray-500 font-medium">{alert.time}</span>
                    {alert.severity && (
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                            alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                            alert.severity === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                            {alert.severity}
                        </span>
                    )}
                    {alert.isShopSuspended && (
                        <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-red-100 text-red-700 border border-red-200">
                            Suspended
                        </span>
                    )}
                </div>
                {isDismissed && (
                    <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Resolved</span>
                )}
            </div>

            <p className="text-[13.5px] text-gray-800 m-0 font-normal leading-relaxed">{alert.desc}</p>

            {alert.user && (
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                        {alert.user[0]?.toUpperCase()}
                    </div>
                    <span>Reporter: <strong className="text-gray-700">{alert.user}</strong></span>
                    {alert.shop && (
                        <>
                            <FontAwesomeIcon icon={faArrowRight} className="text-[10px] text-gray-400" />
                            <span className="text-green-600 font-semibold">{alert.shop}</span>
                        </>
                    )}
                </div>
            )}

            {!isDismissed && alert.actions && (
                <div className="mt-3 flex items-center gap-3">
                    {alert.actions.map((action) => (
                        <button
                            key={action}
                            onClick={() => onSelectAction(alert, action)}
                            className={`bg-white border border-gray-200 rounded-lg px-3 py-1.5 cursor-pointer text-xs font-semibold font-sans transition-all hover:shadow-sm active:scale-95 ${
                                action === "Dismiss Review" || action === "Investigate" || action === "Audit Logs" || action === "Reactivate Shop"
                                    ? "text-green-700 border-green-200 hover:bg-green-50"
                                    : action === "Hide Review" || action === "Suspend Shop" || action === "Freeze Ratings"
                                    ? "text-red-600 border-red-200 hover:bg-red-50"
                                    : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            {action}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// Action Confirmation / Inspector Modal
function ActionModal({ alert, selectedAction, onClose, onConfirm, submitting }) {
    const [notes, setNotes] = useState("");

    if (!alert || !selectedAction) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 m-0">Confirm Moderation Action</h3>
                        <p className="text-xs text-gray-500 mt-1 m-0">Action: <span className="font-bold text-gray-800">{selectedAction}</span></p>
                    </div>
                    <button onClick={onClose} className="border-none bg-transparent text-gray-400 hover:text-gray-600 cursor-pointer p-1">
                        <FontAwesomeIcon icon={faXmark} className="text-lg" />
                    </button>
                </div>

                <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200/80 mb-4 text-xs text-gray-700 space-y-1">
                    <p className="m-0"><strong>Alert Type:</strong> {alert.type}</p>
                    <p className="m-0"><strong>Description:</strong> {alert.desc}</p>
                    {alert.shop && <p className="m-0"><strong>Target Garage:</strong> {alert.shop}</p>}
                </div>

                <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Admin Notes / Audit Reason (Optional)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Provide details or reasoning for this action log..."
                        rows={3}
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 outline-none focus:border-green-500 resize-none font-sans"
                    />
                </div>

                <div className="flex gap-2.5 justify-end">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-white text-gray-700 cursor-pointer hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(alert.id, selectedAction, notes)}
                        disabled={submitting}
                        className="px-4 py-2 text-xs font-bold rounded-xl border-none bg-green-600 text-white cursor-pointer hover:bg-green-700 flex items-center gap-1.5"
                    >
                        {submitting ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faCheck} />}
                        Execute Action
                    </button>
                </div>
            </div>
        </div>
    );
}

// Main Moderation page
export default function Moderation() {
    const [loading, setLoading] = useState(true);
    const [alerts, setAlerts] = useState([]);
    const [summary, setSummary] = useState({ reviewReports: 0, profileFlags: 0, fraudSignals: 0 });
    const [activeTab, setActiveTab] = useState("ALL");
    const [actionTarget, setActionTarget] = useState(null); // { alert, action }
    const [submitting, setSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    const fetchModerationData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`admin/getModerationFlags.php?type=${activeTab}`);
            if (res?.success && res.data) {
                setAlerts(res.data.alerts || []);
                setSummary(res.data.summary || { reviewReports: 0, profileFlags: 0, fraudSignals: 0 });
            }
        } catch (err) {
            console.error("Failed to load moderation data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchModerationData();
    }, [activeTab]);

    const handleOpenActionModal = (alert, action) => {
        setActionTarget({ alert, action });
    };

    const handleExecuteAction = async (flagId, action, notes) => {
        setSubmitting(true);
        try {
            const res = await api.post("admin/resolveModerationFlag.php", { flagId, action, notes });
            if (res?.success) {
                setToastMessage(res.message || `Action '${action}' applied.`);
                setActionTarget(null);
                fetchModerationData(); // Refresh data
                setTimeout(() => setToastMessage(""), 4000);
            }
        } catch (err) {
            console.error("Failed to process action:", err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeading title="Moderation" sub="Reported content, fraud signals, and profile compliance." />

            {/* Notification Toast */}
            {toastMessage && (
                <div className="bg-green-50 border border-green-200 text-green-800 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in">
                    <FontAwesomeIcon icon={faCheck} className="text-green-600" />
                    {toastMessage}
                </div>
            )}

            {/* Top summary stats */}
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
                <AdminSummaryCard accent="orange" icon={faFlag} title="Review Reports" count={summary.reviewReports} meta="Needs action" metaPositive={false} />
                <AdminSummaryCard accent="violet" icon={faUsers} title="Profile Flags" count={summary.profileFlags} meta="Compliance review" metaPositive={false} />
                <AdminSummaryCard accent="green" icon={faShieldHalved} title="Fraud Signals" count={summary.fraudSignals} meta="Automated alerts" metaPositive={false} />
            </div>

            {/* Main Page Card & Filters */}
            <div className="bg-white rounded-[18px] border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
                {/* Header & Tabs */}
                <div className="py-4 px-6 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                    <h2 className="text-[15px] font-bold text-gray-900 m-0">All Moderation Alerts</h2>

                    {/* Filter Tabs */}
                    <div className="flex bg-gray-100/80 p-1 rounded-xl gap-1">
                        {[
                            { id: "ALL", label: "All Items" },
                            { id: "REVIEW REPORT", label: "Review Reports" },
                            { id: "PROFILE FLAG", label: "Profile Flags" },
                            { id: "FRAUD SIGNAL", label: "Fraud Signals" }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border-none cursor-pointer transition-all ${
                                    activeTab === tab.id
                                        ? "bg-white text-gray-900 shadow-sm font-bold"
                                        : "bg-transparent text-gray-500 hover:text-gray-800"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List Container */}
                <div className="flex flex-col min-h-[260px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                            <FontAwesomeIcon icon={faSpinner} spin className="text-2xl text-green-600" />
                            <span className="text-xs font-medium">Loading moderation feed...</span>
                        </div>
                    ) : alerts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                            <FontAwesomeIcon icon={faCircleExclamation} className="text-2xl text-gray-300" />
                            <span className="text-xs font-medium">No moderation alerts found for this filter.</span>
                        </div>
                    ) : (
                        alerts.map((alert) => (
                            <ModerationAlertCard key={alert.id} alert={alert} onSelectAction={handleOpenActionModal} />
                        ))
                    )}
                </div>
            </div>

            {/* Action Confirmation Modal */}
            <ActionModal
                alert={actionTarget?.alert}
                selectedAction={actionTarget?.action}
                onClose={() => setActionTarget(null)}
                onConfirm={handleExecuteAction}
                submitting={submitting}
            />
        </div>
    );
}
