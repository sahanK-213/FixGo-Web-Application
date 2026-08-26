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
    faFilter,
    faSearch,
    faTriangleExclamation,
    faStore,
    faUser,
    faLock
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
        <div className="bg-white rounded-[18px] border border-gray-200 py-5 px-6 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-default">
            <div className="flex items-start gap-4">
                <div className={`w-[52px] h-[52px] rounded-2xl flex items-center justify-center shrink-0 ${s.iconBg}`}>
                    <FontAwesomeIcon icon={icon} className={`text-xl ${s.iconColor}`} />
                </div>
                <div>
                    <p className="text-[13px] text-gray-500 m-0 font-bold tracking-wide uppercase">{title}</p>
                    <p className="text-[28px] font-extrabold text-gray-900 my-1 leading-tight">{count}</p>
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

// Helper to get styled actions
const getActionStyle = (action) => {
    switch (action) {
        case "Dismiss Review":
        case "Investigate":
        case "Audit Logs":
        case "Reactivate Shop":
            return {
                classes: "bg-green-50 text-green-700 hover:bg-green-100 border-green-200",
                icon: faCheck
            };
        case "Hide Review":
        case "Suspend Shop":
        case "Freeze Ratings":
            return {
                classes: "bg-red-50 text-red-700 hover:bg-red-100 border-red-200",
                icon: faLock
            };
        default:
            return {
                classes: "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200",
                icon: faXmark
            };
    }
};

