import { useState } from "react";
import { FaBook, FaCalendarAlt, FaCar, FaShieldAlt, FaHandshake, FaArrowRight } from "react-icons/fa";

const helpResources = [
  {
    icon: <FaBook className="text-[#16a34a] text-2xl" />,
    title: "User Guide",
    desc: "Complete guide to using FixGo",
    modalTitle: "FixGo User Guide",
    modalContent: [
      { heading: "Getting Started", body: "Create your FixGo account and complete your profile. You can register as a customer or as a shop owner from the Get Started page." },
      { heading: "Finding a Shop", body: "Use the Find Shops page to search for nearby vehicle repair centers. Filter by service type, location, and ratings to find your best match." },
      { heading: "Booking a Service", body: "Click on any shop, choose a service, select a time slot, and confirm your booking. You'll receive an email confirmation immediately." },
      { heading: "Managing Your Account", body: "Access your dashboard to view booking history, update your profile, manage notifications, and track your active service requests." },
    ],
  },
  {
    icon: <FaCalendarAlt className="text-[#16a34a] text-2xl" />,
    title: "How Booking Works",
    desc: "Step-by-step booking process",
    modalTitle: "How Booking Works",
    modalContent: [
      { heading: "Step 1 – Find a Shop", body: "Browse or search for a repair shop near you. You can filter results by service category, distance, and customer ratings." },
      { heading: "Step 2 – Select a Service", body: "Pick the type of service you need from the shop's profile (e.g., full service, tyre change, oil change, AC repair)." },
      { heading: "Step 3 – Choose a Time Slot", body: "Select a convenient date and time from the shop's available calendar. Slots update in real time." },
      { heading: "Step 4 – Confirm & Track", body: "Confirm your booking and monitor its status from your dashboard. The shop will be notified and will confirm or suggest an alternative slot." },
      { heading: "Cancellations", body: "You may cancel or reschedule up to 2 hours before your appointment via the dashboard." },
    ],
  },
  {
    icon: <FaCar className="text-[#16a34a] text-2xl" />,
    title: "Roadside Assistance",
    desc: "Everything about our roadside help",
    modalTitle: "Roadside Assistance",
    modalContent: [
      { heading: "What Is Roadside Assistance?", body: "FixGo Roadside Help connects you with the nearest available mechanic when your vehicle breaks down unexpectedly on the road." },
      { heading: "How to Request Help", body: "Tap the Roadside Help button in the app or on the website. Share your location and describe the issue — a technician will be dispatched to you." },
      { heading: "Coverage", body: "Roadside assistance is currently available across the Western Province of Sri Lanka. Coverage is being expanded to other provinces soon." },
      { heading: "24/7 Hotline", body: "You can also reach our emergency hotline at +94 11 234 5678 at any time of day or night for immediate roadside support." },
    ],
  },
  {
    icon: <FaShieldAlt className="text-[#16a34a] text-2xl" />,
    title: "Safety Guidelines",
    desc: "Your safety is our priority",
    modalTitle: "Safety Guidelines",
    modalContent: [
      { heading: "Verified Shops Only", body: "All shops listed on FixGo are verified and reviewed before being approved. We check licenses, facilities, and customer feedback regularly." },
      { heading: "Secure Data", body: "Your personal information is encrypted and never shared with third parties without your consent. We are compliant with data protection standards." },
      { heading: "Review System", body: "After every completed service, you can leave a verified review. This keeps our community honest and helps others choose trusted shops." },
      { heading: "Dispute Resolution", body: "If you have a safety concern or dispute, contact our support team within 48 hours. We will investigate and mediate between you and the shop." },
    ],
  },
  {
    icon: <FaHandshake className="text-[#16a34a] text-2xl" />,
    title: "Become a Partner",
    desc: "Join FixGo as a service partner",
    modalTitle: "Become a FixGo Partner",
    modalContent: [
      { heading: "Who Can Join?", body: "Any registered vehicle repair shop, mobile mechanic, or roadside assistance provider in Sri Lanka can apply to join the FixGo partner network." },
      { heading: "Benefits", body: "Get access to thousands of customers, manage bookings digitally, receive reviews that build credibility, and grow your business with our tools." },
      { heading: "How to Apply", body: "Click Get Started on the homepage and register as a Shop Owner. Fill in your business details and submit your application for review." },
      { heading: "Approval Process", body: "Our team will verify your credentials within 2–3 business days. Once approved, your shop will be listed and visible to all FixGo users." },
    ],
  },
];

const ResourceModal = ({ resource, onClose }) => {
  if (!resource) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-8 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors text-sm font-bold">
          ✕
        </button>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            {resource.icon}
          </div>
          <h3 className="text-xl font-bold text-gray-900">{resource.modalTitle}</h3>
        </div>
        <div className="flex flex-col gap-5">
          {resource.modalContent.map((section) => (
            <div key={section.heading}>
              <p className="text-sm font-bold text-[#16a34a] mb-1">{section.heading}</p>
              <p className="text-gray-600 text-sm leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-7 pt-5 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors active:scale-95">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

const ResourceCard = ({ icon, title, desc, onOpen }) => (
  <div onClick={onOpen} className="group bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md hover:border-green-200 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
    <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
      {icon}
    </div>
    <div className="flex-1">
      <p className="font-bold text-gray-800 text-sm">{title}</p>
      <p className="text-gray-400 text-xs mt-1 leading-relaxed">{desc}</p>
    </div>
    <div className="flex items-center gap-1 text-[#16a34a] text-xs font-semibold group-hover:gap-2 transition-all">
      Learn more <FaArrowRight className="text-[10px]" />
    </div>
  </div>
);

const HelpResources = () => {
  const [activeResource, setActiveResource] = useState(null);

  return (
    <>
      <section className="max-w-6xl mx-auto px-4 pb-14">
        <h2 className="text-2xl font-bold text-gray-900 mb-7">Help Resources</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {helpResources.map((r) => (
            <ResourceCard key={r.title} {...r} onOpen={() => setActiveResource(r)} />
          ))}
        </div>
      </section>
      <ResourceModal resource={activeResource} onClose={() => setActiveResource(null)} />
    </>
  );
};

export default HelpResources;
