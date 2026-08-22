import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCar,
  faPalette,
  faTruck,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";

function Avatar({ initials, color, size = 40 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        background: color + "1A",
        color,
        fontSize: size * 0.34,
        borderColor: color + "33",
      }}
      className="rounded-full flex items-center justify-center font-bold shrink-0 border-[1.5px] tracking-[0.2px]"
    >
      {initials}
    </div>
  );
}

function RequestTable({
  visibleRequests,
  activeTab,
  setSelectedRequest,
  handleAcceptClick,
  handleDeclineClick,
}) {
  const [hoveredRow, setHoveredRow] = useState(null);

  return (
    <div className="bg-white rounded-[18px] border border-[#E5E9F0] overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.04)]">
      {/* Table Header */}
      <div
        className={`py-4 px-6 border-b border-[#E5E9F0] bg-slate-50 grid gap-2 ${
          activeTab === "new"
            ? "[grid-template-columns:2.2fr_1.5fr_1fr_1fr_1.5fr]"
            : "[grid-template-columns:2.2fr_1.5fr_1fr_2fr]"
        }`}
      >
        {(activeTab === "new"
          ? ["Customer & Vehicle", "Service", "Urgency", "Details", "Action"]
          : ["Customer & Vehicle", "Service", "Urgency", "Reason"]
        ).map((h) => (
          <span
            key={h}
            className="text-[12.5px] font-bold text-slate-500 uppercase tracking-[0.5px]"
          >
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      {visibleRequests.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-[14.5px]">
          {activeTab === "new"
            ? "No service requests found"
            : activeTab === "missed"
            ? "No missed opportunities"
            : "No declined requests"}
        </div>
      ) : (
        visibleRequests.map((r, i) => (
          <div
            key={r.id}
            onMouseEnter={() => setHoveredRow(r.id)}
            onMouseLeave={() => setHoveredRow(null)}
            className={`py-4.5 px-6 grid gap-2 items-center transition-colors duration-150 ease-in-out ${
              i < visibleRequests.length - 1 ? "border-b border-[#E5E9F0]" : ""
            } ${
              activeTab === "new"
                ? "[grid-template-columns:2.2fr_1.5fr_1fr_1fr_1.5fr]"
                : "[grid-template-columns:2.2fr_1.5fr_1fr_2fr]"
            } ${hoveredRow === r.id ? "bg-slate-50" : "bg-transparent"}`}
          >
            {/* Customer & Vehicle */}
            <div className="flex items-center gap-3.5">
              <Avatar
                initials={r.customer_name?.substring(0, 2).toUpperCase()}
                color={activeTab === "new" ? "#15803D" : "#94A3B8"}
              />

              <div>
                <div className="font-semibold text-base text-slate-900">
                  {r.customer_name}
                </div>

                <div className="text-sm text-slate-500 mt-0.5">
                  <FontAwesomeIcon icon={faCar} className="mr-1 text-slate-400" />{" "}
                  {r.vehicle_brand}
                </div>

                <div
                  className={`text-[13px] font-semibold mt-px ${
                    activeTab === "new" ? "text-green-700" : "text-slate-400"
                  }`}
                >
                  <FontAwesomeIcon icon={faPalette} className="mr-1 opacity-80" />{" "}
                  {r.vehicle_color}
                </div>
              </div>
            </div>

            {/* Service */}
            <div>
              <div className="text-[15.5px] text-slate-900 font-medium">
                {r.issue_category}
              </div>

              {activeTab === "new" && Number(r.requires_tow) === 1 && (
                <div className="mt-2 inline-block py-1 px-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                  <FontAwesomeIcon icon={faTruck} className="mr-1.5" /> Tow Truck Required
                </div>
              )}

              {activeTab === "new" && r.pickup_landmark && Number(r.requires_tow) === 1 && (
                <div className="mt-1.5 text-[12.5px] text-slate-400">
                  <FontAwesomeIcon icon={faLocationDot} className="mr-1 text-slate-400" />{" "}
                  {r.pickup_landmark}
                </div>
              )}
            </div>

            {/* Urgency */}
            <div>
              <span
                className={`py-1.5 px-3 rounded-full text-[13px] font-semibold border ${
                  r.urgency_level === "Urgent"
                    ? "bg-red-50 border-red-200 text-red-600"
                    : "bg-[#ECFDF3] border-[#BBF7D0] text-green-700"
                }`}
              >
                {r.urgency_level}
              </span>
            </div>

            {activeTab === "new" ? (
              <>
                {/* Details */}
                <div>
                  <button
                    onClick={() => setSelectedRequest(r)}
                    className="py-2 px-3.5 rounded-[9px] border border-green-700 bg-white text-green-700 font-semibold text-sm cursor-pointer transition-colors duration-150 ease-in-out hover:bg-[#ECFDF3]"
                  >
                    View Details
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {r.status === "Pending" ? (
                    <>
                      <button
                        className="py-2 px-4.5 rounded-[10px] border-none bg-green-700 text-white font-semibold text-sm cursor-pointer transition-colors duration-150 ease-in-out hover:bg-[#116530]"
                        onClick={() => handleAcceptClick(r)}
                      >
                        Accept
                      </button>

                      <button
                        className="py-2 px-4.5 rounded-[10px] border border-red-200 text-red-600 bg-white font-semibold text-sm cursor-pointer transition-colors duration-150 ease-in-out hover:bg-red-50"
                        onClick={() => handleDeclineClick(r)}
                      >
                        Decline
                      </button>
                    </>
                  ) : r.status === "Accepted" ? (
                    <span className="py-2 px-3.5 rounded-full bg-amber-100 text-amber-800 font-semibold text-[13px]">
                      Waiting for customer confirmation
                    </span>
                  ) : (
                    <span className="py-2 px-3.5 rounded-full bg-red-100 text-red-600 font-semibold text-[13px]">
                      {r.status}
                    </span>
                  )}
                </div>
              </>
            ) : (
              /* Declined tab — show reason instead of action buttons */
              <div className="text-sm text-slate-500 leading-normal">
                {r.cancellation_reason || "No reason provided"}
              </div>
            )}
          </div>
        ))
      )}

      {/* Footer */}
      <div className="py-4 px-6 text-center border-t border-[#E5E9F0]">
        <button className="py-2.5 px-9 rounded-[10px] border-[1.5px] border-green-700 text-green-700 bg-transparent font-semibold text-[15px] cursor-pointer transition-colors duration-150 ease-in-out hover:bg-[#ECFDF3]">
          View all requests
        </button>
      </div>
    </div>
  );
}

export default RequestTable;
