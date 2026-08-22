import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCircleCheck, faHandshake, faStethoscope, faWrench,
    faBoxesStacked, faCircleXmark, faClock, faUser,
    faPhone, faIdCard, faTruckPickup, faArrowRight,
    faSpinner, faStore, faExternalLinkAlt, faXmark, faStar, faCheck
} from "@fortawesome/free-solid-svg-icons";
import { FONT, STATUS_META, getMessage, formatTime, formatRefId } from "./NotificationHelpers";

const DetailRow = ({ icon, label, value, isPhone, isMono }) => (
    <div className="flex items-start gap-2">
        <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-px" style={{ background: "rgba(22, 163, 74,0.1)" }}>
            <FontAwesomeIcon icon={icon} className="text-[10px]" style={{ color: "#16A34A" }} />
        </div>
        <div>
            <p className="text-[10px] text-gray-400 m-0 font-semibold uppercase tracking-[0.04em]">{label}</p>
            {isPhone ? (
                <a href={`tel:${value}`} className="text-xs font-bold no-underline" style={{ color: "#16A34A" }}>{value}</a>
            ) : (
                <p
                    className="text-xs text-gray-700 font-bold m-0"
                    style={{ fontFamily: isMono ? "'Courier New', monospace" : "inherit", letterSpacing: isMono ? "0.08em" : "normal" }}
                >
                    {value}
                </p>
            )}
        </div>
    </div>
);

const TowTruckCard = ({ notif }) => {
    if (notif.requires_tow != 1) return null;

    const hasDetails = !!(notif.dispatched_driver_name || notif.dispatched_truck_brand || notif.dispatched_truck_plate);

    return (
        <div
            className="mt-3.5 border rounded-2xl py-4 px-[18px] flex flex-col gap-3"
            style={{
                background: "linear-gradient(135deg, rgba(22, 163, 74,0.06) 0%, rgba(22,163,74,0.06) 100%)",
                borderColor: "rgba(22, 163, 74,0.25)",
            }}
        >
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(22, 163, 74,0.12)" }}>
                    <FontAwesomeIcon icon={faTruckPickup} className="text-sm" style={{ color: "#16A34A" }} />
                </div>
                <div>
                    <p className="text-[13px] font-bold m-0" style={{ color: "#16A34A" }}>
                        Tow Truck Service Included
                    </p>
                    <p className="text-[11px] text-gray-500 m-0">
                        {hasDetails
                            ? "The shop has assigned a tow truck for pickup"
                            : "The shop will arrange a tow truck to pick up your vehicle"}
                    </p>
                </div>
                <span
                    className="ml-auto rounded-full py-0.5 px-2.5 text-[10px] font-bold flex-shrink-0"
                    style={{
                        background: hasDetails ? "rgba(22, 163, 74,0.12)" : "rgba(217,119,6,0.10)",
                        color: hasDetails ? "#16A34A" : "#D97706",
                    }}
                >
                    {hasDetails ? "En Route" : "Arranging"}
                </span>
            </div>

            {hasDetails && (
                <>
                    <div className="h-px" style={{ background: "rgba(22, 163, 74,0.15)" }} />
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                        {notif.dispatched_driver_name  && <DetailRow icon={faUser}        label="Driver"    value={notif.dispatched_driver_name} />}
                        {notif.dispatched_driver_phone && <DetailRow icon={faPhone}       label="Contact"   value={notif.dispatched_driver_phone} isPhone />}
                        {notif.dispatched_truck_brand  && <DetailRow icon={faTruckPickup} label="Truck"     value={`${notif.dispatched_truck_brand}${notif.dispatched_truck_color ? ` · ${notif.dispatched_truck_color}` : ""}`} />}
                        {notif.dispatched_truck_plate  && <DetailRow icon={faIdCard}      label="Plate No." value={notif.dispatched_truck_plate} isMono />}
                    </div>
                    {notif.promised_eta && notif.promised_eta > 0 && (
                        <div className="flex items-center gap-2 rounded-[10px] py-2 px-3" style={{ background: "rgba(22, 163, 74,0.08)" }}>
                            <FontAwesomeIcon icon={faClock} className="text-xs" style={{ color: "#16A34A" }} />
                            <span className="text-xs font-semibold" style={{ color: "#16A34A" }}>
                                Estimated arrival: <strong>{notif.promised_eta} minutes</strong>
                            </span>
                        </div>
                    )}
                </>
            )}

            {!hasDetails && (
                <div
                    className="border rounded-[10px] py-2.5 px-3.5 flex items-center gap-2"
                    style={{ background: "rgba(217,119,6,0.06)", borderColor: "rgba(217,119,6,0.2)" }}
                >
                    <FontAwesomeIcon icon={faClock} className="text-xs" style={{ color: "#D97706" }} />
                    <p className="text-xs m-0 font-semibold" style={{ color: "#D97706" }}>
                        Tow truck details will appear here once the shop confirms the arrangement.
                    </p>
                </div>
            )}

            {notif.pickup_landmark && (
                <div className="flex items-start gap-2 rounded-[10px] py-2 px-3" style={{ background: "rgba(22, 163, 74,0.05)" }}>
                    <span className="text-[11px] text-gray-500 font-semibold">📍 Pickup:</span>
                    <span className="text-[11px] text-gray-700">{notif.pickup_landmark}</span>
                </div>
            )}
        </div>
    );
};

