import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faMoneyBillWave, faChartLine, faStore } from "@fortawesome/free-solid-svg-icons";
import { api } from "../../src/services/api";
import toast from "react-hot-toast";

import { PageHeading, SkeletonCard, SkeletonChart, PageCard } from "./Revenue/RevenueShared";
import AdminSummaryCard from "./Revenue/AdminSummaryCard";
import { RevenueBarChart, CollectionHealth } from "./Revenue/RevenueCharts";
import BillingActions from "./Revenue/BillingActions";
import InvoiceLedgerTable from "./Revenue/InvoiceLedgerTable";
import { MONTH_NAMES } from "./Revenue/RevenueConstants";

function Revenue() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [healthMonth, setHealthMonth] = useState("latest");

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("admin/getAnalytics.php");
      setAnalytics(res.data);
    } catch {
      toast.error("Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRefresh = () => {
    load();
    setRefreshKey(prev => prev + 1);
  };

  const kpis = analytics?.kpis || {};

  const calendarMonths = Array.from({ length: 12 }, (_, i) => MONTH_NAMES[i + 1]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <PageHeading title="Revenue & Ledger" sub="Monthly billing and commission tracking across all shops." />
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50 shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
        >
          <FontAwesomeIcon icon={faClock} /> Refresh
        </button>
      </div>

      {loading ? (
        <>
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
          <SkeletonChart />
          <SkeletonChart />
        </>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
            <AdminSummaryCard
              accent="green" icon={faMoneyBillWave}
              title="Projected Revenue (This Month)"
              count={`LKR ${Number(kpis.projectedRevenue || 0).toLocaleString()}`}
              tooltip="Based on completed requests this month × active category rates"
            />
            <AdminSummaryCard
              accent="blue" icon={faChartLine}
              title="Monthly Recurring Revenue (MRR)"
              count={`LKR ${Number(kpis.mrr || 0).toLocaleString()}`}
              meta="Spare parts shops flat fee"
              tooltip="Flat subscription fees from active Spare Part shops only"
            />
            <AdminSummaryCard
              accent="orange" icon={faStore}
              title="Active Shops"
              count={kpis.activeShops || 0}
              meta="Billed this cycle"
              tooltip="Verified shops currently listed on the platform"
            />

          </div>

          {/* Revenue bar chart */}
          <PageCard title="Revenue Trend (Last 12 Months)">
            <RevenueBarChart data={analytics?.revenueChart} />
          </PageCard>

          {/* Collection health */}
          <PageCard 
            title="Collection Health"
            action={
              <select 
                className="text-[13px] border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-700 font-semibold cursor-pointer outline-none hover:bg-gray-100 transition-colors" 
                value={healthMonth} 
                onChange={e => setHealthMonth(e.target.value)}
              >
                 <option value="latest">Latest Month</option>
                 <option value="all">All Time</option>
                 {calendarMonths.map(m => (
                    <option key={m} value={m}>{m}</option>
                 ))}
              </select>
            }
          >
            <CollectionHealth health={analytics?.collectionHealth} selectedMonth={healthMonth} />
          </PageCard>

          {/* Billing action panel */}
          <BillingActions analytics={analytics} onRefresh={handleRefresh} />

          {/* Full invoice ledger */}
          <InvoiceLedgerTable refreshKey={refreshKey} />
        </>
      )}
    </div>
  );
}

export default Revenue;

