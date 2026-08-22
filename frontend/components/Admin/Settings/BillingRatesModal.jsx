import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoneyBillWave, faSave, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { api } from "../../../src/services/api";
import toast from "react-hot-toast";

export function BillingRatesModal({ onClose }) {
  const [rates, setRates]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({});

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("admin/getBillingRates.php");
        setRates(res.data);
        setForm(res.data);
      } catch {
        toast.error("Failed to load billing rates.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post("admin/updateBillingRates.php", form);
      toast.success("Billing rates updated successfully.");
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to save rates.");
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, fieldKey, desc }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
      {desc && <p className="text-[11px] text-gray-400 mb-1.5">{desc}</p>}
      <div className="flex items-center border border-gray-200 rounded-[10px] overflow-hidden focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-50 transition-all">
        <span className="px-3 py-2.5 text-xs font-bold text-gray-500 bg-gray-50 border-r border-gray-200">LKR</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={form[fieldKey] ?? ""}
          onChange={e => setForm(prev => ({ ...prev, [fieldKey]: e.target.value }))}
          className="flex-1 py-2.5 px-3 text-sm outline-none bg-white"
        />
      </div>
    </div>
  );

  const DaysField = ({ label, fieldKey }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
      <div className="flex items-center border border-gray-200 rounded-[10px] overflow-hidden focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-50 transition-all">
        <input
          type="number"
          min="1"
          max="60"
          value={form[fieldKey] ?? ""}
          onChange={e => setForm(prev => ({ ...prev, [fieldKey]: e.target.value }))}
          className="flex-1 py-2.5 px-3 text-sm outline-none bg-white"
        />
        <span className="px-3 py-2.5 text-xs font-bold text-gray-500 bg-gray-50 border-l border-gray-200">days</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]" onClick={onClose}>
      <div className="bg-white rounded-[18px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full max-w-xl mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
            <FontAwesomeIcon icon={faMoneyBillWave} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-[16px] font-bold text-gray-900 m-0">Billing Rates</h2>
            <p className="text-xs text-gray-500 m-0">Changes apply to future invoice cycles only.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16 text-gray-400">
            <FontAwesomeIcon icon={faSpinner} spin className="text-3xl" />
          </div>
        ) : (
          <div className="p-6 flex flex-col gap-6">
            {/* Per-request fees */}
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Per-Request Fees</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Garage Fee" fieldKey="garagePerRequestFee" desc="Per completed service request" />
                <Field label="Service Center Fee" fieldKey="serviceCenterPerRequestFee" desc="Per completed service request" />
              </div>
            </div>

            {/* Monthly flat fee */}
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Monthly Flat Fee</p>
              <Field label="Spare Parts Shop Monthly Fee" fieldKey="sparePartsMonthlyFee" desc="Fixed monthly subscription regardless of requests" />
            </div>

            {/* Grace periods */}
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Grace Periods (days before Overdue)</p>
              <div className="grid grid-cols-3 gap-4">
                <DaysField label="Garages" fieldKey="garageGracePeriodDays" />
                <DaysField label="Service Centers" fieldKey="serviceCenterGracePeriodDays" />
                <DaysField label="Spare Parts" fieldKey="sparePartsGracePeriodDays" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-[10px] text-sm font-semibold cursor-pointer bg-white hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-[10px] bg-green-600 text-white text-sm font-bold border-none cursor-pointer hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSave} />}
                {saving ? "Saving…" : "Save Rates"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
