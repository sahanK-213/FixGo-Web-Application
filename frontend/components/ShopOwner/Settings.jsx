import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShieldHalved,
  faGear,
  faLock,
  faFileLines,
  faCircleInfo,
  faChevronRight,
  faXmark,
  faStore,
  faUserSlash,
  faTrash,
  faTriangleExclamation,
  faSpinner
} from "@fortawesome/free-solid-svg-icons";
import { api } from "../../src/services/api";

const FONT = "'Segoe UI', system-ui, sans-serif";

function SettingsRow({ icon, label, meta, onClick, hasBorderTop, textColor, iconColor }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-1 w-full items-center justify-between py-4 px-6 bg-transparent cursor-pointer text-left transition-colors duration-150 hover:bg-[rgba(22,163,74,0.08)] ${hasBorderTop ? "border-t border-gray-100" : "border-none"}`}
            style={{ fontFamily: FONT }}
        >
            <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={icon} className="w-4" style={{ color: iconColor || "#16A34A80" }} />
                <span className={`text-[13px] font-semibold ${textColor || "text-gray-700"}`}>{label}</span>
            </div>
            <div className="flex items-center gap-2.5">
                {meta && <span className="text-[13px] text-gray-400">{meta}</span>}
                <FontAwesomeIcon icon={faChevronRight} className="text-[11px]" style={{ color: "#16A34A66" }} />
            </div>
        </button>
    );
}

function SettingsSection({ iconBg, iconColor, icon, title, description, children }) {
    return (
        <div className="bg-white border border-gray-200 rounded-[18px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden flex flex-wrap">
            {/* Left panel */}
            <div className="flex items-center gap-5 p-6 border-b sm:border-b-0 sm:border-r border-gray-100 w-full sm:w-[260px] flex-shrink-0 box-border">
                <div
                    className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center"
                    style={{ background: iconBg }}
                >
                    <FontAwesomeIcon icon={icon} className="text-[22px]" style={{ color: iconColor }} />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-900 m-0">{title}</p>
                    <p className="text-xs text-gray-500 mt-1 mb-0 leading-relaxed">{description}</p>
                </div>
            </div>

            {/* Right rows */}
            <div className="flex-1 min-w-[200px] flex flex-col">
                {children}
            </div>
        </div>
    );
}

function Settings({ setActiveNav }) {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState(null); // 'password' | null

  // Password form state
  const [pwdForm, setPwdForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState({ type: "", text: "" });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleItemClick = (label) => {
    if (label === "Password Update") {
      setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPwdMsg({ type: "", text: "" });
      setActiveModal("password");
    } else if (label === "Terms & Conditions") {
      navigate("/terms-conditions");
    } else if (label === "About FixGo") {
      navigate("/support");
    } else {
      alert(`${label} - Coming soon.`);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPwdMsg({ type: "", text: "" });

    const currentPassword = pwdForm.currentPassword.trim();
    const newPassword = pwdForm.newPassword.trim();
    const confirmPassword = pwdForm.confirmPassword.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwdMsg({ type: "error", text: "All password fields are required." });
      return;
    }

    if (newPassword.length < 6) {
      setPwdMsg({ type: "error", text: "New password must be at least 6 characters long." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: "error", text: "New password and confirm password do not match." });
      return;
    }

    setPwdLoading(true);
    try {
      const res = await api.post("shop/updatePassword.php", {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
        confirmPassword: pwdForm.confirmPassword
      });
      if (res?.success) {
        setPwdMsg({ type: "success", text: res.message || "Password updated successfully!" });
        setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => {
          setActiveModal(null);
          setPwdMsg({ type: "", text: "" });
        }, 1800);
      } else {
        setPwdMsg({ type: "error", text: res?.message || "Failed to update password." });
      }
    } catch (err) {
      setPwdMsg({ type: "error", text: err.message || "Current password is incorrect." });
    } finally {
      setPwdLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
      setDeleteLoading(true);
      setDeleteError("");
      try {
          const res = await api.post("shop/deleteAccount.php", {});
          if (res.success) {
              localStorage.removeItem("jwt_token");
              localStorage.removeItem("user_data");
              navigate("/login");
          } else {
              setDeleteError(res.message || "Failed to delete account.");
          }
      } catch (err) {
          setDeleteError(err.message || "Failed to delete account. Please try again.");
      } finally {
          setDeleteLoading(false);
      }
  };

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily: FONT }}>
      {/* ── Page heading ── */}
      <div
          className="rounded-[18px] p-6 border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row justify-between sm:items-center gap-4"
          style={{ background: "linear-gradient(180deg, #EEF7F0, #FFFFFF)" }}
      >
          <div>
              <h1 className="text-[28px] font-bold text-gray-900 m-0">Settings</h1>
              <p className="text-gray-500 mt-1.5 mb-0 text-sm">
                  Manage your account security, shop preferences and system settings.
              </p>
          </div>
      </div>

      {/* ── Account Settings ── */}
      <SettingsSection
          icon={faLock}
          iconBg="rgba(22,163,74,0.08)"
          iconColor="#16A34A"
          title="Account Settings"
          description="Manage your account security, profile, and login settings."
      >
          <SettingsRow icon={faStore} label="Shop Profile" onClick={() => setActiveNav("profile")} />
          <SettingsRow icon={faLock} label="Password Update" onClick={() => handleItemClick("Password Update")} hasBorderTop />
          <SettingsRow icon={faUserSlash} label="Delete Account" textColor="text-gray-500" iconColor="#9CA3AF" onClick={() => setIsDeleteModalOpen(true)} hasBorderTop />
      </SettingsSection>

      {/* ── App Settings ── */}
      <SettingsSection
          icon={faGear}
          iconBg="rgba(217,119,6,0.10)"
          iconColor="#D97706"
          title="App Settings"
          description="Manage app behavior and system info."
      >
          <SettingsRow icon={faFileLines} label="Terms & Conditions" onClick={() => handleItemClick("Terms & Conditions")} />
          <SettingsRow icon={faCircleInfo} label="About FixGo" meta="Version 1.0.0" onClick={() => handleItemClick("About FixGo")} hasBorderTop />
      </SettingsSection>


      {/* Password Update Modal */}
      {activeModal === "password" && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 relative space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 m-0 flex items-center gap-2">
                <FontAwesomeIcon icon={faLock} className="w-5 h-5 text-green-600" />
                Update Password
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base border-none bg-transparent cursor-pointer"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Current Password *
                </label>
                <input
                  type="password"
                  value={pwdForm.currentPassword}
                  onChange={(e) => {
                    setPwdForm({ ...pwdForm, currentPassword: e.target.value });
                    if (pwdMsg.text) setPwdMsg({ type: "", text: "" });
                  }}
                  placeholder="Enter current password"
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 box-border"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  value={pwdForm.newPassword}
                  onChange={(e) => {
                    setPwdForm({ ...pwdForm, newPassword: e.target.value });
                    if (pwdMsg.text) setPwdMsg({ type: "", text: "" });
                  }}
                  placeholder="At least 6 characters"
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 box-border"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  value={pwdForm.confirmPassword}
                  onChange={(e) => {
                    setPwdForm({ ...pwdForm, confirmPassword: e.target.value });
                    if (pwdMsg.text) setPwdMsg({ type: "", text: "" });
                  }}
                  placeholder="Re-enter new password"
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 box-border"
                />
              </div>

              {pwdMsg.text && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${
                  pwdMsg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {pwdMsg.text}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className={`flex-1 py-2.5 rounded-xl bg-green-600 text-white font-semibold text-xs border-none shadow-2xs ${
                    pwdLoading ? "opacity-70 cursor-not-allowed" : "hover:bg-green-700 cursor-pointer"
                  }`}
                >
                  {pwdLoading ? "Updating..." : "Update Password"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-xs cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Account Confirmation Modal ── */}
      {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
              <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-150 p-6 relative text-center">
                  <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 text-2xl">
                      <FontAwesomeIcon icon={faTriangleExclamation} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 m-0 mb-2">Delete Account?</h3>
                  <p className="text-sm text-gray-500 m-0 mb-6 leading-relaxed">
                      Are you absolutely sure you want to permanently delete your account? This action cannot be undone and you will instantly lose access.
                  </p>

                  {deleteError && (
                      <div className="mb-4 text-xs bg-red-50 text-red-700 p-3 rounded-xl border border-red-200">
                          {deleteError}
                      </div>
                  )}

                  <div className="flex gap-3">
                      <button
                          type="button"
                          onClick={() => setIsDeleteModalOpen(false)}
                          disabled={deleteLoading}
                          className="flex-1 px-4 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl border-none cursor-pointer transition-colors"
                      >
                          Cancel
                      </button>
                      <button
                          type="button"
                          onClick={handleDeleteAccount}
                          disabled={deleteLoading}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl border-none cursor-pointer shadow-sm disabled:opacity-50 transition-colors"
                      >
                          {deleteLoading ? (
                              <>
                                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Deleting...
                              </>
                          ) : (
                              "Yes, Delete"
                          )}
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}

export default Settings;
