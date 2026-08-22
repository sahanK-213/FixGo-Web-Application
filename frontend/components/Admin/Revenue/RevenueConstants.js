export const ACCENT_STYLES = {
  green:  { iconBg: "bg-green-50",  iconColor: "text-green-600",  metaColor: "text-green-600" },
  blue:   { iconBg: "bg-[#EDF3FF]", iconColor: "text-blue-600",   metaColor: "text-blue-600" },
  orange: { iconBg: "bg-[#FFF4EE]", iconColor: "text-[#FF6B1A]",  metaColor: "text-[#FF6B1A]" },
};

export const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const STATUS_STYLES = {
  Paid:                   "bg-green-50 text-green-600",
  Dispatched:             "bg-blue-50 text-blue-600",
  "Verification Pending": "bg-amber-50 text-amber-600",
  Overdue:                "bg-red-100 text-red-600",
  Draft:                  "bg-gray-100 text-gray-500",
  Ignored:                "bg-slate-100 text-slate-500",
};

export const LINE_COLORS = { Garages: "#16a34a", "Service Centers": "#2563eb", "Spare Parts": "#f97316" };

export const HEALTH_CFG = [
  { key: "Paid",                 label: "Paid",      fill: "#16a34a", text: "text-green-600",  bar: "bg-green-500",  pulse: false },
  { key: "Dispatched",           label: "Dispatched",fill: "#2563eb", text: "text-blue-600",   bar: "bg-blue-500",   pulse: false },
  { key: "Verification Pending", label: "Pending",   fill: "#d97706", text: "text-amber-600", bar: "bg-amber-400",  pulse: true  },
  { key: "Overdue",              label: "Overdue",   fill: "#dc2626", text: "text-red-600",   bar: "bg-red-500",   pulse: true  },
];