// Renders one row in the moderation alert feed
function ModerationAlertCard({ alert, onSelectAction }) {
    const ts = ALERT_TYPE_STYLES[alert.type] || DEFAULT_ALERT_TYPE_STYLE;
    const isDismissed = alert.status === "dismissed";

    let typeIcon = faCircleExclamation;
    if (alert.type === "REVIEW REPORT") typeIcon = faTriangleExclamation;
    else if (alert.type === "PROFILE FLAG") typeIcon = faUser;
    else if (alert.type === "FRAUD SIGNAL") typeIcon = faShieldHalved;

    return (
        <div className={`p-5 rounded-2xl border border-gray-200/80 bg-white shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3 relative overflow-hidden ${isDismissed ? 'opacity-65' : ''}`}>
            
            {/* Top row: Type badge, time, severity, status */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full py-1 px-3 text-xs font-bold ${ts.badge}`}>
                        <FontAwesomeIcon icon={typeIcon} className="text-[10px]" />
                        {alert.type}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">{alert.time}</span>
                    
                    {alert.severity && (
                        <span className={`text-[10px] tracking-wider uppercase font-bold px-2 py-0.5 rounded-md border ${
                            alert.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                            alert.severity === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                            'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                            {alert.severity}
                        </span>
                    )}

                    {alert.isShopSuspended && (
                        <span className="text-[10px] tracking-wider uppercase font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-800 border border-red-200">
                            Suspended
                        </span>
                    )}
                </div>

                {isDismissed && (
                    <span className="text-xs font-bold text-gray-500 bg-gray-100/80 px-2.5 py-1 rounded-lg border border-gray-200">Resolved</span>
                )}
            </div>

            {/* Description */}
            <p className="text-[14px] text-gray-800 m-0 font-normal leading-relaxed">{alert.desc}</p>

            {/* User and Shop Details Box */}
            {alert.user && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <div className="flex items-center text-gray-600">
                        <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-extrabold text-gray-700 mr-2">
                            {alert.user[0]?.toUpperCase()}
                        </div>
                        <span>Reporter: <strong className="text-gray-900">{alert.user}</strong></span>
                    </div>

                    {alert.shop && (
                        <div className="flex items-center text-gray-600">
                            <FontAwesomeIcon icon={faArrowRight} className="text-[10px] text-gray-400 mx-2" />
                            <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center text-[10px] text-green-700 mr-2 border border-green-100">
                                <FontAwesomeIcon icon={faStore} className="text-[9px]" />
                            </div>
                            <span>Target Shop: <strong className="text-green-700 font-semibold">{alert.shop}</strong></span>
                        </div>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            {!isDismissed && alert.actions && (
                <div className="flex flex-wrap gap-2.5 pt-2">
                    {alert.actions.map((action) => {
                        const style = getActionStyle(action);
                        return (
                            <button
                                key={action}
                                onClick={() => onSelectAction(alert, action)}
                                className={`border rounded-xl px-4 py-2 cursor-pointer text-xs font-bold transition-all duration-150 flex items-center gap-1.5 hover:shadow-sm active:scale-95 ${style.classes}`}
                            >
                                <FontAwesomeIcon icon={style.icon} className="text-[10px] opacity-75" />
                                {action}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// Action Confirmation / Inspector Modal
function ActionModal({ alert, selectedAction, onClose, onConfirm, submitting }) {
    const [notes, setNotes] = useState("");

    // Reset notes on modal show
    useEffect(() => {
        if (alert) setNotes("");
    }, [alert]);

    if (!alert || !selectedAction) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200 border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 m-0">Confirm Moderation Action</h3>
                        <p className="text-xs text-gray-500 mt-1 m-0">Action: <span className="font-extrabold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">{selectedAction}</span></p>
                    </div>
                    <button onClick={onClose} className="border-none bg-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer p-0 transition-colors">
                        <FontAwesomeIcon icon={faXmark} className="text-base" />
                    </button>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/80 mb-4 text-xs text-gray-700 space-y-2">
                    <p className="m-0 flex justify-between border-b border-gray-200/50 pb-1.5"><strong className="text-gray-500">Alert Type:</strong> <span className="font-semibold text-gray-900">{alert.type}</span></p>
                    <p className="m-0 flex flex-col gap-1 border-b border-gray-200/50 pb-1.5"><strong className="text-gray-500">Description:</strong> <span className="text-gray-900 leading-normal">{alert.desc}</span></p>
                    {alert.shop && <p className="m-0 flex justify-between"><strong className="text-gray-500">Target Garage:</strong> <span className="font-semibold text-green-700">{alert.shop}</span></p>}
                </div>

                <div className="mb-5">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Admin Notes / Audit Reason (Optional)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Provide details or reasoning for this action log..."
                        rows={3}
                        className="w-full text-xs p-3 rounded-xl border border-gray-300 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600/30 resize-none font-sans bg-white transition-all"
                    />
                </div>

                <div className="flex gap-2.5 justify-end pt-3 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="px-4 py-2.5 text-xs font-bold rounded-xl border border-gray-200 bg-white text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(alert.id, selectedAction, notes)}
                        disabled={submitting}
                        className="px-5 py-2.5 text-xs font-bold rounded-xl border-none bg-green-600 text-white cursor-pointer hover:bg-green-700 flex items-center gap-1.5 shadow-sm transition-all"
                    >
                        {submitting ? <FontAwesomeIcon icon={faSpinner} spin className="text-xs" /> : <FontAwesomeIcon icon={faCheck} className="text-xs" />}
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
    const [searchQuery, setSearchQuery] = useState("");

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

    // Filter alerts locally based on search input
    const filteredAlerts = alerts.filter(alert => {
        const query = searchQuery.toLowerCase();
        const descMatch = alert.desc?.toLowerCase().includes(query);
        const shopMatch = alert.shop?.toLowerCase().includes(query);
        const userMatch = alert.user?.toLowerCase().includes(query);
        const typeMatch = alert.type?.toLowerCase().includes(query);
        return descMatch || shopMatch || userMatch || typeMatch;
    });

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
                
                {/* Header & Tabs & Search */}
                <div className="py-5 px-6 border-b border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h2 className="text-[16px] font-bold text-gray-900 m-0">All Moderation Alerts</h2>
                        <p className="text-xs text-gray-400 mt-1 mb-0">Select a tab or search to filter alerts.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        {/* Search Bar */}
                        <div className="relative flex-1 min-w-[200px] lg:w-64">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 flex items-center">
                                <FontAwesomeIcon icon={faSearch} className="text-xs" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by shop, reporter..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-8 py-2 w-full text-xs rounded-xl border border-gray-200 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600/30 transition-all font-sans"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none text-gray-400 hover:text-gray-600 cursor-pointer p-0.5 flex items-center"
                                >
                                    <FontAwesomeIcon icon={faXmark} className="text-xs" />
                                </button>
                            )}
                        </div>

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
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setSearchQuery(""); // Clear search when switching tabs to avoid confusion
                                    }}
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
                </div>

                {/* List Container */}
                <div className="p-6 flex flex-col gap-4 min-h-[260px] bg-gray-50/30">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                            <FontAwesomeIcon icon={faSpinner} spin className="text-2xl text-green-600" />
                            <span className="text-xs font-medium">Loading moderation feed...</span>
                        </div>
                    ) : filteredAlerts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2 bg-white rounded-2xl border border-dashed border-gray-200">
                            <FontAwesomeIcon icon={faCircleExclamation} className="text-2xl text-gray-300" />
                            <span className="text-xs font-medium">No moderation alerts found matching criteria.</span>
                        </div>
                    ) : (
                        filteredAlerts.map((alert) => (
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
