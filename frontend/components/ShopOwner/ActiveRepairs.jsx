import { useEffect, useState } from "react";
import { FaWhatsapp, FaMapMarkerAlt } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWrench } from "@fortawesome/free-solid-svg-icons";
import { api } from "../../src/services/api";


function Avatar({ initials, color, size = 36 }) {
  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold shrink-0 border"
      style={{
        width: size,
        height: size,
        background: color + "22",
        color,
        fontSize: size * 0.33,
        borderColor: color + "44",
      }}
    >
      {initials}
    </div>
  );
}

// Maps each status to a badge color and to the next status in the lifecycle
const STATUS_STYLES = {
  "Confirmed":   { bg: "bg-blue-100", text: "text-blue-600", dot: "bg-blue-600" },
  "In Progress": { bg: "bg-amber-100", text: "text-amber-600", dot: "bg-amber-600" },
  "Completed":   { bg: "bg-green-100", text: "text-green-600", dot: "bg-green-600" },
};

const NEXT_STATUS = {
  "Confirmed": "In Progress",
  "In Progress": "Completed",
};

const NEXT_STATUS_LABEL = {
  "Confirmed": "Start Repair",
  "In Progress": "Mark Completed",
};

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

function generateMapsUrl(lat, lng) {
  if (!lat || !lng) return "";
  // Leaves origin blank so the driver's phone GPS automatically fills it in!
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

function generateWhatsAppLink(repair) {
  // 1. Clean the driver's phone number
  let cleanPhone = repair.dispatched_driver_phone?.replace(/[^0-9]/g, "") || "";

  if (!cleanPhone) {
    alert("No driver phone number saved for this dispatch.");
    return "#";
  }

  // 2. Format for WhatsApp API (Assuming Sri Lankan numbers)
  // If it starts with 0 (e.g., 0712345678), replace the 0 with 94
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "94" + cleanPhone.substring(1);
  }

  // 3. Generate the Maps URL
  const mapsUrl = generateMapsUrl(repair.customer_lat, repair.customer_lng);

  // 4. Build the Ticket string (Removed complex emojis to prevent  corruption)
  let message = `*TOW DISPATCH*\n\n`;
  message += `*Customer:* ${repair.customer_name}\n`;
  message += `*Phone:* ${repair.customer_phone}\n`;
  message += `*Vehicle:* ${repair.vehicle_brand} (${repair.vehicle_color})\n\n`;

  if (repair.pickup_landmark) {
    message += `*Landmark:* ${repair.pickup_landmark}\n\n`;
  }

  message += `*Navigate to Customer:*\n${mapsUrl}`;

  // 5. Build the final wa.me link
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

function ActiveRepairs({ fetchActiveRepairCount }) {
  const [activeRepairs, setActiveRepairs] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    api.get("shop/getActiveRepairs.php")
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const filteredActive = data.data.filter(
            (repair) =>
              repair.status === "Confirmed" ||
              repair.status === "In Progress"
          );
          setActiveRepairs(filteredActive);
          const viewedIds = JSON.parse(localStorage.getItem("fixgo_viewed_repairs") || "[]");
          const newIds = filteredActive.map((r) => String(r.id));
          const updatedViewed = Array.from(new Set([...viewedIds, ...newIds]));
          localStorage.setItem("fixgo_viewed_repairs", JSON.stringify(updatedViewed));
          if (fetchActiveRepairCount) {
            fetchActiveRepairCount();
          }
        }
      })
      .catch(console.error);
  }, []);

  const handleChangeStatus = async (requestId, currentStatus) => {
    const nextStatus = NEXT_STATUS[currentStatus];
    if (!nextStatus) return;
    setUpdatingId(requestId);

    try {
      const data = await api.post("shared/updateStatus.php", {
        request_id: requestId,
        new_status: nextStatus,
      });

      if (nextStatus === "Completed") {
        setActiveRepairs((prev) => prev.filter((r) => r.id !== requestId));
      } else {
        setActiveRepairs((prev) =>
          prev.map((r) =>
            r.id === requestId ? { ...r, status: nextStatus } : r
          )
        );
      }
      window.dispatchEvent(new Event("fixgo_unread_changed"));
      if (fetchActiveRepairCount) {
        fetchActiveRepairCount();
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong while updating the status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="w-full">
      <div
        className="rounded-[18px] p-6 border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6"
        style={{ background: "linear-gradient(180deg, #EEF7F0, #FFFFFF)" }}
      >
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 m-0">
            Active Repairs
          </h1>
          <p className="text-gray-500 mt-1.5 mb-0 text-sm">
            Track all ongoing repair jobs.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[18px] border border-[#E7EFE8] overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
        {activeRepairs.length === 0 ? (
          <div className="p-10 sm:p-12 flex flex-col items-center justify-center gap-3 text-center w-full min-w-0">
            <FontAwesomeIcon icon={faWrench} className="text-4xl sm:text-5xl text-gray-200 mb-1" />
            <p className="text-base sm:text-[17px] font-bold text-gray-900 m-0 leading-snug break-words">
              No active repairs
            </p>
            <p className="text-xs sm:text-[13px] text-gray-500 m-0 max-w-md leading-relaxed whitespace-normal break-words">
              You don't have any active repairs at the moment. Completed repairs will appear in Service History.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop View (≥ 768px) */}
            <div className="hidden md:block">
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-gray-100 grid gap-3 [grid-template-columns:2.3fr_2fr_2fr_1.5fr_1.5fr]">
                {["Customer", "Vehicle", "Service", "Status", "Action"].map((h) => (
                  <span key={h} className="text-xs font-semibold text-gray-500">
                    {h}
                  </span>
                ))}
              </div>
              {/* Rows */}
              {activeRepairs.map((r, i) => {
                const statusStyle = STATUS_STYLES[r.status] || {
                  bg: "bg-gray-100",
                  text: "text-gray-500",
                  dot: "bg-gray-500",
                };
            const nextLabel = NEXT_STATUS_LABEL[r.status];
            const isUpdating = updatingId === r.id;

            return (
              <div
                key={r.id}
                className={`px-5 py-4 grid gap-3 items-center [grid-template-columns:2.3fr_2fr_2fr_1.5fr_1.5fr] ${
                  i < activeRepairs.length - 1 ? "border-b border-gray-50" : ""
                }`}
              >
                {/* Customer */}
                <div className="flex items-center gap-2.5">
                  <Avatar initials={getInitials(r.customer_name)} color="#16A34A" />
                  <div>
                    <div className="font-semibold text-sm text-gray-900">
                      {r.customer_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {r.customer_phone}
                    </div>
                  </div>
                </div>

                {/* Vehicle */}
                <div>
                  <div className="text-sm text-gray-700">{r.vehicle_brand}</div>
                  <div className="text-xs text-green-600 font-semibold">
                    {r.vehicle_color}
                  </div>
                </div>

                {/* Service */}
                <div>
                  <div className="text-sm text-gray-700">{r.issue_category}</div>
                </div>

                {/* Status Badge */}
                <span
                  className={`${statusStyle.bg} ${statusStyle.text} rounded-full px-3.5 py-1.5 text-xs font-bold inline-flex justify-center items-center text-center gap-1.5 w-[130px]`}
                >
                  <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                  {r.status}
                </span>

                {/* Action Column */}
                <div className="flex flex-col gap-2 items-start">
                  {/* 1. Main Action Button */}
                  {nextLabel ? (
                    <button
                      disabled={isUpdating}
                      onClick={() => handleChangeStatus(r.id, r.status)}
                      className={`w-full px-4.5 py-2.5 rounded-[10px] border border-gray-300 font-semibold text-[13px] transition-all duration-200 ${
                        isUpdating
                          ? "bg-gray-100 text-gray-700 cursor-not-allowed"
                          : "bg-white text-gray-700 cursor-pointer hover:bg-green-600 hover:text-white hover:border-green-600"
                      }`}
                    >
                      {isUpdating ? "Updating..." : nextLabel}
                    </button>
                  ) : (
                    <span className="text-[13px] text-gray-400 font-semibold py-2.5">
                      Completed
                    </span>
                  )}

                  {/* 2. Dispatch Utilities */}
                  {r.requires_tow == 1 && r.status === "Confirmed" && (
                    <div className="flex gap-1.5 w-full">
                      {/* Map Button */}
                      <a
                        href={generateMapsUrl(r.customer_lat, r.customer_lng)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Navigate to Customer"
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-sky-100 text-sky-700 no-underline text-xs font-semibold transition-colors duration-200 hover:bg-sky-200"
                      >
                        <FaMapMarkerAlt size={14} /> Map
                      </a>

                      {/* WhatsApp Button */}
                      <a
                        href={generateWhatsAppLink(r)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Text Driver Details"
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-green-100 text-green-700 no-underline text-xs font-semibold transition-colors duration-200 hover:bg-green-200"
                      >
                        <FaWhatsapp size={16} /> Driver
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile View (< 768px) */}
        <div className="block md:hidden divide-y divide-gray-100">
          {activeRepairs.map((r) => {
            const statusStyle = STATUS_STYLES[r.status] || {
              bg: "bg-gray-100",
              text: "text-gray-500",
              dot: "bg-gray-500",
            };
            const nextLabel = NEXT_STATUS_LABEL[r.status];
            const isUpdating = updatingId === r.id;

            return (
              <div key={r.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar initials={getInitials(r.customer_name)} color="#16A34A" size={36} />
                    <div>
                      <div className="font-bold text-sm text-gray-900">{r.customer_name}</div>
                      <div className="text-xs text-gray-500">{r.customer_phone}</div>
                    </div>
                  </div>
                  <span
                    className={`${statusStyle.bg} ${statusStyle.text} rounded-full px-3 py-1 text-xs font-bold inline-flex items-center gap-1.5`}
                  >
                    <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                    {r.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Vehicle</span>
                    <span className="font-semibold text-gray-800">{r.vehicle_brand}</span>
                    {r.vehicle_color && <span className="text-green-600 font-semibold block text-[11px]">{r.vehicle_color}</span>}
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Service</span>
                    <span className="font-semibold text-gray-800">{r.issue_category}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  {nextLabel && (
                    <button
                      disabled={isUpdating}
                      onClick={() => handleChangeStatus(r.id, r.status)}
                      className={`w-full py-2.5 px-4 rounded-xl border border-gray-300 font-bold text-xs transition-all ${
                        isUpdating
                          ? "bg-gray-100 text-gray-700 cursor-not-allowed"
                          : "bg-white text-gray-700 cursor-pointer hover:bg-green-600 hover:text-white hover:border-green-600"
                      }`}
                    >
                      {isUpdating ? "Updating..." : nextLabel}
                    </button>
                  )}

                  {r.requires_tow == 1 && r.status === "Confirmed" && (
                    <div className="flex gap-2 w-full">
                      <a
                        href={generateMapsUrl(r.customer_lat, r.customer_lng)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-sky-100 text-sky-700 no-underline text-xs font-bold"
                      >
                        <FaMapMarkerAlt size={14} /> Map
                      </a>
                      <a
                        href={generateWhatsAppLink(r)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-100 text-green-700 no-underline text-xs font-bold"
                      >
                        <FaWhatsapp size={16} /> Driver
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </>
        )}

        {/* Footer */}
        <div className="px-5 py-3.5 text-center border-t border-gray-100">
          <button className="px-8 py-2.5 rounded-[10px] border-[1.5px] border-green-600 text-green-600 bg-transparent font-semibold text-sm cursor-pointer">
            View all active repairs
          </button>
        </div>
      </div>
    </div>
  );
}

export default ActiveRepairs;