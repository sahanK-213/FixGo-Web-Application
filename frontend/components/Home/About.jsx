import { useState, useEffect, useRef } from "react";
import { api, UPLOADS_URL } from "../../src/services/api";
import {
    HiOutlineShieldCheck,
    HiOutlineUserGroup,
    HiOutlineMapPin,
    HiStar,
    HiOutlineMap,
    HiOutlineWrench,
    HiOutlineMagnifyingGlass,
    HiOutlineCalendar
} from "react-icons/hi2";

const DEFAULT_TESTIMONIALS = [
    {
        id: 1,
        name: "Nuwan Perera",
        location: "Colombo",
        stars: 5,
        text: "Found a great garage near me in minutes. The booking process was super easy!",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80"
    },
    {
        id: 2,
        name: "Dilini Fernando",
        location: "Kandy",
        stars: 5,
        text: "Excellent service and transparent pricing. Highly recommended FixGo!",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80"
    },
    {
        id: 3,
        name: "Tharindu Silva",
        location: "Galle",
        stars: 5,
        text: "Their roadside assistance saved me during an emergency. Very professional!",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80"
    }
];

const useCountUp = (end, duration = 2500, decimals = 0, startAnimation = false) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        // Only run if end is a valid number and startAnimation is true
        if (!startAnimation) return;
        const numericEnd = typeof end === 'string' ? parseFloat(end.replace(/,/g, '')) : end;
        if (end === "..." || isNaN(numericEnd)) return;

        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // easeOutQuart for smooth deceleration
            const easeProgress = 1 - Math.pow(1 - progress, 4);
            setCount(+(easeProgress * numericEnd).toFixed(decimals));

            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                setCount(numericEnd);
            }
        };

        window.requestAnimationFrame(step);
    }, [end, duration, decimals, startAnimation]);

    return count;
};

