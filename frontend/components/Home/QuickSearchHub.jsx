import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faCar, faWarehouse, faLocationDot, faLocationCrosshairs, faTruckPickup, faLock } from "@fortawesome/free-solid-svg-icons";
import { api } from "../../src/services/api";


export const QuickSearchHub = ({ onRequireAuth }) => {
    const navigate = useNavigate();

    // 1. Core UI State
    const [homeVehicle, setHomeVehicle] = useState("");
    const [homeService, setHomeService] = useState("");
    const [homeCity, setHomeCity] = useState("Current Location");
    const [needsTow, setNeedsTow] = useState(false);

    // Dynamic Category Fetching
    const [vehicleOptions, setVehicleOptions] = useState([]);
    const [serviceOptions, setServiceOptions] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const json = await api.getPublic('search/getCategories.php');
                setVehicleOptions(json.vehicles);
                setServiceOptions(json.services);
            } catch (error) {
                console.warn("Backend categories not ready. Using fallbacks.", error);
                setVehicleOptions([
                    { id: "1", label: "3-Wheelers & Bikes" },
                    { id: "2", label: "4-Wheelers" },
                    { id: "3", label: "Commercial" },
                ]);
                setServiceOptions([
                    { id: "1", label: "Garages" },
                    { id: "2", label: "Service Centers" },
                    { id: "3", label: "Spare Parts" },
                ]);
            }
        };
        fetchCategories();
    }, []);


    // 2. Custom Autocomplete State
    const [predictions, setPredictions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null); 
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Google API Logic
    const handleTyping = async (text) => {
        setHomeCity(text);
        setSelectedLocation(null);

        if (text.length < 3) {
            setPredictions([]);
            setShowDropdown(false);
            return;
        }

        try {
            const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': import.meta.env.VITE_GOOGLE_MAPS_API_KEY
                },
                body: JSON.stringify({
                    input: text,
                    includedRegionCodes: ["lk"]
                })
            });
            
            const data = await response.json();
            if (data.suggestions) {
                setPredictions(data.suggestions);
                setShowDropdown(true);
            } else {
                setPredictions([]);
            }
        } catch (error) {
            console.error("Error fetching API predictions:", error);
        }
    };

    const handleSelectPlace = async (placeId, description) => {
        setHomeCity(description);
        setShowDropdown(false);
        setPredictions([]);

        try {
            const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}?fields=location`, {
                headers: {
                    'X-Goog-Api-Key': import.meta.env.VITE_GOOGLE_MAPS_API_KEY
                }
            });
            const data = await response.json();
            if (data.location) {
                setSelectedLocation({
                    lat: data.location.latitude,
                    lng: data.location.longitude
                });
            }
        } catch (error) {
            console.error("Error fetching location coordinates:", error);
        }
    };

    // --- STRICT DISABLED LOGIC ---
    // Disable if Service Centers (2) or Spare Parts (3) are selected
    const isTowDisabled = homeService !== "1";

    const handleServiceChange = (e) => {
        const val = e.target.value;
        setHomeService(val);
        
        // Instantly force the toggle OFF if switching to an invalid service
        if (val !== "1") {
            setNeedsTow(false);
        }
    };

    const handleTowToggle = () => {
        // Double security: prevent any action if disabled
        if (isTowDisabled) return; 
        setNeedsTow(!needsTow);
    };

    // 4. Routing Logic
    const handleSearchClick = () => {
        sessionStorage.removeItem('fixgo_activeVehicle');
        sessionStorage.removeItem('fixgo_activeService');
        sessionStorage.removeItem('fixgo_sortBy');
        sessionStorage.removeItem('fixgo_searchName');
        sessionStorage.removeItem('fixgo_needsTow');

        const isUserLoggedIn = true; 
        
        if (!isUserLoggedIn) {
            onRequireAuth(); 
            return; 
        }

        const params = new URLSearchParams();
        if (homeVehicle) params.append('vehicle', homeVehicle);
        if (homeService) params.append('service', homeService);
        if (needsTow) params.append('needs_tow', 'true');

        if (selectedLocation) {
            params.append('lat', selectedLocation.lat);
            params.append('lng', selectedLocation.lng);
        }

        if (homeCity) {
            params.append('locName', homeCity.trim());
        }
        
        navigate(`/shops?${params.toString()}`);
    }

    return (
        <section className="relative -mt-20 z-20 w-full max-w-6xl mx-auto px-4 md:px-8 mb-20 flex flex-col gap-3">
            
            {/* MAIN WHITE CARD CONTAINER */}
            <div className="bg-white w-full rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-6 md:p-8 border border-gray-100">
                
                {/* ROW 1: INPUTS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    
                    {/* 1. Select Vehicle */}
                    <div className="flex flex-col w-full">
                        <label className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                            <span className="bg-[#16a34a] text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span>
                            Select Vehicle
                        </label>
                        <div className="relative border border-gray-200 rounded-lg bg-white focus-within:border-[#16a34a] transition-colors">
                            <FontAwesomeIcon icon={faCar} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <select 
                                value={homeVehicle} 
                                onChange={(e) => setHomeVehicle(e.target.value)}
                                className="w-full bg-transparent text-gray-600 font-medium text-sm py-3.5 pl-10 pr-4 outline-none cursor-pointer appearance-none"
                            >
                                <option value="">Select Vehicle Type</option>
                                {vehicleOptions.map((vehicle) => (
                                    <option key={vehicle.id} value={vehicle.id}>{vehicle.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 2. Choose Service */}
                    <div className="flex flex-col w-full">
                        <label className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                            <span className="bg-[#16a34a] text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span>
                            Choose Service
                        </label>
                        <div className="relative border border-gray-200 rounded-lg bg-white focus-within:border-[#16a34a] transition-colors">
                            <FontAwesomeIcon icon={faWarehouse} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <select 
                                value={homeService} 
                                onChange={handleServiceChange}
                                className="w-full bg-transparent text-gray-600 font-medium text-sm py-3.5 pl-10 pr-4 outline-none cursor-pointer appearance-none"
                            >
                                <option value="">Select Service</option>
                                {serviceOptions.map((service) => (
                                    <option key={service.id} value={service.id}>{service.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 3. Set Location */}
                    <div className="flex flex-col w-full relative" ref={dropdownRef}>
                        <label className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                            <span className="bg-[#16a34a] text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">3</span>
                            Set Location
                        </label>
                        <div className="relative border border-gray-200 rounded-lg bg-white focus-within:border-[#16a34a] transition-colors">
                            <FontAwesomeIcon icon={homeCity === "Current Location" ? faLocationCrosshairs : faLocationDot} className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm transition-colors ${homeCity === "Current Location" ? 'text-[#16a34a]' : 'text-gray-400'}`} />
                            <input 
                                value={homeCity}
                                onChange={(e) => handleTyping(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                                onFocus={() => { if (homeCity === "Current Location") setHomeCity(""); }}
                                onBlur={() => { if (homeCity.trim() === "") setHomeCity("Current Location"); }}
                                className={`w-full bg-transparent text-sm py-3.5 pl-10 pr-4 outline-none transition-colors ${homeCity === "Current Location" ? 'text-[#16a34a] font-bold' : 'text-gray-600 font-medium'}`}
                                placeholder="Use My Location" 
                                type="text" 
                            />
                        </div>

                        {/* Autocomplete Dropdown */}
                        {showDropdown && predictions.length > 0 && (
                            <ul className="absolute top-[85px] left-0 right-0 bg-white border border-gray-100 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                                {predictions.map((pred) => (
                                    <li 
                                        key={pred.placePrediction.placeId} 
                                        onClick={() => handleSelectPlace(pred.placePrediction.placeId, pred.placePrediction.text.text)}
                                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 text-sm font-medium text-gray-700 flex items-center gap-3"
                                    >
                                        <FontAwesomeIcon icon={faLocationDot} className="text-gray-400" />
                                        {pred.placePrediction.text.text}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* 4. Search Button */}
                    <button onClick={handleSearchClick} className="w-full h-[50px] bg-[#16a34a] text-white font-bold text-sm px-4 rounded-lg hover:bg-[#14532d] transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2">
                        <FontAwesomeIcon icon={faSearch} />
                        Find Nearby Shops
                    </button>
                </div>

                {/* ROW 2: PREMIUM SMART EMERGENCY TOW ROW */}
                <div className="mt-6 pt-5 border-t border-gray-100">
                    {/* We use the exact same grid to anchor the alignment vertically */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        
                        {/* LEFT SIDE: The Toggle */}
                        <div className="md:col-span-2 flex items-center gap-4">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Emergency:</span>
                            
                            <button
                                type="button"
                                onClick={handleTowToggle}
                                disabled={isTowDisabled}
                                className={`group relative flex items-center gap-3 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 overflow-hidden
                                    ${isTowDisabled 
                                        ? 'opacity-60 cursor-not-allowed bg-gray-50 text-gray-400 border border-gray-200' 
                                        : (needsTow 
                                            ? 'bg-[#16a34a]/10 text-[#14532d] border border-[#16a34a]/30 shadow-sm' 
                                            : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 shadow-sm hover:shadow')
                                    }`}
                            >
                                <FontAwesomeIcon 
                                    icon={isTowDisabled ? faLock : faTruckPickup} 
                                    className={`transition-colors ${needsTow && !isTowDisabled ? 'text-[#16a34a]' : 'text-gray-400'}`} 
                                />
                                <span>Require Roadside Towing</span>
                                
                                {/* Premium Apple-style Toggle Visual */}
                                <div className={`w-10 h-5.5 rounded-full relative transition-colors duration-300 ml-2 shadow-inner border border-black/5
                                    ${isTowDisabled ? 'bg-gray-200' : (needsTow ? 'bg-[#16a34a]' : 'bg-gray-200')}`}>
                                    <div className={`absolute top-[2px] left-[2px] w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-md 
                                        ${needsTow && !isTowDisabled ? 'translate-x-[18px]' : 'translate-x-0'}`}>
                                    </div>
                                </div>
                            </button>
                        </div>

                        {/* RIGHT SIDE: Balancing Micro-copy (Only visible when locked) */}
                        <div className="md:col-span-2 hidden md:flex justify-end">
                            <p className={`text-[11px] font-bold tracking-wide uppercase transition-all duration-500 
                                ${isTowDisabled ? 'text-gray-400 opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
                                <FontAwesomeIcon icon={faLock} className="mr-2" />
                                Towing is only available for Garages
                            </p>
                        </div>

                    </div>
                </div>

            </div>
        </section>
    );
};