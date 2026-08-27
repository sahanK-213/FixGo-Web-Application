import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStore,
  faTag,
  faUser,
  faCar,
  faEnvelope,
  faPhone,
  faLocationDot,
  faClipboardList,
  faWrench,
  faFileLines,
  faPenToSquare,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { UPLOADS_URL } from "../../../src/services/api";

export const VEHICLE_CAT_OPTIONS = [
  "3 Wheelers & Bikes",
  "4 Wheelers",
  "Commercial Vehicles"
];

function ShopInfoTab({
  shopData,
  isEditingBusinessInfo,
  setIsEditingBusinessInfo,
  businessForm,
  handleBusinessFormChange,
  handleVehicleCatToggle,
  businessSaving,
  businessError,
  handleSaveBusinessInfo,
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <h3 className="font-extrabold text-lg text-slate-900 m-0">
          Shop Information
        </h3>
        {!isEditingBusinessInfo ? (
          <button
            type="button"
            onClick={() => setIsEditingBusinessInfo(true)}
            className="py-2 px-4 rounded-xl border border-green-600 bg-white text-green-600 font-semibold text-xs cursor-pointer hover:bg-green-50 flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <FontAwesomeIcon icon={faPenToSquare} /> Edit Information
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingBusinessInfo(false)}
            className="py-2 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-xs cursor-pointer hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
      </div>

      {!isEditingBusinessInfo ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
          {/* Left Key-Value List */}
          <div className="space-y-3.5 divide-y divide-slate-100">
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium flex items-center gap-2">
                <FontAwesomeIcon icon={faStore} className="text-slate-400" /> Shop Name
              </span>
              <span className="text-slate-900 font-bold">{shopData.name}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium flex items-center gap-2">
                <FontAwesomeIcon icon={faTag} className="text-slate-400" /> Category
              </span>
              <span className="text-slate-900 font-bold">{shopData.categories || "Garages"}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium flex items-center gap-2">
                <FontAwesomeIcon icon={faUser} className="text-slate-400" /> Owner
              </span>
              <span className="text-slate-900 font-bold">{shopData.owner}</span>
            </div>

            <div className="flex items-start justify-between pt-2">
              <span className="text-slate-500 font-medium flex items-center gap-2">
                <FontAwesomeIcon icon={faCar} className="text-slate-400" /> Vehicle Categories
              </span>
              <span className="text-slate-900 font-bold text-right max-w-[60%] leading-relaxed">
                {shopData.vehicleCategories || "3 Wheelers & Bikes, 4 Wheelers, Commercial Vehicles"}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium flex items-center gap-2">
                <FontAwesomeIcon icon={faEnvelope} className="text-slate-400" /> Email (Read-Only)
              </span>
              <span className="text-slate-900 font-bold">{shopData.email}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium flex items-center gap-2">
                <FontAwesomeIcon icon={faPhone} className="text-slate-400" /> Phone
              </span>
              <span className="text-slate-900 font-bold">{shopData.contactNumber}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium flex items-center gap-2">
                <FontAwesomeIcon icon={faLocationDot} className="text-slate-400" /> Address (Read-Only)
              </span>
              <span className="text-slate-900 font-bold">{shopData.address}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium flex items-center gap-2">
                <FontAwesomeIcon icon={faClipboardList} className="text-slate-400" /> Reg. No. (Read-Only)
              </span>
              <span className="text-slate-900 font-bold">{shopData.BRN || "Not Available"}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium flex items-center gap-2">
                <FontAwesomeIcon icon={faFileLines} className="text-slate-400" /> Verification Doc
              </span>
              {shopData.verification_document ? (
                <a
                  href={`${UPLOADS_URL}/${shopData.verification_document}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 font-bold hover:underline inline-flex items-center gap-1"
                >
                  View Document ↗
                </a>
              ) : (
                <span className="text-slate-400 font-medium">Not Uploaded</span>
              )}
            </div>
          </div>

          {/* Right Key-Value List */}
          <div className="space-y-5">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-semibold flex items-center gap-2">
                <FontAwesomeIcon icon={faWrench} className="text-slate-400" /> Carriage Service
              </span>
              <span className={`font-bold py-0.5 px-3 rounded-full text-xs ${
                shopData.carriageService ? "bg-green-100 text-green-600" : "bg-slate-200 text-slate-700"
              }`}>
                {shopData.carriageService ? "Available" : "Not Available"}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <span className="text-slate-600 font-semibold block flex items-center gap-2">
                <FontAwesomeIcon icon={faFileLines} className="text-slate-400" /> Description
              </span>
              <p className="text-slate-700 leading-relaxed text-xs m-0">
                {shopData.description || "We provide high-quality vehicle repair and maintenance services with experienced technicians and modern equipment. Your vehicle's safety and performance are our top priority."}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Edit Business Info Form */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-600 font-semibold block mb-1">Shop Name *</label>
              <input
                type="text"
                name="name"
                value={businessForm.name}
                onChange={handleBusinessFormChange}
                className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 box-border"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-semibold block mb-1">Owner *</label>
              <input
                type="text"
                name="owner"
                value={businessForm.owner}
                onChange={handleBusinessFormChange}
                className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 box-border"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="py-1">
              <span className="text-xs text-slate-500 font-semibold block">Category (Read-Only)</span>
              <span className="text-xs text-slate-800 font-medium">{shopData.categories || "Garages"}</span>
            </div>

            <div className="py-1">
              <span className="text-xs text-slate-500 font-semibold block">Email (Read-Only)</span>
              <span className="text-xs text-slate-800 font-medium">{shopData.email}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-600 font-semibold block mb-1">Phone *</label>
              <input
                type="text"
                name="phone"
                value={businessForm.phone}
                onChange={handleBusinessFormChange}
                placeholder="e.g. +94123456789 or 0123456789"
                className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 box-border"
              />
            </div>

            <div className="py-1">
              <span className="text-xs text-slate-500 font-semibold block">Reg. No. (BRN) (Read-Only)</span>
              <span className="text-xs text-slate-800 font-medium">{shopData.BRN || "Not Available"}</span>
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-500 font-semibold block mb-1">Address (Read-Only)</span>
            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800">
              {shopData.address}
            </div>
          </div>

          {/* Editable Description Textarea */}
          <div>
            <label className="text-xs text-slate-600 font-semibold block mb-1">Shop Description</label>
            <textarea
              name="description"
              rows="3"
              value={businessForm.description}
              onChange={handleBusinessFormChange}
              placeholder="Describe your shop services, technicians, and equipment..."
              className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 box-border leading-relaxed"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 font-semibold block mb-1">Supported Vehicle Categories</label>
            <div className="flex flex-wrap gap-4 mt-2">
              {VEHICLE_CAT_OPTIONS.map(vCat => (
                <label key={vCat} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={businessForm.vehicleCategories.includes(vCat)}
                    onChange={() => handleVehicleCatToggle(vCat)}
                    className="rounded text-green-600 focus:ring-green-500"
                  />
                  {vCat}
                </label>
              ))}
            </div>
          </div>

          {businessError && <p className="text-red-600 text-xs font-semibold">{businessError}</p>}

          <button
            type="button"
            onClick={handleSaveBusinessInfo}
            disabled={businessSaving}
            className="mt-2 w-full py-2.5 rounded-xl bg-green-600 text-white font-semibold text-xs cursor-pointer hover:bg-green-600 shadow-2xs"
          >
            {businessSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}

export default ShopInfoTab;
