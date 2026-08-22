import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faComments } from "@fortawesome/free-solid-svg-icons";
import { api } from "../../src/services/api";


const AVATAR_COLORS = ["#7C3AED", "#059669", "#2563EB", "#D97706", "#F59E0B", "#DB2777", "#0891B2"];

function getShopIdFromToken() {
  const token = localStorage.getItem("jwt_token");
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.shop_id ?? payload.id ?? payload.user_id ?? null;
  } catch {
    return null;
  }
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const initials = parts.length > 1
    ? parts[0][0] + parts[1][0]
    : parts[0].slice(0, 2);
  return initials.toUpperCase();
}

function getColorForName(name) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function timeAgo(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString.replace(" ", "T"));
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days !== 1 ? "s" : ""} ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""} ago`;

  const years = Math.floor(days / 365);
  return `${years} year${years !== 1 ? "s" : ""} ago`;
}

function Avatar({ initials, color, size = 36 }) {
  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold shrink-0 border"
      style={{
        width: size,
        height: size,
        background: color + "22",
        color,
        fontSize: size * 0.33,
        borderColor: color + "44",
      }}
    >
      {initials}
    </div>
  );
}

function Stars({ count, max = 5, size = 14 }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <FontAwesomeIcon
          key={i}
          icon={faStar}
          className={i < count ? "text-amber-500" : "text-gray-300"}
          style={{ fontSize: size }}
        />
      ))}
    </span>
  );
}

function ReviewsRatings() {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [activeTab, setActiveTab] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [highlightedReqId, setHighlightedReqId] = useState(null);

  useEffect(() => {
    const handleHighlight = (e) => {
      if (e.detail) {
        setHighlightedReqId(e.detail);
        setActiveTab("All");
        
        setTimeout(() => {
          const el = document.getElementById(`review-card-${e.detail}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);

        setTimeout(() => {
          setHighlightedReqId(null);
        }, 3000);
      }
    };
    
    window.addEventListener("fixgo_highlight_review", handleHighlight);
    return () => window.removeEventListener("fixgo_highlight_review", handleHighlight);
  }, []);

  useEffect(() => {
    const shopId = getShopIdFromToken();

    if (!shopId) {
      setError("Could not determine shop id.");
      setLoading(false);
      return;
    }

    api.get(`shop/getShopReviews.php?shop_id=${shopId}`)
      .then((data) => {
        if (!data || !data.success) {
          setError(data?.message || "Failed to load reviews.");
          return;
        }
        setReviews(data.data || []);
        setAverageRating(data.average_rating || 0);
        setTotalReviews(data.total_reviews || 0);
      })
      .catch(() => setError("Failed to load reviews."))
      .finally(() => setLoading(false));
  }, []);


  const starCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Number(r.rating) === star).length,
  }));

  const tabs = [
    { label: `All Reviews (${totalReviews})`, value: "All" },
    ...starCounts.map(({ star, count }) => ({
      label: `${star} Star${star !== 1 ? "s" : ""} (${count})`,
      value: star,
    })),
  ];

  const filteredReviews = activeTab === "All"
    ? reviews
    : reviews.filter((r) => Number(r.rating) === activeTab);

  return (
    <div>
      <div
        className="rounded-[18px] p-6 border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6"
        style={{ background: "linear-gradient(180deg, #EEF7F0, #FFFFFF)" }}
      >
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 m-0">
            Reviews & Ratings
          </h1>
          <p className="text-gray-500 mt-1.5 mb-0 text-sm">
            See what your customers are saying about your service.
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 mb-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
        <div className="flex flex-col items-center min-w-[140px]">
          <p className="text-[48px] sm:text-[56px] font-bold text-gray-900 m-0 leading-none">
            {totalReviews > 0 ? Number(averageRating).toFixed(1) : "0.0"}
          </p>
          <div className="mt-2">
            <Stars count={Math.round(Number(averageRating))} size={22} />
          </div>
          <p className="text-[13px] text-gray-500 mt-1.5 mb-0">
            Based on {totalReviews} reviews
          </p>
        </div>

        <div className="w-full sm:flex-1 min-w-0 flex flex-col gap-2.5">
          {starCounts.map((row) => {
            const pct = totalReviews > 0 ? Math.round((row.count / totalReviews) * 100) : 0;
            return (
              <div key={row.star} className="flex items-center gap-3">
                <span className="w-[52px] shrink-0 text-[13px] text-gray-500">
                  {row.star} {row.star === 1 ? "Star" : "Stars"}
                </span>
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green-600"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-4 text-right text-[13px] font-semibold text-gray-900">
                  {row.count}
                </span>
                <span className="w-12 text-right text-[13px] text-gray-400">
                  ({pct}%)
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-2 min-w-[120px]">
          <div className="w-[60px] h-[60px] rounded-full bg-[#F5EDFF] flex items-center justify-center text-purple-600">
            <FontAwesomeIcon icon={faComments} className="text-xl" />
          </div>
          <p className="text-4xl font-bold text-gray-900 m-0 leading-none">
            {totalReviews}
          </p>
          <p className="text-[13px] text-gray-500 m-0">Total Reviews</p>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        {/* Tabs */}
        <div className="px-4 sm:px-5 py-3 border-b border-gray-100 flex flex-wrap items-center gap-1.5 w-full">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`py-1.5 px-3 sm:px-3.5 rounded-full border-none text-xs sm:text-[13px] cursor-pointer ${
                activeTab === tab.value
                  ? "bg-orange-50 text-green-600 font-bold border-b-2 border-green-600"
                  : "bg-transparent text-gray-500 font-normal"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Review Items */}
        {loading ? (
          <div className="py-10 px-5 text-center text-gray-500 text-sm">
            Loading reviews...
          </div>
        ) : error ? (
          <div className="py-10 px-5 text-center text-red-600 text-sm">
            {error}
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-10 px-5 text-center text-gray-500 text-sm">
            No reviews to show.
          </div>
        ) : (
          filteredReviews.map((r, i) => {
            const initials = getInitials(r.customer_name);
            const color = getColorForName(r.customer_name);
            const isHighlighted = highlightedReqId && String(highlightedReqId) === String(r.service_request_id);

            return (
              <div
                key={r.id}
                id={`review-card-${r.service_request_id}`}
                className={`py-4.5 px-5 transition-all duration-500 ${
                  i < filteredReviews.length - 1 ? "border-b border-gray-50" : ""
                } ${isHighlighted ? "bg-green-50" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <Avatar initials={initials} color={color} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900">{r.customer_name}</span>
                      <Stars count={r.rating} />
                      <span className="text-[13px] text-gray-400">{r.rating}.0</span>
                      <span className="text-[13px] text-gray-400">· {timeAgo(r.created_at)}</span>
                    </div>
                    {r.comment && (
                      <p className="text-sm text-gray-700 m-0">{r.comment}</p>
                    )}
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

export default ReviewsRatings;


