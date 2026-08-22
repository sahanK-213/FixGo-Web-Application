import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBell, faCheck, faCircleCheck, faStar,
    faWrench, faBoxesStacked, faHandshake,
    faClock, faCircleXmark, faStethoscope, faClipboardList,
    faChevronRight, faCar,
} from "@fortawesome/free-solid-svg-icons";
import { api } from "../../src/services/api";

const FONT = "'Segoe UI', system-ui, sans-serif";

const STATUS_META = {
    Pending: { icon: faClock, iconBg: "rgba(217,119,6,0.10)", iconColor: "#D97706", badgeBg: "rgba(217,119,6,0.10)", badgeColor: "#D97706", label: "Pending" },
    Accepted: { icon: faCircleCheck, iconBg: "rgba(37,99,235,0.10)", iconColor: "#2563EB", badgeBg: "rgba(37,99,235,0.10)", badgeColor: "#2563EB", label: "Accepted" },
    Confirmed: { icon: faHandshake, iconBg: "rgba(22, 163, 74,0.10)", iconColor: "#16A34A", badgeBg: "rgba(22, 163, 74,0.10)", badgeColor: "#16A34A", label: "Confirmed" },
    Diagnosis: { icon: faStethoscope, iconBg: "rgba(217,119,6,0.10)", iconColor: "#D97706", badgeBg: "rgba(217,119,6,0.10)", badgeColor: "#D97706", label: "Diagnosis" },
    "In Progress": { icon: faWrench, iconBg: "rgba(168,85,247,0.10)", iconColor: "#A855F7", badgeBg: "rgba(168,85,247,0.10)", badgeColor: "#A855F7", label: "In Progress" },
    "Pending Parts": { icon: faBoxesStacked, iconBg: "rgba(217,119,6,0.10)", iconColor: "#D97706", badgeBg: "rgba(217,119,6,0.10)", badgeColor: "#D97706", label: "Pending Parts" },
    Completed: { icon: faCircleCheck, iconBg: "rgba(22,163,74,0.10)", iconColor: "#16A34A", badgeBg: "rgba(22,163,74,0.10)", badgeColor: "#16A34A", label: "Completed" },
    Cancelled: { icon: faCircleXmark, iconBg: "#FEF2F2", iconColor: "#DC2626", badgeBg: "#FEF2F2", badgeColor: "#DC2626", label: "Cancelled" },
    Declined: { icon: faCircleXmark, iconBg: "#FEF2F2", iconColor: "#DC2626", badgeBg: "#FEF2F2", badgeColor: "#DC2626", label: "Declined" },

    // Shop owner specific types
    NewRequest: { icon: faClipboardList, iconBg: "rgba(37,99,235,0.10)", iconColor: "#2563EB", badgeBg: "rgba(37,99,235,0.10)", badgeColor: "#2563EB", label: "New Request", targetNav: "requests", buttonText: "View Requests" },
    CustomerConfirmed: { icon: faHandshake, iconBg: "rgba(22, 163, 74,0.10)", iconColor: "#16A34A", badgeBg: "rgba(22, 163, 74,0.10)", badgeColor: "#16A34A", label: "Confirmed", targetNav: "repairs", buttonText: "View Active Jobs" },
    CustomerCancelled: { icon: faCircleXmark, iconBg: "#FEF2F2", iconColor: "#DC2626", badgeBg: "#FEF2F2", badgeColor: "#DC2626", label: "Cancelled" },
    CustomerDeclined: { icon: faCircleXmark, iconBg: "#FEF2F2", iconColor: "#DC2626", badgeBg: "#FEF2F2", badgeColor: "#DC2626", label: "Declined" },
    NewReview: { icon: faStar, iconBg: "rgba(217,119,6,0.10)", iconColor: "#D97706", badgeBg: "rgba(217,119,6,0.10)", badgeColor: "#D97706", label: "New Review", targetNav: "reviews", buttonText: "View Reviews" },
};

const DEFAULT_META = {
    icon: faBell,
    iconBg: "rgba(22,163,74,0.08)",
    iconColor: "#16A34A",
    badgeBg: "rgba(22,163,74,0.10)",
    badgeColor: "#16A34A",
    label: "Update",
    targetNav: null,
};

const TABS = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread" },
    { key: "requests", label: "Requests" },
    { key: "reviews", label: "Reviews" },
    { key: "cancelled", label: "Cancelled" },
];

