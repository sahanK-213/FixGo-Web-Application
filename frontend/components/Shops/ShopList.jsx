import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { UPLOADS_URL } from "../../src/services/api";

import { 
    faStar, 
    faLocationDot, 
    faRoute, 
    faHeart, 
    faShieldHalved,
    faWrench,
    faCarSide,
    faTruck,
    faMotorcycle,
    faBolt,
    faClock,
    faMessage
} from "@fortawesome/free-solid-svg-icons";

const formatResponseTime = (minutes) => {
    // 1. Handle missing data (your default fallback)
    if (!minutes) return "15 mins"; 

    const mins = parseInt(minutes, 10);
    
    // 2. Handle cases where the backend might accidentally send a string
    if (isNaN(mins)) return minutes; 

    // 3. The UX Formatting Logic
    if (mins < 60) {
        return `${mins} mins`;
    } else if (mins < 1440) { // Less than 24 hours
        const hours = Math.round(mins / 60);
        return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
        const days = Math.round(mins / 1440);
        return `${days} day${days > 1 ? 's' : ''}`;
    }
};

export function ShopList({ shopsList, isLoading, error, locationName }) {
    const navigate = useNavigate();

    if (isLoading) return <div className="py-10 font-sans text-[#16a34a] font-bold">Loading nearby shops...</div>;
    if (error) return <div className="py-10 font-sans text-red-500">{error}</div>;
    if (!isLoading && shopsList.length === 0) return <div className="py-10 font-sans text-gray-500">No shops match your exact filters. Try clearing them.</div>;

    const getTagIcon = (tag) => {
        const lowerTag = tag.toLowerCase();
        if (lowerTag.includes('bike') || lowerTag.includes('3 wheeler')) return faMotorcycle;
        if (lowerTag.includes('car') || lowerTag.includes('4 wheeler')) return faCarSide;
        if (lowerTag.includes('commercial')) return faTruck;
        return faWrench; 
    };

    return (
        <div className="flex flex-col gap-4">
            
            {/* ADDED: The Header Block displaying results count and location */}
            <div className="mb-2">
                <h2 className="font-sans text-lg font-bold text-gray-900">
                    {shopsList.length} {shopsList.length === 1 ? 'Shop' : 'Shops'} Found
                </h2>
                <p className="font-sans text-xs text-gray-500">
                    Showing results near {locationName || "your location"}
                </p>
            </div>

            {/* The List Container */}
            {shopsList.map((shop) => (
                <article key={shop.id} className="flex flex-col sm:flex-row overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md sm:h-[200px]">
                    
                    {/* IMAGE BLOCK */}
                    <div className="relative h-48 sm:h-full sm:w-[220px] shrink-0 bg-[#14532d]">
                        {shop.thumbnail_url && (
                            <img 
                                src={`${UPLOADS_URL}/${shop.thumbnail_url}`} 
                                alt={shop.name} 
                                className="absolute inset-0 w-full h-full object-cover text-transparent"
                                onError={(e) => { e.target.style.display = 'none'; }} 
                            />
                        )}

                        <span className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold text-white shadow-sm
                            ${shop.is_open_now ? 'bg-[#16a34a]' : 'bg-gray-600'}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                            {shop.open_status_text}
                        </span>
                    </div>
                    
                    {/* DATA BLOCK */}
                    <div className="flex flex-col p-4 w-full h-full">
                        
                        {/* TOP SECTION: Normal Flow Stack */}
                        <div className="flex flex-col w-full">
                            
                            {/* Row 1: Title & Heart */}
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-sans text-lg font-bold text-gray-900 leading-tight truncate">
                                        {shop.name}
                                    </h3>
                                    
                                    {/* Ratings & Services Completed */}
                                    <div className="flex items-center gap-2 mt-1 text-xs">
                                        {shop.review_count > 0 ? (
                                            <div className="flex items-center text-yellow-500 font-bold">
                                                <FontAwesomeIcon icon={faStar} className="mr-1" />
                                                <span>{Number(shop.avg_rating).toFixed(1)}</span>
                                                <span className="text-gray-500 font-normal ml-1">({shop.review_count} Reviews)</span>
                                            </div>
                                        ) : (
                                            <span className="text-[#16a34a] font-bold bg-green-50 border border-green-200 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider flex items-center gap-1">
                                                <FontAwesomeIcon icon={faBolt} className="text-yellow-500" /> NEW SHOP
                                            </span>
                                        )}
                                        <span className="text-gray-300">&bull;</span>
                                        <span className="text-gray-500 truncate">{shop.services_completed || "500+"} Services</span>
                                    </div>
                                </div>
                                
                                <button className="text-gray-400 hover:text-red-500 transition-colors shrink-0 pt-1">
                                    <FontAwesomeIcon icon={faHeart} className="text-lg" />
                                </button>
                            </div>

                            {/* Row 2: Address */}
                            <div className="flex items-center gap-1.5 mt-2.5 text-xs text-gray-600 truncate w-full">
                                <FontAwesomeIcon icon={faLocationDot} className="text-gray-400 shrink-0" />
                                <span className="truncate">{shop.location_text}</span>
                            </div>

                            {/* Row 3: Distance & Time */}
                            <div className="flex items-center gap-4 mt-1.5 text-xs">
                                <div className="flex items-center gap-1.5 font-bold text-[#16a34a] shrink-0">
                                    <FontAwesomeIcon icon={faRoute} />
                                    <span>{shop.distance_km} km away</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-500 shrink-0">
                                    <FontAwesomeIcon icon={faClock} className="text-gray-400" />
                                    <span>Opens {shop.opening_time || "8:00 AM"}</span>
                                </div>
                            </div>

                            {/* Row 4: Tags */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2.5 overflow-hidden h-[24px]">
                                {shop.tags.map((tag) => (
                                    <span key={tag} className="shrink-0 flex items-center gap-1.5 rounded bg-gray-50 px-2 py-1 text-[10px] font-bold text-gray-700 border border-gray-200">
                                        <FontAwesomeIcon icon={getTagIcon(tag)} className="text-gray-400" />
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* BOTTOM SECTION */}
                        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                            <div className="hidden lg:flex items-center gap-4 text-[10px] font-bold text-[#16a34a] truncate">
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <FontAwesomeIcon icon={faMessage} />
                                    <span>Within {formatResponseTime(shop.response_time)}</span>
                                </div>
                                {Boolean(shop.is_verified) && (
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <FontAwesomeIcon icon={faShieldHalved} />
                                        <span>Verified</span>
                                    </div>
                                )}
                            </div>
                            
                            <button 
                                onClick={() => navigate(`/shop/${shop.id}`, { state: { distance: shop.distance_km } })} 
                                type="button" 
                                className="shrink-0 rounded-lg bg-[#16a34a] px-4 py-1.5 text-xs font-bold text-white transition hover:bg-[#14532d] active:scale-95 flex items-center gap-2 ml-auto"
                            >
                                View Shop &rarr;
                            </button>
                        </div>

                    </div>
                </article>
            ))}
        </div>
    );
}