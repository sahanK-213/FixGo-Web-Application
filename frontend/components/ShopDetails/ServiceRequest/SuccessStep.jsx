import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
    faTimes, faCheck, faCar, faStar, faMapMarkerAlt, faCopy, 
    faBolt, faPaperPlane, faClock, faCheckCircle, faWrench, faInfoCircle, faLock 
} from "@fortawesome/free-solid-svg-icons";

export const SuccessStep = ({
    shop,
    distance,
    referenceId,
    onClose,
    onTrackRequest
}) => {
    return (
        <div className="relative pt-10 pb-6 flex flex-col items-center justify-center animate-in zoom-in duration-400">

            {/* Top Right Close Button */}
            <button onClick={onClose} className="absolute -top-2 -right-2 text-gray-400 hover:text-gray-700 transition-colors p-2">
                <FontAwesomeIcon icon={faTimes} className="text-xl" />
            </button>

            {/* Main Success Icon */}
            <div className="relative mb-6">
                <div className="w-20 h-20 bg-[#16a34a] text-white rounded-full flex items-center justify-center text-4xl shadow-lg shadow-[#16a34a]/20">
                    <FontAwesomeIcon icon={faCheck} />
                </div>
                {/* Simplified Confetti Dots */}
                <div className="absolute top-1 -left-4 w-2 h-2 rounded-full bg-blue-400"></div>
                <div className="absolute top-4 -right-4 w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                <div className="absolute -bottom-2 left-2 w-2 h-2 rounded-full bg-green-300"></div>
            </div>

            <h4 className="text-[24px] font-bold text-[#14532d] mb-1.5">Request Sent Successfully!</h4>
            <p className="text-[14px] text-gray-500 mb-8">Your request has been sent to</p>

            {/* --- ALL CONTAINERS BELOW SCALED TO max-w-md FOR PERFECT ALIGNMENT --- */}

            {/* DYNAMIC Shop Info Card Mini */}
            <div className="border border-gray-100 rounded-xl p-3.5 flex items-center gap-4 bg-white shadow-sm w-full max-w-md mb-5">
                <div className="w-12 h-12 rounded-full bg-[#f3f4f6] flex flex-col items-center justify-center flex-shrink-0 border border-gray-200">
                    <FontAwesomeIcon icon={faCar} className="text-lg text-gray-400" />
                </div>
                <div className="flex flex-col justify-center">
                    <h3 className="text-[14px] font-bold text-[#1f2937]">{shop?.info?.name || 'Service Center'}</h3>
                    <div className="flex items-center gap-3 text-[12px] text-gray-500 mt-0.5">
                        <div className="flex items-center gap-1">
                            <FontAwesomeIcon icon={faStar} className="text-[#f59e0b]" />
                            <span className="font-bold text-gray-700">{shop?.stats?.averageRating || 'New'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400" />
                            <span>{distance || 'Distance unknown'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reference ID Box */}
            <div className="w-full max-w-md border border-dashed border-[#16a34a]/40 bg-[#f0fdf4]/50 rounded-xl p-5 flex flex-col items-center justify-center relative mb-4">
                <span className="text-[11px] font-bold text-[#14532d] uppercase tracking-wider mb-1">Reference ID</span>
                <span className="text-xl font-mono font-bold text-gray-800 tracking-wide">{referenceId || 'REQ-2026-00124'}</span>
                <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(referenceId)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#16a34a] transition-colors p-2 cursor-pointer"
                    title="Copy ID"
                >
                    <FontAwesomeIcon icon={faCopy} className="text-lg" />
                </button>
            </div>

            {/* DYNAMIC Estimated Response Time Box */}
            <div className="w-full max-w-md bg-[#f0fdf4] border border-[#dcfce7] rounded-xl p-4 flex items-center justify-center gap-3 mb-6 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-[#dcfce7] flex items-center justify-center">
                    <FontAwesomeIcon icon={faBolt} className="text-[#16a34a] text-sm" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[12px] text-[#14532d] font-bold">Estimated Response Time</span>
                    <span className="text-[15px] font-bold text-[#16a34a]">~ {shop?.info?.response_time_minutes || shop?.responseTime || 15} Minutes</span>
                </div>
            </div>

            {/* What's Next Tracker */}
            <div className="w-full max-w-md border border-gray-100 rounded-xl p-6 mb-6 bg-white shadow-sm">
                <h4 className="text-[13px] font-bold text-[#14532d] mb-5">What's next?</h4>
                <div className="flex items-start justify-between relative px-2">
                    {/* Background Line */}
                    <div className="absolute top-4 left-8 right-8 h-[2px] bg-gray-100 -z-10"></div>

                    {/* Step 1 */}
                    <div className="flex flex-col items-center gap-2 bg-white relative">
                        <div className="w-8 h-8 rounded-full bg-[#ecfdf5] border-2 border-[#16a34a] text-[#16a34a] flex items-center justify-center text-[11px] shadow-sm">
                            <FontAwesomeIcon icon={faPaperPlane} />
                        </div>
                        <span className="text-[10px] font-bold text-[#16a34a] whitespace-nowrap absolute -bottom-5">Request Sent</span>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-center gap-2 bg-white relative">
                        <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 text-gray-300 flex items-center justify-center text-[11px]">
                            <FontAwesomeIcon icon={faClock} />
                        </div>
                        <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap absolute -bottom-5">Reviewing</span>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col items-center gap-2 bg-white relative">
                        <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 text-gray-300 flex items-center justify-center text-[11px]">
                            <FontAwesomeIcon icon={faCheckCircle} />
                        </div>
                        <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap absolute -bottom-5">Responded</span>
                    </div>

                    {/* Step 4 */}
                    <div className="flex flex-col items-center gap-2 bg-white relative">
                        <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 text-gray-300 flex items-center justify-center text-[11px]">
                            <FontAwesomeIcon icon={faWrench} />
                        </div>
                        <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap absolute -bottom-5">Repairing</span>
                    </div>
                </div>
            </div>

            {/* Notification Info Banner */}
            <div className="w-full max-w-md bg-[#eff6ff] border border-[#bfdbfe] rounded-xl p-4 flex items-start gap-3 mb-6">
                <FontAwesomeIcon icon={faInfoCircle} className="text-[#3b82f6] mt-0.5 text-sm" />
                <div className="text-[12px] text-[#1e3a8a] leading-relaxed">
                    You will be notified as soon as the shop responds.<br />
                    You can track the status of your request anytime.
                </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full max-w-md flex gap-3 mb-6">
                <button
                    onClick={() => {
                        onClose();
                        if (onTrackRequest) onTrackRequest(referenceId);
                    }}
                    className="flex-1 py-3.5 rounded-xl font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                    <FontAwesomeIcon icon={faClock} className="text-[#16a34a]" /> Track Request
                </button>
                <button onClick={onClose} className="flex-1 py-3.5 rounded-xl font-bold bg-[#16a34a] text-white hover:bg-[#15803d] transition-colors text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer">
                    <FontAwesomeIcon icon={faCar} /> Back to Shops
                </button>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                <FontAwesomeIcon icon={faLock} className="text-[10px]" /> Thank you for choosing FixGo!
            </div>
        </div>
    );
};
