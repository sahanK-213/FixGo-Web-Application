import { FaCheckCircle } from "react-icons/fa";

export const ShopSidebar = ({ shopCategories, isFullyUnlocked, info, handleGetDirections, setIsModalOpen }) => {
  return (
    <div className="lg:col-span-1 space-y-6">
      {/* 1. Book a Service Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-slate-900 m-0">Book a Service</h3>
        {shopCategories?.includes("Spare Parts") ? (
          <div className="space-y-3 mt-4">
            <button 
              disabled 
              className="w-full rounded-xl bg-slate-100 py-3 text-slate-400 font-semibold cursor-not-allowed border border-slate-200 transition text-sm"
            >
              Service Unavailable
            </button>
            <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-xs text-amber-700 leading-snug m-0">
                <strong className="font-bold">Note:</strong> Online service requests are not available for retail Spare Parts shops. Please contact the shop directly for part inquiries.
              </p>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="w-full rounded-xl bg-green-600 py-3 text-white font-bold hover:bg-green-700 transition shadow-sm active:scale-95 text-sm cursor-pointer mt-4"
          >
            Request Service
          </button>
        )}
      </div>

      {/* 2. Shop Location Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-slate-900 m-0">Shop Location</h3>
        <div className="overflow-hidden rounded-xl bg-slate-100 relative group border border-slate-200">
          <iframe 
            title="shop-location" 
            src={`https://maps.google.com/maps?q=${encodeURIComponent(info.mapQuery)}&t=&z=${isFullyUnlocked ? 15 : 14}&ie=UTF8&iwloc=&output=embed`} 
            className="h-56 w-full" 
            loading="lazy"
          />
          {!isFullyUnlocked && (
            <div 
               className="absolute inset-0 z-10 bg-transparent cursor-not-allowed" 
               title="Complete booking to unlock interactive map"
            ></div>
          )}
        </div>
        
        <button 
          disabled={!isFullyUnlocked} 
          onClick={handleGetDirections}
          className={`mt-4 w-full rounded-xl py-3 font-bold text-sm transition cursor-pointer ${isFullyUnlocked ? 'bg-green-600 text-white hover:bg-green-700 active:scale-95 shadow-sm' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'}`}
        >
          {isFullyUnlocked ? "Get Directions" : "Directions Locked"}
        </button>
      </div>

      {/* 3. Why Choose Us Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-slate-900 m-0">Why Choose Us?</h3>
        <div className="space-y-3.5 text-xs sm:text-sm">
          <div className="flex items-center gap-3">
            <FaCheckCircle className="text-green-600 text-base shrink-0" />
            <span className="font-semibold text-slate-700">Certified Technicians</span>
          </div>
          <div className="flex items-center gap-3">
            <FaCheckCircle className="text-green-600 text-base shrink-0" />
            <span className="font-semibold text-slate-700">Modern Diagnostics</span>
          </div>
          <div className="flex items-center gap-3">
            <FaCheckCircle className="text-green-600 text-base shrink-0" />
            <span className="font-semibold text-slate-700">Transparent Pricing</span>
          </div>
        </div>
      </div>
    </div>
  );
};