const About = () => {
    const [stats, setStats] = useState({
        verifiedGarages: "...",
        successfulBookings: "...",
        averageRating: "..."
    });

    const statsRef = useRef(null);
    const [statsInView, setStatsInView] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setStatsInView(true);
                    observer.disconnect(); // Only animate once
                }
            },
            { threshold: 0.2 } // Trigger when 20% of the container is visible
        );

        if (statsRef.current) {
            observer.observe(statsRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const animatedGarages = useCountUp(stats.verifiedGarages, 2500, 0, statsInView);
    const animatedBookings = useCountUp(stats.successfulBookings, 2500, 0, statsInView);
    const animatedRating = useCountUp(stats.averageRating, 2500, 1, statsInView);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.getPublic('home/getHomeStats.php');
                if (res?.success && res.data) {
                    setStats(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch home stats:", error);
                // Fallback to static values if API fails
                setStats({
                    verifiedGarages: "500+",
                    successfulBookings: "12,000+",
                    averageRating: "4.8"
                });
            }
        };
        fetchStats();
    }, []);

    const [testimonials, setTestimonials] = useState(DEFAULT_TESTIMONIALS);
    const [loading, setLoading] = useState(false);

    // Initial index starts at the middle set's first element
    const [activeIndex, setActiveIndex] = useState(3);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const loadReviews = async () => {
            setLoading(true);
            try {
                const res = await api.getPublic("reviews/getPlatformReviews.php");
                if (res && res.success && Array.isArray(res.data)) {
                    setTestimonials(res.data);
                    if (res.data.length >= 3) {
                        setActiveIndex(3);
                    } else if (res.data.length > 0) {
                        setActiveIndex(0);
                    }
                }
            } catch (err) {
                console.warn("Failed to load platform reviews on homepage:", err);
            } finally {
                setLoading(false);
            }
        };
        loadReviews();
    }, []);

    const activeTestimonials = testimonials;
    const extendedTestimonials = testimonials.length >= 3
        ? [...testimonials, ...testimonials, ...testimonials]
        : testimonials;

    // Track mobile responsiveness for carousel translation
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Auto-play interval: rotates testimonials every 5 seconds if multiple reviews exist
    useEffect(() => {
        if (activeTestimonials.length <= 1) return;

        const timer = setInterval(() => {
            setActiveIndex((prevIndex) => {
                const maxIdx = activeTestimonials.length >= 3 ? activeTestimonials.length + 2 : activeTestimonials.length - 1;
                const resetIdx = activeTestimonials.length >= 3 ? 3 : 0;
                if (prevIndex >= maxIdx) return resetIdx;
                return prevIndex + 1;
            });
        }, 5000);

        return () => clearInterval(timer);
    }, [activeTestimonials.length]);

    const handleDotClick = (index) => {
        setActiveIndex(index + 3);
    };

    // Calculate translation based on viewport size
    const getTransformStyle = () => {
        if (isMobile) {
            return `translateX(calc(-${activeIndex * 80}% + 10%))`;
        } else {
            return `translateX(-${(activeIndex - 1) * 33.3333}%)`;
        }
    };

    const getAvatarUrl = (avatar) => {
        if (!avatar) return null;
        if (avatar.startsWith("http://") || avatar.startsWith("https://") || avatar.startsWith("data:")) return avatar;
        return `${UPLOADS_URL}/${avatar}`;
    };

    return (
        <section className="w-full max-screen mx-auto px-4 md:px-10 mt-20 ">
            {/* 1. Statistics Strip */}
            <div ref={statsRef} className="bg-gradient-to-br from-[#f0fdf4] to-white border border-[#e2e8f0] rounded-2xl py-8 px-6 md:px-12 md:py-16 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-y-10 md:gap-y-0 md:divide-x divide-gray-200 items-center">
                {/* Stat 1 */}
                <div className="flex items-center gap-4 justify-center md:justify-start md:pl-8 group cursor-default transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-green-50 text-green-500 shrink-0 group-hover:bg-green-100 transition-colors">
                        <HiOutlineShieldCheck className="w-7 h-7" />
                    </div>
                    <div className="flex flex-col items-start">
                        {stats.verifiedGarages === "..." ? (
                            <div className="animate-pulse bg-gray-200 h-8 w-16 rounded mb-1"></div>
                        ) : (
                            <span className="text-2xl md:text-3xl font-mono font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-emerald-500 leading-none">
                                {animatedGarages}+
                            </span>
                        )}
                        <span className="text-xs md:text-sm text-gray-500 font-mono font-semibold mt-1">Verified Garages</span>
                    </div>
                </div>

                {/* Stat 2 */}
                <div className="flex items-center gap-4 justify-center md:justify-center group cursor-default transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-green-50 text-green-500 shrink-0 group-hover:bg-green-100 transition-colors">
                        <HiOutlineUserGroup className="w-7 h-7" />
                    </div>
                    <div className="flex flex-col items-start">
                        {stats.successfulBookings === "..." ? (
                            <div className="animate-pulse bg-gray-200 h-8 w-24 rounded mb-1"></div>
                        ) : (
                            <span className="text-2xl md:text-3xl font-mono font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-emerald-500 leading-none">
                                {Number(animatedBookings).toLocaleString()}+
                            </span>
                        )}
                        <span className="text-xs md:text-sm text-gray-500 font-mono font-semibold mt-1">Successful Bookings</span>
                    </div>
                </div>

                {/* Stat 3 */}
                <div className="flex items-center gap-4 justify-center md:justify-center group cursor-default transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-green-50 text-green-500 shrink-0 group-hover:bg-green-100 transition-colors">
                        <HiOutlineMapPin className="w-7 h-7" />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-2xl md:text-3xl font-mono font-semibold bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-gray-500 leading-none">Across</span>
                        <span className="text-xs md:text-sm text-gray-500 font-mono font-semibold mt-1">Western Province</span>
                    </div>
                </div>

                {/* Stat 4 */}
                <div className="flex items-center gap-4 justify-center md:justify-end md:pr-8 group cursor-default transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-green-50 text-green-500 shrink-0 group-hover:bg-green-100 transition-colors">
                        <HiStar className="w-7 h-7 text-[#16a34a]" />
                    </div>
                    <div className="flex flex-col items-start">
                        {stats.averageRating === "..." ? (
                            <div className="animate-pulse bg-gray-200 h-8 w-16 rounded mb-1"></div>
                        ) : (
                            <span className="text-2xl md:text-3xl font-mono font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-emerald-500 leading-none">
                                {animatedRating.toFixed(1)} <span className="text-sm font-normal text-gray-400">/ 5</span>
                            </span>
                        )}
                        <span className="text-xs md:text-sm text-gray-500 font-mono font-semibold mt-1">Average Rating</span>
                    </div>
                </div>
            </div>

            {/* 2–3. Popular Services Section */}
            <div className="relative -mx-4 md:-mx-10 mt-16">
                {/* Full-width soft green background */}
                <div className="bg-gradient-to-br from-[#f0fdf4] via-[#f7fdf9] to-[#eafaf1] border-y border-green-100 py-16 px-4 md:px-10">
                    <div className="max-w-6xl mx-auto">
                        {/* Section heading */}
                        <div className="text-center mb-12">
                            <span className="inline-block bg-green-100 text-[#16a34a] text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-wide uppercase">What We Offer</span>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-wide">Popular Services</h2>
                            <p className="text-gray-500 font-mono font-semibold text-sm mt-3">Explore our most in-demand vehicle services</p>
                        </div>

                        {/* Cards grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Card 1 */}
                            <div className="bg-white border border-[#f1f5f9] rounded-3xl p-10 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center justify-center">
                                <div className="mb-6 w-20 h-20 rounded-2xl bg-green-50 flex items-center justify-center text-green-500">
                                    <HiOutlineMap className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Find Nearest Garage</h3>
                                <p className="text-gray-500 text-sm leading-relaxed max-w-[240px]">
                                    Locate trusted garages near you in seconds.
                                </p>
                            </div>

                            {/* Card 2 */}
                            <div className="bg-white border border-[#f1f5f9] rounded-3xl p-10 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center justify-center">
                                <div className="mb-6 w-20 h-20 rounded-2xl bg-green-50 flex items-center justify-center text-green-500">
                                    <HiOutlineWrench className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Find Quick Spare Parts</h3>
                                <p className="text-gray-500 text-sm leading-relaxed max-w-[240px]">
                                    Find the right spare parts quickly and easily.
                                </p>
                            </div>

                            {/* Card 3 */}
                            <div className="bg-white border border-[#f1f5f9] rounded-3xl p-10 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center justify-center">
                                <div className="mb-6 w-20 h-20 rounded-2xl bg-green-50 flex items-center justify-center text-green-500">
                                    <HiOutlineShieldCheck className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Find Reliable Service Centers</h3>
                                <p className="text-gray-500 text-sm leading-relaxed max-w-[240px]">
                                    Connect with reliable service centers for quality care.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. How FixGo Works Section */}
            <div className="relative -mx-4 md:-mx-10 mt-2">
                <div className="bg-[#f8faf8] border-y border-gray-100 py-16 px-4 md:px-10">
                    <div className="max-w-6xl mx-auto">
                        {/* Section heading */}
                        <div className="text-center mb-14">
                            <span className="inline-block bg-gray-200 text-gray-600 text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-wide uppercase">How It Works</span>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-wide">How FixGo Works</h2>
                            <p className="text-gray-500 font-mono font-semibold text-sm mt-3">Simple steps to get your vehicle fixed</p>
                        </div>

                        <div className="flex flex-col lg:flex-row justify-between items-center gap-8 lg:gap-4 max-w-5xl mx-auto">
                            {/* Step 1 */}
                            <div className="flex flex-col items-center text-center gap-4 w-full lg:w-auto">
                                <div className="relative">
                                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full bg-[#16a34a] text-white text-xs font-bold border-2 border-white shadow-sm z-10">
                                        1
                                    </span>
                                    <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-white border border-[#d1e7d7] text-[#16a34a] shadow-sm">
                                        <HiOutlineMagnifyingGlass className="w-9 h-9" />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-base">Search</h4>
                                    <p className="text-gray-500 text-xs mt-1 max-w-[140px] leading-relaxed">Find and compare verified garages</p>
                                </div>
                            </div>

                            {/* Arrow 1 */}
                            <div className="hidden lg:flex items-center justify-center shrink-0 opacity-30">
                                <svg className="w-14 h-6" fill="none" stroke="#16a34a" viewBox="0 0 48 24">
                                    <path strokeDasharray="4 4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 12h36M32 6l6 6-6 6" />
                                </svg>
                            </div>

                            {/* Step 2 */}
                            <div className="flex flex-col items-center text-center gap-4 w-full lg:w-auto">
                                <div className="relative">
                                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full bg-[#16a34a] text-white text-xs font-bold border-2 border-white shadow-sm z-10">
                                        2
                                    </span>
                                    <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-white border border-[#d1e7d7] text-[#16a34a] shadow-sm">
                                        <HiOutlineCalendar className="w-9 h-9" />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-base">Book</h4>
                                    <p className="text-gray-500 text-xs mt-1 max-w-[140px] leading-relaxed">Choose a time and book your service</p>
                                </div>
                            </div>

                            {/* Arrow 2 */}
                            <div className="hidden lg:flex items-center justify-center shrink-0 opacity-30">
                                <svg className="w-14 h-6" fill="none" stroke="#16a34a" viewBox="0 0 48 24">
                                    <path strokeDasharray="4 4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 12h36M32 6l6 6-6 6" />
                                </svg>
                            </div>

                            {/* Step 3 */}
                            <div className="flex flex-col items-center text-center gap-4 w-full lg:w-auto">
                                <div className="relative">
                                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full bg-[#16a34a] text-white text-xs font-bold border-2 border-white shadow-sm z-10">
                                        3
                                    </span>
                                    <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-white border border-[#d1e7d7] text-[#16a34a] shadow-sm">
                                        <HiOutlineWrench className="w-9 h-9" />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-base">Get It Fixed</h4>
                                    <p className="text-gray-500 text-xs mt-1 max-w-[140px] leading-relaxed">Experts fix your vehicle with quality care</p>
                                </div>
                            </div>

                            {/* Arrow 3 */}
                            <div className="hidden lg:flex items-center justify-center shrink-0 opacity-30">
                                <svg className="w-14 h-6" fill="none" stroke="#16a34a" viewBox="0 0 48 24">
                                    <path strokeDasharray="4 4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 12h36M32 6l6 6-6 6" />
                                </svg>
                            </div>

                            {/* Step 4 */}
                            <div className="flex flex-col items-center text-center gap-4 w-full lg:w-auto">
                                <div className="relative">
                                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full bg-[#16a34a] text-white text-xs font-bold border-2 border-white shadow-sm z-10">
                                        4
                                    </span>
                                    <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-white border border-[#d1e7d7] text-[#16a34a] shadow-sm">
                                        <HiOutlineShieldCheck className="w-9 h-9" />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-base">Drive With Confidence</h4>
                                    <p className="text-gray-500 text-xs mt-1 max-w-[140px] leading-relaxed">Safe rides, every time</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. What Our Customers Say Section */}
            <div className="text-center mt-24 mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-wider">What Our Customers Say</h2>
            </div>

            {/* Testimonials Carousel Container */}
            <div className="relative w-full max-w-7xl mx-auto overflow-hidden px-4 mb-4">
                <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: getTransformStyle() }}
                >
                    {extendedTestimonials.map((t, idx) => {
                        const isCenter = idx === activeIndex;
                        return (
                            <div
                                key={idx}
                                className={`w-[80%] md:w-1/3 shrink-0 px-3 transition-all duration-500 ${isCenter ? 'opacity-100 scale-100 z-10' : 'opacity-60 scale-95 z-0'
                                    }`}
                            >
                                <div className={`h-full border rounded-3xl p-8 shadow-sm transition-all duration-500 flex flex-col justify-between items-start text-left min-h-[240px] ${isCenter ? 'bg-white border-[#16a34a] shadow-md' : 'bg-white border-[#f1f5f9]'
                                    }`}>
                                    <div>
                                        <div className="flex gap-1 mb-4">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <HiStar
                                                    key={s}
                                                    className={`w-5 h-5 ${s <= (t.stars || 5)
                                                            ? "fill-yellow-400 text-yellow-400"
                                                            : "fill-gray-200 text-gray-200"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-gray-600 text-sm leading-relaxed mb-6 font-sans line-clamp-4">
                                            &ldquo;{t.text}&rdquo;
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {getAvatarUrl(t.avatar) ? (
                                            <img
                                                src={getAvatarUrl(t.avatar)}
                                                alt={t.name}
                                                className="w-12 h-12 rounded-full object-cover border-2 border-green-500/10 shrink-0"
                                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                            />
                                        ) : null}
                                        <div
                                            className="w-12 h-12 rounded-full bg-gray-100 border-2 border-gray-200 shrink-0 items-center justify-center text-gray-400 text-base font-bold"
                                            style={{ display: getAvatarUrl(t.avatar) ? 'none' : 'flex' }}
                                        >
                                            {(t.name || '?')[0].toUpperCase()}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-bold text-gray-900 text-sm truncate">{t.name}</span>
                                            <span className="text-gray-400 text-xs truncate">{t.location || "Sri Lanka"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Carousel Indicator Dots */}
            <div className="flex justify-center gap-3 mt-8 mb-20">
                {activeTestimonials.map((_, idx) => {
                    const isActive = (activeIndex % activeTestimonials.length) === idx;
                    return (
                        <button
                            key={idx}
                            onClick={() => handleDotClick(idx)}
                            className={`w-3 h-3 rounded-full transition-all duration-300 cursor-pointer ${isActive ? 'bg-[#16a34a] scale-125' : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    );
                })}
            </div>
        </section>
    );
};

export default About;