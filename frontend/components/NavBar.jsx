import { Link, NavLink, useNavigate } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
    faBell, faCircleQuestion, faRightFromBracket, faUser, faCheck, faEnvelopeOpen,
    faClock, faCircleCheck, faHandshake, faStethoscope, faWrench, faBoxesStacked, faCircleXmark,
    faClipboardList, faStar, faBars, faXmark, faHome, faShop, faGauge, faHeadset
} from "@fortawesome/free-solid-svg-icons";
import logo from '../src/assets/FixGo.png'
import { useState, useEffect, useRef } from "react";
import Sign from "./SignIn";
import { api, UPLOADS_URL } from "../src/services/api";

const STATUS_META = {
    Pending:           { icon: faClock,         iconBg: "rgba(217,119,6,0.08)",  iconColor: "#D97706", badgeBg: "rgba(217,119,6,0.10)",  badgeColor: "#D97706",  label: "Pending"       },
    Accepted:          { icon: faCircleCheck,   iconBg: "rgba(37,99,235,0.08)",  iconColor: "#2563EB", badgeBg: "rgba(37,99,235,0.10)",  badgeColor: "#2563EB",  label: "Accepted"      },
    Confirmed:         { icon: faHandshake,     iconBg: "rgba(22, 163, 74,0.08)", iconColor: "#16A34A", badgeBg: "rgba(22, 163, 74,0.10)", badgeColor: "#16A34A",  label: "Confirmed"     },
    Diagnosis:         { icon: faStethoscope,   iconBg: "rgba(217,119,6,0.08)",  iconColor: "#D97706", badgeBg: "rgba(217,119,6,0.10)",  badgeColor: "#D97706",  label: "Diagnosis"     },
    "In Progress":     { icon: faWrench,        iconBg: "rgba(168,85,247,0.08)", iconColor: "#A855F7", badgeBg: "rgba(168,85,247,0.10)", badgeColor: "#A855F7",  label: "In Progress"   },
    "Pending Parts":   { icon: faBoxesStacked,  iconBg: "rgba(217,119,6,0.08)",  iconColor: "#D97706", badgeBg: "rgba(217,119,6,0.10)",  badgeColor: "#D97706",  label: "Pending Parts" },
    Completed:         { icon: faCircleCheck,   iconBg: "rgba(22,163,74,0.08)",  iconColor: "#16A34A", badgeBg: "rgba(22,163,74,0.10)",  badgeColor: "#16A34A",  label: "Completed"     },
    Cancelled:         { icon: faCircleXmark,   iconBg: "#FEF2F2",               iconColor: "#DC2626", badgeBg: "#FEF2F2",               badgeColor: "#DC2626",  label: "Cancelled"     },
    Declined:          { icon: faCircleXmark,   iconBg: "#FEF2F2",               iconColor: "#DC2626", badgeBg: "#FEF2F2",               badgeColor: "#DC2626",  label: "Declined"      },

    // Shop Owner notification status types
    NewRequest:        { icon: faClipboardList, iconBg: "rgba(37,99,235,0.08)",  iconColor: "#2563EB", badgeBg: "rgba(37,99,235,0.10)",  badgeColor: "#2563EB",  label: "New Request"   },
    CustomerConfirmed: { icon: faHandshake,     iconBg: "rgba(22, 163, 74,0.08)", iconColor: "#16A34A", badgeBg: "rgba(22, 163, 74,0.10)", badgeColor: "#16A34A",  label: "Confirmed"     },
    CustomerCancelled: { icon: faCircleXmark,   iconBg: "#FEF2F2",               iconColor: "#DC2626", badgeBg: "#FEF2F2",               badgeColor: "#DC2626",  label: "Cancelled"     },
    CustomerDeclined:  { icon: faCircleXmark,   iconBg: "#FEF2F2",               iconColor: "#DC2626", badgeBg: "#FEF2F2",               badgeColor: "#DC2626",  label: "Declined"      },
    NewReview:         { icon: faStar,          iconBg: "rgba(217,119,6,0.08)",  iconColor: "#D97706", badgeBg: "rgba(217,119,6,0.10)",  badgeColor: "#D97706",  label: "New Review"    },
};

const FONT = "'Segoe UI', system-ui, sans-serif";

