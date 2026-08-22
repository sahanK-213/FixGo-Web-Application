import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldHalved, faSave, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { api } from "../../../src/services/api";
import toast from "react-hot-toast";

export function AdminPasswordModal({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg]               = useState("");
  const [saving, setSaving]                   = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const curr = currentPassword.trim();
    const newP = newPassword.trim();
    const conf = confirmPassword.trim();

    if (!curr || !newP || !conf) {
      const msg = "Please fill in all password fields.";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (newP.length < 6) {
      const msg = "New password must be at least 6 characters long.";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (newP !== conf) {
      const msg = "New password and confirm password do not match.";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    setSaving(true);
    try {
      const res = await api.post("admin/updatePassword.php", {
        currentPassword,
        newPassword,
        confirmPassword
      });
      if (res?.success) {
        toast.success(res.message || "Admin password updated successfully.");
        onClose();
      } else {
        const msg = res?.message || "Failed to update password.";
        setErrorMsg(msg);
        toast.error(msg);
      }
    } catch (err) {
      const msg = err.message || "Current password is incorrect.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]" onClick={onClose}>
      <div className="bg-white rounded-[18px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
            <FontAwesomeIcon icon={faShieldHalved} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-[16px] font-bold text-gray-900 m-0">Change Password</h2>
            <p className="text-xs text-gray-500 m-0">Update your account security password.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Current Password *</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => { setCurrentPassword(e.target.value); if (errorMsg) setErrorMsg(""); }}
              placeholder="Enter current password"
              className="w-full py-2.5 px-3 text-sm border border-gray-200 rounded-[10px] outline-none focus:border-green-400 focus:ring-2 focus:ring-green-50 transition-all box-border"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">New Password *</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => { setNewPassword(e.target.value); if (errorMsg) setErrorMsg(""); }}
              placeholder="Minimum 6 characters"
              className="w-full py-2.5 px-3 text-sm border border-gray-200 rounded-[10px] outline-none focus:border-green-400 focus:ring-2 focus:ring-green-50 transition-all box-border"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm New Password *</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); if (errorMsg) setErrorMsg(""); }}
              placeholder="Repeat new password"
              className="w-full py-2.5 px-3 text-sm border border-gray-200 rounded-[10px] outline-none focus:border-green-400 focus:ring-2 focus:ring-green-50 transition-all box-border"
              required
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-[10px] text-sm font-semibold cursor-pointer bg-white hover:bg-gray-50">Cancel</button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-[10px] bg-green-600 text-white text-sm font-bold border-none cursor-pointer hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSave} />}
              {saving ? "Saving…" : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
