import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { api } from "../../src/services/api";

import {
    faArrowRight,
    faArrowTrendUp,
    faBell,
    faCalendarCheck,
    faCalendarDays,
    faCircleCheck,
    faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";

const ACCENT = {
    green:  { iconBg: "bg-[#EDF9F0]",  iconColor: "text-green-600",  linkColor: "text-green-600",  metaColor: "text-green-600"  },
    orange: { iconBg: "bg-[#FFF4EE]", iconColor: "text-[#FF6B1A]", linkColor: "text-[#FF6B1A]", metaColor: "text-[#FF6B1A]" },
    blue:   { iconBg: "bg-[#EDF3FF]",   iconColor: "text-blue-600",   linkColor: "text-blue-600",   metaColor: "text-blue-600"   },
    violet: { iconBg: "bg-[#F5EDFF]", iconColor: "text-purple-500", linkColor: "text-purple-500", metaColor: "text-purple-500" },
};

function SummaryCard({ accent, icon, title, count, linkText, meta, onClick }) {
    const a = ACCENT[accent];
    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-[18px] border border-gray-200 py-5 px-6 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-[250ms] ease-in-out
                hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_10px_24px_rgba(0,0,0,0.08)]
                ${onClick ? "cursor-pointer" : "cursor-default"}`}
        >
            <div className="flex items-start gap-4">
                <div className={`w-[52px] h-[52px] rounded-full ${a.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <FontAwesomeIcon icon={icon} className={`text-xl ${a.iconColor}`} />
                </div>
                <div>
                    <p className="text-[13px] text-gray-500 m-0">{title}</p>
                    <p className="text-[28px] font-bold text-gray-900 my-1">{count}</p>
                    {meta && (
                        <p className={`text-xs font-semibold ${a.metaColor} m-0 flex items-center gap-1`}>
                            <FontAwesomeIcon icon={faArrowTrendUp} className="text-[10px]" />
                            {meta}
                        </p>
                    )}
                    {linkText && (
                        <button
                            onClick={onClick}
                            className={`inline-flex items-center gap-1.5 text-[13px] font-semibold ${a.linkColor} bg-transparent border-0 cursor-pointer p-0 mt-1.5`}
                            style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
                        >
                            {linkText} <FontAwesomeIcon icon={faArrowRight} className="text-[11px]" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

const ONGOING_STATUSES   = ["Pending", "Accepted", "Confirmed", "In Progress"];
const NOTIF_WORTHY       = ["Accepted", "Confirmed", "Diagnosis", "In Progress", "Pending Parts", "Completed", "Cancelled"];

function Dashboard({ onNavigate }) {
    const [firstName, setFirstName] = useState("");
    const [counts, setCounts]       = useState({
        active:        0,
        completed:     0,
        appointments:  0,
        notifications: 0,
    });

    // Fetch profile for greeting name
    useEffect(() => {
        api.get("customer/getCustomerProfile.php")
            .then(data => { if (data.success) setFirstName(data.name.split(" ")[0]); })
            .catch(() => {});
    }, []);


    // Fetch counts from service requests
    useEffect(() => {
        const token = localStorage.getItem("jwt_token");

        const fetchCounts = async () => {
            try {
                const token = localStorage.getItem("jwt_token");
                const data = await api.get("customer/getCustomerRequest.php");

                if (!data.success) return;

                const all = data.data || [];

                let unreadCount = 0;
                try {
                    const notifData = await api.get("shared/getNotifications.php");
                    if (notifData.success) {
                        const notifItems = (notifData.data || []).filter(r => NOTIF_WORTHY.includes(r.status));
                        unreadCount = notifItems.filter(n => Number(n.isRead) === 0).length;
                    }
                } catch (err) {
                    console.error("Dashboard failed to fetch notifications count:", err);
                }

                setCounts({
                    active:        all.filter(r => ONGOING_STATUSES.includes(r.status)).length,
                    completed:     all.filter(r => r.status === "Completed").length,
                    appointments:  all.filter(r => ["Confirmed", "Accepted"].includes(r.status)).length,
                    notifications: unreadCount,
                });
            } catch { /* ignore */ }
        };

        fetchCounts();
        const interval = setInterval(fetchCounts, 30000);
        return () => clearInterval(interval);
    }, []);

    const today = new Date().toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
    });

    return (
        <div className="flex flex-col gap-5" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

            {/* ── Header banner ── */}
            <div
                className="rounded-[18px] p-6 border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.04)] flex justify-between items-center"
                style={{ background: "linear-gradient(180deg, #EEF7F0, #FFFFFF)" }}
            >
                <div>
                    <h1 className="text-[28px] font-bold text-gray-900 m-0">
                        {getGreeting()}{firstName ? `, ${firstName}` : ""}! 👋
                    </h1>
                    <p className="text-gray-500 mt-1.5 mb-0 text-sm">
                        Here&apos;s what&apos;s happening with your vehicle services.
                    </p>
                </div>
                <div className="text-sm font-semibold text-gray-700 bg-white py-2.5 px-4 rounded-xl border border-gray-200 flex items-center gap-2">
                    {today}
                    <FontAwesomeIcon icon={faCalendarDays} className="text-gray-400" />
                </div>
            </div>

            {/* ── Summary Cards ── */}
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <SummaryCard
                    accent="green"
                    icon={faCircleInfo}
                    title="Active Repairs"
                    count={String(counts.active)}
                    meta="Up to date"
                    linkText="View details"
                    onClick={() => onNavigate("repair")}
                />
                <SummaryCard
                    accent="blue"
                    icon={faCircleCheck}
                    title="Completed Repairs"
                    count={String(counts.completed)}
                    linkText="View history"
                    onClick={() => onNavigate("history")}
                />
                <SummaryCard
                    accent="orange"
                    icon={faCalendarCheck}
                    title="Upcoming Appointments"
                    count={String(counts.appointments)}
                    linkText="View status"
                    onClick={() => onNavigate("repair")}
                />
                <SummaryCard
                    accent="violet"
                    icon={faBell}
                    title="Notifications"
                    count={String(counts.notifications)}
                    linkText="View all"
                    onClick={() => onNavigate("notifications")}
                />
            </div>

        </div>
    );
}

export default Dashboard;