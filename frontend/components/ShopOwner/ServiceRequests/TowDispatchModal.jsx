import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTruck, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

function TowField({ label, value, onChange, type = "text", placeholder, disabled, min }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-semibold text-slate-500 uppercase tracking-[0.4px]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        disabled={disabled}
        min={min}
        className="py-2.5 px-3.5 rounded-[10px] border border-[#E5E9F0] text-[15px] text-slate-900 outline-none bg-slate-50 focus:border-blue-600"
      />
    </label>
  );
}

function TowDispatchModal({
  showTowModal,
  towTruck,
  setTowTruck,
  isAcceptFlow,
  isCalculatingEta,
  minEta,
  etaError,
  setEtaError,
  setShowTowModal,
  setIsAcceptFlow,
  saveTowTruckDetails,
  confirmTowAndAccept,
}) {
  if (!showTowModal || !towTruck) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/55 flex justify-center items-center z-[1000] p-5">
      <div className="bg-white w-[480px] max-w-full rounded-2xl overflow-hidden shadow-[0_24px_48px_rgba(15,23,42,0.25)]">
        {/* Header */}
        <div className="py-5 px-7 border-b border-[#E5E9F0] flex items-center gap-3">
          <div className="w-[38px] h-[38px] rounded-[10px] bg-blue-100 flex items-center justify-center text-lg shrink-0 text-blue-600">
            <FontAwesomeIcon icon={faTruck} />
          </div>
          <div>
            <h2 className="m-0 text-lg font-bold text-slate-900">
              Tow Truck Details
            </h2>
            <p className="m-0 text-[13.5px] text-slate-500 mt-0.5">
              {isAcceptFlow
                ? "Confirm dispatch info to accept this request"
                : "Dispatch info for this pickup"}
            </p>
          </div>
        </div>

        {/* Fields */}
        <div className="py-6 px-7 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3.5">
            <TowField
              label="Driver Name"
              value={towTruck.default_driver_name}
              onChange={(e) =>
                setTowTruck({ ...towTruck, default_driver_name: e.target.value })
              }
            />
            <TowField
              label="Driver Phone"
              value={towTruck.default_driver_phone}
              onChange={(e) =>
                setTowTruck({ ...towTruck, default_driver_phone: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <TowField
              label="Truck Brand"
              value={towTruck.default_truck_brand}
              onChange={(e) =>
                setTowTruck({ ...towTruck, default_truck_brand: e.target.value })
              }
            />
            <TowField
              label="Truck Color"
              value={towTruck.default_truck_color}
              onChange={(e) =>
                setTowTruck({ ...towTruck, default_truck_color: e.target.value })
              }
            />
          </div>

          <TowField
            label="Truck Plate"
            value={towTruck.tow_truck_plate}
            onChange={(e) =>
              setTowTruck({ ...towTruck, tow_truck_plate: e.target.value })
            }
          />

          <TowField
            label="Promised ETA (minutes)"
            type="number"
            placeholder={isCalculatingEta ? "Calculating Route..." : "e.g. 25"}
            value={isCalculatingEta ? "" : towTruck.promised_eta}
            disabled={isCalculatingEta}
            min={minEta}
            onChange={(e) => {
              setTowTruck({ ...towTruck, promised_eta: e.target.value });
              if (etaError) setEtaError("");
            }}
          />
        </div>

        {/* The Inline Warning Box */}
        {etaError && (
          <div className="mx-7 mb-5 py-3 px-4 bg-red-50 border border-red-200 rounded-[10px] text-red-600 text-[14.5px] font-medium flex items-center gap-2.5 animate-[fadeIn_0.2s_ease]">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-lg" />
            {etaError}
          </div>
        )}

        {/* Footer */}
        <div className="py-4 px-7 border-t border-[#E5E9F0] flex justify-end gap-2.5 bg-slate-50">
          <button
            onClick={() => {
              setShowTowModal(false);
              setIsAcceptFlow(false);
              setEtaError("");
            }}
            className="py-2.5 px-5 rounded-[10px] border border-[#E5E9F0] bg-white text-slate-500 font-semibold text-[14.5px] cursor-pointer hover:bg-slate-50"
          >
            Cancel
          </button>

          {isAcceptFlow ? (
            <button
              onClick={confirmTowAndAccept}
              className="py-2.5 px-5.5 rounded-[10px] border-none bg-green-700 text-white font-semibold text-[14.5px] cursor-pointer hover:bg-[#116530]"
            >
              Confirm
            </button>
          ) : (
            <button
              onClick={saveTowTruckDetails}
              className="py-2.5 px-5.5 rounded-[10px] border-none bg-blue-600 text-white font-semibold text-[14.5px] cursor-pointer hover:bg-blue-700"
            >
              Save Changes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TowDispatchModal;