export const NotificationCard = ({
    notif, isLast, confirming, declining, localConfirmed, localDeclined, highlightedId,
    markRead, openDeclineModal, handleConfirm, setReviewModal, reviewedIds, navigate
}) => {
    const meta         = STATUS_META[notif.status] || STATUS_META["Pending"];
    const isRead       = Number(notif.isRead) === 1;
    const isConfirming = confirming === notif.id;
    const isDeclining  = declining  === notif.service_request_id;

    const isConfirmed  = localConfirmed.includes(String(notif.service_request_id))
        || ["Confirmed", "Diagnosis", "In Progress", "Pending Parts", "Completed"].includes(notif.current_status);
    const isDeclined   = localDeclined.includes(String(notif.service_request_id))
        || notif.current_status === "Cancelled";
    const hasTow       = notif.requires_tow == 1;
    const isHighlighted = String(notif.id) === String(highlightedId);
    
    return (
        <div
            id={`notif-${notif.id}`}
            onClick={() => !isRead && markRead(notif.id)}
            className={`flex items-start gap-4 py-5 px-6 cursor-pointer transition-all duration-300
                ${isLast ? "border-b-0" : "border-b border-gray-100"}
                ${!isRead ? "hover:bg-[#F0FDF4]" : "hover:bg-gray-50"}`}
            style={{ 
                background: isHighlighted 
                    ? "rgba(22,163,74,0.08)" 
                    : !isRead ? "#F0FDF4" : "#FFFFFF",
                borderLeft: isHighlighted
                    ? "4px solid #16A34A"
                    : "4px solid transparent"
            }}
        >
            {/* Status Icon */}
            <div
                className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center"
                style={{ background: meta.iconBg }}
            >
                <FontAwesomeIcon icon={meta.icon} className="text-lg" style={{ color: meta.iconColor }} />
            </div>

            {/* Body */}
            <div className="flex-1 min-w-0">

                {/* Title + Badge */}
                <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-gray-900 m-0">
                        {notif.title || (
                            notif.status === "Completed" ? "Repair completed"  :
                            notif.status === "Accepted"  ? "Request accepted"  :
                            notif.status === "Confirmed" ? "Booking confirmed" :
                            notif.status === "Declined"  ? "Request declined"  :
                            "Repair status updated"
                        )}
                    </p>
                    <span
                        className="rounded-full py-0.5 px-3 text-[11px] font-bold"
                        style={{
                            background: isConfirmed && notif.status === "Accepted" ? STATUS_META["Confirmed"].badgeBg : meta.badgeBg,
                            color:      isConfirmed && notif.status === "Accepted" ? STATUS_META["Confirmed"].badgeColor : meta.badgeColor,
                        }}
                    >
                        {isConfirmed && notif.status === "Accepted" ? "Confirmed" : meta.label}
                    </span>
                </div>

                {/* Message */}
                <p className="text-[13px] text-gray-500 mt-1.5 mb-2 leading-relaxed">
                    {getMessage(notif)}
                </p>

                {/* Ref pill */}
                <span className="inline-block bg-gray-100 text-gray-700 rounded-lg py-1 px-3 text-xs font-semibold">
                    {notif.vehicle_brand || "Vehicle"} · {formatRefId(notif.service_request_id, notif.created_at)}
                </span>

                {/* ── ACCEPTED: Action card ── */}
                {notif.status === "Accepted" && (
                    <div
                        className="mt-3.5 border rounded-2xl py-4 px-[18px] transition-all duration-300"
                        style={{
                            background: isConfirmed ? "rgba(22,163,74,0.08)" : isDeclined ? "rgba(220,38,38,0.08)" : "#EDF3FF",
                            borderColor: isConfirmed ? "#16A34A" : isDeclined ? "#DC2626" : "rgba(37,99,235,0.2)",
                        }}
                    >
                        {isConfirmed && (
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-[13px] font-bold m-0 text-green-600">✅ Booking confirmed!</p>
                                    <p className="text-xs text-gray-500 mt-1 mb-0">Head to the Repair Status tab to track your vehicle's progress.</p>
                                </div>
                                <span className="flex items-center gap-1.5 bg-white text-green-600 border border-green-600 rounded-[10px] py-2 px-4 text-[13px] font-bold flex-shrink-0">
                                    <FontAwesomeIcon icon={faCheck} className="text-[11px]" /> Confirmed
                                </span>
                            </div>
                        )}

                        {isDeclined && !isConfirmed && (
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-[13px] font-bold m-0 text-red-600">❌ Booking declined</p>
                                    <p className="text-xs text-gray-500 mt-1 mb-0">You declined this booking. You can still search for another shop.</p>
                                </div>
                                <span className="flex items-center gap-1.5 bg-white text-red-600 border border-red-600 rounded-[10px] py-2 px-4 text-[13px] font-bold flex-shrink-0">
                                    <FontAwesomeIcon icon={faXmark} className="text-[11px]" /> Declined
                                </span>
                            </div>
                        )}

                        {!isConfirmed && !isDeclined && (
                            <>
                                <div className="mb-3.5">
                                    <p className="text-[13px] font-bold m-0 text-blue-600">
                                        Action required — confirm or decline your booking
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 mb-0">
                                        Confirming locks in your appointment and lets the shop know you're coming.
                                    </p>
                                </div>

                                {hasTow && <TowTruckCard notif={notif} />}

                                <div className={`flex gap-2.5 flex-wrap ${hasTow ? "mt-3.5" : "mt-0"}`}>
                                    <button
                                        onClick={(e) => openDeclineModal(e, notif)}
                                        disabled={isDeclining || isConfirming}
                                        className={`flex items-center gap-2 bg-white text-red-600 border-[1.5px] border-red-600 rounded-[10px] py-2.5 px-[18px] text-[13px] font-bold flex-shrink-0 transition-all duration-150 ${isDeclining ? "cursor-not-allowed" : "cursor-pointer"}`}
                                        style={{ fontFamily: FONT }}
                                    >
                                        <FontAwesomeIcon icon={faXmark} className="text-[13px]" /> Decline
                                    </button>

                                    <button
                                        onClick={(e) => handleConfirm(e, notif)}
                                        disabled={isConfirming || isDeclining}
                                        className={`flex items-center gap-2 border-none rounded-[10px] py-2.5 px-[18px] text-[13px] font-bold flex-shrink-0 transition-colors duration-150
                                            ${isConfirming ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white cursor-pointer"}`}
                                        style={{ fontFamily: FONT }}
                                    >
                                        {isConfirming
                                            ? <><FontAwesomeIcon icon={faSpinner} spin className="text-xs" /> Confirming…</>
                                            : <><FontAwesomeIcon icon={faHandshake} className="text-[13px]" /> Confirm Booking <FontAwesomeIcon icon={faArrowRight} className="text-[11px]" /></>
                                        }
                                    </button>

                                    {notif.shop_id && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate(`/shop/${notif.shop_id}`); }}
                                            className="flex items-center gap-1.5 bg-white text-gray-700 border-[1.5px] border-gray-200 rounded-[10px] py-2.5 px-3.5 text-[13px] font-semibold cursor-pointer flex-shrink-0 transition-all duration-150 hover:border-green-600 hover:text-green-600"
                                            style={{ fontFamily: FONT }}
                                        >
                                            <FontAwesomeIcon icon={faStore} className="text-xs" />
                                            View Shop & Take Direction
                                            <FontAwesomeIcon icon={faExternalLinkAlt} className="text-[10px]" />
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ── CONFIRMED: Tow card + track hint + View Shop button ── */}
                {notif.status === "Confirmed" && (
                    <>
                        {hasTow && <TowTruckCard notif={notif} />}
                        <div className={`flex flex-wrap items-center justify-between gap-2.5 ${hasTow ? "mt-2.5" : "mt-0"}`}>
                            <p className="text-xs m-0" style={{ color: "#16A34A" }}>
                                {hasTow
                                    ? <>🚛 Your tow truck is on the way! Track progress in the <strong>Repair Status</strong> tab.</>
                                    : <>🏪 Please bring your vehicle to the shop. Track progress in the <strong>Repair Status</strong> tab.</>
                                }
                            </p>
                            {!hasTow && notif.shop_id && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); navigate(`/shop/${notif.shop_id}`); }}
                                    className="flex items-center gap-1.5 bg-white text-gray-700 border-[1.5px] border-gray-200 rounded-[10px] py-2 px-3.5 text-[13px] font-semibold cursor-pointer flex-shrink-0 transition-all duration-150 hover:border-green-600 hover:text-green-600"
                                    style={{ fontFamily: FONT }}
                                >
                                    <FontAwesomeIcon icon={faStore} className="text-xs" />
                                    View Shop & Take Directions
                                    <FontAwesomeIcon icon={faExternalLinkAlt} className="text-[10px]" />
                                </button>
                            )}
                        </div>
                    </>
                )}

                {/* ── DECLINED: Simple heads-up, encourage trying another shop ── */}
                {notif.status === "Declined" && (
                    <div
                        className="mt-3 flex items-center justify-between rounded-xl py-3 px-4 gap-3"
                        style={{ background: "rgba(220,38,38,0.08)", border: "1px solid #DC262633" }}
                    >
                        <div className="flex items-center gap-2.5">
                            <FontAwesomeIcon icon={faXmark} className="text-red-600" />
                            <div>
                                <p className="text-[13px] font-bold text-gray-900 m-0">This shop couldn't take your request</p>
                                <p className="text-xs text-gray-500 m-0">Browse other nearby shops to get your vehicle sorted.</p>
                            </div>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); navigate("/shops"); }}
                            className="flex items-center gap-1.5 bg-white text-gray-700 border-[1.5px] border-gray-200 rounded-[10px] py-2 px-3.5 text-[13px] font-semibold cursor-pointer flex-shrink-0"
                            style={{ fontFamily: FONT }}
                        >
                            Find Another Shop
                            <FontAwesomeIcon icon={faExternalLinkAlt} className="text-[10px]" />
                        </button>
                    </div>
                )}

                {/* ── COMPLETED: Review prompt ── */}
                {notif.status === "Completed" && (
                    <div
                        className="mt-3 flex items-center justify-between border border-gray-200 rounded-xl py-3 px-4"
                        style={{ background: "rgba(22,163,74,0.08)" }}
                    >
                        <div className="flex items-center gap-2.5">
                            <FontAwesomeIcon icon={faStar} className="text-green-600" />
                            <div>
                                <p className="text-[13px] font-bold text-gray-900 m-0">We'd love to hear about your experience!</p>
                                <p className="text-xs text-gray-500 m-0">Your feedback helps others find great workshops.</p>
                            </div>
                        </div>

                        {reviewedIds.includes(String(notif.service_request_id)) ? (
                            <span className="flex items-center gap-1.5 text-green-600 text-[13px] font-bold flex-shrink-0 ml-3">
                                <FontAwesomeIcon icon={faCheck} /> Reviewed
                            </span>
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setReviewModal({
                                        requestId: notif.service_request_id,
                                        shopId: notif.shop_id,
                                        shopName: notif.shop_name,
                                    });
                                }}
                                className="flex items-center gap-1.5 bg-green-600 text-white border-none rounded-[10px] py-2 px-3.5 text-[13px] font-bold cursor-pointer flex-shrink-0 ml-3"
                                style={{ fontFamily: FONT }}
                            >
                                <FontAwesomeIcon icon={faStar} className="text-[11px]" />
                                Review & Rate
                                <FontAwesomeIcon icon={faArrowRight} className="text-[11px]" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Timestamp + dot */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="text-[11px] text-gray-400 whitespace-nowrap">{formatTime(notif.created_at)}</span>
                <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ background: !isRead ? "#16A34A" : "#E5E7EB" }}
                />
            </div>
        </div>
    );
};
