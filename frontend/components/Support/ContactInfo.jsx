import { FaPhoneAlt, FaEnvelope, FaClock, FaMapMarkerAlt } from "react-icons/fa";

const ContactInfo = () => (
  <section className="max-w-6xl mx-auto px-4 pb-14">
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7 h-fit w-full">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Contact Information</h2>
      <p className="text-gray-500 text-sm mb-6">Get in touch with our support team</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {/* Hotline */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
            <FaPhoneAlt className="text-[#16a34a] text-base" />
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">Hotline (24/7)</p>
            <p className="text-[#16a34a] font-semibold text-sm mt-0.5">+94 11 234 5678</p>
            <p className="text-gray-400 text-xs mt-0.5">For emergency roadside assistance</p>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
            <FaEnvelope className="text-[#16a34a] text-base" />
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">Email Support</p>
            <p className="text-[#16a34a] font-semibold text-sm mt-0.5">support@fixgo.lk</p>
            <p className="text-gray-400 text-xs mt-0.5">We typically reply within 24 hours</p>
          </div>
        </div>

        {/* Hours */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
            <FaClock className="text-[#16a34a] text-base" />
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">Support Hours</p>
            <p className="text-[#16a34a] font-semibold text-sm mt-0.5">8:00 AM – 8:00 PM</p>
            <p className="text-gray-400 text-xs mt-0.5">For general inquiries and support</p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
            <FaMapMarkerAlt className="text-[#16a34a] text-base" />
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">Our Location</p>
            <p className="text-[#16a34a] font-semibold text-sm mt-0.5">Colombo, Sri Lanka</p>
            <p className="text-gray-400 text-xs mt-0.5">We're here to help you</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default ContactInfo;
