import { FaCheckCircle, FaStar, FaWrench, FaShieldAlt, FaSmile, FaClock, FaMapMarkerAlt, FaPhoneAlt, FaTruckPickup, FaFlag } from "react-icons/fa";

const formatTime = (timeStr) => {
  if (!timeStr) return "N/A";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  const hour = parseInt(parts[0], 10);
  const min = parts[1];
  const ampm = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${min} ${ampm}`;
};

export const ShopInfo = ({ info, stats, shopCategories, vehicleCategories, passedDistance, isFullyUnlocked, onReportGarage }) => {
  const isOpenNow = info.is_open_now !== undefined ? info.is_open_now : (info.isAvailable == 1);
  const statusText = info.open_status_text || (info.isAvailable ? "Open Now" : "Currently Busy");

  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
      {/* Title & Verified Badge + Report Garage Option */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{info.name}</h1>
          <span className="flex items-center gap-1.5 rounded-full bg-[#16a34a] px-3 py-1 text-xs font-bold text-white shadow-sm">
            <FaCheckCircle className="text-white/90" /> Verified
          </span>
        </div>

        {onReportGarage && (
          <button
            onClick={onReportGarage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            title="Report this garage to platform moderation"
          >
            <FaFlag className="text-red-500 text-xs" />
            <span>Report Garage</span>
          </button>
        )}
      </div>

      {/* Rating Row */}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-[14px]">
        <span className="text-[17px] font-extrabold text-slate-900">{stats.averageRating}</span>
        <div className="flex items-center text-yellow-400 text-sm gap-0.5">
          {[...Array(5)].map((_, i) => (
             <FaStar key={i} className={i < Math.round(stats.averageRating) ? "text-yellow-400" : "text-slate-200"} />
          ))}
        </div>
        <span className="text-slate-500 font-medium ml-1">({stats.reviewCount} reviews)</span>
        <span className="text-slate-300">•</span>
        <span className="font-semibold text-slate-600">{stats.recommendPercentage}% recommend</span>
      </div>

      {/* Dynamic Categories (Pills) */}
      <div className="mt-6 flex flex-wrap gap-2">
        {shopCategories && shopCategories.map((category, idx) => (
          <span key={`sc-${idx}`} className="rounded-full bg-green-50 px-4 py-1.5 text-[13px] font-bold text-green-700 border border-green-100">
            {category}
          </span>
        ))}
        {vehicleCategories && vehicleCategories.map((vehicle, idx) => (
          <span key={`vc-${idx}`} className="rounded-full bg-slate-50 px-4 py-1.5 text-[13px] font-semibold text-slate-600 border border-slate-200">
            {vehicle}
          </span>
        ))}
        {(!shopCategories?.length && !vehicleCategories?.length) && (
           <span className="text-sm text-slate-400 italic">Categories not specified</span>
        )}
      </div>

      {/* Tow Truck Banner */}
      {info.carriageService == 1 && (
        <div className="mt-6 flex items-center gap-4 rounded-xl bg-green-50 border border-green-100/80 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100/80">
            <FaTruckPickup className="text-lg text-green-600" />
          </div>
          <p className="text-[14.5px] leading-relaxed text-slate-700 font-medium m-0">
            <strong className="font-bold text-slate-900 mr-1">Pickup Available.</strong>
            We offer tow truck transport and pickup services for all supported vehicle types.
          </p>
        </div>
      )}

      {/* Description */}
      <p className="mt-6 text-[15px] leading-relaxed text-slate-600 m-0">
        {info.description || "No description provided."}
      </p>

      {/* Info Grid */}
      <div className="mt-8 mb-8 border-t border-slate-100 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-6 items-start">
          {/* Col 1: Distance */}
          <div className="col-span-1 flex items-center gap-2.5">
            {passedDistance && (
              <>
                <FaMapMarkerAlt className="text-red-600 text-[18px] shrink-0" />
                <span className="font-medium text-slate-600 text-[15px]">
                  {typeof passedDistance === 'string' && passedDistance.includes('km') 
                    ? passedDistance 
                    : parseFloat(passedDistance) > 100 
                      ? (parseFloat(passedDistance) / 1000).toFixed(1) + ' km' 
                      : parseFloat(passedDistance).toFixed(1) + ' km'} away
                </span>
              </>
            )}
          </div>
          {/* Col 2: Status */}
          <div className="col-span-1 flex items-center gap-2.5">
            <div className={`h-2.5 w-2.5 rounded-full ${isOpenNow ? 'bg-green-600' : 'bg-red-500'}`}></div>
            <span className={`font-bold text-[15px] ${isOpenNow ? 'text-green-600' : 'text-red-600'}`}>
              {statusText}
            </span>
            {isOpenNow && info.closeTime && (
              <span className="text-slate-500 text-[14px] font-medium ml-1">
                Closes at {formatTime(info.closeTime)}
              </span>
            )}
          </div>
          {/* Col 3: Schedule */}
          <div className="col-span-1 flex items-start gap-3">
            <FaClock className="text-slate-500 mt-0.5 text-[18px] shrink-0" />
            <div className="flex flex-col text-[14px] text-slate-700 font-medium leading-snug">
              <span>Everyday {formatTime(info.openTime)} - {formatTime(info.closeTime)}</span>
            </div>
          </div>
          {/* Col 1 & 2: Address */}
          <div className="md:col-span-2 flex items-start gap-2.5">
            <FaMapMarkerAlt className="text-red-600 mt-0.5 text-[18px] shrink-0" />
            <p className={`text-[15px] pr-6 leading-snug m-0 ${!isFullyUnlocked ? "text-slate-500 font-medium italic" : "text-slate-700 font-medium"}`}>
              {info.location}
            </p>
          </div>
          {/* Col 3: Phone */}
          <div className="col-span-1 flex items-start gap-3">
            <FaPhoneAlt className="text-slate-700 mt-0.5 text-[17px] shrink-0" />
            <div>
              <p className={`text-[15px] leading-snug m-0 ${!isFullyUnlocked ? "text-slate-500 font-medium italic" : "text-slate-800 font-bold tracking-wide"}`}>
                {info.phone}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-6 border-t border-slate-100">
        <div className="rounded-xl border border-slate-200 bg-white p-4.5 flex flex-col justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-50 mb-3">
            <FaWrench className="text-green-600 text-lg" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900 leading-none mb-1">{stats.jobsCompleted}</h3>
            <p className="text-xs font-medium text-slate-500 m-0">Jobs Completed</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4.5 flex flex-col justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-50 mb-3">
            <FaStar className="text-green-600 text-lg" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900 leading-none mb-1">{stats.averageRating}</h3>
            <p className="text-xs font-medium text-slate-500 m-0">Rating</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4.5 flex flex-col justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-50 mb-3">
            <FaShieldAlt className="text-green-600 text-lg" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900 leading-none mb-1">{stats.yearsExperience}</h3>
            <p className="text-xs font-medium text-slate-500 m-0">Years Experience</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4.5 flex flex-col justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-50 mb-3">
            <FaSmile className="text-green-600 text-lg" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900 leading-none mb-1">{stats.completionRate}</h3>
            <p className="text-xs font-medium text-slate-500 m-0">Completion</p>
          </div>
        </div>
      </div>
    </div>
  );
};
