import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser, faGear, faShieldHalved,
  faChevronRight, faMoneyBillWave,
  faFileLines, faCircleInfo, faTags
} from "@fortawesome/free-solid-svg-icons";

import { AdminPasswordModal } from "./Settings/AdminPasswordModal";
import { BillingRatesModal } from "./Settings/BillingRatesModal";
import { CategoryManagementModal } from "./Settings/CategoryManagementModal";

function PageHeading({ title, sub }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 m-0">{title}</h1>
      {sub && <p className="text-gray-500 mt-1.5 text-sm mb-0">{sub}</p>}
    </div>
  );
}

function Settings() {
  const navigate = useNavigate();
  const [showRatesModal, setShowRatesModal]       = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const sections = [
    {
      icon: faUser,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
      title: "Admin Account",
      subtitle: "Manage admin profile and access.",
      rows: [
        { icon: faShieldHalved, label: "Change Password", onClick: () => setShowPasswordModal(true) },
      ],
    },
    {
      icon: faGear,
      iconBg: "bg-[#EDF3FF]",
      iconColor: "text-blue-600",
      title: "System Settings",
      subtitle: "Platform-level configuration.",
      rows: [
        { icon: faMoneyBillWave, label: "Billing Rates",        onClick: () => setShowRatesModal(true) },
        { icon: faTags,          label: "Category Management", onClick: () => setShowCategoryModal(true) },
      ],
    },
    {
      icon: faGear,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500",
      title: "App Settings",
      subtitle: "Manage app behavior and data.",
      rows: [
        { icon: faFileLines,   label: "Terms & Conditions", onClick: () => navigate("/terms-conditions") },
        { icon: faCircleInfo,  label: "About FixGo",        onClick: () => navigate("/support"), trailing: "Version 1.0.0" },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeading title="Settings" sub="Manage system configuration and admin preferences." />

      {sections.map((sec) => (
        <div
          key={sec.title}
          className="bg-white border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] rounded-2xl overflow-hidden flex flex-col lg:flex-row w-full max-w-full min-w-0"
        >
          <div className="w-full lg:w-[260px] shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 flex items-center gap-4 py-5 px-5 sm:py-6 min-w-0">
            <div className={`w-[48px] h-[48px] sm:w-[52px] sm:h-[52px] rounded-2xl flex items-center justify-center shrink-0 ${sec.iconBg}`}>
              <FontAwesomeIcon icon={sec.icon} className={`text-xl sm:text-2xl ${sec.iconColor}`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold text-gray-900 leading-snug">{sec.title}</div>
              <div className="text-xs text-gray-500 mt-0.5 leading-normal whitespace-normal break-words">{sec.subtitle}</div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-w-0 w-full">
            {sec.rows.map((row, i) => (
              <button
                key={row.label}
                onClick={row.onClick || undefined}
                className={`w-full flex-1 flex items-center justify-between gap-3 py-3.5 px-4 sm:py-4 sm:px-5 bg-transparent border-none cursor-pointer font-sans min-w-0 hover:bg-gray-50 ${
                  i < sec.rows.length - 1 ? "border-b border-gray-100" : ""
                } ${row.onClick ? "hover:bg-green-50/40" : ""}`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 text-left">
                  <FontAwesomeIcon icon={row.icon} className="text-gray-400 w-4 shrink-0" />
                  <span className="text-sm text-gray-700 font-medium whitespace-normal break-words min-w-0 flex-1">{row.label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {row.trailing && (
                    <span className="text-xs text-gray-400 font-normal">{row.trailing}</span>
                  )}
                  <FontAwesomeIcon icon={faChevronRight} className="text-[11px] text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {showRatesModal && <BillingRatesModal onClose={() => setShowRatesModal(false)} />}
      {showPasswordModal && <AdminPasswordModal onClose={() => setShowPasswordModal(false)} />}
      {showCategoryModal && <CategoryManagementModal onClose={() => setShowCategoryModal(false)} />}
    </div>
  );
}

export default Settings;