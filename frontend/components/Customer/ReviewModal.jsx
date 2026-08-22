import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faXmark, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { api } from "../../src/services/api";


const FONT = "'Segoe UI', system-ui, sans-serif";

export default function ReviewModal({ isOpen, onClose, serviceRequestId, shopId, shopName, onSubmitted }) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Reset all modal state whenever it opens (or when the target request changes)
    useEffect(() => {
        if (isOpen) {
            setRating(0);
            setHoverRating(0);
            setComment("");
            setError("");
            setSubmitting(false);
        }
    }, [isOpen, serviceRequestId]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (rating < 1) {
            setError("Please select a star rating.");
            return;
        }
        setSubmitting(true);
        setError("");
        try {
            const data = await api.post("customer/submitReview.php", {
                service_request_id: serviceRequestId,
                shop_id: shopId,
                rating,
                comment,
            });
            if (data.success) {
                onSubmitted(serviceRequestId);
                onClose();
            } else {
                setError(data.message || "Could not submit review. Please try again.");
            }
        } catch {
            setError("Network error. Please check your connection and try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center p-5"
            style={{ backdropFilter: "blur(4px)" }}
        >
            <div
                className="bg-white rounded-[20px] py-7 px-[26px] max-w-[440px] w-full"
                style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.18)", fontFamily: FONT }}
            >
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-[17px] font-bold text-gray-900 m-0">Rate your experience</p>
                        <p className="text-[13px] text-gray-500 mt-1 mb-0">
                            {shopName ? `How was your service with ${shopName}?` : "How was your service?"}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="border-none bg-transparent cursor-pointer text-gray-500 text-base p-1"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>

                <div className="flex justify-center gap-2 mt-6 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <FontAwesomeIcon
                            key={s}
                            icon={faStar}
                            onClick={() => setRating(s)}
                            onMouseEnter={() => setHoverRating(s)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="text-[32px] cursor-pointer transition-colors duration-100"
                            style={{ color: (hoverRating || rating) >= s ? "#F59E0B" : "#E5E7EB" }}
                        />
                    ))}
                </div>

                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell others about your experience (optional)"
                    rows={4}
                    className="w-full mt-4 p-3 rounded-xl border border-gray-200 text-[13px] text-gray-700 resize-y outline-none box-border"
                    style={{ fontFamily: FONT }}
                />

                {error && <p className="text-red-600 text-xs mt-2">{error}</p>}

                <div className="flex gap-2.5 mt-5">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className={`flex-1 py-[11px] rounded-xl border-[1.5px] border-gray-200 bg-white text-gray-700 text-sm font-semibold ${submitting ? "cursor-not-allowed" : "cursor-pointer"}`}
                        style={{ fontFamily: FONT }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className={`flex-1 py-[11px] rounded-xl border-none text-sm font-bold flex items-center justify-center gap-2
                            ${submitting ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-green-600 text-white cursor-pointer"}`}
                        style={{ fontFamily: FONT }}
                    >
                        {submitting ? <><FontAwesomeIcon icon={faSpinner} spin /> Submitting…</> : "Submit Review"}
                    </button>
                </div>
            </div>
        </div>
    );
}