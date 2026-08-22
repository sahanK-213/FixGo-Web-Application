function ShopTowTab({
  hasTowService,
  showTowForm,
  setShowTowForm,
  towLoading,
  towDetails,
  towForm,
  handleTowFormChange,
  towError,
  setTowError,
  handleTowSave,
  towSaving,
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <h3 className="font-extrabold text-lg text-slate-900 m-0 flex items-center gap-2">
          <span>🚛</span> Tow Truck & Transportation Details
        </h3>
      </div>

      {!hasTowService && !showTowForm && (
        <div className="max-w-md py-4">
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            Do you provide tow truck or vehicle carriage services for customers in breakdown situations?
          </p>
          <button
            onClick={() => setShowTowForm(true)}
            className="py-2.5 px-5 rounded-xl border-none bg-green-600 text-white font-semibold text-xs cursor-pointer hover:bg-green-600 transition shadow-2xs"
          >
            Yes, I provide tow service
          </button>
        </div>
      )}

      {hasTowService && !showTowForm && (
        <div className="max-w-2xl">
          {towLoading ? (
            <p className="text-xs text-slate-500">Loading tow truck details...</p>
          ) : towDetails ? (
            <>
              <div className="divide-y divide-slate-100 text-xs">
                {[
                  ["Driver Name", towDetails.default_driver_name],
                  ["Driver Phone", towDetails.default_driver_phone],
                  ["Truck Brand", towDetails.default_truck_brand],
                  ["Truck Color", towDetails.default_truck_color],
                  ["Plate Number", towDetails.tow_truck_plate],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-3">
                    <span className="text-slate-500 font-medium">{k}</span>
                    <span className="text-slate-900 font-bold">{v || "—"}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowTowForm(true)}
                className="mt-6 py-2.5 px-5 rounded-xl border border-slate-300 text-slate-700 bg-white font-semibold text-xs cursor-pointer hover:bg-slate-50"
              >
                Edit Tow Truck Details
              </button>
            </>
          ) : (
            <p className="text-xs text-slate-500">No tow truck details found.</p>
          )}
        </div>
      )}

      {showTowForm && (
        <div className="max-w-md space-y-3">
          {[
            ["driverName", "Driver Name", "e.g. John Doe"],
            ["driverPhone", "Driver Phone", "e.g. +94 77 123 4567"],
            ["truckBrand", "Truck Brand", "e.g. Isuzu, Toyota"],
            ["truckColor", "Truck Color", "e.g. White, Blue"],
            ["truckPlate", "Plate Number", "e.g. WP GA-1234"],
          ].map(([name, label, placeholder]) => (
            <div key={name}>
              <label className="text-[11px] text-slate-600 font-semibold block mb-1">{label}</label>
              <input
                type="text"
                name={name}
                value={towForm[name]}
                onChange={handleTowFormChange}
                placeholder={placeholder}
                className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 box-border"
              />
            </div>
          ))}

          {towError && <p className="text-red-600 text-xs font-semibold">{towError}</p>}

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleTowSave}
              disabled={towSaving}
              className={`flex-1 py-2.5 rounded-xl border-none bg-green-600 text-white font-semibold text-xs ${
                towSaving ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:bg-green-600 shadow-2xs"
              }`}
            >
              {towSaving ? "Saving..." : "Save Details"}
            </button>
            <button
              onClick={() => { setShowTowForm(false); setTowError(""); }}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-xs cursor-pointer hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShopTowTab;
