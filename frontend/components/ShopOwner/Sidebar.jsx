import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCarSide,
  faClipboardList,
  faWrench,
  faClock,
  faStar,
  faStore,
  faBell,
  faCreditCard,
  faGear,
  faRightFromBracket
} from "@fortawesome/free-solid-svg-icons";
import { UPLOADS_URL } from "../../src/services/api";


const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: faCarSide },
  { id: "profile", label: "Shop Profile", icon: faStore },
  { id: "requests", label: "Service Requests", icon: faClipboardList },
  { id: "repairs", label: "Active Repairs", icon: faWrench },
  { id: "history", label: "Service History", icon: faClock },
  { id: "reviews", label: "Reviews & Ratings", icon: faStar },
  { id: "notifications", label: "Notifications", icon: faBell },
  { id: "billing",       label: "Billing",       icon: faCreditCard },
  { id: "settings",      label: "Settings",      icon: faGear },
];

function Badge({ count }) {
  if (!count) return null;
  return (
    <span className="bg-green-600 text-white rounded-full text-[11px] font-bold py-0.5 px-[7px] min-w-[20px] text-center leading-normal animate-pulse-custom">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function Sidebar({ activeNav, setActiveNav, shopData, requestCount, activeRepairCount, notificationCount, reviewCount, billingCount, isOpen = false, onClose }) {
  const navigate = useNavigate();

  const handleNav = (id) => {
    setActiveNav(id);
    if (onClose) onClose();
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
    if (onClose) onClose();
    navigate("/");
  };

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
          {/* Shop Header */}
          <div className="py-5 px-4 pb-4 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
            <div className="w-11 h-11 rounded-xl bg-gray-900 flex-shrink-0 overflow-hidden flex items-center justify-center">
              <img
                src={
                  shopData?.profileImageURL
                    ? `${UPLOADS_URL}/${shopData.profileImageURL}`
                    : "/default-shop.png"
                }
                alt="Shop"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="min-w-0">
              <div
                className="font-bold text-sm text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis"
                style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
              >
                {shopData?.name || "Shop"}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {shopData?.categories || "Shop Owner"}
              </div>
              <div className="flex items-center gap-[5px] mt-[3px]">
                <span className={`w-[7px] h-[7px] rounded-full inline-block ${Number(shopData?.isAvailable) === 0 ? "bg-red-500" : "bg-green-600"}`} />
                <span className={`text-[11px] font-semibold ${Number(shopData?.isAvailable) === 0 ? "text-red-500" : "text-green-600"}`}>
                  {Number(shopData?.isAvailable) === 0 ? "Closed" : "Active"}
                </span>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 py-3 px-2 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center gap-2.5 py-2.5 px-3 rounded-[10px] border-0 cursor-pointer text-sm text-left transition-all duration-150 ease-in-out ${
                    isActive
                      ? "border-l-4 border-l-green-600 bg-green-50 text-green-600 font-bold"
                      : "border-l-4 border-l-transparent bg-transparent text-gray-700 font-medium hover:bg-gray-100"
                  }`}
                  style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
                >
                  <FontAwesomeIcon
                    icon={item.icon}
                    className={`text-base ${isActive ? "text-green-600" : ""}`}
                  />
                  <span className="flex-1">{item.label}</span>
                  <Badge
                    count={
                      item.id === "requests"
                        ? requestCount
                        : item.id === "repairs"
                        ? activeRepairCount
                        : item.id === "notifications"
                        ? notificationCount
                        : item.id === "billing"
                        ? billingCount
                        : 0
                    }
                  />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Logout */}
        <div className="p-2 border-t border-gray-100 bg-white flex-shrink-0">
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 py-2.5 px-3 rounded-[10px] border-l-4 border-l-transparent cursor-pointer bg-transparent text-gray-500 font-medium text-sm hover:bg-red-50 hover:text-red-600 transition-all duration-150 ease-in-out"
            style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="text-base" />
            <span className="flex-1 text-left">Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;


