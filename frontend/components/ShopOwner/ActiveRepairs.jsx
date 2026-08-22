import { useEffect, useState } from "react";
import { FaWhatsapp, FaMapMarkerAlt } from "react-icons/fa";
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

function ActiveRepairs() {
  const [activeRepairs, setActiveRepairs] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    api.get("shop/getActiveRepairs.php")
      .then((data) => {
        if (data.success) {
          setActiveRepairs(data.data);
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
    } catch (err) {
      console.error(err);
      alert("Something went wrong while updating the status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 m-0">
          Active Repairs
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Track all ongoing repair jobs.
        </p>
      </div>

      <div className="bg-white rounded-[18px] border border-[#E7EFE8] overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.05)]">

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

        {/* Footer */}
        <div className="px-5 py-3.5 text-center">
          <button className="px-8 py-2.5 rounded-[10px] border-[1.5px] border-green-600 text-green-600 bg-transparent font-semibold text-sm cursor-pointer">
            View all active repairs
          </button>
        </div>
      </div>
    </div>
  );
}

export default ActiveRepairs;