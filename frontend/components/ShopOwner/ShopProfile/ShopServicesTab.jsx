export const COMMON_CATEGORIES = [
  "Mechanical",
  "Electrical",
  "Maintenance",
  "Detailing",
  "Parts Supply",
  "Towing",
  "General"
];

function ShopServicesTab({
  isEditingServices,
  setIsEditingServices,
  shopServices,
  handleRemoveService,
  servicesSaving,
  newService,
  setNewService,
  handleAddCustomService,
  handleSaveServices,
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <h3 className="font-extrabold text-lg text-slate-900 m-0 flex items-center gap-2">
          <span>🔧</span> Services Offered
        </h3>
      </div>

      {!isEditingServices ? (
        <>
          {shopServices.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {shopServices.map((s, idx) => (
                <div key={idx} className="p-4 border border-slate-200/70 rounded-xl bg-slate-50/60 flex justify-between items-center hover:border-green-200 transition-colors">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-green-600 bg-green-100/80 px-2 py-0.5 rounded-md border border-green-200/50">
                      {s.category || "General"}
                    </span>
                    <div className="font-bold text-sm text-slate-900 mt-1.5">{s.service_name || s.name}</div>
                    <div className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1">
                      <span>⏱️</span> {s.duration}
                    </div>
                  </div>
                  <div className="font-bold text-xs text-green-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                    {s.starting_price || s.price}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic mb-4">No custom services added yet.</p>
          )}
          <button
            type="button"
            onClick={() => setIsEditingServices(true)}
            className="mt-6 py-2.5 px-6 rounded-xl border-[1.5px] border-green-600 text-green-600 bg-white font-semibold text-xs cursor-pointer hover:bg-green-50 transition-colors shadow-2xs"
          >
            + Add / Edit Services
          </button>
        </>
      ) : (
        <div>
          <p className="text-xs text-slate-500 mb-4 font-medium">Manage custom services for your workshop:</p>

          {/* Added Services List */}
          <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-1">
            {shopServices.map((s, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="font-extrabold text-green-600 mr-2">[{s.category || "General"}]</span>
                  <span className="font-semibold text-slate-900">{s.service_name || s.name}</span>
                  <span className="text-slate-500 ml-2">({s.starting_price || s.price} • {s.duration})</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveService(idx)}
                  disabled={servicesSaving}
                  className="text-red-600 hover:text-red-800 font-bold border-none bg-transparent cursor-pointer text-xs flex items-center gap-1"
                >
                  ✕ Remove
                </button>
              </div>
            ))}
            {shopServices.length === 0 && (
              <p className="text-xs text-slate-400 italic">No services in your list. Fill out below to add your first service.</p>
            )}
          </div>

          {/* Add Custom Service Form */}
          <div className="p-4 bg-green-50/40 rounded-xl border border-green-200/80 space-y-3 mb-6">
            <div className="font-bold text-xs text-green-900 flex items-center gap-1">
              <span>+</span> Add New Custom Service
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Category *</label>
                <input
                  type="text"
                  list="category-suggestions"
                  placeholder="e.g. Mechanical, Electrical"
                  value={newService.category}
                  onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-green-500 box-border"
                />
                <datalist id="category-suggestions">
                  {COMMON_CATEGORIES.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Service Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Full Engine Tune-up"
                  value={newService.service_name}
                  onChange={(e) => setNewService({ ...newService, service_name: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-green-500 box-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Starting Price</label>
                <input
                  type="text"
                  placeholder="e.g. Rs. 8,500"
                  value={newService.starting_price}
                  onChange={(e) => setNewService({ ...newService, starting_price: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-green-500 box-border"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Duration</label>
                <input
                  type="text"
                  placeholder="e.g. 3 Hours"
                  value={newService.duration}
                  onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-green-500 box-border"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddCustomService}
              disabled={servicesSaving}
              className={`w-full py-2.5 text-white font-bold text-xs rounded-xl border-none shadow-2xs transition-colors ${
                servicesSaving ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-600 cursor-pointer"
              }`}
            >
              {servicesSaving ? "Saving..." : "+ Add Service to List"}
            </button>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSaveServices}
              disabled={servicesSaving}
              className="flex-1 py-2.5 rounded-xl bg-green-600 text-white font-semibold text-xs cursor-pointer hover:bg-green-600 shadow-2xs"
            >
              {servicesSaving ? "Saving..." : "Save All Services"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditingServices(false)}
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

export default ShopServicesTab;
