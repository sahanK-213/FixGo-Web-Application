import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import { api } from "../../src/services/api";
import AdminSidebar from "./AdminSidebar";
import Dashboard from "./Dashboard";
import VerificationQueue from "./VerificationQueue";
import Moderation from "./Moderation";
import Revenue from "./Revenue";
import Settings from "./Settings";

function AdminControlDashboard() {
    const location = useLocation();
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(location.state?.targetPage || "dashboard");
    const [verificationCount, setVerificationCount] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const loadCounts = async () => {
        try {
            const [payRes, shopRes] = await Promise.allSettled([
                api.get("admin/getPendingVerifications.php"),
                api.get("admin/getPendingShops.php")
            ]);
            
            const payCount = payRes.status === "fulfilled" ? (payRes.value.data?.length || 0) : 0;
            const shopCount = shopRes.status === "fulfilled" ? (shopRes.value.data?.length || 0) : 0;
            
            setVerificationCount(payCount + shopCount);
        } catch (err) {
            console.error("Failed to fetch notification counts", err);
        }
    };

    useEffect(() => {
        loadCounts();
        if (currentPage === "verification") {
            loadCounts();
        }
    }, [currentPage]);

    useEffect(() => {
        const handler = (e) => {
            if (e.detail?.tab) {
                setCurrentPage(e.detail.tab);
                setSidebarOpen(false);
            }
        };
        window.addEventListener("fixgo_navigate", handler);
        return () => window.removeEventListener("fixgo_navigate", handler);
    }, []);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        setSidebarOpen(false);
    };

    return (
        <div className="min-h-screen bg-[#F4F8F5] text-gray-900 font-sans">
            {/* Mobile Backdrop */}
            {sidebarOpen && (
                <div 
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs transition-opacity"
                />
            )}

            {/* ── SIDEBAR ── */}
            <AdminSidebar 
                currentPage={currentPage} 
                setCurrentPage={handlePageChange} 
                verificationCount={verificationCount}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* ── MAIN CONTENT ── */}
            <main className="ml-0 md:ml-[240px] min-h-[calc(100vh-65px)] p-4 sm:p-6 box-border transition-all duration-300">
                <div className="max-w-[1180px] mx-auto">
                    {/* Mobile Menu Toggle Bar */}
                    <div className="md:hidden flex items-center justify-between bg-white px-4 py-3 border border-gray-100 mb-4 rounded-2xl shadow-xs">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-green-600 bg-transparent border-none cursor-pointer"
                        >
                            <FontAwesomeIcon icon={sidebarOpen ? faXmark : faBars} className="text-base text-green-600" />
                            <span>Admin Menu</span>
                        </button>
                        <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full capitalize">
                            {currentPage === "verification" ? "Verification Queue" : currentPage === "revenue" ? "Revenue & Ledger" : currentPage}
                        </span>
                    </div>

                    {currentPage === "dashboard"    && <Dashboard setCurrentPage={handlePageChange} />}
                    {currentPage === "verification" && <VerificationQueue />}
                    {currentPage === "moderation"   && <Moderation />}
                    {currentPage === "revenue"      && <Revenue />}
                    {currentPage === "settings"     && <Settings />}
                </div>
            </main>
        </div>
    );
}

export default AdminControlDashboard;
