import { FaHeadset, FaShieldAlt, FaBolt, FaTools } from "react-icons/fa";

const heroFeatures = [
  {
    icon: <FaHeadset className="text-[#16a34a] text-2xl" />,
    title: "24/7 Support",
    desc: "Our team is always on standby. Reach us any time via phone or email — day or night.",
    accent: "bg-green-50 border-green-200",
  },
  {
    icon: <FaShieldAlt className="text-green-600 text-2xl" />,
    title: "Verified Service Shops",
    desc: "Every shop on FixGo is reviewed and verified. You can trust the quality before you book.",
    accent: "bg-green-50 border-green-200",
  },
  {
    icon: <FaBolt className="text-teal-600 text-2xl" />,
    title: "Instant Roadside Help",
    desc: "Stuck on the road? Connect with the nearest mechanic in minutes through our live dispatch.",
    accent: "bg-teal-50 border-teal-200",
  },
];

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#f0faf4] via-[#f7fdf9] to-[#eef9f4] border-b border-green-100 py-14 px-4">
      {/* Subtle decorative circles matching design style */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-green-100/50 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-50 rounded-full translate-y-1/2 -translate-x-1/3 blur-2xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto">
        {/* Top row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 bg-white border border-green-200 text-[#16a34a] text-xs font-semibold px-4 py-1.5 rounded-full mb-5 shadow-sm">
              <FaHeadset /> We're here to help
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
              How can we <span className="text-[#16a34a]">help you?</span>
            </h1>
            <p className="text-gray-500 mt-3 text-base max-w-md leading-relaxed">
              Browse our help topics, contact our team, or explore guides for all your FixGo needs.
            </p>
          </div>

          {/* Illustration — matches the design's headset visual */}
          <div className="shrink-0 flex items-center justify-center">
            <div className="relative w-44 h-44">
              {/* Outer glow ring */}
              <div className="absolute inset-0 rounded-full bg-green-100/80 scale-110" />
              {/* Inner circle */}
              <div className="relative w-full h-full rounded-full bg-white shadow-lg border border-green-100 flex items-center justify-center">
                <FaHeadset className="text-[#16a34a] text-7xl" />
              </div>
              {/* Chat bubble dot */}
              <div className="absolute -top-1 -right-1 w-10 h-10 bg-[#16a34a] rounded-full flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg leading-none">?</span>
              </div>
              {/* Wrench accent dot */}
              <div className="absolute -bottom-1 -left-1 w-8 h-8 bg-green-100 border-2 border-white rounded-full flex items-center justify-center shadow">
                <FaTools className="text-[#16a34a] text-xs" />
              </div>
            </div>
          </div>
        </div>

        {/* Feature highlight cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {heroFeatures.map((f) => (
            <div
              key={f.title}
              className={`flex items-start gap-4 border rounded-2xl px-5 py-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 ${f.accent}`}
            >
              <div className="w-11 h-11 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center shrink-0">
                {f.icon}
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">{f.title}</p>
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