const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    if (d.toDateString() === today.toDateString()) return `Today, ${timeStr}`;
    if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${timeStr}`;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) + `, ${timeStr}`;
};

export function useUnreadCount() {
    const [count, setCount] = useState(0);

    const fetchCount = useCallback(async () => {
        try {
            const res = await api.get(`shared/getNotifications.php?_t=${Date.now()}`);
            if (res.success) {
                const unread = (res.data || res.notifications || []).filter(n => Number(n.isRead) === 0).length;
                setCount(unread);
            }
        } catch { }
    }, []);

    useEffect(() => {
        fetchCount();
        const handler = () => fetchCount();
        window.addEventListener("fixgo_unread_changed", handler);
        return () => window.removeEventListener("fixgo_unread_changed", handler);
    }, [fetchCount]);

    return count;
}

export default function Notification({ setActiveNav, initialSelectedId, onClearSelection }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");
    const [highlightedId, setHighlightedId] = useState(initialSelectedId || null);

    const loadNotifications = useCallback(() => {
        api.get(`shared/getNotifications.php?_t=${Date.now()}`)
            .then((data) => {
                if (!data || !data.success) return;
                const formatted = (data.data || []).map((item) => {
                    const rawStatusKey = item.type || item.status || "Pending";
                    const statusKey = typeof rawStatusKey === "string" ? rawStatusKey.trim() : rawStatusKey;
                    const meta = STATUS_META[statusKey] || DEFAULT_META;
                    return {
                        id: String(item.id),
                        serviceRequestId: item.service_request_id,
                        title: item.title || "Notification",
                        subtitle: item.message || "",
                        statusKey,
                        requestStatus: (item.current_status || item.request_status || item.status || "").trim(),
                        timestamp: item.created_at,
                        meta,
                        requestNumber: item.service_request_id ? `REQ-${item.service_request_id}` : `NOTIF-${item.id}`,
                        vehicle: item.vehicle_brand || "",
                        isUnread: Number(item.isRead) === 0,
                    };
                });
                setNotifications(formatted);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        loadNotifications();
        window.addEventListener("fixgo_unread_changed", loadNotifications);
        return () => window.removeEventListener("fixgo_unread_changed", loadNotifications);
    }, [loadNotifications]);

    useEffect(() => {
        if (initialSelectedId) {
            markAsRead(initialSelectedId);
            setHighlightedId(String(initialSelectedId));
            setActiveTab("all");

            const timerScroll = setTimeout(() => {
                const el = document.getElementById(`notif-card-${initialSelectedId}`);
                if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }, 150);

            const timerHighlight = setTimeout(() => {
                setHighlightedId(null);
                if (onClearSelection) onClearSelection();
            }, 3200);

            return () => {
                clearTimeout(timerScroll);
                clearTimeout(timerHighlight);
            };
        }
    }, [initialSelectedId, onClearSelection]);

    const unreadCount = notifications.filter((n) => n.isUnread).length;

    const tabCount = (key) => {
        if (key === "all") return notifications.length;
        if (key === "unread") return unreadCount;
        if (key === "requests") return notifications.filter(n => n.statusKey === "NewRequest" || n.statusKey === "CustomerConfirmed").length;
        if (key === "reviews") return notifications.filter(n => n.statusKey === "NewReview").length;
        if (key === "cancelled") return notifications.filter(n => n.statusKey === "CustomerCancelled" || n.statusKey === "CustomerDeclined" || n.statusKey === "Cancelled").length;
        return 0;
    };

    const filteredNotifications = notifications.filter((n) => {
        if (activeTab === "unread") return n.isUnread;
        if (activeTab === "requests") return n.statusKey === "NewRequest" || n.statusKey === "CustomerConfirmed";
        if (activeTab === "reviews") return n.statusKey === "NewReview";
        if (activeTab === "cancelled") return n.statusKey === "CustomerCancelled" || n.statusKey === "CustomerDeclined" || n.statusKey === "Cancelled";
        return true;
    });

    const markAsRead = (id) => {
        const target = notifications.find((n) => n.id === String(id));
        if (!target || !target.isUnread) return;

        setNotifications((prev) =>
            prev.map((n) => (n.id === String(id) ? { ...n, isUnread: false } : n))
        );

        api.post("shared/markNotificationRead.php", { notification_id: id })
            .then(() => {
                window.dispatchEvent(new Event("fixgo_unread_changed"));
            })
            .catch(console.error);
    };

    const markAllAsRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));

        api.post("shared/markNotificationRead.php", { mark_all: true })
            .then(() => {
                window.dispatchEvent(new Event("fixgo_unread_changed"));
            })
            .catch(console.error);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20 font-sans" style={{ fontFamily: FONT }}>
                <p className="text-xs text-gray-500 font-medium animate-pulse">Loading notifications...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6" style={{ fontFamily: FONT }}>
            {/* Header */}
            <div
                className="rounded-[18px] p-6 border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row justify-between sm:items-center gap-4"
                style={{ background: "linear-gradient(180deg, #EEF7F0, #FFFFFF)" }}
            >
                <div>
                    <h1 className="text-[28px] font-bold text-gray-900 m-0">Notifications</h1>
                    <p className="text-gray-500 mt-1.5 mb-0 text-sm">
                        Stay updated with customer service requests and repair status updates.
                    </p>
                </div>
            </div>

            {/* Filter Tabs & Mark All */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    {TABS.map((tab) => {
                        const active = activeTab === tab.key;
                        const count = tabCount(tab.key);
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`rounded-full py-1.5 px-3 sm:px-4 text-xs font-semibold cursor-pointer transition-all duration-150 border-none ${active
                                    ? "bg-green-600 text-white shadow-sm"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                {tab.label} {count > 0 && <span className="ml-1 opacity-80">({count})</span>}
                            </button>
                        );
                    })}
                </div>

                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full py-1.5 px-4 text-xs font-semibold text-gray-700 hover:text-green-600 hover:border-green-600 cursor-pointer shadow-xs transition-colors"
                    >
                        <FontAwesomeIcon icon={faCheck} className="text-xs text-green-600" />
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Notification Cards List */}
            <div className="flex flex-col gap-3.5">
                {filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-gray-100 rounded-2xl text-center shadow-xs">
                        <FontAwesomeIcon icon={faBell} className="text-4xl text-gray-200 mb-3" />
                        <p className="text-xs font-semibold text-gray-400 m-0">No notifications found in this view.</p>
                    </div>
                ) : (
                    filteredNotifications.map((notif) => {
                        const meta = notif.meta;
                        const isHighlighted = String(notif.id) === String(highlightedId);
                        const statusUpper = (notif.requestStatus || "").toUpperCase().trim();
                        let isRequestMoved = false;
                        if (notif.statusKey === "NewRequest") {
                            isRequestMoved = ["CONFIRMED", "DIAGNOSIS", "PENDING PARTS", "IN PROGRESS", "COMPLETED", "CANCELLED", "CANCELED", "DECLINED"].includes(statusUpper);
                        } else if (notif.statusKey === "NewReview") {
                            isRequestMoved = false;
                        } else {
                            isRequestMoved = ["COMPLETED", "CANCELLED", "CANCELED", "DECLINED"].includes(statusUpper);
                        }

                        return (
                            <div
                                key={notif.id}
                                id={`notif-card-${notif.id}`}
                                onClick={() => markAsRead(notif.id)}
                                className={`bg-white border rounded-2xl p-5 shadow-xs transition-all duration-300 relative cursor-pointer ${isHighlighted
                                    ? "border-2 border-green-500 shadow-lg shadow-green-500/20 scale-[1.01]"
                                    : notif.isUnread
                                        ? "border-green-200/80 bg-green-50/10 hover:border-green-300"
                                        : "border-gray-100 hover:border-gray-200"
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Status Icon */}
                                    <div
                                        className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                                        style={{ background: meta.iconBg }}
                                    >
                                        <FontAwesomeIcon icon={meta.icon} className="text-sm" style={{ color: meta.iconColor }} />
                                    </div>

                                    {/* Body */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className={`text-sm m-0 ${notif.isUnread ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>
                                                    {notif.title}
                                                </h3>
                                                <span
                                                    className="rounded-full py-[1px] px-2.5 text-[10px] font-bold"
                                                    style={{ background: meta.badgeBg, color: meta.badgeColor }}
                                                >
                                                    {meta.label}
                                                </span>
                                                {notif.isUnread && (
                                                    <span className="w-2 h-2 rounded-full bg-green-600 inline-block animate-ping" />
                                                )}
                                            </div>
                                            <span className="text-[11px] text-gray-400 whitespace-nowrap">
                                                {formatTime(notif.timestamp)}
                                            </span>
                                        </div>

                                        <p className="text-xs text-gray-600 m-0 leading-relaxed mb-3">
                                            {notif.subtitle}
                                        </p>

                                        {/* Pills footer */}
                                        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-gray-50">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 rounded-md px-2.5 py-1 text-[11px] font-semibold">
                                                    <FontAwesomeIcon icon={faWrench} className="text-[10px] text-gray-400" />
                                                    {notif.requestNumber}
                                                </span>
                                                {notif.vehicle && (
                                                    <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 rounded-md px-2.5 py-1 text-[11px] font-semibold">
                                                        <FontAwesomeIcon icon={faCar} className="text-[10px] text-gray-400" />
                                                        {notif.vehicle}
                                                    </span>
                                                )}
                                            </div>

                                            {meta.targetNav && setActiveNav && (
                                                <button
                                                    disabled={isRequestMoved}
                                                    onClick={(e) => {
                                                        e.stopPropagation();

                                                        if (isRequestMoved) return;

                                                        markAsRead(notif.id);
                                                        setActiveNav(meta.targetNav);

                                                        if (notif.statusKey === "NewReview") {
                                                            setTimeout(() => {
                                                                window.dispatchEvent(new CustomEvent("fixgo_highlight_review", { detail: notif.serviceRequestId }));
                                                            }, 100);
                                                        }
                                                    }}
                                                    className={`inline-flex items-center gap-1.5 text-xs font-bold bg-transparent border-none p-0 ${isRequestMoved
                                                            ? "text-gray-400 cursor-not-allowed no-underline"
                                                            : "text-green-600 hover:text-green-700 hover:underline cursor-pointer"
                                                        }`}
                                                >
                                                    <span>
                                                        {isRequestMoved
                                                            ? "Request Moved"
                                                            : meta.buttonText || "View details"}
                                                    </span>

                                                    {!isRequestMoved && (
                                                        <FontAwesomeIcon
                                                            icon={faChevronRight}
                                                            className="text-[10px]"
                                                        />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

