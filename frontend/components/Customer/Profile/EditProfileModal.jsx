import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faXmark, faExclamationCircle, faCheckCircle,
    faCamera, faTrash, faSpinner, faSave
} from "@fortawesome/free-solid-svg-icons";

export const EditProfileModal = ({
    isModalOpen, setIsModalOpen,
    activeTab, setActiveTab,
    modalError, setModalError,
    modalSuccess,
    isEditingVehicle, setIsEditingVehicle,
    vehicleFormData, setVehicleFormData,
    formData, setFormData,
    previewUrl, avatarSrc, handleFileChange,
    handleSave, handleSaveVehicle, handleDeleteVehicle,
    saving,
    vehicles, vehicleCategories,
    deleteConfirmId, setDeleteConfirmId
}) => {
    if (!isModalOpen) return null;

    return (
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
                    <button
                        onClick={() => { setActiveTab("vehicles"); setModalError(""); setIsEditingVehicle(false); setVehicleFormData({ id: null, brand: "", color: "", vehicle_category_id: "" }); }}
                        className={`py-3 px-4 text-xs font-bold border-b-2 bg-transparent cursor-pointer transition-colors ${activeTab === "vehicles" ? "border-green-600 text-green-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                    >
                        My Vehicles
                    </button>
                </div>

                <form onSubmit={activeTab === "vehicles" ? (isEditingVehicle ? handleSaveVehicle : handleSaveVehicle) : handleSave} className="p-6 flex flex-col gap-4">

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

                    {activeTab === "vehicles" && (
                        <>
                            {!isEditingVehicle && vehicles.length > 0 ? (
                                <div className="flex flex-col gap-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-sm font-bold text-gray-900 m-0">Saved Vehicles</h4>
                                        <button type="button" onClick={() => { setIsEditingVehicle(true); setVehicleFormData({ id: null, brand: "", color: "", vehicle_category_id: "" }); }} className="text-xs font-bold text-green-600 bg-transparent border-none cursor-pointer">
                                            + Add New
                                        </button>
                                    </div>
                                    {vehicles.map(v => {
                                        const cat = vehicleCategories.find(c => c.id == v.vehicle_category_id);
                                        return (
                                            <div key={v.id} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded-xl">
                                                <div>
                                                    <p className="text-[13px] font-bold text-gray-900 m-0">{v.brand}</p>
                                                    <p className="text-[11px] text-gray-500 m-0">{v.color} • {cat ? cat.name : "Vehicle"}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button type="button" onClick={() => { setVehicleFormData({ id: v.id, brand: v.brand, color: v.color, vehicle_category_id: v.vehicle_category_id }); setIsEditingVehicle(true); }} className="text-[11px] font-bold text-blue-600 bg-transparent border-none cursor-pointer hover:underline">Edit</button>
                                                    {deleteConfirmId === v.id ? (
                                                        <button type="button" onClick={() => handleDeleteVehicle(v.id)} className="text-[11px] font-bold text-white bg-red-600 px-2 py-1 rounded cursor-pointer hover:bg-red-700 border-none">Sure?</button>
                                                    ) : (
                                                        <button type="button" onClick={() => setDeleteConfirmId(v.id)} className="text-[11px] font-bold text-red-600 bg-transparent border-none cursor-pointer hover:underline"><FontAwesomeIcon icon={faTrash} /></button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-sm font-bold text-gray-900 m-0">{vehicleFormData.id ? "Edit Vehicle" : "Add New Vehicle"}</h4>
                                        {vehicles.length > 0 && (
                                            <button type="button" onClick={() => setIsEditingVehicle(false)} className="text-[11px] text-gray-500 bg-transparent border-none cursor-pointer hover:underline">Cancel Edit</button>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-gray-700">Vehicle Type *</label>
                                        <select
                                            value={vehicleFormData.vehicle_category_id}
                                            onChange={e => setVehicleFormData({...vehicleFormData, vehicle_category_id: e.target.value})}
                                            className="px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-green-500"
                                            required
                                        >
                                            <option value="">Select Type</option>
                                            {vehicleCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-gray-700">Brand / Make *</label>
                                        <input
                                            type="text"
                                            value={vehicleFormData.brand}
                                            onChange={e => setVehicleFormData({...vehicleFormData, brand: e.target.value})}
                                            className="px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-green-500"
                                            placeholder="e.g. Toyota Camry"
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-gray-700">Color *</label>
                                        <input
                                            type="text"
                                            value={vehicleFormData.color}
                                            onChange={e => setVehicleFormData({...vehicleFormData, color: e.target.value})}
                                            className="px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-green-500"
                                            placeholder="e.g. Silver"
                                            required
                                        />
                                    </div>
                                </div>
                            )}
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
                                    <FontAwesomeIcon icon={faSave} className="text-xs" /> {activeTab === "vehicles" && !isEditingVehicle && vehicles.length > 0 ? "Done" : "Save Changes"}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
