import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faChartLine,
    faShieldHalved,
    faFlag,
    faMoneyBillWave,
    faGear,
    faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";

const NAV_ITEMS = [
    { key: "dashboard",    icon: faChartLine,     label: "Dashboard" },
    { key: "verification", icon: faShieldHalved,  label: "Verification Queue" },
    { key: "moderation",   icon: faFlag,          label: "Moderation" },
    { key: "revenue",      icon: faMoneyBillWave, label: "Revenue & Ledger" },
    { key: "settings",     icon: faGear,          label: "Settings" },
];

function AdminSidebarLink({ active, icon, label, badge, onClick, danger = false }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-2.5 py-2.5 px-3 rounded-[10px] border-none cursor-pointer text-sm text-left font-sans border-l-4 transition-all duration-150 ease-in-out ${
                active
                    ? "bg-[#F0FDF4] text-green-600 font-bold border-l-green-600"
                    : danger
                        ? "bg-transparent text-gray-500 font-medium border-l-transparent hover:bg-red-50 hover:text-red-600"
                        : "bg-transparent text-gray-700 font-medium border-l-transparent hover:bg-gray-100"
            }`}
        >
            <FontAwesomeIcon
                icon={icon}
                className="text-base"
            />
            <span className="flex-1">{label}</span>
            {badge != null && (
                <span className="bg-green-600 text-white rounded-full text-[11px] font-bold py-0.5 px-[7px] min-w-[20px] text-center">
                    {badge}
                </span>
            )}
        </button>
    );
}

function AdminSidebar({ currentPage, setCurrentPage, verificationCount, isOpen = false, onClose }) {
    const navigate = useNavigate();

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
        if (onClose) onClose();
        navigate("/");
    };

    const handleLinkClick = (key) => {
        setCurrentPage(key);
        if (onClose) onClose();
    };

    return (
        <aside 
            className={`w-[240px] flex flex-col bg-white border-r border-gray-100 shadow-[4px_0_24px_rgba(0,0,0,0.08)] h-[calc(100vh-65px)] fixed top-[65px] left-0 z-50 justify-between transition-transform duration-300 ease-in-out
                ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        >
            <div className="flex flex-col flex-1 min-h-0">
                {/* Profile block */}
                <div className="pt-5 px-4 pb-4 border-b border-gray-100 flex items-center gap-3 shrink-0">
                    <div className="w-11 h-11 rounded-xl bg-gray-900 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        FA
                    </div>
                    <div className="min-w-0">
                        <div className="font-bold text-sm text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                            FixGo Admin
                        </div>
                        <div className="text-xs text-gray-500">Automotive Management</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-[7px] h-[7px] rounded-full bg-green-600 inline-block" />
                            <span className="text-[11px] text-green-600 font-semibold">Active</span>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 py-3 px-2 overflow-y-auto">
                    {NAV_ITEMS.map((item) => (
                        <AdminSidebarLink
                            key={item.key}
                            active={currentPage === item.key}
                            icon={item.icon}
                            label={item.label}
                            badge={item.key === "verification" && verificationCount > 0 ? verificationCount : item.badge}
                            onClick={() => handleLinkClick(item.key)}
                        />
                    ))}
                </nav>
            </div>

            {/* Bottom Log Out */}
            <div className="p-2 border-t border-gray-100 bg-white shrink-0">
                <AdminSidebarLink
                    icon={faRightFromBracket}
                    label="Log Out"
                    onClick={handleSignOut}
                    danger
                />
            </div>
        </aside>
    );
}

export default AdminSidebar;
