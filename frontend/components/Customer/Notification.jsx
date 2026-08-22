import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import ReviewModal from "./ReviewModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBell, faCheck, faCircleCheck, faStar,
    faArrowRight, faWrench, faBoxesStacked, faHandshake,
    faClock, faCircleXmark, faStethoscope, faSpinner,
    faTruckPickup, faUser, faPhone, faIdCard,
    faStore, faXmark, faExternalLinkAlt, faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { api } from "../../src/services/api";

import { DeclineModal } from "./Notification/DeclineModal";
import { NotificationCard } from "./Notification/NotificationCard";
import { FONT, STATUS_META, formatRefId } from "./Notification/NotificationHelpers";

const getUserIdFromToken = () => {
    try {
        const token = localStorage.getItem("jwt_token");
        if (!token) return null;
        const decoded = jwtDecode(token);
        return decoded.user_id || decoded.id || null;
    } catch {
        return null;
    }
};

// ── Shared sync signal ──────────────────────────────────────────────────────
const notifyUnreadChanged = () => {
    window.dispatchEvent(new Event("fixgo_unread_changed"));
};

const NOTIF_WORTHY = ["Accepted", "Confirmed", "Diagnosis", "In Progress", "Pending Parts", "Completed", "Cancelled"];
const TABS = [
    { key: "all",      label: "All" },
    { key: "unread",   label: "Unread" },
    { key: "repair",   label: "Repairs" },
    { key: "complete", label: "Completed" },
    { key: "cancel",   label: "Cancelled" }
];

// ── Exported hook ─────────────────────────────────────────────────────────────
export function useUnreadCount() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const id = getUserIdFromToken();
        if (!id) {
            setCount(0);
            return;
        }

        const fetchAndCount = async () => {
            try {
                const data = await api.get("shared/getNotifications.php", { _t: Date.now() });
                if (data.success) {
                    const unread = (data.data || []).filter(n => Number(n.isRead) === 0 && NOTIF_WORTHY.includes(n.status)).length;
                    setCount(unread);
                }
            } catch {}
        };

        fetchAndCount();
        const interval = setInterval(fetchAndCount, 15000);
        window.addEventListener("fixgo_unread_changed", fetchAndCount);
        return () => {
            clearInterval(interval);
            window.removeEventListener("fixgo_unread_changed", fetchAndCount);
        };
    }, []);

    return count;
}

