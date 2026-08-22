import React, { useState, useEffect } from "react";
import { NavBar } from "../components/NavBar";
import { Footer } from "../components/footer";
import * as FaIcons from "react-icons/fa";
import { FaFileSignature, FaGavel, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import { api } from "../src/services/api";
import toast from "react-hot-toast";

function TermsConditions() {
    const [activeSection, setActiveSection] = useState(1);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState([]);
    const [saving, setSaving] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        // Check if user is admin
        const role = localStorage.getItem("role");
        if (role === "admin") {
            setIsAdmin(true);
        }

        // Fetch terms
        fetchTerms();
    }, []);

    const fetchTerms = async () => {
        try {
            setLoading(true);
            const data = await api.getPublic('shared/getTerms.php');
            if (data && Array.isArray(data)) {
                setSections(data);
                setEditFormData(data);
                if (data.length > 0) setActiveSection(data[0].id);
            }
        } catch (error) {
            console.error("Failed to fetch terms:", error);
        } finally {
            setLoading(false);
        }
    };

    const scrollToSection = (id) => {
        setActiveSection(id);
        const element = document.getElementById(`section-${id}`);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    };

    const handleEditToggle = () => {
        if (isEditing) {
            // Cancel editing, revert changes
            setEditFormData(sections);
        }
        setIsEditing(!isEditing);
    };

    const handleFormChange = (index, field, value) => {
        const newData = [...editFormData];
        newData[index] = { ...newData[index], [field]: value };
        setEditFormData(newData);
    };

    const handleSaveClick = () => {
        // Check if anything actually changed
        if (JSON.stringify(editFormData) === JSON.stringify(sections)) {
            toast.info("No changes were made.");
            setIsEditing(false);
            return;
        }
        setShowConfirmModal(true);
    };

    const handleConfirmSave = async () => {
        setShowConfirmModal(false);
        try {
            setSaving(true);
            const data = await api.post('admin/updateTerms.php', { terms: editFormData });
            if (data.success) {
                setSections(editFormData);
                setIsEditing(false);
                setShowSuccessModal(true);
                // Auto-hide the modal after 3 seconds
                setTimeout(() => {
                    setShowSuccessModal(false);
                }, 3000);
            }
        } catch (error) {
            console.error("Failed to update terms:", error);
            toast.error("Failed to update terms. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans relative overflow-x-hidden">
            <NavBar />
            
            {/* Background Aesthetic Blobs */}
            <div className="absolute top-24 -left-48 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse pointer-events-none" />
            <div className="absolute top-96 -right-48 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-pulse pointer-events-none" />

            <main className="flex-grow max-w-5xl mx-auto w-full px-4 md:px-8 py-12 relative z-10">
                {/* Hero / Header Section */}
                <div 
                    className="rounded-[32px] p-8 md:p-12 border border-white/80 shadow-[0_20px_50px_rgba(22,163,74,0.04)] mb-8 text-center relative overflow-hidden backdrop-blur-md"
                    style={{ background: "linear-gradient(135deg, rgba(238,247,240,0.9) 0%, rgba(255,255,255,0.9) 100%)" }}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-bl-full" />
                    <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-green-700 bg-green-100/80 px-4 py-2 rounded-full mb-4">
                        <FaGavel className="text-[10px]" /> FixGo Legal Documentation
                    </span>
                    <h1 className="text-3xl md:text-5xl font-black text-slate-900 mt-2 mb-3 tracking-tight leading-none">
                        Terms & <span className="text-green-600">Conditions</span>
                    </h1>
                    <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-xl mx-auto font-medium mb-6">
                        Please review our agreement terms. They outline rules, responsibilities, and guidelines for using the FixGo platform.
                    </p>

                    {isAdmin && (
                        <div className="flex justify-center gap-4">
                            {!isEditing ? (
                                <button 
                                    onClick={handleEditToggle}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md shadow-green-500/20 transition-all"
                                >
                                    <FaEdit /> Edit Terms
                                </button>
                            ) : (
                                <>
                                    <button 
                                        onClick={handleSaveClick}
                                        disabled={saving}
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-70"
                                    >
                                        <FaSave /> {saving ? "Saving..." : "Save Changes"}
                                    </button>
                                    <button 
                                        onClick={handleEditToggle}
                                        disabled={saving}
                                        className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-70"
                                    >
                                        <FaTimes /> Cancel
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                        <p className="mt-4 text-slate-500 font-medium">Loading terms...</p>
                    </div>
                ) : (
                    <>
                        {/* Horizontal Navigation Bar */}
                        <div className="sticky top-20 z-30 bg-white/90 backdrop-blur-md rounded-2xl p-2 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] mb-10 flex flex-wrap items-center justify-center gap-1.5">
                            {(isEditing ? editFormData : sections).map((sec) => {
                                const IconComponent = FaIcons[sec.icon] || FaFileSignature;
                                return (
                                    <button
                                        key={sec.id}
                                        onClick={() => scrollToSection(sec.id)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 border-none cursor-pointer ${activeSection === sec.id ? "bg-green-600 text-white shadow-md shadow-green-500/20" : "bg-transparent text-slate-600 hover:bg-green-50 hover:text-green-700"}`}
                                    >
                                        <IconComponent className="text-sm shrink-0" />
                                        <span>{sec.title}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Policy Sections List */}
                        <div className="space-y-6">
                            {(isEditing ? editFormData : sections).map((sec, index) => {
                                const IconComponent = FaIcons[sec.icon] || FaFileSignature;
                                return (
                                    <article 
                                        key={sec.id} 
                                        id={`section-${sec.id}`}
                                        className={`bg-white rounded-3xl p-6 md:p-8 border transition-all duration-300 ${activeSection === sec.id ? "border-green-400 shadow-md shadow-green-500/5 ring-1 ring-green-500/20" : "border-slate-100 hover:border-slate-200 shadow-xs"}`}
                                        onClick={() => setActiveSection(sec.id)}
                                    >
                                        <div className="flex flex-col md:flex-row items-start gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${activeSection === sec.id ? "bg-green-600 text-white" : "bg-green-50 text-green-600"}`}>
                                                <IconComponent className="text-lg" />
                                            </div>
                                            <div className="space-y-3 flex-grow w-full">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
                                                        Section 0{index + 1}
                                                    </span>
                                                </div>
                                                
                                                {isEditing ? (
                                                    <div className="space-y-4 w-full">
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Section Title</label>
                                                            <input 
                                                                type="text" 
                                                                value={sec.title} 
                                                                onChange={(e) => handleFormChange(index, 'title', e.target.value)}
                                                                className="w-full text-xl font-bold text-slate-900 border-2 border-slate-200 rounded-xl px-4 py-2 focus:border-green-500 focus:ring-0 transition-colors"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Section Content</label>
                                                            <textarea 
                                                                value={sec.content}
                                                                onChange={(e) => handleFormChange(index, 'content', e.target.value)}
                                                                rows="5"
                                                                className="w-full text-slate-700 text-sm leading-relaxed border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-0 transition-colors resize-y"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Icon Name (FontAwesome)</label>
                                                            <input 
                                                                type="text" 
                                                                value={sec.icon} 
                                                                onChange={(e) => handleFormChange(index, 'icon', e.target.value)}
                                                                className="w-full text-sm text-slate-700 border-2 border-slate-200 rounded-xl px-4 py-2 focus:border-green-500 focus:ring-0 transition-colors"
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{sec.title}</h2>
                                                        <p className="text-slate-600 text-sm leading-relaxed font-sans whitespace-pre-wrap">
                                                            {sec.content}
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </>
                )}
            </main>

            {/* Custom Confirm Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200 border border-amber-100">
                        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-amber-100 mb-6">
                            <FaEdit className="h-10 w-10 text-amber-600" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Save Changes?</h3>
                        <p className="text-slate-500 font-medium mb-8">
                            Are you sure you want to update the Terms & Conditions? These changes will be visible to all users immediately.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmSave}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md shadow-blue-500/20"
                            >
                                Yes, Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200 border border-green-100">
                        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
                            <FaSave className="h-10 w-10 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Saved Successfully!</h3>
                        <p className="text-slate-500 font-medium mb-8">
                            The terms and conditions have been updated and are now live.
                        </p>
                        <button
                            onClick={() => setShowSuccessModal(false)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md shadow-green-500/20"
                        >
                            Got it, thanks!
                        </button>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}

export default TermsConditions;
