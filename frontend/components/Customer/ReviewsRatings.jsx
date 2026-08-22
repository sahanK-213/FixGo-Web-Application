import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCalendarDays,
    faChevronDown,
    faWrench,
} from "@fortawesome/free-solid-svg-icons";
import { api } from "../../src/services/api";


const FONT = "'Segoe UI', system-ui, sans-serif";

function StarDisplay({ rating, size = "sm" }) {
    const fontSize = size === "lg" ? 22 : 15;
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <span
                    key={s}
                    style={{
                        fontSize,
                        color: rating >= s || (rating >= s - 0.5 && rating < s) ? "#F59E0B" : "#E5E7EB",
                    }}
                >
                    ★
                </span>
            ))}
        </div>
    );
}

function ReviewsRatings() {
    const [filter, setFilter] = useState("All Time");
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const data = await api.get("customer/getCustomerReviews.php");
                if (data.success) setReviews(data.data || []);
            } catch (err) {
                console.error("Fetch reviews error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, []);


    const totalReviews = reviews.length;

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <p className="text-[13px] text-gray-500" style={{ fontFamily: FONT }}>Loading reviews…</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5" style={{ fontFamily: FONT }}>

            {/* ── Page heading ── */}
            <div
                className="rounded-[18px] p-6 border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.04)] flex justify-between items-center"
                style={{ background: "linear-gradient(180deg, #EEF7F0, #FFFFFF)" }}
            >
                <div>
                    <h1 className="text-[28px] font-bold text-gray-900 m-0">Reviews & Ratings</h1>
                    <p className="text-gray-500 mt-1.5 mb-0 text-sm">
                        See your reviews and ratings for past services.
                    </p>
                </div>
            </div>

            {/* ── My Reviews list ── */}
            <div className="bg-white border border-gray-200 rounded-[18px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">

                <div className="flex items-center justify-between py-4 px-6 border-b border-gray-100">
                    <h2 className="text-[15px] font-bold text-gray-900 m-0">My Reviews</h2>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-[10px] py-2 px-3 text-[13px]">
                        <FontAwesomeIcon icon={faCalendarDays} className="text-gray-400" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="border-none outline-none text-[13px] text-gray-700 bg-transparent cursor-pointer"
                            style={{ fontFamily: FONT }}
                        >
                            <option>All Time</option>
                            <option>Last 3 Months</option>
                            <option>Last 6 Months</option>
                            <option>This Year</option>
                        </select>
                        <FontAwesomeIcon icon={faChevronDown} className="text-[11px] text-gray-400" />
                    </div>
                </div>

                {totalReviews === 0 ? (
                    <div className="py-12 px-6 text-center">
                        <p className="text-[13px] text-gray-400 m-0">You haven't left any reviews yet.</p>
                    </div>
                ) : (
                    reviews.map((review, idx) => {
                        const isLast = idx === reviews.length - 1;
                        return (
                            <div
                                key={review.id}
                                className={`grid items-start ${!isLast ? "border-b border-gray-100" : "border-b-0"}`}
                                style={{ gridTemplateColumns: "auto 1fr auto 1fr" }}
                            >
                                <div className="py-5 pr-5 pl-6 flex items-center">
                                    <div className="w-[52px] h-[52px] rounded-full bg-[#EDF9F0] flex items-center justify-center">
                                        <FontAwesomeIcon icon={faWrench} className="text-xl text-green-600" />
                                    </div>
                                </div>

                                <div className="py-5 pr-5 pl-0 border-r border-gray-100 flex flex-col justify-center">
                                    <p className="text-sm font-semibold text-gray-900 m-0">
                                        {review.issue_category || review.vehicle_brand || "Service"}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 mb-0">{review.shop_name}</p>
                                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400">
                                        <FontAwesomeIcon icon={faCalendarDays} className="text-[11px]" />
                                        <span>{new Date(review.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                                    </div>
                                </div>

                                <div className="py-5 px-6 border-r border-gray-100 flex flex-col items-center justify-center">
                                    <p className="text-2xl font-bold text-gray-900 m-0">
                                        {Number(review.rating).toFixed(1)}
                                    </p>
                                    <div className="mt-1"><StarDisplay rating={Number(review.rating)} /></div>
                                </div>

                                <div className="py-5 px-6 flex items-center">
                                    <p className="text-[13px] text-gray-700 leading-relaxed m-0 whitespace-pre-line">
                                        {review.comment || "No comment left."}
                                    </p>
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