import { useEffect, useState } from "react";
import { api, UPLOADS_URL } from "../../src/services/api";


function Avatar({ initials, color, size = 32 }) {
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

const AVATAR_COLORS = ["#7C3AED", "#059669", "#2563EB", "#16A34A", "#EF4444", "#D97706"];

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

function colorForId(id) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ServiceHistory({ shopCategory }) {
  const [history, setHistory] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    api.get("shop/getServiceHistory.php")
      .then((data) => {
        if (data.success) {
          setHistory(data.data);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 m-0">
          Service History
        </h1>
        <p className="text-gray-500 mt-1 text-xs sm:text-sm">
          All completed service records.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
        {history.length === 0 ? (
          <div className="py-12 px-4 text-center text-gray-400 text-sm">
            No completed services yet.
          </div>
        ) : (
          <>
            {/* Desktop Table View (≥ 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    {["Customer", "Vehicle", "Service Provided", "Confirmed On", "Completed On", "Action"].map((h) => (
                      <th
                        key={h}
                        className="py-3 px-4 text-left text-xs font-semibold text-gray-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((r, i) => (
                    <tr
                      key={r.id}
                      className={i < history.length - 1 ? "border-b border-gray-50 hover:bg-gray-50/50 transition-colors" : "hover:bg-gray-50/50 transition-colors"}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar initials={getInitials(r.customer_name)} color={colorForId(r.id)} />
                          <div>
                            <div className="font-semibold text-sm text-gray-900">{r.customer_name}</div>
                            <div className="text-xs text-gray-500">{r.customer_phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-sm font-medium text-gray-800">{r.vehicle_brand}</div>
                        <div className="text-xs text-green-600 font-semibold">{r.vehicle_color}</div>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-gray-700">{r.issue_category}</td>
                      <td className="py-3.5 px-4 text-[13px] text-gray-500">{formatDate(r.confirmed_at)}</td>
                      <td className="py-3.5 px-4 text-[13px] text-gray-500">{formatDate(r.completed_at)}</td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => setSelectedRequest(r)}
                          className="py-1.5 px-3.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold text-xs cursor-pointer transition-all duration-200 hover:bg-green-600 hover:text-white hover:border-green-600"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (< 768px) */}
            <div className="block md:hidden divide-y divide-gray-100">
              {history.map((r) => (
                <div key={r.id} className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={getInitials(r.customer_name)} color={colorForId(r.id)} size={36} />
                      <div>
                        <div className="font-bold text-sm text-gray-900">{r.customer_name}</div>
                        <div className="text-xs text-gray-500">{r.customer_phone}</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-green-600 bg-green-50 py-1 px-2.5 rounded-full">
                      Completed
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-gray-50/60 p-3 rounded-xl text-xs">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-semibold">Vehicle</span>
                      <span className="font-semibold text-gray-800">{r.vehicle_brand}</span>
                      {r.vehicle_color && <span className="text-green-600 font-semibold block text-[11px]">{r.vehicle_color}</span>}
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-semibold">Service</span>
                      <span className="font-semibold text-gray-800">{r.issue_category}</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-gray-400 block text-[10px] uppercase font-semibold">Confirmed</span>
                      <span className="text-gray-600">{formatDate(r.confirmed_at)}</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-gray-400 block text-[10px] uppercase font-semibold">Completed</span>
                      <span className="text-gray-600">{formatDate(r.completed_at)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedRequest(r)}
                    className="w-full py-2.5 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold text-xs cursor-pointer transition-colors hover:bg-green-600 hover:text-white hover:border-green-600"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Service Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/60 flex justify-center items-center z-[999] p-4 sm:p-6 backdrop-blur-xs">
          <div className="bg-white w-[560px] max-w-full max-h-[90vh] overflow-y-auto rounded-2xl p-5 sm:p-7 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <h2 className="m-0 text-lg sm:text-xl font-bold text-slate-900">
                Service Request Details
              </h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-400 hover:text-gray-600 bg-transparent border-none text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3.5 mb-5">
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Customer
                </div>
                <div className="text-base font-semibold text-slate-900 mt-0.5">
                  {selectedRequest.customer_name} ({selectedRequest.customer_phone})
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Vehicle
                  </div>
                  <div className="text-sm font-semibold text-slate-800 mt-0.5">
                    {selectedRequest.vehicle_brand}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Issue Category
                  </div>
                  <div className="text-sm font-semibold text-slate-800 mt-0.5">
                    {selectedRequest.issue_category}
                  </div>
                </div>
              </div>

              {shopCategory === "Service Centers" && selectedRequest.preferred_date && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Appointment
                  </div>
                  <div className="text-sm text-slate-800 mt-0.5 font-medium">
                    {selectedRequest.preferred_date} • {selectedRequest.preferred_time}
                  </div>
                </div>
              )}

              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Description
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs sm:text-sm text-slate-800 leading-relaxed">
                  {selectedRequest.description || "No description provided."}
                </div>
              </div>
            </div>

            {selectedRequest.photo && (
              <img
                src={`${UPLOADS_URL}/${selectedRequest.photo}`}
                alt="Problem"
                className="w-full rounded-xl mb-4 border border-slate-200 max-h-[300px] object-cover"
              />
            )}

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                onClick={() => setSelectedRequest(null)}
                className="py-2.5 px-6 bg-green-600 hover:bg-green-700 text-white border-none rounded-xl font-bold text-xs cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServiceHistory;
