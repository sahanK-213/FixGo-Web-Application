import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { FaStar } from "react-icons/fa";

export const ShopReviews = ({ stats, activeSort, setActiveSort, activeFilter, setActiveFilter, processedReviews }) => {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-slate-900 m-0">Customer Reviews</h2>
            {stats.averageRating && (
              <span className="inline-flex items-center gap-1 text-sm font-extrabold text-slate-900 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg">
                {stats.averageRating} <FaStar className="text-yellow-500 text-xs" />
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-slate-500 mt-1 m-0">
            Based on {stats.reviewCount} {stats.reviewCount === 1 ? "review" : "reviews"} • {stats.recommendPercentage}% recommend
          </p>
        </div>
        
        {/* Sort Dropdown */}
        <select 
          value={activeSort} 
          onChange={(e) => setActiveSort(e.target.value)} 
          className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 focus:border-green-500 outline-none cursor-pointer bg-white shadow-2xs self-start sm:self-auto"
        >
          <option>Most Recent</option>
          <option>Highest Rated</option>
          <option>Lowest Rated</option>
        </select>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {["All", "5 Stars", "4 Stars", "3 Stars", "2 Stars", "1 Star"].map(filter => (
          <button 
            key={filter} 
            onClick={() => setActiveFilter(filter)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${activeFilter === filter ? 'bg-green-600 text-white border-transparent shadow-xs' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            {filter === "All" ? `All (${stats.reviewCount})` : filter}
          </button>
        ))}
      </div>

      {/* Filtered Reviews Output */}
      {processedReviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-1">
          {processedReviews.map((review, i) => (
            <div key={i} className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 transition-all">
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white shrink-0">
                      {review.name.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900 m-0">{review.name}</p>
                      <div className="mt-0.5 flex items-center gap-0.5 text-yellow-400 text-xs">
                        {Array.from({ length: parseInt(review.rating) }).map((_, index) => (
                          <FontAwesomeIcon key={index} icon={faStar} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-400 shrink-0">{review.date}</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-600 m-0">{review.summary}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-10 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-xs font-medium text-slate-500 m-0">No reviews match this filter.</p>
        </div>
      )}
    </div>
  );
};
