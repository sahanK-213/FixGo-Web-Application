import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faXmark,
  faCarSide,
  faClipboardList,
  faWrench,
  faClock,
  faStar,
  faStore,
  faBell,
  faCreditCard,
  faGear,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from "recharts";
import Sidebar from "./Sidebar";
import ServiceRequests from "./ServiceRequests";
import ActiveRepairs from "./ActiveRepairs";
import ServiceHistory from "./ServiceHistory";
import ReviewsRatings from "./ReviewsRatings";
import ShopProfile from "./ShopProfile";
import Notification from "./Notification";
import Settings from "./Settings";
import Billing from "./Billing";
import { api } from "../../src/services/api";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: faCarSide },
  { id: "requests", label: "Service Requests", icon: faClipboardList },
  { id: "repairs", label: "Active Repairs", icon: faWrench },
  { id: "history", label: "Service History", icon: faClock },
  { id: "reviews", label: "Reviews & Ratings", icon: faStar },
  { id: "profile", label: "Shop Profile", icon: faStore },
  { id: "notifications", label: "Notifications", icon: faBell },
  { id: "billing", label: "Billing", icon: faCreditCard },
  { id: "settings", label: "Settings", icon: faGear },
];

function CustomTimelineTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const dataItem = payload[0]?.payload;
  const headerLabel = dataItem?.fullName || label;

  return (
    <div className="bg-gray-900 text-white rounded-xl px-4 py-3 shadow-xl text-[12px] min-w-[140px]">
      <p className="font-bold mb-2 text-gray-300">{headerLabel}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ background: p.stroke || p.fill || "#10b981" }}
            />
            Requests
          </span>
          <span className="font-bold text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Dashboard View (Forced Full Width) ──────────────────────────────────────