const getMessage = (req) => {
    if (req.message) return req.message;
    const shop = req.shop_name || "the shop";
    switch (req.status) {
        case "Accepted": return `${shop} accepted your request. Please confirm or decline.`;
        case "Confirmed": return req.requires_tow == 1
            ? `Your booking with ${shop} is confirmed! We're on our way to pick up your vehicle.`
            : `Your booking with ${shop} is confirmed! Please bring your vehicle to the shop.`;
        case "Diagnosis": return `${shop} is currently diagnosing your vehicle.`;
        case "In Progress": return `Your vehicle repair is now in progress at ${shop}.`;
        case "Pending Parts": return `${shop} is waiting for spare parts to arrive.`;
        case "Completed": return `Your repair at ${shop} is complete. Your vehicle is ready!`;
        case "Cancelled": return `Your service request with ${shop} was cancelled.`;
        case "Declined": return `Unfortunately, ${shop} declined your service request.`;
        default: return `Your request status was updated to ${req.status}.`;
    }
};

const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    if (d.toDateString() === today.toDateString()) return `Today, ${timeStr}`;
    if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${timeStr}`;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

export const NavBar = () => {
    const navigate = useNavigate();
    const [showSignIn, setShowSignIn] = useState(false);
    const token = localStorage.getItem("jwt_token");
    const profileImage = localStorage.getItem("profileImage");

    // Mobile drawer state
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const drawerRef = useRef(null);

    // Notifications state
    const [notifications, setNotifications] = useState([]);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);

    const fetchNotifications = async () => {
        if (!token) return;
        try {
            const data = await api.get("shared/getNotifications.php");
            if (data.success) {
                const NOTIF_WORTHY = ["Accepted", "Confirmed", "Diagnosis", "In Progress", "Pending Parts", "Completed", "Cancelled", "Declined"];
                const raw = data.data || [];
                const filtered = raw.filter(r => !r.status || NOTIF_WORTHY.includes(r.status));
                setNotifications(filtered.length > 0 ? filtered : raw);
            }
        } catch (err) {
            console.error("Error fetching notifications in NavBar:", err);
        }
    };

    useEffect(() => {
        if (token) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000);
            window.addEventListener("fixgo_unread_changed", fetchNotifications);
            return () => {
                clearInterval(interval);
                window.removeEventListener("fixgo_unread_changed", fetchNotifications);
            };
        } else {
            setNotifications([]);
        }
    }, [token]);

    useEffect(() => {
        if (!showNotifDropdown) return;
        const handleOutsideClick = (e) => {
            if (!e.target.closest(".notif-dropdown-container")) {
                setShowNotifDropdown(false);
            }
        };
        document.addEventListener("click", handleOutsideClick);
        return () => document.removeEventListener("click", handleOutsideClick);
    }, [showNotifDropdown]);

    // Lock body scroll and handle outside click when mobile menu is open
    useEffect(() => {
        if (!mobileMenuOpen) return;
        const handleOutside = (e) => {
            if (drawerRef.current && !drawerRef.current.contains(e.target)) {
                setMobileMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutside);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("mousedown", handleOutside);
            document.body.style.overflow = "";
        };
    }, [mobileMenuOpen]);

    const handleMarkRead = async (e, id) => {
        e.stopPropagation();
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: 1 } : n));
        try {
            await api.post("shared/markNotificationRead.php", { notification_id: id });
            window.dispatchEvent(new Event("fixgo_unread_changed"));
        } catch (err) {
            console.error("Error marking notification read in NavBar:", err);
        }
    };

    const handleMarkAllRead = async (e) => {
        e.stopPropagation();
        setNotifications(prev => prev.map(n => ({ ...n, isRead: 1 })));
        try {
            await api.post("shared/markNotificationRead.php", { mark_all: true });
            window.dispatchEvent(new Event("fixgo_unread_changed"));
        } catch (err) {
            console.error("Error marking all read in NavBar:", err);
        }
    };

    const handleSignOut = () => {
        const preserved = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("fixgo_read_notifs_")) {
                preserved[key] = localStorage.getItem(key);
            }
        }
        localStorage.clear();
        Object.entries(preserved).forEach(([key, value]) => {
            localStorage.setItem(key, value);
        });
        setMobileMenuOpen(false);
        navigate("/");
    };

    const handleRegister = () => {
        setShowSignIn(false);
        setMobileMenuOpen(false);
        
        const registerSection = document.getElementById("register");
        if (registerSection) {
            registerSection.scrollIntoView({ behavior: "smooth" });
        } else {
            navigate('/', { state: { scrollToRegister: true } });
        }
    };

    const handleNavigateToNotifications = (id = null) => {
        setShowNotifDropdown(false);
        let userRole = "customer";
        try {
            if (token) {
                const payload = JSON.parse(atob(token.split(".")[1]));
                userRole = payload.role || "customer";
            }
        } catch {}

        if (userRole === "admin") {
            navigate("/services", { state: { targetPage: "verification" } });
            window.dispatchEvent(new CustomEvent("fixgo_navigate", { detail: { tab: "verification" } }));
        } else if (userRole === "shop" || userRole === "shop_owner") {
            navigate("/services", { state: { targetPage: "notifications", selectedNotifId: id } });
            window.dispatchEvent(new CustomEvent("fixgo_navigate", { detail: { tab: "notifications", selectedNotifId: id } }));
        } else {
            navigate("/services", { state: { targetPage: "notifications", selectedNotifId: id } });
            window.dispatchEvent(new CustomEvent("fixgo_navigate", { detail: { tab: "notifications", selectedNotifId: id } }));
        }
    };

    const unreadNotifications = notifications.filter(n => Number(n.isRead) === 0);
    const unreadCount = unreadNotifications.length;

    const navLinks = [
        { to: "/",         label: "Homepage",   icon: faHome    },
        { to: "/shops",    label: "Find Shops",  icon: faShop    },
        { to: "/services", label: "Dashboard",   icon: faGauge   },
        { to: "/support",  label: "Support",     icon: faHeadset },
    ];

    return (
        <>
            <header
                className="flex justify-between items-center w-full sticky top-0 z-50 bg-[#f9f9f9]/95 backdrop-blur-md border-b border-[#d1e7d7] shadow-sm py-3 px-4 min-[907px]:px-8"
                style={{ fontFamily: FONT }}
            >
                {/* ── Logo ── */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <img alt="FixGo Logo" className="h-8 sm:h-10 w-auto" src={logo} />
                    <span className="text-base sm:text-lg font-bold text-[#14532d]">FixGo</span>
                </div>

                {/* ── Desktop Nav Links ── */}
                <nav className="hidden min-[907px]:flex items-center gap-6 lg:gap-10">
                    <NavLink to="/" className={({ isActive }) => `font-mono active:scale-105 py-1 transition-colors ${isActive ? 'text-[#16a34a]' : 'text-[#000000] hover:text-[#16a34a]'}`}>
                        Homepage
                    </NavLink>
                    <NavLink
                        to="/shops"
                        onClick={() => Object.keys(sessionStorage).forEach(k => { if (k.startsWith('fixgo_')) sessionStorage.removeItem(k); })}
                        className={({ isActive }) => `font-mono active:scale-105 py-1 transition-colors ${isActive ? 'text-[#16a34a]' : 'text-[#000000] hover:text-[#16a34a]'}`}
                    >
                        Find Shops
                    </NavLink>
                    <NavLink to="/services" className={({ isActive }) => `font-mono active:scale-105 py-1 transition-colors ${isActive ? 'text-[#16a34a]' : 'text-[#000000] hover:text-[#16a34a]'}`}>
                        Dashboard
                    </NavLink>
                    <NavLink to="/support" className={({ isActive }) => `font-mono active:scale-105 py-1 transition-colors ${isActive ? 'text-[#16a34a]' : 'text-[#000000] hover:text-[#16a34a]'}`}>
                        Support
                    </NavLink>
                </nav>

                {/* ── Desktop Right Actions ── */}
                <div className="hidden min-[907px]:flex items-center gap-2 sm:gap-4">
                    {token && (
                        <div className="relative notif-dropdown-container">
                            <button
                                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                                className="relative hover:bg-[#e8e8e8] p-2 rounded-full transition-colors active:scale-95 cursor-pointer shrink-0 border-none bg-transparent flex items-center justify-center"
                            >
                                <FontAwesomeIcon icon={faBell} className="text-lg text-gray-700" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#f9f9f9]">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {showNotifDropdown && (
                                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden z-50 py-1 text-left animate-in fade-in slide-in-from-top-2 duration-150">
                                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                                        <span className="text-xs font-bold text-gray-800">Notifications</span>
                                        {unreadCount > 0 && (
                                            <button onClick={handleMarkAllRead} className="text-[11px] font-semibold text-green-600 hover:text-green-700 bg-transparent border-none cursor-pointer">
                                                Mark all as read
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                                <FontAwesomeIcon icon={faEnvelopeOpen} className="text-2xl mb-2 opacity-30" />
                                                <span className="text-xs">No notifications yet</span>
                                            </div>
                                        ) : (
                                            notifications.map(notif => {
                                                const isUnread = Number(notif.isRead) === 0;
                                                const message = getMessage(notif);
                                                const rawStatusKey = notif.type || notif.status || "";
                                                const statusKey = typeof rawStatusKey === "string" ? rawStatusKey.trim() : rawStatusKey;
                                                const meta = STATUS_META[statusKey] || {
                                                    icon: faBell,
                                                    iconBg: "rgba(22,163,74,0.08)",
                                                    iconColor: "#16A34A",
                                                    badgeBg: "rgba(22,163,74,0.10)",
                                                    badgeColor: "#16A34A",
                                                    label: statusKey || "Notice"
                                                };
                                                return (
                                                    <div
                                                        key={notif.id}
                                                        onClick={() => {
                                                            if (isUnread) handleMarkRead({ stopPropagation: () => {} }, notif.id);
                                                            handleNavigateToNotifications(notif.id);
                                                        }}
                                                        className={`flex gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 cursor-pointer transition-colors relative ${isUnread ? "bg-green-50/20" : ""}`}
                                                    >
                                                        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: meta.iconBg }}>
                                                            <FontAwesomeIcon icon={meta.icon} className="text-[10px]" style={{ color: meta.iconColor }} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-1 flex-wrap">
                                                                <p className={`text-xs m-0 truncate ${isUnread ? "font-bold text-gray-900" : "text-gray-700"}`}>
                                                                    {notif.title || "Notification"}
                                                                </p>
                                                                <span className="rounded-full py-[1px] px-2 text-[9px] font-bold" style={{ background: meta.badgeBg, color: meta.badgeColor }}>
                                                                    {meta.label}
                                                                </span>
                                                                <span className="text-[9px] text-gray-400 whitespace-nowrap ml-auto self-center">
                                                                    {formatTime(notif.created_at)}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-gray-500 m-0 mt-0.5 line-clamp-2 leading-normal">{message}</p>
                                                        </div>
                                                        {isUnread && (
                                                            <button onClick={(e) => handleMarkRead(e, notif.id)} title="Mark as read" className="self-center w-5 h-5 rounded-full hover:bg-gray-200 border-none bg-transparent flex items-center justify-center text-gray-400 hover:text-green-600 transition-colors cursor-pointer">
                                                                <FontAwesomeIcon icon={faCheck} className="text-xs" />
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                    <div className="px-4 py-2 border-t border-gray-100 text-center bg-gray-50">
                                        <button onClick={handleNavigateToNotifications} className="text-xs font-bold text-green-600 hover:underline bg-transparent border-none cursor-pointer">
                                            View all notifications
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}


                    {token ? (
                        <>
                            <div
                                onClick={() => navigate("/services")}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-[#16a34a] overflow-hidden flex items-center justify-center bg-white cursor-pointer active:scale-95 transition-all shadow-sm shrink-0"
                                title="Go to Dashboard"
                            >
                                {profileImage ? (
                                    <img src={profileImage.startsWith("http") ? profileImage : `${UPLOADS_URL}/${profileImage}`} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <FontAwesomeIcon icon={faUser} className="text-[#16a34a] text-sm sm:text-lg" />
                                )}
                            </div>
                            <button onClick={handleSignOut} title="Log Out" className="hover:bg-[#e8e8e8] p-1.5 sm:p-2 rounded-full transition-colors active:scale-95 cursor-pointer shrink-0 border-none bg-transparent">
                                <FontAwesomeIcon icon={faRightFromBracket} className="text-base sm:text-lg text-gray-700 hover:text-red-600" />
                            </button>
                        </>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={() => setShowSignIn(true)} className="border-2 border-green-500 text-[#16a34a] font-mono px-3 py-1.5 sm:px-6 sm:py-2 rounded-lg hover:bg-[#16a34a] hover:text-white active:scale-95 transition-all text-xs sm:text-sm cursor-pointer whitespace-nowrap">
                                Log In
                            </button>
                            <button onClick={handleRegister} className="bg-green-500 text-white font-mono px-3 py-1.5 sm:px-6 sm:py-2 rounded-lg hover:brightness-110 active:scale-95 transition-all text-xs sm:text-sm cursor-pointer whitespace-nowrap">
                                Get Started
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Mobile Right: Bell + Hamburger ── */}
                <div className="flex min-[907px]:hidden items-center gap-1.5">
                    {token && (
                        <button
                            onClick={() => handleNavigateToNotifications()}
                            className="relative p-2 rounded-full hover:bg-gray-100 border-none bg-transparent cursor-pointer transition-colors"
                            aria-label="Notifications"
                        >
                            <FontAwesomeIcon icon={faBell} className="text-lg text-gray-700" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#f9f9f9]">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    )}
                    <button
                        id="hamburger-btn"
                        onClick={() => setMobileMenuOpen(true)}
                        className="p-2 rounded-lg hover:bg-gray-100 border-none bg-transparent cursor-pointer transition-colors"
                        aria-label="Open navigation menu"
                    >
                        <FontAwesomeIcon icon={faBars} className="text-xl text-gray-700" />
                    </button>
                </div>
            </header>

            {/* ── Mobile Backdrop ── */}
            <div
                onClick={() => setMobileMenuOpen(false)}
                style={{
                    position: "fixed", inset: 0, zIndex: 60,
                    background: "rgba(0,0,0,0.45)",
                    backdropFilter: "blur(3px)",
                    opacity: mobileMenuOpen ? 1 : 0,
                    pointerEvents: mobileMenuOpen ? "auto" : "none",
                    transition: "opacity 0.25s ease",
                }}
                aria-hidden="true"
            />

            {/* ── Mobile Slide-In Drawer ── */}
            <div
                ref={drawerRef}
                id="mobile-nav-drawer"
                style={{
                    position: "fixed",
                    top: 0,
                    right: 0,
                    height: "100%",
                    width: "290px",
                    maxWidth: "85vw",
                    zIndex: 70,
                    background: "#ffffff",
                    boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
                    display: "flex",
                    flexDirection: "column",
                    transform: mobileMenuOpen ? "translateX(0)" : "translateX(100%)",
                    transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
                    fontFamily: FONT,
                }}
            >
                {/* Drawer Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f0f0f0", background: "linear-gradient(to right, #f0faf4, #ffffff)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <img alt="FixGo Logo" style={{ height: "32px", width: "auto" }} src={logo} />
                        <span style={{ fontSize: "15px", fontWeight: 700, color: "#14532d" }}>FixGo</span>
                    </div>
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "#f3f4f6", border: "none", cursor: "pointer", color: "#4b5563" }}
                        aria-label="Close menu"
                    >
                        <FontAwesomeIcon icon={faXmark} style={{ fontSize: "14px" }} />
                    </button>
                </div>

                {/* Profile Strip (if logged in) */}
                {token && (
                    <div
                        onClick={() => { navigate("/services"); setMobileMenuOpen(false); }}
                        style={{ display: "flex", alignItems: "center", gap: "12px", margin: "16px", padding: "12px", borderRadius: "12px", background: "#f0fdf4", border: "1px solid #bbf7d0", cursor: "pointer" }}
                    >
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "2px solid #16a34a", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", flexShrink: 0 }}>
                            {profileImage ? (
                                <img src={profileImage.startsWith("http") ? profileImage : `${UPLOADS_URL}/${profileImage}`} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                <FontAwesomeIcon icon={faUser} style={{ color: "#16a34a", fontSize: "16px" }} />
                            )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827", margin: 0 }}>My Account</p>
                            <p style={{ fontSize: "11px", color: "#16a34a", fontWeight: 600, margin: 0 }}>View Dashboard →</p>
                        </div>
                    </div>
                )}

                {/* Nav Links */}
                <nav style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {navLinks.map(({ to, label, icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all no-underline ${
                                    isActive
                                        ? "bg-green-50 text-[#16a34a] border border-green-100"
                                        : "text-gray-700 hover:bg-gray-50 hover:text-[#16a34a]"
                                }`
                            }
                        >
                            <span style={{ width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", background: "#f0fdf4", flexShrink: 0 }}>
                                <FontAwesomeIcon icon={icon} style={{ color: "#16a34a", fontSize: "11px" }} />
                            </span>
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* Spacer */}
                <div style={{ flex: 1 }} />

                {/* Auth Buttons */}
                <div style={{ padding: "16px", borderTop: "1px solid #f3f4f6", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {token ? (
                        <button
                            onClick={handleSignOut}
                            style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #fecaca", background: "#fff1f2", color: "#dc2626", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                        >
                            <FontAwesomeIcon icon={faRightFromBracket} />
                            Sign Out
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => { setMobileMenuOpen(false); setShowSignIn(true); }}
                                style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "2px solid #22c55e", background: "transparent", color: "#16a34a", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
                            >
                                Log In
                            </button>
                            <button
                                onClick={handleRegister}
                                style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "none", background: "#16a34a", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(22,163,74,0.25)" }}
                            >
                                Get Started
                            </button>
                        </>
                    )}
                </div>
            </div>

            {showSignIn && <Sign setShowSignIn={setShowSignIn} />}
        </>
    );
}