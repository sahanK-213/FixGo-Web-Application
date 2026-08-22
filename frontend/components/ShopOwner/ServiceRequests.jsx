import { useEffect, useState } from "react";
import { api } from "../../src/services/api";
import RequestTable from "./ServiceRequests/RequestTable";
import RequestDetailsModal from "./ServiceRequests/RequestDetailsModal";
import DeclineConfirmModal from "./ServiceRequests/DeclineConfirmModal";
import TowDispatchModal from "./ServiceRequests/TowDispatchModal";

function ServiceRequests({ shopCategory, shopCoordinates, fetchRequestCount }) {
  const [activeTab, setActiveTab] = useState("new"); // "new" | "missed" | "declined"

  const [requests, setRequests] = useState([]);
  const [declinedRequests, setDeclinedRequests] = useState([]);
  const [declinedLoaded, setDeclinedLoaded] = useState(false);
  const [missedRequests, setMissedRequests] = useState([]);
  const [missedLoaded, setMissedLoaded] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestPendingTow, setRequestPendingTow] = useState(null);
  const [showTowModal, setShowTowModal] = useState(false);
  const [isAcceptFlow, setIsAcceptFlow] = useState(false);
  const [towTruck, setTowTruck] = useState({
    default_driver_name: "",
    default_driver_phone: "",
    default_truck_brand: "",
    default_truck_color: "",
    tow_truck_plate: "",
    promised_eta: "",
  });
  const [isCalculatingEta, setIsCalculatingEta] = useState(false);
  const [minEta, setMinEta] = useState(0);
  const [etaError, setEtaError] = useState("");

  // Decline confirmation
  const [requestPendingDecline, setRequestPendingDecline] = useState(null);
  const [isDeclining, setIsDeclining] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  // Fetch the declined list lazily, the first time that tab is opened
  useEffect(() => {
    if (activeTab === "declined" && !declinedLoaded) {
      fetchDeclinedRequests();
    }
  }, [activeTab, declinedLoaded]);

  // Fetch the missed list lazily
  useEffect(() => {
    if (activeTab === "missed" && !missedLoaded) {
      fetchMissedRequests();
    }
  }, [activeTab, missedLoaded]);

  const updateStatus = async (requestId, status) => {
    try {
      const data = await api.post("shared/updateStatus.php", {
        request_id: requestId,
        new_status: status,
      });

      // No popup for Accept or Decline — both have their own UI feedback
      if (status !== "Accepted" && status !== "Declined") {
        alert(data.message);
      }

      fetchRequests();
      fetchRequestCount();
      window.dispatchEvent(new Event("fixgo_unread_changed"));

      if (status === "Declined" && declinedLoaded) {
        fetchDeclinedRequests();
      }

    } catch (error) {
      console.error(error);
      if (error.message) {
        alert(error.message);
      }
    }
  };

  const fetchRequests = async () => {
    try {
      const data = await api.get("shop/getServiceRequests.php");
      if (data.success) {
        setRequests(data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchDeclinedRequests = async () => {
    try {
      const data = await api.get("shop/getDeclinedRequests.php");
      if (data.success) {
        setDeclinedRequests(data.data);
        setDeclinedLoaded(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMissedRequests = async () => {
    try {
      const data = await api.get("shop/getMissedRequests.php");
      if (data.success) {
        setMissedRequests(data.data);
        setMissedLoaded(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAcceptClick = (r) => {
    if (Number(r.requires_tow) === 1) {
      setRequestPendingTow(r);
      setIsAcceptFlow(true);
      openTowTruckModal(r, true);
    } else {
      updateStatus(r.id, "Accepted");
    }
  };

  const handleDeclineClick = (r) => {
    setRequestPendingDecline(r);
  };

  const confirmDecline = async () => {
    if (!requestPendingDecline) return;
    setIsDeclining(true);
    try {
      await updateStatus(requestPendingDecline.id, "Declined");
    } finally {
      setIsDeclining(false);
      setRequestPendingDecline(null);
    }
  };

  const openTowTruckModal = async (requestData, isAccepting = false) => {
    try {
      const data = await api.get("shop/getTowTruckDetails.php");
      if (data.success) {
        setTowTruck({
          ...data.data,
          promised_eta: requestData?.promised_eta || "",
        });
        setShowTowModal(true);

        if (isAccepting && shopCoordinates?.lat && requestData.customer_lat && requestData.customer_lng) {
          setIsCalculatingEta(true);
          try {
            const googleRes = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
                "X-Goog-FieldMask": "routes.duration",
              },
              body: JSON.stringify({
                origin: { location: { latLng: { latitude: shopCoordinates.lat, longitude: shopCoordinates.lng } } },
                destination: { location: { latLng: { latitude: requestData.customer_lat, longitude: requestData.customer_lng } } },
                travelMode: "DRIVE",
              }),
            });
            const googleData = await googleRes.json();
            if (googleData.routes && googleData.routes.length > 0) {
              const seconds = parseInt(googleData.routes[0].duration.replace("s", ""));
              const calculatedMinutes = Math.ceil(seconds / 60);
              setTowTruck((prev) => ({ ...prev, promised_eta: calculatedMinutes }));
              setMinEta(calculatedMinutes);
            }
          } catch (error) {
            console.error("Failed to calculate ETA via Google:", error);
          } finally {
            setIsCalculatingEta(false);
          }
        }
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Could not load tow truck details.");
    }
  };

  const saveTowTruckDetails = async () => {
    if (parseInt(towTruck.promised_eta) < minEta) {
      setEtaError(`ETA cannot be less than the calculated drive time (${minEta} mins).`);
      return;
    }
    try {
      const data = await api.post("shop/updateTowTruckDetails.php", {
        request_id: requestPendingTow?.id,
        driver_name: towTruck.default_driver_name,
        driver_phone: towTruck.default_driver_phone,
        truck_brand: towTruck.default_truck_brand,
        truck_color: towTruck.default_truck_color,
        truck_plate: towTruck.tow_truck_plate,
        promised_eta: towTruck.promised_eta,
      });
      if (data.success) {
        alert("Tow truck details updated.");
        setShowTowModal(false);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Failed to save tow truck details.");
    }
  };

  const confirmTowAndAccept = async () => {
    if (parseInt(towTruck.promised_eta) < minEta) {
      setEtaError(`ETA cannot be less than the calculated drive time (${minEta} mins).`);
      return;
    }
    try {
      const data = await api.post("shop/updateTowTruckDetails.php", {
        request_id: requestPendingTow.id,
        driver_name: towTruck.default_driver_name,
        driver_phone: towTruck.default_driver_phone,
        truck_brand: towTruck.default_truck_brand,
        truck_color: towTruck.default_truck_color,
        truck_plate: towTruck.tow_truck_plate,
        promised_eta: towTruck.promised_eta,
      });
      if (data.success) {
        await updateStatus(requestPendingTow.id, "Accepted");
        setShowTowModal(false);
        setIsAcceptFlow(false);
        setRequestPendingTow(null);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const visibleRequests = activeTab === "new" ? requests : (activeTab === "missed" ? missedRequests : declinedRequests);

  return (
    <div className="w-full font-[inherit]">
      {/* Header */}
      <div
        className="rounded-[18px] p-6 border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6"
        style={{ background: "linear-gradient(180deg, #EEF7F0, #FFFFFF)" }}
      >
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 m-0">
            Service Requests
          </h1>
          <p className="text-gray-500 mt-1.5 mb-0 text-sm">
            Review and respond to incoming service requests.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-5 w-full">
        {[
          { key: "new", label: "Service Requests" },
          { key: "missed", label: "Missed Opportunities" },
          { key: "declined", label: "Declined Requests" },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2 px-3 sm:py-2.5 sm:px-5 rounded-[10px] border-[1.5px] font-semibold text-xs sm:text-[14.5px] cursor-pointer transition-all duration-150 ease-in-out ${
                isActive
                  ? "border-green-700 bg-[#ECFDF3] text-green-700"
                  : "border-[#E5E9F0] bg-white text-slate-500"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Extracted Request Table */}
      <RequestTable
        visibleRequests={visibleRequests}
        activeTab={activeTab}
        setSelectedRequest={setSelectedRequest}
        handleAcceptClick={handleAcceptClick}
        handleDeclineClick={handleDeclineClick}
      />

      {/* Extracted Modals */}
      <RequestDetailsModal
        selectedRequest={selectedRequest}
        setSelectedRequest={setSelectedRequest}
        shopCategory={shopCategory}
      />

      <DeclineConfirmModal
        requestPendingDecline={requestPendingDecline}
        setRequestPendingDecline={setRequestPendingDecline}
        isDeclining={isDeclining}
        confirmDecline={confirmDecline}
      />

      <TowDispatchModal
        showTowModal={showTowModal}
        towTruck={towTruck}
        setTowTruck={setTowTruck}
        isAcceptFlow={isAcceptFlow}
        isCalculatingEta={isCalculatingEta}
        minEta={minEta}
        etaError={etaError}
        setEtaError={setEtaError}
        setShowTowModal={setShowTowModal}
        setIsAcceptFlow={setIsAcceptFlow}
        saveTowTruckDetails={saveTowTruckDetails}
        confirmTowAndAccept={confirmTowAndAccept}
      />
    </div>
  );
}

export default ServiceRequests;
