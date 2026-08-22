import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTags, faPlus, faPenToSquare, faTrash, faSearch, faExclamationTriangle, faCar, faWrench, faSave, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { api } from "../../../src/services/api";
import toast from "react-hot-toast";

export function CategoryManagementModal({ onClose }) {
  const [activeTab, setActiveTab] = useState("shop"); // 'shop' | 'vehicle'
  const [shopCategories, setShopCategories] = useState([]);
  const [vehicleCategories, setVehicleCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Sub-modals state
  const [formModal, setFormModal] = useState(null); // null | { type: 'shop'|'vehicle', item: null | object }
  const [deleteTarget, setDeleteTarget] = useState(null); // null | { type: 'shop'|'vehicle', item: object }
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get("admin/getCategories.php");
      if (res?.success && res?.data) {
        setShopCategories(res.data.shopCategories || []);
        setVehicleCategories(res.data.vehicleCategories || []);
      } else {
        toast.error(res?.message || "Failed to load categories.");
      }
    } catch (err) {
      toast.error(err.message || "Error fetching categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = (type) => {
    setFormName("");
    setFormDesc("");
    setFormModal({ type, item: null });
  };

  const openEditModal = (type, item) => {
    setFormName(item.name || "");
    setFormDesc(item.description || "");
    setFormModal({ type, item });
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Category name is required.");
      return;
    }

    setSaving(true);
    try {
      const isEdit = Boolean(formModal?.item);
      const endpoint = isEdit ? "admin/updateCategory.php" : "admin/addCategory.php";
      const payload = {
        type: formModal.type,
        name: formName.trim(),
        description: formDesc.trim(),
      };
      if (isEdit) {
        payload.id = formModal.item.id;
      }

      const res = await api.post(endpoint, payload);
      if (res?.success) {
        toast.success(res.message || (isEdit ? "Updated successfully!" : "Added successfully!"));
        setFormModal(null);
        fetchCategories();
      } else {
        toast.error(res?.message || "Operation failed.");
      }
    } catch (err) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await api.post("admin/deleteCategory.php", {
        type: deleteTarget.type,
        id: deleteTarget.item.id,
      });
      if (res?.success) {
        toast.success(res.message || "Deleted successfully!");
        setDeleteTarget(null);
        fetchCategories();
      } else {
        toast.error(res?.message || "Failed to delete item.");
      }
    } catch (err) {
      toast.error(err.message || "Error deleting item.");
    } finally {
      setSaving(false);
    }
  };

  const currentList = activeTab === "shop" ? shopCategories : vehicleCategories;
  const filteredList = currentList.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]" onClick={onClose}>
      <div className="bg-white rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full max-w-3xl mx-4 overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <FontAwesomeIcon icon={faTags} className="text-blue-600 text-lg" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 m-0">Category Management</h2>
              <p className="text-xs text-gray-500 m-0">Manage shop categories and supported vehicle types.</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full border-none bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold cursor-pointer flex items-center justify-center text-sm transition-colors">
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-100 pb-3">
            <button
              onClick={() => { setActiveTab("shop"); setSearchQuery(""); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-none cursor-pointer ${
                activeTab === "shop"
                  ? "bg-green-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <FontAwesomeIcon icon={faWrench} />
              Shop Categories ({shopCategories.length})
            </button>
            <button
              onClick={() => { setActiveTab("vehicle"); setSearchQuery(""); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-none cursor-pointer ${
                activeTab === "vehicle"
                  ? "bg-green-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <FontAwesomeIcon icon={faCar} />
              Vehicle Types ({vehicleCategories.length})
            </button>
          </div>

          {/* Action Bar (Search & Add Button) */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
            <div className="relative flex-1">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                placeholder={activeTab === "shop" ? "Search shop categories..." : "Search vehicle types..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2 pl-9 pr-3 text-xs border border-gray-200 rounded-xl outline-none focus:border-green-400 focus:ring-2 focus:ring-green-50 transition-all box-border bg-gray-50/50"
              />
            </div>
            <button
              onClick={() => openAddModal(activeTab)}
              className="px-4 py-2.5 rounded-xl bg-green-600 text-white text-xs font-bold border-none cursor-pointer hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-2xs"
            >
              <FontAwesomeIcon icon={faPlus} />
              {activeTab === "shop" ? "Add Shop Category" : "Add Vehicle Type"}
            </button>
          </div>

          {/* Categories List / Table */}
          {loading ? (
            <div className="flex justify-center py-12 text-gray-400">
              <FontAwesomeIcon icon={faSpinner} spin className="text-2xl" />
            </div>
          ) : filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3 text-lg">
                <FontAwesomeIcon icon={faTags} />
              </div>
              <p className="font-bold text-sm text-gray-700 m-0">
                {searchQuery ? "No matching categories found" : activeTab === "shop" ? "No shop categories created yet" : "No vehicle types created yet"}
              </p>
              <p className="text-xs text-gray-400 mt-1 mb-4">
                {searchQuery ? "Try searching for a different keyword." : "Click the button below to add your first category."}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => openAddModal(activeTab)}
                  className="px-3.5 py-2 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 text-xs font-bold border-none cursor-pointer transition-colors"
                >
                  + Add {activeTab === "shop" ? "Shop Category" : "Vehicle Type"}
                </button>
              )}
            </div>
          ) : (
            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 grid grid-cols-12 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <div className="col-span-4 sm:col-span-4">Name</div>
                <div className="col-span-5 sm:col-span-6">Description</div>
                <div className="col-span-3 sm:col-span-2 text-right">Actions</div>
              </div>
              <div className="divide-y divide-gray-100 bg-white">
                {filteredList.map((item) => (
                  <div key={item.id} className="px-4 py-3.5 grid grid-cols-12 items-center hover:bg-gray-50/80 transition-colors">
                    <div className="col-span-4 sm:col-span-4 font-bold text-xs text-gray-900 truncate pr-2">
                      {item.name}
                    </div>
                    <div className="col-span-5 sm:col-span-6 text-xs text-gray-500 truncate pr-2">
                      {item.description || <span className="text-gray-300 italic">No description</span>}
                    </div>
                    <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(activeTab, item)}
                        title="Edit"
                        className="w-7 h-7 rounded-lg border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-200 text-gray-600 hover:text-blue-600 cursor-pointer flex items-center justify-center transition-colors text-xs"
                      >
                        <FontAwesomeIcon icon={faPenToSquare} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ type: activeTab, item })}
                        title="Delete"
                        className="w-7 h-7 rounded-lg border border-gray-200 bg-white hover:bg-red-50 hover:border-red-200 text-gray-600 hover:text-red-600 cursor-pointer flex items-center justify-center transition-colors text-xs"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-xl text-xs font-bold cursor-pointer bg-white hover:bg-gray-50 text-gray-700">
            Close
          </button>
        </div>
      </div>

      {/* Add / Edit Sub-Modal */}
      {formModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-xs" onClick={() => setFormModal(null)}>
          <div className="bg-white rounded-[18px] shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 m-0">
                {formModal.item
                  ? formModal.type === "shop" ? "Edit Shop Category" : "Edit Vehicle Type"
                  : formModal.type === "shop" ? "Add Shop Category" : "Add Vehicle Type"}
              </h3>
              <button onClick={() => setFormModal(null)} className="border-none bg-transparent text-gray-400 hover:text-gray-600 font-bold cursor-pointer text-base">✕</button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {formModal.type === "shop" ? "Shop Category Name *" : "Vehicle Type Name *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={formModal.type === "shop" ? "e.g. Garages, Spare Parts..." : "e.g. 4 Wheelers, Bikes..."}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full py-2.5 px-3 text-xs border border-gray-200 rounded-xl outline-none focus:border-green-400 focus:ring-2 focus:ring-green-50 transition-all box-border"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  rows="3"
                  placeholder="Enter optional description..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full py-2.5 px-3 text-xs border border-gray-200 rounded-xl outline-none focus:border-green-400 focus:ring-2 focus:ring-green-50 transition-all box-border font-sans"
                />
              </div>

              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setFormModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold cursor-pointer bg-white hover:bg-gray-50 text-gray-700">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-xs font-bold border-none cursor-pointer hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2 shadow-2xs"
                >
                  {saving ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSave} />}
                  {saving ? "Saving..." : formModal.item ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Sub-Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-xs" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-[18px] shadow-2xl w-full max-w-sm mx-4 p-6 overflow-hidden border border-gray-100 text-center space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center text-xl">
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 m-0">
                {deleteTarget.type === "shop" ? "Delete Category" : "Delete Vehicle Type"}
              </h3>
              <p className="text-xs text-gray-500 mt-1 mb-0">
                Are you sure you want to delete <span className="font-bold text-gray-800">"{deleteTarget.item.name}"</span>? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold cursor-pointer bg-white hover:bg-gray-50 text-gray-700">
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold border-none cursor-pointer hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2 shadow-2xs"
              >
                {saving ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faTrash} />}
                {saving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
