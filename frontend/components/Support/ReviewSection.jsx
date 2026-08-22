import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiStar } from "react-icons/hi2";
import { FaLock, FaPaperPlane, FaCheckCircle } from "react-icons/fa";
import { api, UPLOADS_URL } from "../../src/services/api";

const ReviewSection = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isLoggedIn = !!localStorage.getItem("jwt_token");

  const loadPlatformReviews = async () => {
    setLoading(true);
    try {
      const res = await api.getPublic("reviews/getPlatformReviews.php");
      if (res && res.success && Array.isArray(res.data)) {
        setReviews(res.data);
        if (res.data.length >= 3) {
          setActiveIndex(3);
        } else if (res.data.length > 0) {
          setActiveIndex(0);
        }
      }
    } catch (err) {
      console.warn("Failed to load platform reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlatformReviews();
  }, []);

  const activeTestimonials = reviews;
  const extended = reviews.length >= 3
    ? [...reviews, ...reviews, ...reviews]
    : reviews;

  useEffect(() => {
    if (activeTestimonials.length <= 1) return;

    const t = setInterval(() => {
      setActiveIndex((i) => {
        const maxIdx = activeTestimonials.length >= 3 ? activeTestimonials.length + 2 : activeTestimonials.length - 1;
        const resetIdx = activeTestimonials.length >= 3 ? 3 : 0;
        if (i >= maxIdx) return resetIdx;
        return i + 1;
      });
    }, 4000);
    return () => clearInterval(t);
  }, [activeTestimonials.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    if (!rating) {
      setErrorMsg("Please select a star rating.");
      return;
    }
    if (!reviewText.trim()) {
      setErrorMsg("Please enter your review text.");
      return;
    }

    setErrorMsg("");
    setSubmitting(true);

    try {
      await api.post("reviews/submitPlatformReview.php", {
        rating,
        comment: reviewText.trim(),
      });
      setSubmitted(true);
      setRating(0);
      setReviewText("");
      loadPlatformReviews();
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      setErrorMsg(err.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith("http://") || avatar.startsWith("https://") || avatar.startsWith("data:")) return avatar;
    return `${UPLOADS_URL}/${avatar}`;
  };

  return (
    <section className="max-w-6xl mx-auto px-4 pb-14">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">What Our Customers Say</h2>
      <p className="text-gray-500 text-sm mb-8">Real experiences from FixGo users — and we'd love to hear yours too.</p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* ── Testimonial Carousel ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-hidden px-4 pt-6 pb-2">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${(activeIndex - 1) * 33.333}%)` }}
            >
              {extended.map((t, idx) => {
                const isCenter = idx === activeIndex;
                return (
                  <div
                    key={idx}
                    className={`w-1/3 shrink-0 px-2 transition-all duration-500 ${isCenter ? "opacity-100 scale-100" : "opacity-50 scale-95"}`}
                  >
                    <div className={`border rounded-2xl p-5 flex flex-col gap-3 min-h-[180px] justify-between transition-all duration-500 ${isCenter ? "border-[#16a34a] bg-white shadow-md" : "border-gray-100 bg-white"}`}>
                      <div>
                        <div className="flex gap-0.5 mb-3">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <HiStar key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-gray-600 text-xs leading-relaxed line-clamp-4">&ldquo;{t.text}&rdquo;</p>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {getAvatarUrl(t.avatar) ? (
                          <img
                            src={getAvatarUrl(t.avatar)}
                            alt={t.name}
                            className="w-9 h-9 rounded-full object-cover border-2 border-green-100 shrink-0"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                        ) : null}
                        <div
                          className="w-9 h-9 rounded-full bg-gray-100 border-2 border-gray-200 shrink-0 items-center justify-center text-gray-400 text-xs font-bold"
                          style={{ display: getAvatarUrl(t.avatar) ? 'none' : 'flex' }}
                        >
                          {(t.name || '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-900 text-xs truncate">{t.name}</p>
                          <p className="text-gray-400 text-[10px] truncate">{t.location || "Sri Lanka"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Dots */}
          <div className="flex justify-center gap-2 py-4">
            {activeTestimonials.map((_, idx) => {
              const isActive = (activeIndex % activeTestimonials.length) === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx + 3)}
                  className={`rounded-full transition-all duration-300 ${isActive ? "w-5 h-2.5 bg-[#16a34a]" : "w-2.5 h-2.5 bg-gray-200 hover:bg-gray-300"}`}
                />
              );
            })}
          </div>
        </div>

        {/* ── Leave a Review Form ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            <HiStar className="w-5 h-5 fill-[#16a34a] text-[#16a34a]" />
            <h3 className="font-bold text-gray-900 text-base">Leave a Review</h3>
          </div>
          <p className="text-gray-400 text-xs mb-5">Share your experience with FixGo</p>

          {!isLoggedIn ? (
            <div className="flex flex-col items-center justify-center gap-4 py-8 text-center bg-gray-50 rounded-xl p-5 border border-dashed border-gray-200">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-[#16a34a]">
                <FaLock className="text-xl" />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">Members Only</p>
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                  Only registered users can leave a review. Sign in to share your experience with FixGo!
                </p>
              </div>
              <Link
                to="/login"
                className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold py-2.5 rounded-xl text-xs transition-all shadow-md shadow-green-100 text-center block mt-1"
              >
                Sign In to Write a Review
              </Link>
            </div>
          ) : submitted ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                <FaCheckCircle className="text-[#16a34a] text-2xl" />
              </div>
              <p className="font-bold text-gray-800 text-sm">Thank you for your review!</p>
              <p className="text-gray-400 text-xs">Your feedback helps us improve FixGo.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {errorMsg && (
                <div className="bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs p-2.5">
                  {errorMsg}
                </div>
              )}

              {/* Star Rating */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Your Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      id={`star-${s}`}
                      onMouseEnter={() => setHoverStar(s)}
                      onMouseLeave={() => setHoverStar(0)}
                      onClick={() => setRating(s)}
                      className="p-0.5 transition-transform hover:scale-110 active:scale-95"
                    >
                      <HiStar
                        className={`w-7 h-7 transition-colors ${s <= (hoverStar || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-200"
                          }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Your Review</label>
                <textarea
                  id="review-text"
                  required
                  rows={4}
                  placeholder="Tell others about your experience with FixGo..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a]/30 focus:border-[#16a34a] bg-gray-50 resize-none transition-all"
                />
              </div>

              <button
                id="submit-review-btn"
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-md shadow-green-100 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
              >
                <FaPaperPlane className="text-xs" />
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReviewSection;
