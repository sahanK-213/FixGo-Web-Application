import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation, faSpinner, faXmark } from "@fortawesome/free-solid-svg-icons";

const FONT = "'Segoe UI', system-ui, sans-serif";

export const DeclineModal = ({ shopName, refId, onConfirm, onCancel, isLoading }) => (
    <div
        className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center p-5"
        style={{ backdropFilter: "blur(4px)", animation: "fadeIn 0.15s ease" }}
    >
        <div
            className="bg-white rounded-[20px] py-8 px-7 max-w-[420px] w-full flex flex-col items-center gap-4"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.18)", animation: "slideUp 0.2s ease" }}
        >
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <FontAwesomeIcon icon={faTriangleExclamation} className="text-2xl text-red-600" />
            </div>

            <div className="text-center">
                <p className="text-[17px] font-bold text-gray-900 mb-2 mt-0">
                    Decline this booking?
                </p>
                <p className="text-[13px] text-gray-500 m-0 leading-relaxed">
                    You're about to decline the booking from{" "}
                    <strong className="text-gray-700">{shopName || "this shop"}</strong>
                    {refId && <> ({refId})</>}.
                    <br />This action cannot be undone.
                </p>
            </div>

            <div className="w-full h-px bg-gray-200" />

            <div className="flex gap-2.5 w-full">
                <button
                    onClick={onCancel}
                    disabled={isLoading}
                    className={`flex-1 py-[11px] rounded-xl border-[1.5px] border-gray-200 bg-white text-gray-700 text-sm font-semibold transition-all duration-150 ${isLoading ? "cursor-not-allowed" : "cursor-pointer"}`}
                    style={{ fontFamily: FONT }}
                >
                    Keep Booking
                </button>
                <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className={`flex-1 py-[11px] rounded-xl border-none text-sm font-bold transition-all duration-150 flex items-center justify-center gap-2
                        ${isLoading ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-red-600 text-white cursor-pointer"}`}
                    style={{ fontFamily: FONT }}
                >
                    {isLoading
                        ? <><FontAwesomeIcon icon={faSpinner} spin /> Declining…</>
                        : <><FontAwesomeIcon icon={faXmark} /> Yes, Decline</>
                    }
                </button>
            </div>
        </div>

        <style>{`
            @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
            @keyframes slideUp { from { transform: translateY(16px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        `}</style>
    </div>
);
