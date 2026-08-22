import { useState, useEffect, useMemo } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { NavBar } from "../components/NavBar";
import { Footer } from "../components/footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faFlag, faTimes, faCheck, faTriangleExclamation, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { ServiceRequestModal } from "../components/ShopDetails/ServiceRequestForm";
import { FaWrench } from "react-icons/fa";
import { api } from "../src/services/api";

import { ShopGallery } from "../components/ShopDetails/ShopGallery";
import { ShopInfo } from "../components/ShopDetails/ShopInfo";
import { ShopServices } from "../components/ShopDetails/ShopServices";
import { ShopSidebar } from "../components/ShopDetails/ShopSidebar";
import { ShopReviews } from "../components/ShopDetails/ShopReviews";

function ShopDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const locationData = useLocation();
  // Check if we passed a distance. If they visited the URL directly, it gracefully falls back to null.
  const passedDistance = locationData.state?.distance;

  // State for our Safety Nets and Data
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State for Review Filtering
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeSort, setActiveSort] = useState("Most Recent");

  // State for Report Garage Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportType, setReportType] = useState("PROFILE FLAG");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccessMsg, setReportSuccessMsg] = useState("");
  const [reportErrorMsg, setReportErrorMsg] = useState("");

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) {
      setReportErrorMsg("Please enter a reason for reporting this garage.");
      return;
    }
    setSubmittingReport(true);
    setReportErrorMsg("");
    try {
      const res = await api.post("customer/reportShop.php", {
        shop_id: id,
        flag_type: reportType,
        description: reportReason.trim()
      });
      if (res && res.success) {
        setReportSuccessMsg(res.message || "Report submitted successfully.");
        setReportReason("");
        setTimeout(() => {
          setIsReportModalOpen(false);
          setReportSuccessMsg("");
        }, 2200);
      }
    } catch (err) {
      setReportErrorMsg(err.data?.error || err.message || "Failed to submit report. Please log in first.");
    } finally {
      setSubmittingReport(false);
    }
  };

  // API Fetching Effect
  useEffect(() => {
    const fetchShopDetails = async () => {
      try {
        setLoading(true);
        const data = await api.getOptionalAuth('shop-details/getShopDetails.php', { id });
        setShop(data.data);
      } catch (err) {
        setError(err.message || "Shop not found.");
      } finally {
        setLoading(false);
      }
    };

    fetchShopDetails();
  }, [id]);

  // Review Filtering & Sorting Engine
  const processedReviews = useMemo(() => {
    if (!shop || !shop.reviews) return [];
    let result = [...shop.reviews];

    // 1. Filter by Stars
    if (activeFilter !== "All") {
      const targetStars = parseInt(activeFilter.split(" ")[0]); // Extracts "5" from "5 Stars"
      result = result.filter((r) => parseInt(r.rating) === targetStars);
    }

    // 2. Sort Logic
    if (activeSort === "Highest Rated") {
      result.sort((a, b) => b.rating - a.rating);
    } else if (activeSort === "Lowest Rated") {
      result.sort((a, b) => a.rating - b.rating);
    } else {
      // Most Recent
      result.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    return result;
  }, [shop, activeFilter, activeSort]);

  // SAFETY NET 1: The Loading Screen
  if (loading) {
    return (
      <>
        <NavBar />
        <main className="min-h-screen bg-[#f7fbf8] flex items-center justify-center">
          <div className="flex flex-col items-center animate-pulse">
            <FaWrench className="text-4xl text-green-500 mb-4 animate-spin" />
            <h2 className="text-xl font-bold text-slate-700">Loading shop details...</h2>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // SAFETY NET 2: The 404 / Error Screen
  if (error || !shop) {
    return (
      <>
        <NavBar />
        <main className="min-h-screen bg-[#f7fbf8] flex items-center justify-center pt-20">
          <div className="text-center bg-white p-10 rounded-2xl shadow-sm border border-red-100 max-w-md">
            <h2 className="text-2xl font-bold text-slate-800 mb-3">Oops!</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <button onClick={() => navigate(-1)} className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700">
              Go Back
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // --- RENDER MAIN UI ---
  const { info, stats, gallery, services, isHandshakeComplete, shopCategories, vehicleCategories } = shop;

  // Strip out empty or null strings from the database array so Swiper only gets real URLs!
  const validGallery = gallery?.filter(imgUrl => imgUrl && imgUrl.trim() !== '') || [];

  // A single variable to control all UI locks!
  const isFullyUnlocked = isHandshakeComplete || shopCategories?.includes("Spare Parts");

  // Google Maps Navigation Handler
  const handleGetDirections = () => {
    if (!isFullyUnlocked || !info?.mapQuery) return;

    // Create the Universal Google Maps Directions URL
    const destination = encodeURIComponent(info.mapQuery);
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;

    // Open in a new tab (or launch the native app on mobile)
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <NavBar />

      <main className="min-h-screen bg-[#f7fbf8] pt-3 pb-10">
        <div className="mx-auto w-full max-w-screen-2xl px-6">
          {/* Top Navigation Row: Small Back Button & Breadcrumbs */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <button
              onClick={() => navigate(-1)}
              className="group flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13.5px] font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-x-1 hover:border-[#16a34a] hover:text-[#16a34a] hover:shadow-md"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="transition-transform duration-200 group-hover:-translate-x-1" />
              Go Back
            </button>

            {/* Dynamic Breadcrumbs */}
            <div className="flex items-center gap-2 text-[13px] text-slate-500 font-medium">
              <Link to="/" className="hover:text-[#16a34a] transition-colors">Home</Link>
              <span className="text-slate-300">›</span>
              <span className="cursor-pointer hover:text-[#16a34a] transition-colors" onClick={() => navigate(-1)}>Shops</span>
              <span className="text-slate-300">›</span>
              <span className="text-slate-800 font-bold">{info.name}</span>
            </div>
          </div>

          <div className="overflow-hidden bg-white">
            {/* IMAGE GALLERY SECTION */}
            <ShopGallery validGallery={validGallery} />

            <div className="space-y-8 px-4 pb-6 pt-4 sm:px-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* LEFT COLUMN (Span 2 on Desktop) */}
                <div className="lg:col-span-2 space-y-8">
                  <ShopInfo
                    info={info}
                    stats={stats}
                    shopCategories={shopCategories}
                    vehicleCategories={vehicleCategories}
                    passedDistance={passedDistance}
                    isFullyUnlocked={isFullyUnlocked}
                    onReportGarage={() => setIsReportModalOpen(true)}
                  />
                  <ShopServices services={services} />
                </div>

                {/* RIGHT SIDEBAR COLUMN (Span 1 on Desktop) */}
                <ShopSidebar
                  shopCategories={shopCategories}
                  isFullyUnlocked={isFullyUnlocked}
                  info={info}
                  handleGetDirections={handleGetDirections}
                  setIsModalOpen={setIsModalOpen}
                />
              </div>

              {/* FULL-WIDTH CUSTOMER REVIEWS SECTION */}
              <ShopReviews
                stats={stats}
                activeSort={activeSort}
                setActiveSort={setActiveSort}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                processedReviews={processedReviews}
              />
            </div>
          </div>
        </div>
      </main>

      {/* REPORT GARAGE MODAL */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-150 relative">
            
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <FontAwesomeIcon icon={faFlag} className="text-lg" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 m-0">Report {info?.name || "Garage"}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 m-0">Submit a flag to FixGo Platform Moderation</p>
                </div>
              </div>
              <button 
                onClick={() => setIsReportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 bg-transparent border-none cursor-pointer"
              >
                <FontAwesomeIcon icon={faTimes} className="text-lg" />
              </button>
            </div>

            {reportSuccessMsg && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-800 text-xs font-semibold p-3 rounded-xl flex items-center gap-2">
                <FontAwesomeIcon icon={faCheck} className="text-green-600" />
                {reportSuccessMsg}
              </div>
            )}

            {reportErrorMsg && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3 rounded-xl flex items-center gap-2">
                <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-500" />
                {reportErrorMsg}
              </div>
            )}

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Issue Category</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-green-500 bg-white font-sans"
                >
                  <option value="PROFILE FLAG">Garage Profile / Compliance Issue</option>
                  <option value="REVIEW REPORT">Fraudulent or Misleading Information</option>
                  <option value="FRAUD SIGNAL">Overcharging / Service Misconduct</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Details & Description *</label>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Explain what happened or why this garage is being reported..."
                  rows={4}
                  required
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:border-green-500 resize-none font-sans"
                />
              </div>

              <div className="flex gap-2.5 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  disabled={submittingReport}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="px-4 py-2 text-xs font-bold rounded-xl border-none bg-red-600 hover:bg-red-700 text-white cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  {submittingReport ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faFlag} />}
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ServiceRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        shop={shop}
        distance={passedDistance}
        initialNeedsTow={false}
        onTrackRequest={(requestId) => {
          setIsModalOpen(false);
          navigate("/services", { state: { navigateTo: "repair", requestId } });
        }}
      />
      <Footer />
    </>
  );
}

export default ShopDetails;
