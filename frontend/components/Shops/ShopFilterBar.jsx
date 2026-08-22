import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faSearch,
    faLocationDot,
    faLocationCrosshairs,
    faCar,
    faWarehouse
} from "@fortawesome/free-solid-svg-icons";

export const ShopFilterBar = ({
    initialLocationText,
    onLocationChange, 
    activeVehicle,
    setActiveVehicle,
    activeService,
    setActiveService,
    needsTow,
    setNeedsTow,
    vehicleOptions = [],
    serviceOptions = []
}) => {
    
    // --- 1. LOCAL DRAFT STATE ---
    // We hold the selections here until the user clicks "Search Shops"
    const [localVehicle, setLocalVehicle] = useState(activeVehicle || "");
    const [localService, setLocalService] = useState(activeService || "");
    const [localNeedsTow, setLocalNeedsTow] = useState(needsTow || false);
    
    // We also hold the coordinates locally until search is clicked
    const [localLocation, setLocalLocation] = useState({ 
        lat: null, 
        lng: null, 
        text: initialLocationText || "Current Location" 
    });
    
    const [locationInputText, setLocationInputText] = useState(initialLocationText || "Current Location");
    
    // Sync props to local state (Useful if the user clicks "Clear Filters" in the parent component)
    useEffect(() => { setLocalVehicle(activeVehicle); }, [activeVehicle]);
    useEffect(() => { setLocalService(activeService); }, [activeService]);
    useEffect(() => { setLocalNeedsTow(needsTow); }, [needsTow]);

    // Google Autocomplete State
    const [predictions, setPredictions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        if (initialLocationText) setLocationInputText(initialLocationText);
    }, [initialLocationText]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowDropdown(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLocationTyping = (text) => {
        setLocationInputText(text);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        if (text.length < 3 || text === "Current Location") {
            setPredictions([]);
            setShowDropdown(false);
            return;
        }

        typingTimeoutRef.current = setTimeout(async () => {
            try {
                const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': import.meta.env.VITE_GOOGLE_MAPS_API_KEY
                    },
                    body: JSON.stringify({ input: text, includedRegionCodes: ["lk"] })
                });
                const data = await response.json();
                
                if (data.suggestions) {
                    setPredictions(data.suggestions);
                    setShowDropdown(true);
                }
            } catch (error) {
                console.error("Error fetching API predictions:", error);
            }
        }, 500);
    };

    const handleSelectPlace = async (placeId, description) => {
        setLocationInputText(description);
        setShowDropdown(false);
        setPredictions([]);

        try {
            const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}?fields=location`, {
                headers: { 'X-Goog-Api-Key': import.meta.env.VITE_GOOGLE_MAPS_API_KEY }
            });
            const data = await response.json();
            
            if (data.location) {
                // CHANGED: Save to LOCAL state. Do not update parent component yet!
                setLocalLocation({ lat: data.location.latitude, lng: data.location.longitude, text: description });
            }
        } catch (error) {
            console.error("Error fetching location coordinates:", error);
        }
    };

    // --- 2. THE SUBMIT FUNCTION ---
    // This fires ONLY when the green Search button is clicked
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        
        // Push all local draft states up to the parent component
        setActiveVehicle(localVehicle);
        setActiveService(localService);
        setNeedsTow(localNeedsTow);
        
        // Push location up if a new valid one was selected
        if (localLocation.lat && localLocation.lng) {
            onLocationChange(localLocation.lat, localLocation.lng, localLocation.text);
        }
        
        // Scroll down to the results
        window.scrollTo({ top: document.getElementById('shop-results')?.offsetTop || 400, behavior: 'smooth' });
    };

    return (
        <div className="w-full rounded-2xl border border-gray-200 bg-white p-2 shadow-sm flex flex-col md:flex-row items-center relative z-30">

            <div className="flex flex-col md:flex-row w-full flex-1 md:divide-x divide-gray-100">
                
                {/* VEHICLE TYPE BLOCK */}
                <div className="flex flex-col flex-1 px-4 py-2 border-b md:border-b-0 border-gray-100">
                    <label className="text-[10px] font-bold text-gray-500 mb-1">Vehicle Type</label>
                    <div className="relative">
                        <FontAwesomeIcon icon={faCar} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <select
                            value={localVehicle}
                            onChange={(e) => setLocalVehicle(e.target.value)}
                            // CHANGED: Added bg-gray-50 and border for clear visibility
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-3 py-2 font-bold text-gray-900 outline-none cursor-pointer text-sm focus:border-[#16a34a] focus:bg-white transition-colors appearance-none"
                        >
                            <option value="">All Vehicles</option>
                            {vehicleOptions.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                        </select>
                    </div>
                </div>

                {/* SERVICE TYPE BLOCK */}
                <div className="flex flex-col flex-1 px-4 py-2 border-b md:border-b-0 border-gray-100">
                    
                    {/* CHANGED: We now use a flex-row to put the label and the checkbox on the exact same line! */}
                    <div className="flex items-center justify-between mb-1 h-4">
                        <label className="text-[10px] font-bold text-gray-500">Service Type</label>
                        
                        {/* The Tow Truck checkbox now appears cleanly right here when Garages is selected */}
                        {localService === "1" && (
                            <label className="flex items-center space-x-1.5 cursor-pointer animate-in fade-in">
                                <input 
                                    type="checkbox" 
                                    checked={localNeedsTow} 
                                    onChange={(e) => setLocalNeedsTow(e.target.checked)} 
                                    className="accent-[#16a34a] w-3 h-3 cursor-pointer shrink-0" 
                                />
                                <span className="text-[10px] font-bold text-[#16a34a] leading-none mt-[1px]">Requires Tow Truck</span>
                            </label>
                        )}
                    </div>

                    <div className="relative">
                        <FontAwesomeIcon icon={faWarehouse} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <select
                            value={localService}
                            onChange={(e) => {
                                setLocalService(e.target.value);
                                if (e.target.value !== "1") setLocalNeedsTow(false);
                            }}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-3 py-2 font-bold text-gray-900 outline-none cursor-pointer text-sm focus:border-[#16a34a] focus:bg-white transition-colors appearance-none"
                        >
                            <option value="">All Services</option>
                            {serviceOptions.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                        </select>
                    </div>
                </div>

                {/* LOCATION BLOCK */}
                <div className="flex flex-col flex-1 px-4 py-2 relative" ref={dropdownRef}>
                    <label className="text-[10px] font-bold text-gray-500 mb-1">Location</label>
                    <div className="flex items-center w-full relative">
                        <FontAwesomeIcon 
                            icon={locationInputText === "Current Location" ? faLocationCrosshairs : faLocationDot} 
                            className={`absolute left-3 text-sm ${locationInputText === "Current Location" ? 'text-[#16a34a]' : 'text-gray-400'}`} 
                        />
                        <input
                            type="text"
                            value={locationInputText}
                            onChange={(e) => handleLocationTyping(e.target.value)}
                            onFocus={() => { if (locationInputText === "Current Location") setLocationInputText(""); }}
                            onBlur={() => { 
                                if (locationInputText.trim() === "") {
                                    setLocationInputText("Current Location");
                                    if ("geolocation" in navigator) {
                                        navigator.geolocation.getCurrentPosition((pos) => {
                                            // CHANGED: Save locally
                                            setLocalLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, text: "Current Location" });
                                        });
                                    }
                                } 
                            }}
                            placeholder="City or Area..."
                            // CHANGED: Added bg-gray-50 and border
                            className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold text-sm text-gray-900 truncate focus:border-[#16a34a] focus:bg-white transition-colors"
                        />
                    </div>
                    
                    {/* Google API Autocomplete Dropdown */}
                    {showDropdown && predictions.length > 0 && (
                        <ul className="absolute top-full left-0 right-0 mt-4 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto text-sm">
                            {predictions.map((pred) => (
                                <li 
                                    key={pred.placePrediction.placeId} 
                                    onClick={() => handleSelectPlace(pred.placePrediction.placeId, pred.placePrediction.text.text)} 
                                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 text-gray-800 flex items-center gap-3 font-bold"
                                >
                                    <FontAwesomeIcon icon={faLocationDot} className="text-gray-400" /> 
                                    {pred.placePrediction.text.text}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* SEARCH BUTTON */}
            <div className="px-2 w-full md:w-auto mt-2 md:mt-0 shrink-0">
                <button
                    onClick={handleSearchSubmit} // Trigger the bulk update
                    className="w-full md:w-auto bg-[#16a34a] hover:bg-[#14532d] text-white px-8 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                    <FontAwesomeIcon icon={faSearch} />
                    Search Shops
                </button>
            </div>
            
        </div>
    );
};