function DashboardView({
  shopData,
  requestCount,
  activeRepairCount,
  completedJobCount,
  averageRating,
  reviewCount,
  setActiveNav,
}) {
  const [timelineFilter, setTimelineFilter] = useState("30days");
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setChartLoading(true);

    api.get(`shop/getServiceRequestVolume.php?timeframe=${timelineFilter}`)
      .then((res) => {
        if (!isMounted) return;
        if (res && res.success && Array.isArray(res.data)) {
          setChartData(res.data);
        } else {
          setChartData([]);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to load request volume chart:", err);
        setChartData([]);
      })
      .finally(() => {
        if (isMounted) setChartLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [timelineFilter]);

  const getTimelineDateRange = () => {
    const end = new Date();
    const start = new Date();

    if (timelineFilter === "7days") {
      start.setDate(end.getDate() - 6);
      const formatOpts = { month: "short", day: "numeric", year: "numeric" };
      return `${start.toLocaleDateString("en-US", formatOpts)} — ${end.toLocaleDateString("en-US", formatOpts)}`;
    } else if (timelineFilter === "12months") {
      start.setMonth(end.getMonth() - 11);
      const formatOpts = { month: "short", year: "numeric" };
      return `${start.toLocaleDateString("en-US", formatOpts)} — ${end.toLocaleDateString("en-US", formatOpts)}`;
    } else {
      start.setDate(end.getDate() - 29);
      const formatOpts = { month: "short", day: "numeric", year: "numeric" };
      return `${start.toLocaleDateString("en-US", formatOpts)} — ${end.toLocaleDateString("en-US", formatOpts)}`;
    }
  };

  const stats = [
    {
      label: "New Requests",
      value: requestCount,
      sub: "Pending requests",
      subColor: "text-green-600",
      icon: faClipboardList,
      target: "requests",
    },
    {
      label: "Active Jobs",
      value: activeRepairCount,
      sub: "View all",
      subColor: "text-green-600",
      icon: faWrench,
      target: "repairs",
    },
    {
      label: "Completed Jobs",
      value: completedJobCount,
      sub: "View history",
      subColor: "text-green-600",
      icon: faCircleCheck,
      target: "history",
    },
    {
      label: "Average Rating",
      value: reviewCount > 0 ? Number(averageRating).toFixed(1) : "0.0",
      sub: `(${reviewCount} ${reviewCount === 1 ? "review" : "reviews"})`,
      subColor: "text-green-600",
      icon: faStar,
      target: "reviews",
    },
  ];

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="w-full block">
      <div
        className="rounded-[18px] p-6 border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6"
        style={{ background: "linear-gradient(180deg, #EEF7F0, #FFFFFF)" }}
      >
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 m-0">
            Hello, {shopData?.name || "Shop"}! 👋
          </h1>
          <p className="text-gray-500 mt-1.5 mb-0 text-sm">
            Here's what's happening at your shop today.
          </p>
        </div>

        <span className="text-sm font-semibold text-gray-700 bg-white py-2.5 px-4 rounded-xl border border-gray-200 self-start sm:self-auto">
          {currentDate}
        </span>
      </div>

      {/* Stat Cards Layout - Responsive grid for mobile, tablet & desktop */}
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 md:mb-8 w-full">
        {stats.map((s) => (
          <div
            key={s.label}
            role="button"
            tabIndex={0}
            onClick={() => setActiveNav && setActiveNav(s.target)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (setActiveNav) setActiveNav(s.target);
              }
            }}
            className="bg-white rounded-[18px] border border-[#E7EFE8] py-4 px-5 sm:py-5 sm:px-6 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-[250ms] ease-in-out cursor-pointer hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_10px_24px_rgba(0,0,0,0.08)]"
          >
            <div className="text-2xl mb-2 text-green-600">
              <FontAwesomeIcon icon={s.icon} />
            </div>
            <div className="text-gray-500 text-[13px] mb-1">{s.label}</div>
            <div className="text-[28px] sm:text-[32px] font-bold text-gray-900 leading-none">{s.value}</div>
            <div className={`text-[13px] mt-1.5 ${s.subColor}`}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Service Request Volume Line Chart */}
      <div className="bg-white rounded-[18px] border border-[#E7EFE8] p-4 sm:p-6 shadow-[0_4px_12px_rgba(0,0,0,0.05)] w-full flex flex-col min-h-[350px]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-gray-900 m-0">Service Request Volume</h3>
            <p className="text-xs text-gray-500 font-medium mt-1 tracking-wide">
              {getTimelineDateRange()}
            </p>
          </div>
          <select
            value={timelineFilter}
            onChange={(e) => setTimelineFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-2 outline-none cursor-pointer self-end sm:self-auto"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="12months">Last 12 Months</option>
          </select>
        </div>

        <div className="flex-1 w-full min-h-[250px] relative">
          {chartLoading ? (
            <div className="flex justify-center items-center h-full min-h-[220px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex justify-center items-center h-full min-h-[220px] text-gray-400 text-sm font-medium">
              No service requests during this period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minHeight={240}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} dy={10} minTickGap={20} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} allowDecimals={false} />
                <RechartsTooltip
                  content={<CustomTimelineTooltip />}
                  cursor={{ stroke: "#e5e7eb", strokeWidth: 2, strokeDasharray: "5 5" }}
                />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="#10b981"
                  strokeWidth={4}
                  dot={false}
                  activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2, fill: "#10b981" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function renderPage(
  activeNav,
  shopData,
  requestCount,
  activeRepairCount,
  completedJobCount,
  averageRating,
  reviewCount,
  setActiveNav,
  fetchRequestCount,
  fetchActiveRepairCount,
  selectedNotifId,
  onClearSelection
) {
  switch (activeNav) {
    case "dashboard":
  return (
    <DashboardView
      shopData={shopData}
      requestCount={requestCount}
      activeRepairCount={activeRepairCount}
      completedJobCount={completedJobCount}
      averageRating={averageRating}
      reviewCount={reviewCount}
      setActiveNav={setActiveNav}
    />
  );
    case "requests":      return <ServiceRequests
  shopCategory={shopData?.categories}
  shopCoordinates={{
    lat: shopData?.latitude,
    lng: shopData?.longitude
  }}
  fetchRequestCount={fetchRequestCount}
/>;
    case "repairs":       return <ActiveRepairs fetchActiveRepairCount={fetchActiveRepairCount} />;
    case "history":       return <ServiceHistory />;
    case "reviews":       return <ReviewsRatings />;
    case "profile":       return <ShopProfile />;
    case "notifications":
    return (
        <Notification
            setActiveNav={setActiveNav}
            initialSelectedId={selectedNotifId}
            onClearSelection={onClearSelection}
        />
    );
    case "settings":      return <Settings setActiveNav={setActiveNav} />;
    case "billing":       return <Billing />;
    default:              return (
      <DashboardView
        shopData={shopData}
        requestCount={requestCount}
        activeRepairCount={activeRepairCount}
        completedJobCount={completedJobCount}
        averageRating={averageRating}
        reviewCount={reviewCount}
        setActiveNav={setActiveNav}
      />
    );
  }
}

// ── Main Layout (Guaranteed Spanning Layout) ──────────────────────────────────
function ShopOwnerDashboard() {
  console.log("ShopOwnerDashboard rendered");
  const location = useLocation();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState(location.state?.targetPage || "dashboard");
  const [selectedNotifId, setSelectedNotifId] = useState(location.state?.selectedNotifId || null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shopData, setShopData] = useState(null);
  const [requestCount, setRequestCount] = useState(0);
  const [activeRepairCount, setActiveRepairCount] = useState(0);
  const [unviewedActiveRepairCount, setUnviewedActiveRepairCount] = useState(0);
  const [completedJobCount, setCompletedJobCount] = useState(0); 
  const [notificationCount, setNotificationCount] = useState(0);
  const [billingCount, setBillingCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);

  const fetchActiveRepairCount = () => {
    api.get("shop/getActiveRepairs.php")
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const activeRepairs = data.data.filter(
            (repair) =>
              repair.status === "Confirmed" ||
              repair.status === "In Progress"
          );
          setActiveRepairCount(activeRepairs.length);

          const viewedIds = JSON.parse(localStorage.getItem("fixgo_viewed_repairs") || "[]");
          const unviewedCount = activeRepairs.filter(
            (r) => !viewedIds.includes(String(r.id))
          ).length;
          setUnviewedActiveRepairCount(unviewedCount);
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchActiveRepairCount();
  }, []);

  useEffect(() => {
    if (location.state?.targetPage) {
      setActiveNav(location.state.targetPage);
      setSelectedNotifId(location.state.selectedNotifId || null);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.targetPage]);

  useEffect(() => {
    const handleNavigate = (e) => {
        if (e.detail?.tab === "notifications") {
            setActiveNav("notifications");
            if (e.detail?.selectedNotifId) {
                setSelectedNotifId(e.detail.selectedNotifId);
            }
        }
    };
    window.addEventListener("fixgo_navigate", handleNavigate);
    return () => window.removeEventListener("fixgo_navigate", handleNavigate);
  }, []);

const fetchRequestCount = () => {
  api.get("shop/getServiceRequests.php")
    .then((data) => {
      if (data.success) {
        const pendingCount = data.data.filter(
          request => request.status === "Pending"
        ).length;
        setRequestCount(pendingCount);
      }
    })
    .catch((err) => console.error(err));
};

useEffect(() => {
  fetchRequestCount();
}, []);

useEffect(() => {
  api.get("shop/getServiceHistory.php")
    .then((data) => {
      if (data.success) {
        setCompletedJobCount(data.data.length);
      }
    })
    .catch((err) => console.error(err));
}, []);

useEffect(() => {
    const loadNotificationCount = () => {
        api.get("shared/getNotifications.php")
        .then(data => {
            if (data.success) {
                const unread = (data.data || []).filter(
                    n => Number(n.isRead) === 0
                ).length;
                setNotificationCount(unread);
            }
        })
        .catch(console.error);
    };

    loadNotificationCount();
    window.addEventListener("fixgo_unread_changed", loadNotificationCount);
    return () => window.removeEventListener("fixgo_unread_changed", loadNotificationCount);
}, []);

useEffect(() => {
  api.get("shop/getShopProfile.php")
    .then((data) => {
      if (data.success) {
        setShopData(data.data);
      } else {
        console.error(data.message);
      }
    })
    .catch((err) => console.error(err));
}, []);

useEffect(() => {
  const token = localStorage.getItem("jwt_token");

  if (!token) return;

  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );

    const shopId = payload.shop_id ?? payload.id ?? payload.user_id;

    if (!shopId) return;

    api.get(`shop/getShopReviews.php?shop_id=${shopId}`)
      .then((data) => {
        if (data.success) {
          setReviewCount(Number(data.total_reviews) || 0);
          setAverageRating(Number(data.average_rating) || 0);
        }
      })
      .catch(console.error);

  } catch (err) {
    console.error("Invalid token:", err);
  }
}, []);

useEffect(() => {
    const loadBillingCount = () => {
        api.get("shop/getMyInvoices.php")
        .then(res => {
            if (res.data) {
                const unpaid = res.data.filter(
                    inv => ["Dispatched", "Verification Pending", "Overdue"].includes(inv.invoiceStatus)
                ).length;
                setBillingCount(unpaid);
            }
        })
        .catch(console.error);
    };

    loadBillingCount();
}, []);
 
    const currentLabel =
    NAV_ITEMS.find((n) => n.id === activeNav)?.label || "Dashboard";
  return (
    <div className="min-h-screen bg-[#F4F8F5] text-[#111827]" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <Sidebar
        activeNav={activeNav}
        setActiveNav={(id) => {
          setActiveNav(id);
          setSidebarOpen(false);
        }}
        shopData={shopData}
        requestCount={requestCount}
        activeRepairCount={activeRepairCount}
        activeRepairBadgeCount={unviewedActiveRepairCount}
        notificationCount={notificationCount}
        reviewCount={reviewCount}
        billingCount={billingCount}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="ml-0 md:ml-60 min-h-[calc(100vh-65px)] p-4 sm:p-6 box-border transition-all duration-300">
        <div className="max-w-[1180px] mx-auto">
          {/* Mobile Menu Toggle Bar */}
          <div className="md:hidden flex items-center justify-between bg-white px-4 py-3 border border-gray-100 mb-4 rounded-2xl shadow-xs">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-green-600 bg-transparent border-none cursor-pointer p-0"
            >
              <FontAwesomeIcon icon={sidebarOpen ? faXmark : faBars} className="text-base text-green-600" />
              <span>Shop Menu</span>
            </button>
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full capitalize">
              {currentLabel}
            </span>
          </div>

          {renderPage(
            activeNav,
            shopData,
            requestCount,
            activeRepairCount,
            completedJobCount,
            averageRating,
            reviewCount,
            setActiveNav,
            fetchRequestCount,
            fetchActiveRepairCount,
            selectedNotifId,
            () => setSelectedNotifId(null)
          )}
        </div>
      </main>
    </div>
  );
}

export default ShopOwnerDashboard;

