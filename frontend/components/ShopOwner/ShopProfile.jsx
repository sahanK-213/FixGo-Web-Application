import { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faCamera,
  faCheck,
  faLocationDot,
  faEye,
  faCircleInfo,
  faClock,
  faImage,
  faTruck,
  faWrench,
  faPenToSquare,
  faStore,
  faTag,
  faUser,
  faCar,
  faEnvelope,
  faPhone,
  faClipboardList,
  faFileLines,
} from "@fortawesome/free-solid-svg-icons";
import { api, UPLOADS_URL } from "../../src/services/api";
import ShopInfoTab from "./ShopProfile/ShopInfoTab";
import ShopHoursTab from "./ShopProfile/ShopHoursTab";
import ShopGalleryTab from "./ShopProfile/ShopGalleryTab";
import ShopTowTab from "./ShopProfile/ShopTowTab";
import ShopServicesTab from "./ShopProfile/ShopServicesTab";

function Stars({ count, max = 5 }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <FontAwesomeIcon
          key={i}
          icon={faStar}
          className={`text-sm ${i < count ? "text-amber-500" : "text-gray-300"}`}
        />
      ))}
    </span>
  );
}

function ShopProfile() {
  const [shopData, setShopData] = useState(null);
  const [activeTab, setActiveTab] = useState("info"); // 'info' | 'hours' | 'gallery' | 'tow' | 'services'

  const isGarage = shopData?.categories?.toLowerCase().includes("garage") || false;
  const hasTowService = shopData ? Number(shopData.carriageService) === 1 : false;

  // Tow Truck state
  const [towDetails, setTowDetails] = useState(null);
  const [towLoading, setTowLoading] = useState(false);
  const [showTowForm, setShowTowForm] = useState(false);
  const [towSaving, setTowSaving] = useState(false);
  const [towError, setTowError] = useState("");
  const [towForm, setTowForm] = useState({
    driverName: "", driverPhone: "", truckBrand: "", truckColor: "", truckPlate: "",
  });

  // Profile Picture state
  const [uploadingProfilePhoto, setUploadingProfilePhoto] = useState(false);
  const profilePhotoInputRef = useRef(null);

  // Gallery state
  const [galleryImages, setGalleryImages] = useState([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedImagesToDelete, setSelectedImagesToDelete] = useState([]);
  const [deletingGallery, setDeletingGallery] = useState(false);
  const fileInputRef = useRef(null);

  // Business Information state
  const [isEditingBusinessInfo, setIsEditingBusinessInfo] = useState(false);
  const [businessSaving, setBusinessSaving] = useState(false);
  const [businessError, setBusinessError] = useState("");
  const [businessForm, setBusinessForm] = useState({
    name: "", owner: "", phone: "", address: "", brn: "", description: "",
    openTime: "08:00", closeTime: "18:00", isAvailable: 1, vehicleCategories: []
  });

  // Operating Hours Edit state
  const [isEditingHours, setIsEditingHours] = useState(false);

  // Services Offered state
  const [shopServices, setShopServices] = useState([]);
  const [isEditingServices, setIsEditingServices] = useState(false);
  const [servicesSaving, setServicesSaving] = useState(false);
  const [newService, setNewService] = useState({
    category: "Mechanical",
    service_name: "",
    starting_price: "",
    duration: ""
  });

  useEffect(() => {
    api.get("shop/getShopProfile.php")
      .then(data => {
        if (data.success) {
          setShopData(data.data);
        } else {
          console.error(data.message);
        }
      })
      .catch(err => {
        console.error("Error loading shop profile:", err);
      });

    // Fetch Gallery
    api.get("shop/getGalleryImages.php")
      .then(res => {
        if (res?.success && Array.isArray(res.data)) {
          setGalleryImages(res.data);
        }
      })
      .catch(err => console.error("Gallery fetch error:", err));

    // Fetch Services
    api.get("shop/getShopServices.php")
      .then(res => {
        if (res?.success && Array.isArray(res.data)) {
          setShopServices(res.data);
        }
      })
      .catch(err => console.error("Services fetch error:", err));
  }, []);

  useEffect(() => {
    if (!shopData) return;
    setTowLoading(true);
    api.get("shop/getTowTruckDetails.php")
      .then(data => {
        if (data.success) {
          setTowDetails(data.data);
          setTowForm({
            driverName: data.data.default_driver_name || "",
            driverPhone: data.data.default_driver_phone || "",
            truckBrand: data.data.default_truck_brand || "",
            truckColor: data.data.default_truck_color || "",
            truckPlate: data.data.tow_truck_plate || "",
          });
        }
      })
      .catch(err => console.error(err))
      .finally(() => setTowLoading(false));
  }, [shopData, hasTowService]);

  // Populate Business Form state when shopData is loaded
  useEffect(() => {
    if (shopData) {
      const vCats = shopData.vehicleCategories 
        ? shopData.vehicleCategories.split(',').map(s => s.trim()) 
        : [];
      setBusinessForm({
        name: shopData.name || "",
        owner: shopData.owner || "",
        phone: shopData.contactNumber || "",
        address: shopData.address || "",
        brn: shopData.BRN || "",
        description: shopData.description || "",
        openTime: shopData.openTime || "08:00:00",
        closeTime: shopData.closeTime || "18:00:00",
        isAvailable: shopData.isAvailable !== undefined ? Number(shopData.isAvailable) : 1,
        vehicleCategories: vCats
      });
    }
  }, [shopData]);

  // Format HH:MM 24hr time to 12hr AM/PM string
  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    const parts = timeStr.split(":");
    if (parts.length < 2) return timeStr;
    const hour = parseInt(parts[0], 10);
    const min = parts[1];
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${min} ${ampm}`;
  };

  // Profile Photo Handler
  const handleUploadProfilePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Profile photo must be under 5MB.");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid image format. Allowed formats: PNG, JPG, JPEG, WEBP.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    setUploadingProfilePhoto(true);

    try {
      const res = await api.post("shop/uploadProfileImage.php", formData);
      if (res.success && res.profileImageURL) {
        setShopData(prev => ({ ...prev, profileImageURL: res.profileImageURL }));
      } else {
        alert(res.message || "Failed to update profile photo.");
      }
    } catch (err) {
      alert(err.message || "Error updating profile photo.");
    } finally {
      setUploadingProfilePhoto(false);
      if (profilePhotoInputRef.current) profilePhotoInputRef.current.value = "";
    }
  };

  // Gallery Handlers
  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (galleryImages.length >= 4) {
      alert("Maximum of 4 gallery images allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Workshop photo must be under 5MB.");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid image format. Allowed formats: PNG, JPG, JPEG, WEBP.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    setUploadingGallery(true);

    try {
      const res = await api.post("shop/uploadGalleryImage.php", formData);
      if (res.success && res.data) {
        setGalleryImages(prev => [res.data, ...prev]);
      } else {
        alert(res.message || "Failed to upload image.");
      }
    } catch (err) {
      alert(err.message || "Error uploading gallery image.");
    } finally {
      setUploadingGallery(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleToggleSelectImage = (imageId) => {
    setSelectedImagesToDelete(prev =>
      prev.includes(imageId) ? prev.filter(id => id !== imageId) : [...prev, imageId]
    );
  };

  const handleConfirmBatchDelete = async () => {
    if (selectedImagesToDelete.length === 0) return;
    setDeletingGallery(true);

    try {
      for (const id of selectedImagesToDelete) {
        await api.post("shop/deleteGalleryImage.php", { image_id: id });
      }
      setGalleryImages(prev => prev.filter(img => !selectedImagesToDelete.includes(img.id)));
      setSelectedImagesToDelete([]);
      setIsDeleteMode(false);
    } catch (err) {
      alert(err.message || "Error deleting gallery images.");
    } finally {
      setDeletingGallery(false);
    }
  };

  // Business Info Handlers
  const handleBusinessFormChange = (e) => {
    setBusinessForm({ ...businessForm, [e.target.name]: e.target.value });
  };

  const handleVehicleCatToggle = (catName) => {
    const current = businessForm.vehicleCategories;
    if (current.includes(catName)) {
      setBusinessForm({ ...businessForm, vehicleCategories: current.filter(c => c !== catName) });
    } else {
      setBusinessForm({ ...businessForm, vehicleCategories: [...current, catName] });
    }
  };

  const handleToggleAvailability = async (newVal) => {
    const updatedForm = { ...businessForm, isAvailable: newVal };
    setBusinessForm(updatedForm);
    try {
      const res = await api.post("shop/updateBusinessInfo.php", updatedForm);
      if (res.success) {
        setShopData(prev => ({ ...prev, isAvailable: newVal }));
      }
    } catch (err) {
      console.error("Error toggling shop availability:", err);
    }
  };

  const handleSaveBusinessInfo = async () => {
    setBusinessError("");
    if (!businessForm.name.trim() || !businessForm.owner.trim() || !businessForm.phone.trim()) {
      setBusinessError("Shop Name, Owner, and Phone are required.");
      return;
    }

    if (!/^(?:\+94\d{9}|0\d{9})$/.test(businessForm.phone.trim())) {
      setBusinessError("Invalid phone format. Valid formats: +94123456789 or 0123456789.");
      return;
    }

    setBusinessSaving(true);
    try {
      const res = await api.post("shop/updateBusinessInfo.php", businessForm);
      if (res.success) {
        setShopData({
          ...shopData,
          name: businessForm.name,
          owner: businessForm.owner,
          contactNumber: businessForm.phone,
          description: businessForm.description,
          openTime: businessForm.openTime,
          closeTime: businessForm.closeTime,
          isAvailable: businessForm.isAvailable,
          vehicleCategories: businessForm.vehicleCategories.join(', ')
        });
        setIsEditingBusinessInfo(false);
        setIsEditingHours(false);
      } else {
        setBusinessError(res.message || "Failed to save business information.");
      }
    } catch (err) {
      setBusinessError(err.message || "Error saving business information.");
    } finally {
      setBusinessSaving(false);
    }
  };

  // Host-Ready Custom Service Entry Handlers (API-First Sync)
  const handleAddCustomService = async () => {
    if (!newService.service_name.trim()) {
      alert("Please enter a Service Name.");
      return;
    }

    const entry = {
      category: newService.category.trim() || "General",
      service_name: newService.service_name.trim(),
      starting_price: newService.starting_price.trim() || "Varies",
      duration: newService.duration.trim() || "Varies"
    };

    const targetServices = Array.isArray(shopServices) ? [...shopServices, entry] : [entry];
    setServicesSaving(true);

    try {
      const res = await api.post("shop/updateServices.php", { services: targetServices });
      if (res?.success) {
        setShopServices(targetServices);
        setNewService({ category: "Mechanical", service_name: "", starting_price: "", duration: "" });
      } else {
        alert(res?.message || "Failed to add service.");
      }
    } catch (err) {
      alert(err.message || "Error adding service.");
    } finally {
      setServicesSaving(false);
    }
  };

  const handleRemoveService = async (index) => {
    const targetServices = Array.isArray(shopServices) ? shopServices.filter((_, i) => i !== index) : [];
    setServicesSaving(true);

    try {
      const res = await api.post("shop/updateServices.php", { services: targetServices });
      if (res?.success) {
        setShopServices(targetServices);
      } else {
        alert(res?.message || "Failed to delete service.");
      }
    } catch (err) {
      alert(err.message || "Error deleting service.");
    } finally {
      setServicesSaving(false);
    }
  };

  const handleSaveServices = async () => {
    setServicesSaving(true);
    let targetServices = Array.isArray(shopServices) ? [...shopServices] : [];
    if (newService.service_name.trim()) {
      targetServices.push({
        category: newService.category.trim() || "General",
        service_name: newService.service_name.trim(),
        starting_price: newService.starting_price.trim() || "Varies",
        duration: newService.duration.trim() || "Varies"
      });
    }
    try {
      const res = await api.post("shop/updateServices.php", { services: targetServices });
      if (res?.success) {
        setShopServices(targetServices);
        setNewService({ category: "Mechanical", service_name: "", starting_price: "", duration: "" });
        setIsEditingServices(false);
      } else {
        alert(res?.message || "Failed to update services.");
      }
    } catch (err) {
      alert(err.message || "Error saving services.");
    } finally {
      setServicesSaving(false);
    }
  };

  const handleTowFormChange = (e) => {
    setTowForm({ ...towForm, [e.target.name]: e.target.value });
  };

  const handleTowSave = () => {
    setTowError("");
    for (const field of ["driverName", "driverPhone", "truckBrand", "truckColor", "truckPlate"]) {
      if (!towForm[field]?.trim()) {
        setTowError("Please fill in all fields.");
        return;
      }
    }

    setTowSaving(true);
    api.post("shop/updateShopTowTruckDetails.php", { ...towForm })
      .then(data => {
        if (data.success) {
          setTowDetails({
            default_driver_name: towForm.driverName,
            default_driver_phone: towForm.driverPhone,
            default_truck_brand: towForm.truckBrand,
            default_truck_color: towForm.truckColor,
            tow_truck_plate: towForm.tow_truck_plate,
          });
          setShopData({ ...shopData, carriageService: 1 });
          setShowTowForm(false);
        } else {
          setTowError(data.message || "Failed to save tow truck details.");
        }
      })
      .catch(err => {
        console.error("Error saving tow truck details:", err);
        setTowError("Something went wrong. Please try again.");
      })
      .finally(() => setTowSaving(false));
  };

  const handleGoToShop = () => {
    if (shopData?.id) {
      window.location.href = `/shop/${shopData.id}`;
    }
  };

  if (!shopData) {
    return <div className="p-6 text-slate-500 font-medium">Loading shop profile...</div>;
  }

  const isCurrentlyOpen = Number(shopData.isAvailable) === 1;

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      
      {/* Page Title Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 m-0 tracking-tight">
          Shop Profile
        </h1>
        <p className="text-slate-500 mt-1 text-sm font-medium">
          Manage your shop information and public profile.
        </p>
      </div>

      {/* Top Shop Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Profile Photo Avatar with Edit Badge */}
          <div className="relative w-32 h-32 rounded-full bg-slate-900 flex items-center justify-center overflow-hidden shrink-0 group border-4 border-white shadow-md">
            <input
              type="file"
              ref={profilePhotoInputRef}
              onChange={handleUploadProfilePhoto}
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="hidden"
            />
            <img
              src={
                shopData?.profileImageURL
                  ? `${UPLOADS_URL}/${shopData.profileImageURL}`
                  : "/default-shop.png"
              }
              alt="Shop Logo"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => profilePhotoInputRef.current?.click()}
              disabled={uploadingProfilePhoto}
              title="Change Profile Photo"
              className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-white text-slate-700 shadow-md border border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-transform active:scale-95"
            >
              {uploadingProfilePhoto ? "..." : <FontAwesomeIcon icon={faCamera} />}
            </button>
          </div>

          <div className="text-center md:text-left space-y-1.5">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h2 className="text-2xl font-extrabold text-slate-900 m-0">
                {shopData.name}
              </h2>
              <span className="bg-green-50 text-green-600 border border-green-200/80 rounded-full py-0.5 px-3 text-xs font-semibold inline-flex items-center gap-1">
                <FontAwesomeIcon icon={faCheck} /> Verified
              </span>

              {/* Shop Availability Badge */}
              <button
                type="button"
                onClick={() => handleToggleAvailability(isCurrentlyOpen ? 0 : 1)}
                title="Click to toggle shop availability"
                className={`py-0.5 px-3 rounded-full text-xs font-bold border transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  isCurrentlyOpen
                    ? "bg-green-100/90 text-green-600 border-green-300 hover:bg-green-200"
                    : "bg-red-100 text-red-700 border-red-300 hover:bg-red-200"
                }`}
              >
                <span>{isCurrentlyOpen ? "🟢 OPEN" : "🔴 CLOSED"}</span>
              </button>
            </div>
            
            <p className="text-sm font-semibold text-slate-600 m-0">
              {shopData.categories || "Service Center"}
            </p>
            
            <div className="text-xs font-medium text-slate-500 flex items-center justify-center md:justify-start gap-1">
              <FontAwesomeIcon icon={faLocationDot} className="text-green-600" /> {shopData.address}
            </div>
            
            <div className="flex items-center justify-center md:justify-start gap-1.5 pt-1">
              <Stars count={Math.round(Number(shopData.averageRating || 0))} />
              <span className="text-xs font-bold text-slate-800">
                {Number(shopData.averageRating || 0).toFixed(1)}
              </span>
              <span className="text-xs font-medium text-slate-500">
                ({shopData.reviewCount || 0} reviews)
              </span>
            </div>
          </div>
        </div>

        {/* Go to My Shop Button */}
        <button
          type="button"
          onClick={handleGoToShop}
          className="py-2.5 px-5 rounded-xl border border-green-600 bg-white text-green-600 font-semibold text-xs cursor-pointer hover:bg-green-50 flex items-center gap-2 transition-all shadow-2xs shrink-0"
        >
          <FontAwesomeIcon icon={faEye} /> Go to My Shop ↗
        </button>
      </div>

      {/* 5-Tab Navigation Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("info")}
          className={`py-2.5 px-4 rounded-xl border font-semibold text-xs cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === "info"
              ? "bg-green-50 text-green-600 border-green-600 shadow-2xs"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <FontAwesomeIcon icon={faCircleInfo} /> Shop Information
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("hours")}
          className={`py-2.5 px-4 rounded-xl border font-semibold text-xs cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === "hours"
              ? "bg-green-50 text-green-600 border-green-600 shadow-2xs"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <FontAwesomeIcon icon={faClock} /> Opening Hours
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("gallery")}
          className={`py-2.5 px-4 rounded-xl border font-semibold text-xs cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === "gallery"
              ? "bg-green-50 text-green-600 border-green-600 shadow-2xs"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <FontAwesomeIcon icon={faImage} /> Shop Gallery
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tow")}
          className={`py-2.5 px-4 rounded-xl border font-semibold text-xs cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === "tow"
              ? "bg-green-50 text-green-600 border-green-600 shadow-2xs"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <FontAwesomeIcon icon={faTruck} /> Transportation Details
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("services")}
          className={`py-2.5 px-4 rounded-xl border font-semibold text-xs cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === "services"
              ? "bg-green-50 text-green-600 border-green-600 shadow-2xs"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <FontAwesomeIcon icon={faWrench} /> Services Offered
        </button>
      </div>

      {/* Tab Panel Content */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm min-h-[350px]">
        {activeTab === "info" && (
          <ShopInfoTab
            shopData={shopData}
            isEditingBusinessInfo={isEditingBusinessInfo}
            setIsEditingBusinessInfo={setIsEditingBusinessInfo}
            businessForm={businessForm}
            handleBusinessFormChange={handleBusinessFormChange}
            handleVehicleCatToggle={handleVehicleCatToggle}
            businessSaving={businessSaving}
            businessError={businessError}
            handleSaveBusinessInfo={handleSaveBusinessInfo}
          />
        )}
        {activeTab === "hours" && (
          <ShopHoursTab
            shopData={shopData}
            isCurrentlyOpen={isCurrentlyOpen}
            handleToggleAvailability={handleToggleAvailability}
            isEditingHours={isEditingHours}
            setIsEditingHours={setIsEditingHours}
            formatTime={formatTime}
            businessForm={businessForm}
            setBusinessForm={setBusinessForm}
            handleBusinessFormChange={handleBusinessFormChange}
            businessSaving={businessSaving}
            businessError={businessError}
            handleSaveBusinessInfo={handleSaveBusinessInfo}
          />
        )}
        {activeTab === "gallery" && (
          <ShopGalleryTab
            galleryImages={galleryImages}
            uploadingGallery={uploadingGallery}
            fileInputRef={fileInputRef}
            handleUploadImage={handleUploadImage}
            isDeleteMode={isDeleteMode}
            setIsDeleteMode={setIsDeleteMode}
            selectedImagesToDelete={selectedImagesToDelete}
            setSelectedImagesToDelete={setSelectedImagesToDelete}
            handleToggleSelectImage={handleToggleSelectImage}
            handleConfirmBatchDelete={handleConfirmBatchDelete}
            deletingGallery={deletingGallery}
          />
        )}
        {activeTab === "tow" && (
          <ShopTowTab
            hasTowService={hasTowService}
            showTowForm={showTowForm}
            setShowTowForm={setShowTowForm}
            towLoading={towLoading}
            towDetails={towDetails}
            towForm={towForm}
            handleTowFormChange={handleTowFormChange}
            towError={towError}
            setTowError={setTowError}
            handleTowSave={handleTowSave}
            towSaving={towSaving}
          />
        )}
        {activeTab === "services" && (
          <ShopServicesTab
            isEditingServices={isEditingServices}
            setIsEditingServices={setIsEditingServices}
            shopServices={shopServices}
            handleRemoveService={handleRemoveService}
            servicesSaving={servicesSaving}
            newService={newService}
            setNewService={setNewService}
            handleAddCustomService={handleAddCustomService}
            handleSaveServices={handleSaveServices}
          />
        )}
      </div>
    </div>
  );
}

export default ShopProfile;
