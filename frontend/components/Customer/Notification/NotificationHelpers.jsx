import {
    faCircleCheck, faHandshake, faStethoscope, faWrench,
    faBoxesStacked, faCircleXmark, faClock
} from "@fortawesome/free-solid-svg-icons";

export const FONT = "'Segoe UI', system-ui, sans-serif";

export const STATUS_META = {
    Pending:         { icon: faClock,        iconBg: "rgba(217,119,6,0.10)",  iconColor: "#D97706", badgeBg: "rgba(217,119,6,0.10)",  badgeColor: "#D97706",  label: "Pending"       },
    Accepted:        { icon: faCircleCheck,  iconBg: "rgba(37,99,235,0.10)",  iconColor: "#2563EB", badgeBg: "rgba(37,99,235,0.10)",  badgeColor: "#2563EB",  label: "Accepted"      },
    Confirmed:       { icon: faHandshake,    iconBg: "rgba(22, 163, 74,0.10)", iconColor: "#16A34A", badgeBg: "rgba(22, 163, 74,0.10)", badgeColor: "#16A34A",  label: "Confirmed"     },
    Diagnosis:       { icon: faStethoscope,  iconBg: "rgba(217,119,6,0.10)",  iconColor: "#D97706", badgeBg: "rgba(217,119,6,0.10)",  badgeColor: "#D97706",  label: "Diagnosis"     },
    "In Progress":   { icon: faWrench,       iconBg: "rgba(168,85,247,0.10)", iconColor: "#A855F7", badgeBg: "rgba(168,85,247,0.10)", badgeColor: "#A855F7",  label: "In Progress"   },
    "Pending Parts": { icon: faBoxesStacked, iconBg: "rgba(217,119,6,0.10)",  iconColor: "#D97706", badgeBg: "rgba(217,119,6,0.10)",  badgeColor: "#D97706",  label: "Pending Parts" },
    Completed:       { icon: faCircleCheck,  iconBg: "rgba(22,163,74,0.10)",  iconColor: "#16A34A", badgeBg: "rgba(22,163,74,0.10)",  badgeColor: "#16A34A",  label: "Completed"     },
    Cancelled:       { icon: faCircleXmark,  iconBg: "#FEF2F2",               iconColor: "#DC2626", badgeBg: "#FEF2F2",               badgeColor: "#DC2626",  label: "Cancelled"     },
    Declined:        { icon: faCircleXmark,  iconBg: "#FEF2F2",               iconColor: "#DC2626", badgeBg: "#FEF2F2",               badgeColor: "#DC2626",  label: "Declined"      },
};

export const getMessage = (req) => {
    if (req.message) return req.message;
    const shop = req.shop_name || "the shop";
    switch (req.status) {
        case "Accepted":       return `${shop} accepted your request. Please confirm or decline below.`;
        case "Confirmed":      return req.requires_tow == 1
            ? `Your booking with ${shop} is confirmed! We're on our way to pick up your vehicle. Sit tight!`
            : `Your booking with ${shop} is confirmed! Please bring your vehicle to the shop.`;
        case "Diagnosis":      return `${shop} is currently diagnosing your vehicle.`;
        case "In Progress":    return `Your vehicle repair is now in progress at ${shop}.`;
        case "Pending Parts":  return `${shop} is waiting for spare parts to arrive.`;
        case "Completed":      return `Your repair at ${shop} is complete. Your vehicle is ready!`;
        case "Cancelled":      return `Your service request with ${shop} was cancelled.`;
        case "Declined":       return `Unfortunately, ${shop} declined your service request. Feel free to try another shop.`;
        default:               return `Your request status was updated to ${req.status}.`;
    }
};

export const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    if (d.toDateString() === today.toDateString())     return `Today, ${timeStr}`;
    if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${timeStr}`;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) + `, ${timeStr}`;
};

export const formatRefId = (id, createdAt) => {
    const year = createdAt ? new Date(createdAt).getFullYear() : new Date().getFullYear();
    return `REQ-${year}-${String(id).padStart(5, "0")}`;
};
