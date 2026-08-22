import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCar, faWrench, faCamera, faCheckCircle, faPaperPlane, faShieldAlt, faCheck, faChevronLeft, faLock } from "@fortawesome/free-solid-svg-icons";

export const ReviewSubmitStep = ({
    shop,
    distance,
    vehicleCategory,
    brand,
    color,
    issueCategory,
    urgencyLevel,
    requiresTow,
    preferredDate,
    preferredTime,
    description,
    imageFile,
    agreedToTerms,
    setAgreedToTerms,
    isSubmitting,
    handleSubmit,
    setStep
}) => {
        // Helper to translate vehicle ID to text
        const getVehicleTypeText = () => {
            if (vehicleCategory === 1) return "2/3 Wheeler";
            if (vehicleCategory === 2) return "4 Wheeler";
            if (vehicleCategory === 3) return "Commercial";
            return "Unknown";
        };


    return (
            <div className="animate-in slide-in-from-right-4 duration-300">

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    {/* LEFT COLUMN: Data */}
                    <div className="space-y-4">

                        {/* Vehicle Info Card */}
                        <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2 text-[#14532d] font-bold text-sm">
                                    <FontAwesomeIcon icon={faCar} /> Vehicle Information
                                </div>
                                <button onClick={() => setStep(1)} className="text-[#16a34a] bg-[#f0fdf4] px-3 py-1 rounded-md text-xs font-bold hover:bg-[#dcfce7] transition-colors">Edit</button>
                            </div>
                            {/* Perfectly aligned 3-column grid */}
                            <div className="grid grid-cols-[110px_10px_1fr] gap-y-2.5 text-[13px]">
                                <span className="text-gray-500">Vehicle Type</span> <span>:</span> <span className="font-bold text-gray-800">{getVehicleTypeText()}</span>
                                <span className="text-gray-500">Brand</span> <span>:</span> <span className="font-bold text-gray-800">{brand}</span>
                                <span className="text-gray-500">Color</span> <span>:</span> <span className="font-bold text-gray-800">{color}</span>
                            </div>
                        </div>

                        {/* Service Details Card */}
                        <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2 text-[#14532d] font-bold text-sm">
                                    <FontAwesomeIcon icon={faWrench} /> Service Details
                                </div>
                                <button onClick={() => setStep(1)} className="text-[#16a34a] bg-[#f0fdf4] px-3 py-1 rounded-md text-xs font-bold hover:bg-[#dcfce7] transition-colors">Edit</button>
                            </div>
                            <div className="grid grid-cols-[110px_10px_1fr] gap-y-2.5 text-[13px]">
                                <span className="text-gray-500">Category</span> <span>:</span> <span className="font-bold text-gray-800">{issueCategory || 'General Checkup'}</span>

                                {shop.shopCategories?.includes('Garages') ? (
                                    <>
                                        <span className="text-gray-500">Urgency</span> <span>:</span>
                                        <span className={`font-bold ${urgencyLevel === 'Urgent' ? 'text-red-600' : 'text-gray-800'}`}>{urgencyLevel}</span>
                                        <span className="text-gray-500">Tow Required</span> <span>:</span>
                                        <span className="font-bold text-gray-800">{requiresTow ? 'Yes' : 'No'}</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-gray-500">Appointment</span> <span>:</span>
                                        <span className="font-bold text-gray-800">{preferredDate ? `${preferredDate} at ${preferredTime}` : 'As soon as possible'}</span>
                                    </>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <span className="text-gray-500 text-[13px] block mb-1.5">Issue Description :</span>
                                <p className="font-medium text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 text-[13px] leading-relaxed">{description}</p>
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Visuals & Expectations */}
                    <div className="space-y-4 flex flex-col h-full">

                        {/* Photos Card */}
                        {(shop.shopCategories?.length > 0) && (
                            <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2 text-[#14532d] font-bold text-sm">
                                        <FontAwesomeIcon icon={faCamera} /> Photos {imageFile ? '(1)' : '(0)'}
                                    </div>
                                    <button onClick={() => setStep(1)} className="text-[#16a34a] bg-[#f0fdf4] px-3 py-1 rounded-md text-xs font-bold hover:bg-[#dcfce7] transition-colors">Edit</button>
                                </div>
                                <div className="flex gap-2">
                                    {imageFile ? (
                                        <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 relative group">
                                            <img src={URL.createObjectURL(imageFile)} alt="Problem" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-full py-6 text-center border-2 border-dashed border-gray-200 rounded-xl text-[13px] text-gray-400 font-medium bg-gray-50/50">
                                            No photos attached
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* What Happens Next - Timeline */}
                        <div className="border border-[#16a34a]/20 bg-[#f0fdf4]/50 rounded-xl p-6 flex-1">
                            <h4 className="font-bold text-[#14532d] text-sm mb-5">What happens next?</h4>
                            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px before:h-[80%] before:w-[2px] before:bg-gradient-to-b before:from-[#16a34a] before:to-transparent before:left-0">

                                <div className="relative flex items-start gap-4">
                                    <div className="w-5 h-5 rounded-full bg-[#16a34a] text-white flex items-center justify-center text-[10px] font-bold shrink-0 z-10 outline outline-4 outline-[#f0fdf4]">1</div>
                                    <div className="pt-0.5">
                                        <p className="text-[13px] font-bold text-gray-800">Shop receives your request</p>
                                        <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">Your request will be sent to the selected shop instantly.</p>
                                    </div>
                                </div>

                                <div className="relative flex items-start gap-4">
                                    <div className="w-5 h-5 rounded-full bg-[#16a34a] text-white flex items-center justify-center text-[10px] font-bold shrink-0 z-10 outline outline-4 outline-[#f0fdf4]">2</div>
                                    <div className="pt-0.5">
                                        <p className="text-[13px] font-bold text-gray-800">Shop reviews your issue</p>
                                        <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">The team will review your details and photos.</p>
                                    </div>
                                </div>

                                <div className="relative flex items-start gap-4">
                                    <div className="w-5 h-5 rounded-full bg-[#16a34a] text-white flex items-center justify-center text-[10px] font-bold shrink-0 z-10 outline outline-4 outline-[#f0fdf4]">3</div>
                                    <div className="pt-0.5">
                                        <p className="text-[13px] font-bold text-gray-800">You receive a response</p>
                                        <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">The shop will confirm your booking or suggest a time.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* FULL WIDTH: Terms and Conditions Card */}
                <div className="mt-5 border border-[#f59e0b]/30 bg-[#fffbeb] rounded-xl p-5">
                    <div className="flex items-center gap-2 text-[#b45309] font-bold text-sm mb-3">
                        <FontAwesomeIcon icon={faShieldAlt} /> By submitting this request
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer group">

                        {/* THE FIX: The hidden input that actually handles the click state */}
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                        />

                        {/* Perfectly aligned, amber-themed custom checkbox */}
                        <div className={`mt-0.5 w-5 h-5 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors ${agreedToTerms ? 'bg-[#b45309] border-[#b45309]' : 'border-[#d97706]/40 bg-white group-hover:border-[#b45309]'}`}>
                            {agreedToTerms && <FontAwesomeIcon icon={faCheck} className="text-white text-[11px]" />}
                        </div>

                        <span className="text-[13px] text-gray-700 leading-relaxed">
                            I understand that submitting this request does not guarantee repair service. I agree to share my contact information securely with the selected shop.
                        </span>

                    </label>
                </div>

                {/* Footer Actions */}
                <div className="mt-8 pt-5 border-t border-gray-100 flex flex-col items-center">
                    <div className="w-full flex items-center justify-between mb-4">
                        <button onClick={() => setStep(1)} className="px-6 py-2.5 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors text-sm flex items-center gap-2 h-[44px]">
                            <FontAwesomeIcon icon={faChevronLeft} className="text-xs" /> Back
                        </button>

                        <button
                            onClick={handleSubmit}
                            disabled={!agreedToTerms || isSubmitting}
                            className={`px-8 py-2.5 rounded-xl font-bold text-white transition-all text-sm flex items-center gap-2 h-[44px] ${!agreedToTerms || isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#16a34a] hover:bg-[#15803d] active:scale-95 shadow-md'}`}
                        >
                            {isSubmitting ? 'Sending...' : 'Send Request'} <FontAwesomeIcon icon={faPaperPlane} className="text-xs" />
                        </button>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                        <FontAwesomeIcon icon={faLock} className="text-[10px]" /> Your information is secure and encrypted
                    </div>
                </div>

            </div>
        );
};
