import { UPLOADS_URL } from "../../../src/services/api";

function RequestDetailsModal({ selectedRequest, setSelectedRequest, shopCategory }) {
  if (!selectedRequest) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/55 flex justify-center items-center z-[999] p-5">
      <div className="bg-white w-[600px] max-w-full max-h-[85vh] overflow-y-auto rounded-[20px] p-7 shadow-[0_24px_48px_rgba(15,23,42,0.25)]">
        <h2 className="m-0 mb-5 text-xl font-bold text-slate-900">
          Service Request Details
        </h2>

        <div className="flex flex-col gap-3 mb-4">
          <div>
            <div className="text-[13px] font-semibold text-slate-500 uppercase tracking-[0.4px]">
              Customer
            </div>
            <div className="text-[16.5px] text-slate-900 mt-0.5">
              {selectedRequest.customer_name}
            </div>
          </div>

          <div>
            <div className="text-[13px] font-semibold text-slate-500 uppercase tracking-[0.4px]">
              Issue
            </div>
            <div className="text-[16.5px] text-slate-900 mt-0.5">
              {selectedRequest.issue_category}
            </div>
          </div>

          {shopCategory === "Service Centers" && (
            <div>
              <div className="text-[13px] font-semibold text-slate-500 uppercase tracking-[0.4px]">
                Appointment
              </div>

              <div className="text-[16.5px] text-slate-900 mt-0.5">
                {selectedRequest.preferred_date
                  ? `${selectedRequest.preferred_date} • ${selectedRequest.preferred_time}`
                  : "Not specified"}
              </div>
            </div>
          )}

          <div>
            <div className="text-[13px] font-semibold text-slate-500 uppercase tracking-[0.4px] mb-1.5">
              Description
            </div>
            <div className="bg-slate-50 border border-[#E5E9F0] p-3.5 rounded-[10px] text-[15px] text-slate-900 leading-relaxed">
              {selectedRequest.description}
            </div>
          </div>
        </div>

        {selectedRequest.photo && (
          <img
            src={`${UPLOADS_URL}/${selectedRequest.photo}`}
            alt="Problem"
            className="w-full rounded-xl mt-1.5 border border-[#E5E9F0]"
          />
        )}

        <div className="flex gap-2.5 mt-6">
          <button
            onClick={() => setSelectedRequest(null)}
            className="py-2.5 px-6 bg-green-700 text-white border-none rounded-[10px] font-semibold text-[15px] cursor-pointer transition-colors duration-150 ease-in-out hover:bg-[#116530]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default RequestDetailsModal;
