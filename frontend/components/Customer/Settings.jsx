import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { api, UPLOADS_URL } from "../../src/services/api";
import {
    faChevronRight,
    faFileLines,
    faLock,
    faMapPin,
    faGear,
    faShield,
    faShieldHalved,
    faUser,
    faCircleInfo,
    faCamera,
    faXmark,
    faSave,
    faSpinner,
    faExclamationCircle,
    faUserSlash,
    faTrash,
    faTriangleExclamation
} from "@fortawesome/free-solid-svg-icons";

const FONT = "'Segoe UI', system-ui, sans-serif";
const DEFAULT_AVATAR = "https://ui-avatars.com/api/?background=16a34a&color=fff&name=";

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

function Settings({ onNavigate }) {
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("info"); // "info" | "password"
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        address: "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [saving, setSaving] = useState(false);
    const [modalError, setModalError] = useState("");
    const [modalSuccess, setModalSuccess] = useState("");

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const fetchProfile = () => {
        api.get("customer/getCustomerProfile.php")
            .then((data) => {
                if (data.success) {
                    setCustomer(data);
                    setFormData({
                        name: data.name || "",
                        phone: data.contactNumber || "",
                        address: data.address || "",
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                    });
                }
            })
            .catch(() => {});
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const openEditModal = (tab = "info") => {
        fetchProfile();
        setSelectedFile(null);
        setPreviewUrl(null);
        setModalError("");
        setModalSuccess("");
        setActiveTab(tab);
        setIsModalOpen(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setModalError("Profile photo must be under 5MB.");
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setModalError("");
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setModalError("");
        setModalSuccess("");

        if (!formData.name.trim()) {
            setModalError("Name is required.");
            return;
        }

        if (!formData.phone.trim()) {
            setModalError("Phone number is required.");
            return;
        }

        const phoneRegex = /^(?:\+94\d{9}|0\d{9})$/;
        if (!phoneRegex.test(formData.phone.trim())) {
            setModalError("Invalid Sri Lankan phone format (e.g., 0771234567 or +94771234567).");
            return;
        }

        if (!formData.address.trim()) {
            setModalError("Address is required.");
            return;
        }

        if (activeTab === "password" || formData.newPassword.trim() !== "") {
            if (!formData.currentPassword) {
                setModalError("Current password is required to set a new password.");
                return;
            }
            if (formData.newPassword.length < 6) {
                setModalError("New password must be at least 6 characters long.");
                return;
            }
            if (formData.newPassword !== formData.confirmPassword) {
                setModalError("New password and confirm password do not match.");
                return;
            }
        }

        setSaving(true);

        try {
            const body = new FormData();
            body.append("name", formData.name.trim());
            body.append("phone", formData.phone.trim());
            body.append("address", formData.address.trim());

            if (selectedFile) {
                body.append("profilePic", selectedFile);
            }

            if (formData.newPassword.trim() !== "") {
                body.append("currentPassword", formData.currentPassword);
                body.append("newPassword", formData.newPassword.trim());
            }

            const res = await api.post("customer/updateCustomerProfile.php", body);

            if (res.success) {
                setCustomer(res);
                setModalSuccess("Profile updated successfully!");
                setTimeout(() => {
                    setIsModalOpen(false);
                    setSaving(false);
                    setModalSuccess("");
                }, 1200);
            } else {
                setModalError(res.message || "Failed to update profile.");
                setSaving(false);
            }
        } catch (err) {
            setModalError(err.message || "Failed to save changes. Please try again.");
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleteLoading(true);
        setDeleteError("");
        try {
            const res = await api.post("customer/deleteAccount.php", {});
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

    let avatarSrc = DEFAULT_AVATAR + encodeURIComponent(customer?.name || "Customer");
    if (customer && customer.profilePhoto) {
        const cleanProfilePhoto = customer.profilePhoto.replace(/['"]/g, '');
        if (cleanProfilePhoto.startsWith("http")) {
            try {
                const urlObj = new URL(cleanProfilePhoto);
                avatarSrc = `${UPLOADS_URL}${urlObj.pathname}`;
            } catch (error) {
                avatarSrc = cleanProfilePhoto;
            }
        } else {
            avatarSrc = `${UPLOADS_URL}/${cleanProfilePhoto.replace(/^\//, '')}`;
        }
    }

    return (
        <div className="flex flex-col gap-5" style={{ fontFamily: FONT }}>

            {/* ── Page heading ── */}
            <div
                className="rounded-[18px] p-6 border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
                style={{ background: "linear-gradient(180deg, #EEF7F0, #FFFFFF)" }}
            >
                <h1 className="text-[28px] font-bold text-gray-900 m-0">Settings</h1>
                <p className="text-gray-500 mt-1.5 mb-0 text-sm">
                    Manage your account, preferences and app settings.
                </p>
            </div>

            {/* ── Account Settings ── */}
            <SettingsSection
                icon={faUser}
                iconBg="rgba(22,163,74,0.08)"
                iconColor="#16A34A"
                title="Account Settings"
                description="Manage your personal information, addresses, and account security."
            >
                <SettingsRow icon={faUser} label="Edit Profile" onClick={() => openEditModal("info")} />
                <SettingsRow icon={faMapPin} label="Addresses" onClick={() => openEditModal("info")} hasBorderTop />
                <SettingsRow icon={faLock} label="Change Password" onClick={() => openEditModal("password")} hasBorderTop />
                <SettingsRow icon={faUserSlash} label="Delete Account" textColor="text-gray-500" iconColor="#9CA3AF" onClick={() => setIsDeleteModalOpen(true)} hasBorderTop />
            </SettingsSection>

            {/* ── App Settings ── */}
            <SettingsSection
                icon={faGear}
                iconBg="rgba(217,119,6,0.10)"
                iconColor="#D97706"
                title="App Settings"
                description="Manage app behavior and data."
            >
                <SettingsRow icon={faFileLines} label="Terms & Conditions" onClick={() => navigate("/terms-conditions")} />
                <SettingsRow icon={faCircleInfo} label="About FixGo" meta="Version 1.0.0" onClick={() => navigate("/support")} hasBorderTop />
            </SettingsSection>

            {/* ── Edit Profile Modal ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-[540px] overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-150">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 m-0">Edit Profile</h3>
                                <p className="text-xs text-gray-500 m-0 mt-0.5">Update your personal account details and password.</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 border-none bg-transparent cursor-pointer transition-colors"
                            >
                                <FontAwesomeIcon icon={faXmark} className="text-base" />
                            </button>
                        </div>

                        {/* Modal Tabs */}
                        <div className="flex border-b border-gray-100 bg-white px-6">
                            <button
                                onClick={() => { setActiveTab("info"); setModalError(""); }}
                                className={`py-3 px-4 text-xs font-bold border-b-2 bg-transparent cursor-pointer transition-colors ${activeTab === "info" ? "border-green-600 text-green-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                            >
                                Personal Info & Photo
                            </button>
                            <button
                                onClick={() => { setActiveTab("password"); setModalError(""); }}
                                className={`py-3 px-4 text-xs font-bold border-b-2 bg-transparent cursor-pointer transition-colors ${activeTab === "password" ? "border-green-600 text-green-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                            >
                                Security & Password
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">

                            {modalError && (
                                <div className="flex items-center gap-2 p-3 text-xs bg-red-50 text-red-700 rounded-xl border border-red-200">
                                    <FontAwesomeIcon icon={faExclamationCircle} className="flex-shrink-0" />
                                    <span>{modalError}</span>
                                </div>
                            )}

                            {modalSuccess && (
                                <div className="flex items-center gap-2 p-3 text-xs bg-green-50 text-green-700 rounded-xl border border-green-200">
                                    <FontAwesomeIcon icon={faCheckCircle} className="flex-shrink-0" />
                                    <span>{modalSuccess}</span>
                                </div>
                            )}

                            {activeTab === "info" && (
                                <>
                                    {/* Profile Photo Upload */}
                                    <div className="flex items-center gap-4 py-2 border-b border-gray-100">
                                        <div className="relative">
                                            <img
                                                src={previewUrl || avatarSrc}
                                                alt="Preview"
                                                className="w-16 h-16 rounded-full object-cover border-2 border-green-500/20"
                                            />
                                        </div>
                                        <div>
                                            <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors">
                                                <FontAwesomeIcon icon={faCamera} /> Change Photo
                                                <input
                                                    type="file"
                                                    accept="image/png, image/jpeg, image/jpg, image/webp"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                />
                                            </label>
                                            <p className="text-[11px] text-gray-400 mt-1 m-0">Max 5MB. JPG, PNG or WEBP.</p>
                                        </div>
                                    </div>

                                    {/* Full Name */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-gray-700">Full Name *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                            placeholder="Enter your full name"
                                            required
                                        />
                                    </div>

                                    {/* Phone Number */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-gray-700">Phone Number *</label>
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                            placeholder="077XXXXXXX or +9477XXXXXXX"
                                            required
                                        />
                                        <p className="text-[11px] text-gray-400 m-0">Valid Sri Lankan phone number format.</p>
                                    </div>

                                    {/* Address */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-gray-700">Address *</label>
                                        <textarea
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            rows={3}
                                            className="px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 resize-none"
                                            placeholder="Enter your primary address"
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            {activeTab === "password" && (
                                <>
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                                        To change your password, please enter your current password and your new password.
                                    </div>

                                    {/* Current Password */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-gray-700">Current Password *</label>
                                        <input
                                            type="password"
                                            value={formData.currentPassword}
                                            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                            className="px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                            placeholder="••••••••"
                                        />
                                    </div>

                                    {/* New Password */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-gray-700">New Password *</label>
                                        <input
                                            type="password"
                                            value={formData.newPassword}
                                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                            className="px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                            placeholder="Minimum 6 characters"
                                        />
                                    </div>

                                    {/* Confirm New Password */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-gray-700">Confirm New Password *</label>
                                        <input
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className="px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                            placeholder="Repeat new password"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Modal Actions */}
                            <div className="flex justify-end items-center gap-3 pt-3 mt-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl border-none cursor-pointer transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl border-none cursor-pointer shadow-sm disabled:opacity-50 transition-colors"
                                >
                                    {saving ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" /> Saving...
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faSave} className="text-xs" /> Save Changes
                                        </>
                                    )}
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