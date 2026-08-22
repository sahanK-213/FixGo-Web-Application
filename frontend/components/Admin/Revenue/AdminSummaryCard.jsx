import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle, faArrowTrendUp } from "@fortawesome/free-solid-svg-icons";
import { ACCENT_STYLES } from "./RevenueConstants";

function AdminSummaryCard({ accent, icon, title, count, meta, tooltip }) {
  const s = ACCENT_STYLES[accent];
  return (
    <div className="bg-white rounded-[18px] border border-gray-200 py-5 px-6 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] cursor-default">
      <div className="flex items-start gap-4">
        <div className={`w-[52px] h-[52px] rounded-full flex items-center justify-center shrink-0 ${s.iconBg}`}>
          <FontAwesomeIcon icon={icon} className={`text-xl ${s.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] text-gray-500 m-0">{title}</p>
            {tooltip && (
              <div className="relative group">
                <FontAwesomeIcon icon={faInfoCircle} className="text-[11px] text-gray-300 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-56 bg-gray-900 text-white text-[11px] rounded-lg px-3 py-2 shadow-xl leading-relaxed pointer-events-none">
                  {tooltip}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </div>
              </div>
            )}
          </div>
          <p className="text-[28px] font-bold text-gray-900 my-1">{count}</p>
          {meta && (
            <p className={`text-xs font-semibold m-0 flex items-center gap-1 ${s.metaColor}`}>
              <FontAwesomeIcon icon={faArrowTrendUp} className="text-[10px]" />
              {meta}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
export default AdminSummaryCard;
