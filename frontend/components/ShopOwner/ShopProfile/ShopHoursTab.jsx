function ShopHoursTab({
  shopData,
  isCurrentlyOpen,
  handleToggleAvailability,
  isEditingHours,
  setIsEditingHours,
  formatTime,
  businessForm,
  setBusinessForm,
  handleBusinessFormChange,
  businessSaving,
  businessError,
  handleSaveBusinessInfo,
}) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6 pb-4 border-b border-slate-100 w-full min-w-0">
        <div className="min-w-0 flex-1 w-full sm:w-auto">
          <h3 className="font-extrabold text-base sm:text-lg text-slate-900 m-0 flex items-center gap-2">
            <span>⏰</span> Operating Hours
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500 min-w-0">
            <span className="text-xs text-slate-500 shrink-0">Current Availability:</span>
            <button
              type="button"
              onClick={() => handleToggleAvailability(isCurrentlyOpen ? 0 : 1)}
              className={`py-1 px-3 rounded-full text-[11px] sm:text-xs font-bold border transition-all cursor-pointer whitespace-normal break-words max-w-full text-center ${
                isCurrentlyOpen
                  ? "bg-green-100/90 text-green-600 border-green-300 hover:bg-green-200"
                  : "bg-red-100 text-red-700 border-red-300 hover:bg-red-200"
              }`}
            >
              {isCurrentlyOpen ? "🟢 OPEN FOR BUSINESS" : "🔴 CLOSED FOR BUSINESS"}
            </button>
          </div>
        </div>

        {!isEditingHours ? (
          <button
            type="button"
            onClick={() => setIsEditingHours(true)}
            className="w-full sm:w-auto justify-center py-2 px-4 rounded-xl border border-green-600 bg-white text-green-600 font-semibold text-xs cursor-pointer hover:bg-green-50 flex items-center gap-1.5 transition-all shadow-2xs shrink-0 mt-1 sm:mt-0"
          >
            <span>✏️</span> Edit Hours
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingHours(false)}
            className="w-full sm:w-auto justify-center py-2 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-xs cursor-pointer hover:bg-slate-50 shrink-0 mt-1 sm:mt-0"
          >
            Cancel
          </button>
        )}
      </div>

      {!isEditingHours ? (
        <div className="divide-y divide-slate-100 text-sm max-w-2xl w-full min-w-0">
          <div className="py-3.5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4 w-full min-w-0">
            <span className="font-semibold text-slate-800 text-sm">Everyday</span>
            <span className="font-bold text-slate-900 text-xs sm:text-sm whitespace-normal break-words">
              {formatTime(shopData?.openTime)} - {formatTime(shopData?.closeTime)}
            </span>
          </div>
        </div>
      ) : (
        /* Everyday Hours Edit Form */
        <div className="max-w-xl space-y-4 sm:space-y-6 w-full min-w-0">
          <div className="p-3.5 sm:p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3 w-full min-w-0">
            <span className="font-bold text-xs text-slate-900 block">Everyday Operating Hours</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full min-w-0">
              <div>
                <label className="text-[11px] text-slate-600 font-semibold block mb-1">Open Time</label>
                <input
                  type="time"
                  name="openTime"
                  value={businessForm.openTime}
                  onChange={handleBusinessFormChange}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-green-500 box-border"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 font-semibold block mb-1">Close Time</label>
                <input
                  type="time"
                  name="closeTime"
                  value={businessForm.closeTime}
                  onChange={handleBusinessFormChange}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-green-500 box-border"
                />
              </div>
            </div>
          </div>

          {businessError && <p className="text-red-600 text-xs font-semibold">{businessError}</p>}

          <button
            type="button"
            onClick={handleSaveBusinessInfo}
            disabled={businessSaving}
            className="w-full py-2.5 rounded-xl bg-green-600 text-white font-semibold text-xs cursor-pointer hover:bg-green-600 shadow-2xs"
          >
            {businessSaving ? "Saving..." : "Save Operating Hours"}
          </button>
        </div>
      )}
    </div>
  );
}

export default ShopHoursTab;