// ── Main Notification component ───────────────────────────────────────────────
export default function Notification({ initialSelectedId, onClearSelection }) {
    const navigate   = useNavigate();

    const [notifications, setNotifications]   = useState([]);
    const [highlightedId, setHighlightedId]   = useState(initialSelectedId);

    const markRead = async (notificationId) => {
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: 1 } : n));
        try {
            await api.post("shared/markNotificationRead.php", { notification_id: notificationId });
        } catch (err) {
            console.error("Mark read error:", err);
        } finally {
            notifyUnreadChanged();
        }
    };

    const [loading, setLoading]               = useState(true);
    const [activeTab, setActiveTab]           = useState("all");
    const [confirming, setConfirming]         = useState(null);
    const [declining, setDeclining]           = useState(null);
    const [localConfirmed, setLocalConfirmed] = useState([]);
    const [localDeclined, setLocalDeclined]   = useState([]);
    const [declineModal, setDeclineModal]     = useState(null);
    const [userId, setUserId]                 = useState(null);
    const [reviewModal, setReviewModal]       = useState(null);
    const [reviewedIds, setReviewedIds]       = useState([]);

    useEffect(() => {
        if (initialSelectedId) {
            markRead(initialSelectedId);
            setActiveTab("all");
            setHighlightedId(initialSelectedId);
            setTimeout(() => {
                const element = document.getElementById(`notif-${initialSelectedId}`);
                if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }, 150);

            const timer = setTimeout(() => {
                setHighlightedId(null);
                if (onClearSelection) onClearSelection();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [initialSelectedId, onClearSelection]);

    useEffect(() => {
        const id = getUserIdFromToken();
        if (!id) return;
        setUserId(id);
    }, []);
    useEffect(() => {
    if (!userId) return;
    const fetchReviewed = async () => {
        try {
            const data = await api.get("customer/getCustomerReviews.php");
            if (data.success) {
                const ids = (data.data || []).map(r => String(r.service_request_id));
                setReviewedIds(ids);
            }
        } catch (err) {
            console.error("Fetch reviewed ids error:", err);
        }
    };
    fetchReviewed();
}, [userId]);

    const fetchNotifs = useCallback(async () => {
        try {
            const data = await api.get("shared/getNotifications.php", { _t: Date.now() });
            if (data.success) {
                const filtered = (data.data || []).filter(r => NOTIF_WORTHY.includes(r.status));
                setNotifications(filtered);
                setLocalConfirmed(prev => prev.filter(id => !filtered.find(n => String(n.service_request_id) === id && n.current_status === "Confirmed")));
                setLocalDeclined(prev  => prev.filter(id => !filtered.find(n => String(n.service_request_id) === id && n.current_status === "Cancelled")));
                notifyUnreadChanged();
            }
        } catch (err) {
            console.error("Notification fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!userId) return;
        fetchNotifs();
        const interval = setInterval(fetchNotifs, 30000);
        return () => clearInterval(interval);
    }, [userId, fetchNotifs]);

    const unreadCount = notifications.filter(n => Number(n.isRead) === 0).length;

    const markAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: 1 })));
        try {
            await api.post("shared/markNotificationRead.php", { mark_all: true });
        } catch (err) {
            console.error("Mark all read error:", err);
        } finally {
            notifyUnreadChanged();
        }
    };

    const handleConfirm = async (e, notif) => {
        e.stopPropagation();
        const requestId = notif.service_request_id;
        setConfirming(notif.id);
        try {
            const data = await api.post("shared/updateStatus.php", {
                request_id: requestId,
                new_status: "Confirmed",
            });
            setLocalConfirmed(prev => [...prev, String(requestId)]);
            await markRead(notif.id);
            await fetchNotifs();
        } catch (err) {
            console.error("Confirm error:", err);
            alert("Could not confirm booking. Please try again.");
            await fetchNotifs();
        } finally {
            setConfirming(null);
        }
    };

    const openDeclineModal = (e, notif) => {
        e.stopPropagation();
        setDeclineModal({
            notifId:   notif.id,
            requestId: notif.service_request_id,
            shopName:  notif.shop_name,
            refId:     formatRefId(notif.service_request_id, notif.created_at),
        });
    };

    const handleDeclineConfirmed = async () => {
        if (!declineModal) return;
        const { requestId, notifId } = declineModal;
        setDeclining(requestId);
        try {
            await api.post("shared/updateStatus.php", {
                request_id: requestId,
                new_status: "Cancelled",
                reason: "Customer declined the booking.",
            });
            setLocalDeclined(prev => [...prev, String(requestId)]);
            await markRead(notifId);
            setDeclineModal(null);
            await fetchNotifs();
        } catch (err) {
            console.error("Decline error:", err);
            alert("Network error. Please check your connection and try again.");
            setDeclineModal(null);
        } finally {
            setDeclining(null);
        }
    };

    const filtered = notifications.filter(n => {
        if (activeTab === "all")      return true;
        if (activeTab === "unread")   return Number(n.isRead) === 0;
        if (activeTab === "repair")   return ["Accepted","Confirmed","Diagnosis","In Progress","Pending Parts"].includes(n.status);
        if (activeTab === "complete") return n.status === "Completed";
        if (activeTab === "cancel")   return n.status === "Cancelled" || n.status === "Declined";
        return true;
    });

    const tabCount = (key) => {
        if (key === "all")      return notifications.length;
        if (key === "unread")   return unreadCount;
        if (key === "repair")   return notifications.filter(n => ["Accepted","Confirmed","Diagnosis","In Progress","Pending Parts"].includes(n.status)).length;
        if (key === "complete") return notifications.filter(n => n.status === "Completed").length;
        if (key === "cancel")   return notifications.filter(n => n.status === "Cancelled" || n.status === "Declined").length;
        return 0;
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <p className="text-[13px] text-gray-500" style={{ fontFamily: FONT }}>Loading notifications…</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5" style={{ fontFamily: FONT }}>

            {declineModal && (
                <DeclineModal
                    shopName={declineModal.shopName}
                    refId={declineModal.refId}
                    isLoading={declining === declineModal.requestId}
                    onConfirm={handleDeclineConfirmed}
                    onCancel={() => setDeclineModal(null)}
                />
            )}
            {reviewModal && (
                <ReviewModal
                    isOpen={!!reviewModal}
                     onClose={() => setReviewModal(null)}
                    serviceRequestId={reviewModal.requestId}
                    shopId={reviewModal.shopId}
                    onSubmitted={(requestId) => {
                        setReviewedIds(prev => [...prev, String(requestId)]);
                        const targetNotif = notifications.find(n => String(n.service_request_id) === String(requestId));
                        if (targetNotif) markRead(targetNotif.id);
                    }}
                />
            )}

            {/* ── Header ── */}
            <div
                className="rounded-[18px] p-6 border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.04)] flex justify-between items-center"
                style={{ background: "linear-gradient(180deg, #EEF7F0, #FFFFFF)" }}
            >
                <div>
                    <h1 className="text-[28px] font-bold text-gray-900 m-0">Notifications</h1>
                    <p className="text-gray-500 mt-1.5 mb-0 text-sm">
                        Stay updated with the latest repair updates and alerts.
                    </p>
                </div>
                {unreadCount > 0 && (
                    <span className="bg-green-600 text-white rounded-full py-1 px-3.5 text-xs font-bold">
                        {unreadCount} unread
                    </span>
                )}
            </div>

            {/* ── Tab Bar ── */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    {TABS.map(tab => {
                        const active = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`rounded-full border py-1.5 px-4 text-[13px] font-semibold cursor-pointer transition-all duration-150
                                    ${active ? "border-green-600 text-green-600" : "border-gray-200 bg-white text-gray-700"}`}
                                style={{ background: active ? "rgba(22,163,74,0.08)" : undefined, fontFamily: FONT }}
                            >
                                {tab.label} ({tabCount(tab.key)})
                            </button>
                        );
                    })}
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllRead}
                        className="flex items-center gap-1.5 border border-gray-200 bg-white rounded-[10px] py-2 px-4 text-[13px] font-semibold text-gray-700 cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
                        style={{ fontFamily: FONT }}
                    >
                        <FontAwesomeIcon icon={faCheck} className="text-[11px] text-green-600" />
                        Mark all as read
                    </button>
                )}
            </div>

            {/* ── Notification List ── */}
            <div className="bg-white border border-gray-200 rounded-[18px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-16 px-6 text-center">
                        <FontAwesomeIcon icon={faBell} className="text-4xl text-gray-200" />
                        <p className="text-[13px] text-gray-400 m-0">No notifications in this category.</p>
                    </div>
                ) : (
                    filtered.map((notif, idx) => (
                        <NotificationCard
                            key={notif.id}
                            notif={notif}
                            isLast={idx === filtered.length - 1}
                            confirming={confirming}
                            declining={declining}
                            localConfirmed={localConfirmed}
                            localDeclined={localDeclined}
                            highlightedId={highlightedId}
                            markRead={markRead}
                            openDeclineModal={openDeclineModal}
                            handleConfirm={handleConfirm}
                            setReviewModal={setReviewModal}
                            reviewedIds={reviewedIds}
                            navigate={navigate}
                        />
                    ))
                )}
            </div>
        </div>
    );
}