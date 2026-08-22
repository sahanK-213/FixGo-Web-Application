import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
    faCar, faPlus, faMotorcycle, faTruck, faTruckPickup, 
    faMapMarkerAlt, faCogs, faBatteryFull, faLifeRing, faWrench, 
    faQuestionCircle, faCamera, faTimes, faClock, faExclamationTriangle 
} from "@fortawesome/free-solid-svg-icons";

export const Step1Form = ({
    shop,
    savedVehicles,
    selectedVehicleId,
    setSelectedVehicleId,
    vehicleCategory,
    setVehicleCategory,
    brand,
    setBrand,
    color,
    setColor,
    requiresTow,
    setRequiresTow,
    handleTowSelection,
    locationStatus,
    pickupLandmark,
    setPickupLandmark,
    issueCategory,
    setIssueCategory,
    description,
    setDescription,
    imageFile,
    setImageFile,
    urgencyLevel,
    setUrgencyLevel,
    preferredDate,
    setPreferredDate,
    preferredTime,
    setPreferredTime
}) => {
    return (
        <div className="space-y-6">
            {/* 1. Vehicle Selection */}

            <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-[#16a34a] text-white flex items-center justify-center text-[11px] font-bold">1</div>
                <h3 className="font-bold text-[#1f2937] text-[13px]">Select Vehicle</h3>
            </div>
            
            {savedVehicles.length > 0 && (
                <div className="flex flex-col gap-2 mb-3">
                    {savedVehicles.map(v => (
                        <button
                            key={v.id}
                            type="button"
                            onClick={() => {
                                setSelectedVehicleId(v.id);
                                setVehicleCategory(parseInt(v.vehicle_category_id));
                                setBrand(v.brand);
                                setColor(v.color);
                            }}
                            className={`p-3 rounded-xl border flex items-center gap-3 transition-all text-left ${selectedVehicleId === v.id ? 'border-[#16a34a] bg-[#f0fdf4] shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                        >
                            <FontAwesomeIcon icon={faCar} className={`text-lg ${selectedVehicleId === v.id ? 'text-[#16a34a]' : 'text-gray-400'}`} />
                            <div className="flex-1">
                                <span className={`block text-[13px] font-bold ${selectedVehicleId === v.id ? 'text-[#14532d]' : 'text-gray-800'}`}>{v.brand}</span>
                                <span className="block text-[11px] text-gray-500">{v.color}</span>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedVehicleId === v.id ? 'border-[#16a34a]' : 'border-gray-300'}`}>
                                {selectedVehicleId === v.id && <div className="w-2 h-2 rounded-full bg-[#16a34a]"></div>}
                            </div>
                        </button>
                    ))}
                    
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedVehicleId('new');
                            setBrand('');
                            setColor('');
                        }}
                        className={`p-3 rounded-xl border border-dashed flex items-center gap-3 transition-all text-left ${selectedVehicleId === 'new' ? 'border-[#16a34a] bg-[#f0fdf4]' : 'border-gray-300 bg-gray-50 hover:border-gray-400'}`}
                    >
                        <FontAwesomeIcon icon={faPlus} className={`text-sm ${selectedVehicleId === 'new' ? 'text-[#16a34a]' : 'text-gray-500'}`} />
                        <span className={`text-[12px] font-bold ${selectedVehicleId === 'new' ? 'text-[#14532d]' : 'text-gray-600'}`}>Use a different vehicle</span>
                        <div className="flex-1"></div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedVehicleId === 'new' ? 'border-[#16a34a]' : 'border-gray-300'}`}>
                            {selectedVehicleId === 'new' && <div className="w-2 h-2 rounded-full bg-[#16a34a]"></div>}
                        </div>
                    </button>
                </div>
            )}

            {selectedVehicleId === 'new' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 mt-3 p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                    
                    <div className="mb-4">
                        <label className="block text-[12px] font-bold text-gray-700 mb-2">Vehicle Type</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 1, label: "2/3 Wheeler", icon: faMotorcycle },
                                { id: 2, label: "4 Wheeler", icon: faCar },
                                { id: 3, label: "Commercial", icon: faTruck }
                            ].map((type) => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setVehicleCategory(type.id)}
                                    className={`py-3 px-2 flex flex-col items-center justify-center rounded-xl border-2 transition-all duration-200 ${vehicleCategory === type.id
                                            ? 'border-[#16a34a] bg-[#f0fdf4] shadow-sm'
                                            : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <FontAwesomeIcon icon={type.icon} className={`text-2xl mb-2 ${vehicleCategory === type.id ? 'text-[#16a34a]' : 'text-gray-400'}`} />
                                    <span className={`text-[11px] font-bold text-center leading-tight ${vehicleCategory === type.id ? 'text-[#14532d]' : 'text-gray-500'}`}>
                                        {type.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[12px] font-bold text-gray-700 mb-2">Vehicle Brand</label>
                            <input type="text" required value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Toyota" className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white focus:border-[#16a34a] outline-none transition-colors text-sm" />
                        </div>
                        <div>
                            <label className="block text-[12px] font-bold text-gray-700 mb-2">Vehicle Color</label>
                            <input type="text" required value={color} onChange={(e) => setColor(e.target.value)} placeholder="e.g. Silver" className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white focus:border-[#16a34a] outline-none transition-colors text-sm" />
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Service Details */}
            {shop.shopCategories?.includes('Garages') && shop.info?.carriageService == 1 && (
                <div className="animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-full bg-[#16a34a] text-white flex items-center justify-center text-[10px] font-bold">1a</div>
                        <h3 className="font-bold text-[#1f2937] text-[13px]">Is your vehicle drivable?</h3>
                    </div>

                    {/* The Two Choice Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        {/* Option 1: Drivable */}
                        <button
                            type="button"
                            onClick={() => setRequiresTow(false)}
                            className={`p-3 rounded-xl border flex items-center gap-3 transition-all text-left ${!requiresTow ? 'border-[#16a34a] bg-[#f0fdf4] shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                        >
                            <FontAwesomeIcon icon={faCar} className={`text-lg ${!requiresTow ? 'text-[#16a34a]' : 'text-gray-400'}`} />
                            <div className="flex-1">
                                <span className={`block text-[12px] font-bold ${!requiresTow ? 'text-[#14532d]' : 'text-gray-600'}`}>Yes, I can bring it to the garage</span>
                            </div>
                            {/* Custom Radio Button Circle */}
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${!requiresTow ? 'border-[#16a34a]' : 'border-gray-300'}`}>
                                {!requiresTow && <div className="w-2 h-2 rounded-full bg-[#16a34a]"></div>}
                            </div>
                        </button>

                        {/* Option 2: Needs Tow */}
                        <button
                            type="button"
                            onClick={handleTowSelection}
                            className={`p-3 rounded-xl border flex items-center gap-3 transition-all text-left ${requiresTow ? 'border-[#16a34a] bg-[#f0fdf4] shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                        >
                            <FontAwesomeIcon icon={faTruckPickup} className={`text-lg ${requiresTow ? 'text-[#16a34a]' : 'text-gray-400'}`} />
                            <div className="flex-1">
                                <span className={`block text-[12px] font-bold ${requiresTow ? 'text-[#14532d]' : 'text-gray-600'}`}>No, I need roadside assistance / towing</span>
                            </div>
                            {/* Custom Radio Button Circle */}
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${requiresTow ? 'border-[#16a34a]' : 'border-gray-300'}`}>
                                {requiresTow && <div className="w-2 h-2 rounded-full bg-[#16a34a]"></div>}
                            </div>
                        </button>
                    </div>

                    {/* Expanded Towing Details Box */}
                    {requiresTow && (
                        <div className="animate-in slide-in-from-top-2 duration-200 p-4 rounded-xl border border-[#16a34a]/30 bg-[#f0fdf4]/50 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-[#14532d]">Tow Truck Required</span>
                                <span className="text-[10px] bg-[#16a34a] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Active</span>
                            </div>
                            <div>
                                <div className="flex justify-between items-end mb-1.5">
                                    <label className="block text-[11px] font-bold text-[#14532d]">Additional Landmark (Optional)</label>
                                    {locationStatus && <span className="text-[9px] font-mono font-bold text-[#16a34a] bg-[#16a34a]/10 px-2 py-0.5 rounded">{locationStatus}</span>}
                                </div>
                                <div className="relative w-full">
                                    <FontAwesomeIcon icon={faMapMarkerAlt} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                    <input
                                        type="text"
                                        value={pickupLandmark}
                                        onChange={(e) => setPickupLandmark(e.target.value)}
                                        placeholder="Type landmark or directions..."
                                        className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-[#16a34a]/30 bg-white outline-none focus:border-[#16a34a] text-sm transition-colors"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-2">
                                    Dispatching {shop.default_truck_brand} <span className="font-mono">({shop.tow_truck_plate})</span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 3. Issue Chips */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-[#16a34a] text-white flex items-center justify-center text-[11px] font-bold">2</div>
                    <h3 className="font-bold text-[#1f2937] text-[13px]">What do you need help with?</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {[
                        { name: 'Engine', icon: faCogs },
                        { name: 'Battery', icon: faBatteryFull },
                        { name: 'Tire', icon: faLifeRing },
                        { name: 'Brakes', icon: faWrench },
                        { name: 'General Service', icon: faWrench },
                        { name: 'Other', icon: faQuestionCircle }
                    ].map(issue => (
                        <button
                            key={issue.name}
                            type="button"
                            onClick={() => setIssueCategory(issue.name)}
                            className={`px-4 py-2 rounded-xl border flex items-center gap-2 text-[12px] font-bold transition-all duration-200 ${issueCategory === issue.name
                                    ? 'bg-[#f0fdf4] text-[#16a34a] border-[#16a34a] shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <FontAwesomeIcon icon={issue.icon} className={issueCategory === issue.name ? 'text-[#16a34a]' : 'text-gray-400'} />
                            {issue.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* 4. Description */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-[#16a34a] text-white flex items-center justify-center text-[11px] font-bold">3</div>
                    <h3 className="font-bold text-[#1f2937] text-[13px]">Describe the issue</h3>
                </div>
                <div className="relative">
                    <textarea
                        required
                        maxLength={500}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What seems to be the problem? e.g. Engine stalled, flat tire..."
                        rows="3"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-[#16a34a] outline-none transition-colors text-sm resize-none pb-8"
                    ></textarea>
                    <div className="absolute bottom-3 right-3 text-[10px] font-mono text-gray-400">{description.length}/500</div>
                </div>
            </div>

            {/* 3. Photo Upload */}
            {/* 5. Photo Upload */}
            {(shop.shopCategories?.length > 0) && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-full bg-[#16a34a] text-white flex items-center justify-center text-[11px] font-bold">4</div>
                        <h3 className="font-bold text-[#1f2937] text-[13px]">Attach a Photo (Optional)</h3>
                    </div>

                    {imageFile ? (
                        /* STATE 1: IMAGE UPLOADED (Centered on a Full-Width Stage) */
                        <div className="w-full py-6 flex justify-center items-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 animate-in fade-in duration-200">

                            <div className="relative inline-block group">

                                {/* The Image Container */}
                                <div className="w-48 sm:w-64 h-32 sm:h-40 rounded-xl overflow-hidden border border-gray-200 shadow-sm relative bg-white">
                                    <img
                                        src={URL.createObjectURL(imageFile)}
                                        alt="Upload preview"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />

                                    {/* Sleek Gradient Overlay for Text */}
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-10 flex flex-col justify-end pointer-events-none">
                                        <span className="text-white text-[12px] sm:text-[13px] font-bold truncate drop-shadow-md">
                                            {imageFile.name}
                                        </span>
                                        <span className="text-white/80 text-[10px] sm:text-[11px] font-medium mt-0.5 drop-shadow-md">
                                            {(imageFile.size / (1024 * 1024)).toFixed(2)} MB
                                        </span>
                                    </div>
                                </div>

                                {/* Floating Close Button */}
                                <button
                                    type="button"
                                    onClick={() => setImageFile(null)}
                                    className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-white hover:bg-red-500 hover:border-red-500 flex items-center justify-center transition-all shadow-md z-10 cursor-pointer"
                                    title="Remove photo"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="text-sm" />
                                </button>
                            </div>

                        </div>
                    ) : (
                        /* STATE 2: EMPTY UPLOAD ZONE (Clickable Label) */
                        <label className="flex flex-col items-center justify-center w-full py-8 px-4 rounded-xl border-2 border-dashed border-[#16a34a]/30 bg-[#f0fdf4]/50 hover:bg-[#f0fdf4] cursor-pointer transition-colors text-sm text-gray-600 group">

                            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                                <FontAwesomeIcon icon={faCamera} className="text-[#16a34a] text-xl opacity-80" />
                            </div>

                            <span className="font-bold text-[#14532d]">Drag & drop photos here or click to browse</span>
                            <span className="text-[11px] text-gray-500 mt-1">PNG, JPG up to 10MB</span>

                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setImageFile(e.target.files[0]);
                                    }
                                }}
                                className="hidden"
                            />
                        </label>
                    )}
                </div>
            )}

            {/* 4. Urgency / Appointment */}

            {shop.shopCategories?.includes('Garages') ? (
                /* GARAGE UI: Urgency Level */
                <div className="animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-full bg-[#16a34a] text-white flex items-center justify-center text-[11px] font-bold">5</div>
                        <h3 className="font-bold text-[#1f2937] text-[13px]">Urgency Level</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button type="button" onClick={() => setUrgencyLevel('Normal')} className={`py-3 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${urgencyLevel === 'Normal' ? 'border-[#16a34a] bg-[#f0fdf4] text-[#14532d]' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'}`}>
                            <FontAwesomeIcon icon={faClock} /> Normal
                        </button>
                        <button type="button" onClick={() => setUrgencyLevel('Urgent')} className={`py-3 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${urgencyLevel === 'Urgent' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'}`}>
                            <FontAwesomeIcon icon={faExclamationTriangle} /> Urgent
                        </button>
                    </div>
                </div>
            ) : (
                /* SERVICE CENTER UI: Preferred Appointment */
                <div className="animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-full bg-[#16a34a] text-white flex items-center justify-center text-[11px] font-bold">5</div>
                        <h3 className="font-bold text-[#1f2937] text-[13px]">Preferred Appointment Slot</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] text-gray-500 mb-1.5">Date</label>
                            <input
                                type="date"
                                min={new Date().toISOString().split('T')[0]} // Prevents picking past dates
                                value={preferredDate}
                                onChange={(e) => setPreferredDate(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white focus:border-[#16a34a] outline-none transition-colors text-sm text-gray-700"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] text-gray-500 mb-1.5">Time Slot</label>
                            <select
                                value={preferredTime}
                                onChange={(e) => setPreferredTime(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white focus:border-[#16a34a] outline-none transition-colors text-sm text-gray-700 appearance-none"
                            >
                                <option value="" disabled>Select a time...</option>
                                <option value="08:00 AM - 10:00 AM">08:00 AM - 10:00 AM</option>
                                <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                                <option value="01:00 PM - 03:00 PM">01:00 PM - 03:00 PM</option>
                                <option value="03:00 PM - 05:00 PM">03:00 PM - 05:00 PM</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
