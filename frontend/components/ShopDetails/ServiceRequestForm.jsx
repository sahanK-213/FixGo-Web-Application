import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTimes, faTruckPickup, faCar, faInfoCircle, faCamera,
    faCheckCircle, faExclamationTriangle, faClock, faChevronLeft,
    faCopy, faStar, faMapMarkerAlt, faBolt, faMotorcycle, faTruck,
    faCogs, faBatteryFull, faLifeRing, faWrench, faQuestionCircle,
    faPaperPlane, faShieldAlt, faLock, faCheck, faPlus
} from "@fortawesome/free-solid-svg-icons";
import { api } from "../../src/services/api";


import { Step1Form } from "./ServiceRequest/Step1Form";
import { ReviewSubmitStep } from "./ServiceRequest/ReviewSubmitStep";
import { SuccessStep } from "./ServiceRequest/SuccessStep";

export const ServiceRequestModal = ({ isOpen, onClose, shop, distance, initialNeedsTow = false, onTrackRequest }) => {
    // NEW: Wizard Step State (1: Form, 2: Review, 3: Success)
    const [step, setStep] = useState(1);

    // Form State
    const [brand, setBrand] = useState('');
    const [color, setColor] = useState('');
    const [description, setDescription] = useState('');
    const [requiresTow, setRequiresTow] = useState(initialNeedsTow);
    const [imageFile, setImageFile] = useState(null);
    const [vehicleCategory, setVehicleCategory] = useState(2);
    const [savedVehicles, setSavedVehicles] = useState([]);
    const [selectedVehicleId, setSelectedVehicleId] = useState(null);

    // NEW: Premium Data States matching our DB upgrades
    const [issueCategory, setIssueCategory] = useState('');
    const [pickupLandmark, setPickupLandmark] = useState('');
    const [urgencyLevel, setUrgencyLevel] = useState('Normal');
    const [preferredDate, setPreferredDate] = useState('');
    const [preferredTime, setPreferredTime] = useState('');
    const [lat, setLat] = useState(6.9061); // Default to Malabe for now
    const [lng, setLng] = useState(79.9696);
    const [locationStatus, setLocationStatus] = useState(''); // To show "Locating..." or "Acquired"

    // NEW: Review Checkboxes
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    // Submission State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [referenceId, setReferenceId] = useState(''); // NEW: To store the formatted ID

    // Reset the form and fetch vehicles
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            api.get("customer/getVehicles.php").then(res => {
                if (res.success && res.vehicles && res.vehicles.length > 0) {
                    setSavedVehicles(res.vehicles);
                    // Pre-select first vehicle
                    const first = res.vehicles[0];
                    setSelectedVehicleId(first.id);
                    setVehicleCategory(parseInt(first.vehicle_category_id));
                    setBrand(first.brand);
                    setColor(first.color);
                } else {
                    setSavedVehicles([]);
                    setSelectedVehicleId('new');
                }
            }).catch(() => {
                setSavedVehicles([]);
                setSelectedVehicleId('new');
            });
            setRequiresTow(initialNeedsTow);
            setBrand('');
            setColor('');
            setDescription('');
            setImageFile(null);
            setIssueCategory('');
            setPickupLandmark('');
            setUrgencyLevel('Normal');
            setAgreedToTerms(false);
            setError('');
            setReferenceId('');
            setPreferredDate('');
            setPreferredTime('');
        }
    }, [isOpen, initialNeedsTow]);

    // NEW FIX: Force modal to scroll to top whenever it is opened or the step changes
    useEffect(() => {
        if (isOpen) {
            const modalScrollContainer = document.getElementById("modal-scroll-container");
            if (modalScrollContainer) {
                modalScrollContainer.scrollTop = 0;
            }
        }
    }, [isOpen, step]);

    if (!isOpen || !shop) return null;

    // Helper: Convert Image
    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.readAsDataURL(file);
            fileReader.onload = () => resolve(fileReader.result);
            fileReader.onerror = (error) => reject(error);
        });
    };

    // Helper: Format the ID for the success screen
    const formatReferenceId = (rawId) => {
        const year = new Date().getFullYear();
        const paddedId = String(rawId).padStart(5, '0');
        return `REQ-${year}-${paddedId}`;
    };

    // NEW: Handle moving to Review step
    const handleProceedToReview = (e) => {
        e.preventDefault();
        setStep(2);
    };

    // Handle Final Submit
    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError('');

        try {
            const token = localStorage.getItem("jwt_token");
            if (!token) {
                setError("Please log in again.");
                setIsSubmitting(false);
                return;
            }
            let base64Image = null;
            if (imageFile) {
                base64Image = await convertToBase64(imageFile);
            }

            // Just-in-Time Auto-Save for new vehicles
            if (selectedVehicleId === 'new') {
                try {
                    await api.post("customer/addVehicle.php", {
                        vehicle_category_id: vehicleCategory,
                        brand: brand,
                        color: color
                    });
                } catch (e) {
                    // Silently fail auto-save if error, don't block request
                }
            }

            const requestData = {
                shop_id: shop.info.id,
                vehicle_category_id: vehicleCategory,
                vehicle_brand: brand,
                vehicle_color: color,
                description: description,
                requires_tow: requiresTow,
                problem_image: base64Image,
                lat: lat,
                lng: lng,
                urgency_level: shop.shopCategories?.includes('Garages') ? urgencyLevel : null,
                preferred_date: !shop.shopCategories?.includes('Garages') ? preferredDate : null,
                preferred_time: !shop.shopCategories?.includes('Garages') ? preferredTime : null,
                issue_category: issueCategory,
                pickup_landmark: requiresTow ? pickupLandmark : null
            };

            const data = await api.post('shop-details/createServiceRequest.php', requestData);
            setReferenceId(formatReferenceId(data.request_id));
            setStep(3);

        } catch (err) {
            setError(err.message);
            setStep(1);
        } finally {
            setIsSubmitting(false);
        }
    };


    // --- SUB-COMPONENTS FOR CLEANER CODE ---
    // 1. The Sticky Top Navigation (Does NOT scroll)
    const renderStickyTopBar = () => (
        <div className="px-5 py-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0 z-10">
            {/* Left: Static Title */}
            <h2 className="text-[19px] font-extrabold text-[#14532d]">Request Service</h2>

            {/* Center: Progress Tracker */}
            <div className="flex items-center gap-3">
                {/* Step 1 Indicator */}
                <div className="flex items-center gap-2">
                    {step === 1 ? (
                        <div className="w-5 h-5 rounded-full bg-[#16a34a] text-white flex items-center justify-center text-[10px] font-bold">1</div>
                    ) : (
                        <div className="w-5 h-5 rounded-full bg-[#dcfce7] text-[#16a34a] flex items-center justify-center text-[10px]">
                            <FontAwesomeIcon icon={faCheck} />
                        </div>
                    )}
                    <span className="text-xs font-bold text-slate-500">Service Details</span>
                </div>

                <div className="w-8 h-[1px] bg-slate-200 hidden sm:block"></div>

                {/* Step 2 Indicator */}
                <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 2 ? 'bg-[#16a34a] text-white' : 'bg-[#f3f4f6] text-slate-400'}`}>2</div>
                    <span className={`text-xs ${step === 2 ? 'font-bold text-[#16a34a]' : 'font-medium text-slate-400'}`}>Review & Submit</span>
                </div>
            </div>

            {/* Right: Close Button */}
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
                <FontAwesomeIcon icon={faTimes} className="text-xl" />
            </button>
        </div>
    );

    // 2. The Shop Info Card (DOES scroll)
    const renderShopInfoCard = () => (
        <div className="p-4 sm:p-6 pb-0">
            {/* Shows only on Step 2 */}
            {step === 2 && (
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-[#1f2937]">Review your request</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Please review the details below before sending your request.</p>
                </div>
            )}

            {/* DYNAMIC SHOP INFO CARD - Refined Proportions */}
            <div className="border border-slate-100 rounded-xl p-4 flex items-center gap-5 sm:gap-6 bg-white shadow-sm">
                <div className="w-16 h-16 rounded-full bg-[#f3f4f6] flex flex-col items-center justify-center flex-shrink-0 border border-slate-200">
                    <FontAwesomeIcon icon={faCar} className="text-2xl text-slate-400 mb-0.5" />
                </div>
                <div className="flex flex-col justify-center gap-1.5">
                    <h3 className="text-[17px] font-extrabold text-[#1f2937] leading-tight">{shop?.info?.name || 'Service Center'}</h3>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[13px] text-slate-500 mt-0.5">
                        <div className="flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faStar} className="text-[#f59e0b]" />
                            <span className="font-bold text-slate-700">{shop?.stats?.averageRating || 'New'}</span>
                            {shop?.stats?.reviewCount > 0 && <span>({shop.stats.reviewCount} reviews)</span>}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-slate-400" />
                            <span>{distance + ' km away' || 'Distance unknown'}</span>
                        </div>
                        <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded border text-[12px] font-bold tracking-wide ${(shop?.info?.is_open_now ?? shop?.info?.isAvailable) ? 'border-[#16a34a]/20 bg-[#ecfdf5] text-[#059669]' : 'border-red-500/20 bg-red-50 text-red-600'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${(shop?.info?.is_open_now ?? shop?.info?.isAvailable) ? 'bg-[#059669]' : 'bg-red-600'}`}></div>
                            {shop?.info?.open_status_text || (shop?.info?.isAvailable ? 'Open Now' : 'Closed')}
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[13px] text-slate-500 font-medium mt-1">
                        <FontAwesomeIcon icon={faBolt} className="text-slate-400" />
                        <span>Average response time: {shop?.info?.response_time_minutes || shop?.responseTime || 15} minutes</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const handleTowSelection = () => {
        setRequiresTow(true);
        setLocationStatus('Acquiring GPS...');

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLat(position.coords.latitude);
                    setLng(position.coords.longitude);
                    setLocationStatus('GPS Locked ✓');
                },
                (error) => {
                    setLocationStatus('GPS unavailable - Please enter landmark below');
                },
                { enableHighAccuracy: true, timeout: 5000 }
            );
        } else {
            setLocationStatus('GPS not supported by browser');
        }
    };

    const renderStep1Form = () => (
        <form onSubmit={handleProceedToReview} className="space-y-6 pb-2">
            <Step1Form 
                shop={shop}
                savedVehicles={savedVehicles}
                selectedVehicleId={selectedVehicleId}
                setSelectedVehicleId={setSelectedVehicleId}
                vehicleCategory={vehicleCategory}
                setVehicleCategory={setVehicleCategory}
                brand={brand}
                setBrand={setBrand}
                color={color}
                setColor={setColor}
                requiresTow={requiresTow}
                setRequiresTow={setRequiresTow}
                handleTowSelection={handleTowSelection}
                locationStatus={locationStatus}
                pickupLandmark={pickupLandmark}
                setPickupLandmark={setPickupLandmark}
                issueCategory={issueCategory}
                setIssueCategory={setIssueCategory}
                description={description}
                setDescription={setDescription}
                imageFile={imageFile}
                setImageFile={setImageFile}
                urgencyLevel={urgencyLevel}
                setUrgencyLevel={setUrgencyLevel}
                preferredDate={preferredDate}
                setPreferredDate={setPreferredDate}
                preferredTime={preferredTime}
                setPreferredTime={setPreferredTime}
            />

            {/* Premium Footer Row - Actions Only */}
            <div className="flex items-center justify-end gap-3 pt-6 mt-8 border-t border-gray-100">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 sm:px-6 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors text-xs sm:text-sm h-[44px]"
                >
                    Cancel
                </button>

                <button
                    type="button" // Changed to button to let handleProceedToReview manage the state transition
                    onClick={handleProceedToReview}
                    disabled={!brand || !color || !description}
                    className="px-4 sm:px-6 py-2.5 rounded-xl font-bold text-white bg-[#16a34a] hover:bg-[#15803d] transition-all text-xs sm:text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-sm h-[44px]"
                >
                    Review Request <FontAwesomeIcon icon={faPaperPlane} className="text-xs" />
                </button>
            </div>
        </form>
    );
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* THE FIX 1: Sticky Top Bar stays OUTSIDE the overflow container */}
                {step !== 3 && renderStickyTopBar()}

                {/* THE FIX 2: Everything else goes INSIDE the scrolling container */}
                <div id="modal-scroll-container" className="flex-1 overflow-y-auto">

                    {/* The Shop Card now scrolls out of the way gracefully */}
                    {step !== 3 && renderShopInfoCard()}

                    {/* Modal Body / Form */}
                    <div className="p-4 sm:p-6">
                        {error && (
                            <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-700 text-sm font-mono">
                                <FontAwesomeIcon icon={faInfoCircle} className="mt-0.5 text-red-500" />
                                <p>{error}</p>
                            </div>
                        )}

                        {step === 1 && renderStep1Form()}
                        {step === 2 && <ReviewSubmitStep 
                            shop={shop}
                            distance={distance}
                            vehicleCategory={vehicleCategory}
                            brand={brand}
                            color={color}
                            issueCategory={issueCategory}
                            urgencyLevel={urgencyLevel}
                            requiresTow={requiresTow}
                            preferredDate={preferredDate}
                            preferredTime={preferredTime}
                            description={description}
                            imageFile={imageFile}
                            agreedToTerms={agreedToTerms}
                            setAgreedToTerms={setAgreedToTerms}
                            isSubmitting={isSubmitting}
                            handleSubmit={handleSubmit}
                            setStep={setStep}
                        />}
                        {step === 3 && <SuccessStep 
                            shop={shop}
                            distance={distance}
                            referenceId={referenceId}
                            onClose={onClose}
                            onTrackRequest={onTrackRequest}
                        />}
                    </div>
                </div>

            </div>
        </div>
    );
};
