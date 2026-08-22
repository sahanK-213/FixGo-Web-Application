import { Link } from 'react-router-dom';
import logo from '../src/assets/FixGo.png';
import { 
    FaFacebookF, 
    FaInstagram, 
    FaYoutube, 
    FaLinkedinIn, 
    FaPhoneAlt, 
    FaEnvelope, 
    FaMapMarkerAlt 
} from 'react-icons/fa';

export const Footer = () => {
    return (
        <footer className="bg-[#1a232d] text-white pt-12 mt-20 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 lg:gap-8 pb-12">
                {/* Column 1: Logo & Description */}
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <img alt="FixGo Logo" className="h-8 w-auto" src={logo} />
                        <span className="text-xl font-bold text-[#16a34a]">FixGo</span>
                    </div>
                    <p className="text-gray-400 text-sm mt-4 leading-relaxed max-w-xs font-sans">
                        Find trusted vehicle repair shops across Western Province.
                    </p>
                    <p className="text-gray-400 text-sm mt-1 leading-relaxed max-w-xs font-sans">
                        Quality service. Peace of mind.
                    </p>
                    <div className="flex gap-3 mt-6">
                        <a href="#" className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-[#16a34a] hover:text-white transition-all duration-300 flex items-center justify-center text-gray-400">
                            <FaFacebookF size={14} />
                        </a>
                        <a href="#" className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-[#16a34a] hover:text-white transition-all duration-300 flex items-center justify-center text-gray-400">
                            <FaInstagram size={14} />
                        </a>
                        <a href="#" className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-[#16a34a] hover:text-white transition-all duration-300 flex items-center justify-center text-gray-400">
                            <FaYoutube size={14} />
                        </a>
                        <a href="#" className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-[#16a34a] hover:text-white transition-all duration-300 flex items-center justify-center text-gray-400">
                            <FaLinkedinIn size={14} />
                        </a>
                    </div>
                </div>

                {/* Column 2: Quick Links */}
                <div className="flex flex-col md:border-l md:border-slate-800 md:pl-8">
                    <h4 className="font-bold text-base tracking-wide text-white">Quick Links</h4>
                    <ul className="flex flex-col gap-3 mt-4 text-sm text-gray-400">
                        <li><Link to="/" className="hover:text-[#16a34a] transition-colors">Homepage</Link></li>
                        <li><Link to="/shops" className="hover:text-[#16a34a] transition-colors">Find Shops</Link></li>
                        <li><Link to="/services" className="hover:text-[#16a34a] transition-colors">Dashboard</Link></li>
                        <li><Link to="/support" className="hover:text-[#16a34a] transition-colors">Support</Link></li>
                        <li><a href="#" className="hover:text-[#16a34a] transition-colors">About Us</a></li>
                    </ul>
                </div>

                {/* Column 3: Workshop Owners */}
                <div className="flex flex-col md:border-l md:border-slate-800 md:pl-8">
                    <h4 className="font-bold text-base tracking-wide text-white">For Workshop Owners</h4>
                    <ul className="flex flex-col gap-3 mt-4 text-sm text-gray-400">
                        <li><Link to="/form/shop-owner" className="hover:text-[#16a34a] transition-colors">Register Your Garage</Link></li>
                        <li><a href="#" className="hover:text-[#16a34a] transition-colors">Manage Appointments</a></li>
                        <li><a href="#" className="hover:text-[#16a34a] transition-colors">Grow Your Business</a></li>
                    </ul>
                </div>

                {/* Column 4: Contact Us */}
                <div className="flex flex-col md:border-l md:border-slate-800 md:pl-8">
                    <h4 className="font-bold text-base tracking-wide text-white">Contact Us</h4>
                    <div className="flex flex-col gap-4 mt-4 text-sm text-gray-400">
                        <div className="flex items-center gap-3">
                            <FaPhoneAlt size={14} className="text-gray-400 shrink-0" />
                            <span>011 2 345 678</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <FaEnvelope size={14} className="text-gray-400 shrink-0" />
                            <span>support@fixgo.lk</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <FaMapMarkerAlt size={14} className="text-gray-400 shrink-0" />
                            <span>Colombo, Sri Lanka</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Copyright Strip */}
            <div className="border-t border-slate-800 bg-[#151d25] py-6 text-xs text-gray-500">
                <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <span>&copy; 2024 FixGo. All rights reserved.</span>
                    <div className="flex gap-4">
                        <Link to="/terms-conditions" className="hover:text-gray-300 transition-colors">Terms & Conditions</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};