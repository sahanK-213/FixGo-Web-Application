import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

function DeclineConfirmModal({
  requestPendingDecline,
  setRequestPendingDecline,
  isDeclining,
  confirmDecline,
}) {
  if (!requestPendingDecline) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/55 flex justify-center items-center z-[1000] p-5">
      <div className="bg-white w-[420px] max-w-full rounded-2xl overflow-hidden shadow-[0_24px_48px_rgba(15,23,42,0.25)]">
        {/* Header */}
        <div className="pt-5.5 px-6.5 pb-1 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-[10px] bg-red-50 border border-red-200 flex items-center justify-center text-[19px] shrink-0 text-red-600">
            <FontAwesomeIcon icon={faTriangleExclamation} />
          </div>
          <div>
            <h2 className="m-0 text-[17.5px] font-bold text-slate-900">
              Decline this request?
            </h2>
            <p className="m-0 mt-1.5 text-sm text-slate-500 leading-normal">
              {requestPendingDecline.customer_name
                ? `${requestPendingDecline.customer_name}'s request will be moved to Declined and they'll be notified. This action can't be undone.`
                : "This request will be moved to Declined and the customer will be notified. This action can't be undone."}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-5 px-6.5 pb-6 flex justify-end gap-2.5">
          <button
            onClick={() => setRequestPendingDecline(null)}
            disabled={isDeclining}
            className={`py-2.5 px-5 rounded-[10px] border border-[#E5E9F0] bg-white text-slate-500 font-semibold text-[14.5px] hover:bg-slate-50 ${
              isDeclining ? "cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            Cancel
          </button>

          <button
            onClick={confirmDecline}
            disabled={isDeclining}
            className={`py-2.5 px-5.5 rounded-[10px] border-none bg-red-600 text-white font-semibold text-[14.5px] hover:bg-[#B91C1C] ${
              isDeclining ? "cursor-not-allowed opacity-70" : "cursor-pointer opacity-100"
            }`}
          >
            {isDeclining ? "Declining..." : "Yes, Decline"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeclineConfirmModal;
