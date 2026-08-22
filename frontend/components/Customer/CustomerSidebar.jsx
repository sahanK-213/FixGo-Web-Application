import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBell, faCar, faCarSide, faClock, faGear, faStar, faUser, faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { api, UPLOADS_URL } from "../../src/services/api";


function SidebarLink({ active = false, icon, label, badge, onClick, danger = false }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-2.5 py-2.5 px-3 rounded-[10px] border-0 cursor-pointer text-sm text-left transition-all duration-150 ease-in-out
                ${active
                    ? "border-l-4 border-l-green-600 bg-green-50 text-green-600 font-bold"
                    : danger
                        ? "border-l-4 border-l-transparent bg-transparent text-gray-500 font-medium hover:bg-red-50 hover:text-red-600"
                        : "border-l-4 border-l-transparent bg-transparent text-gray-700 font-medium hover:bg-gray-100"
                }`}
            style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
        >
            <FontAwesomeIcon icon={icon} className={`text-base ${active ? "text-green-600" : ""}`} />
            <span className="flex-1">{label}</span>
            {badge > 0 && (
                <span className="bg-green-600 text-white rounded-full text-[11px] font-bold py-0.5 px-[7px] min-w-[20px] text-center leading-normal animate-pulse-custom">
                    {badge > 99 ? "99+" : badge}
                </span>
            )}
        </button>
    );
}

function CustomerSidebar({ currentPage, setCurrentPage, unreadCount = 0, isOpen = false, onClose }) {
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);

    useEffect(() => {
        api.get("customer/getCustomerProfile.php")
            .then(data => { if (data.success) setCustomer(data); })
            .catch(() => {});
    }, []);

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

    const handleLinkClick = (page) => {
        setCurrentPage(page);
        if (onClose) onClose();
    };

    const cleanProfilePhoto = customer?.profilePhoto ? customer.profilePhoto.replace(/['"]/g, '') : null;
    let avatarSrc = `https://ui-avatars.com/api/?background=16a34a&color=fff&name=${encodeURIComponent(customer?.name || "Customer")}`;

    if (cleanProfilePhoto) {
        if (cleanProfilePhoto.startsWith("http")) {
            try {
                const urlObj = new URL(cleanProfilePhoto);
                avatarSrc = `${UPLOADS_URL}${urlObj.pathname}`;
            } catch (error) {
                avatarSrc = cleanProfilePhoto;
            }
        } else {
            avatarSrc = `${UPLOADS_URL}/${cleanProfilePhoto.replace(/^\//, '')}`;
        }
    }

    return (
        <>
            <style>{`
                @keyframes pulse-custom {
                    0%, 100% { transform: scale(1); }
                    50%       { transform: scale(1.15); }
                }
                .animate-pulse-custom {
                    animation: pulse-custom 2s infinite;
                }
            `}</style>
            <aside
                className={`w-60 flex flex-col bg-white border-r border-gray-100 fixed top-[65px] left-0 z-50 justify-between transition-transform duration-300 ease-in-out
                    ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
                style={{ height: "calc(100vh - 65px)", boxShadow: "4px 0 24px rgba(0,0,0,0.08)" }}
            >
                <div className="flex flex-col flex-1 min-h-0">
                    <div className="py-5 px-4 pb-4 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
                        <div className="w-11 h-11 rounded-xl bg-gray-900 flex-shrink-0 overflow-hidden flex items-center justify-center">
                            <img src={avatarSrc} alt={customer?.name || "Customer"} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                            <div
                                className="font-bold text-sm text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis"
                                style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
                            >
                                {customer?.name || "Customer"}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">Customer</div>
                            <div className="flex items-center gap-[5px] mt-[3px]">
                                <span className="w-[7px] h-[7px] rounded-full bg-green-600 inline-block" />
                                <span className="text-[11px] text-green-600 font-semibold">Active</span>
                            </div>
                        </div>
                    </div>
                    <nav className="flex-1 py-3 px-2 overflow-y-auto">
                        <SidebarLink active={currentPage === "dashboard"}     icon={faCarSide} label="Dashboard"         onClick={() => handleLinkClick("dashboard")} />
                        <SidebarLink active={currentPage === "profile"}       icon={faUser}    label="My Profile"        onClick={() => handleLinkClick("profile")} />
                        <SidebarLink active={currentPage === "repair"}        icon={faCar}     label="Repair Status"     onClick={() => handleLinkClick("repair")} />
                        <SidebarLink active={currentPage === "history"}       icon={faClock}   label="Service History"   onClick={() => handleLinkClick("history")} />
                        <SidebarLink active={currentPage === "reviews"}       icon={faStar}    label="Reviews & Ratings" onClick={() => handleLinkClick("reviews")} />
                        <SidebarLink
                            active={currentPage === "notifications"}
                            icon={faBell}
                            label="Notifications"
                            badge={unreadCount}
                            onClick={() => handleLinkClick("notifications")}
                        />
                        <SidebarLink active={currentPage === "settings"} icon={faGear} label="Settings" onClick={() => handleLinkClick("settings")} />
                    </nav>
                </div>
                
                <div className="p-2 border-t border-gray-100 bg-white flex-shrink-0">
                    <SidebarLink 
                        icon={faRightFromBracket} 
                        label="Log Out" 
                        onClick={handleSignOut} 
                        danger
                    />
                </div>
            </aside>
        </>
    );
}

export default CustomerSidebar;