import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faStore,
    faShieldHalved,
    faChartLine,
    faUsers,
    faCalendarDays,
    faArrowRight,
    faMoneyCheckDollar,
    faTriangleExclamation
} from "@fortawesome/free-solid-svg-icons";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";
import { api } from "../../src/services/api";

const ACCENT_STYLES = {
    green:  { iconBg: "bg-green-50",     iconColor: "text-green-600",  metaColor: "text-green-600" },
    orange: { iconBg: "bg-[#FFF4EE]",    iconColor: "text-[#FF6B1A]",  metaColor: "text-[#FF6B1A]" },
    blue:   { iconBg: "bg-[#EDF3FF]",    iconColor: "text-blue-600",   metaColor: "text-blue-600" },
    violet: { iconBg: "bg-[#F5EDFF]",    iconColor: "text-purple-500", metaColor: "text-purple-500" },
};

const CHART_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6"];

function PageHeading({ title, sub }) {
    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 m-0">{title}</h1>
            {sub && <p className="text-gray-500 mt-1.5 text-sm mb-0">{sub}</p>}
        </div>
    );
}

function AdminSummaryCard({ accent, icon, title, count }) {
    const s = ACCENT_STYLES[accent];
    return (
        <div className="bg-white rounded-[18px] border border-gray-100 py-5 px-6 shadow-sm transition-all duration-[250ms] ease-in-out hover:-translate-y-1 hover:shadow-md flex items-center gap-4">
            <div className={`w-[52px] h-[52px] rounded-full flex items-center justify-center shrink-0 ${s.iconBg}`}>
                <FontAwesomeIcon icon={icon} className={`text-xl ${s.iconColor}`} />
            </div>
            <div>
                <p className="text-[13px] font-semibold text-gray-500 m-0 uppercase tracking-wide">{title}</p>
                <p className="text-[28px] font-bold text-gray-900 my-0.5">{count}</p>
            </div>
        </div>
    );
}

function CustomTimelineTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-gray-900 text-white rounded-xl px-4 py-3 shadow-xl text-[12px] min-w-[140px]">
            <p className="font-bold mb-2 text-gray-300">{label}</p>
            {payload.map(p => (
                <div key={p.name} className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.stroke || p.fill || '#10b981' }} />
                        Requests
                    </span>
                    <span className="font-bold text-white">{p.value}</span>
                </div>
            ))}
        </div>
    );
}

function CustomSimpleTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const data = payload[0];
    
    // Recharts handles data.name differently between Pie and Bar charts, so we fallback to data.payload.name
    const name = data.payload?.name || data.name;
    
    // BarChart doesn't pass the <Cell> fill to the tooltip, so we map it manually based on name
    let fill = data.payload?.fill || data.color || '#3b82f6';
    if (name === "Customer") fill = "#8b5cf6";
    if (name === "Shop owner") fill = "#3b82f6";
    
    return (
        <div className="bg-gray-900 text-white rounded-lg px-3 py-2 text-[12px] shadow-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: fill }} />
            <span className="font-bold text-gray-200">{name}:</span>
            <span className="font-bold text-white">{data.value}</span>
        </div>
    );
}

function Dashboard({ setCurrentPage }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timelineFilter, setTimelineFilter] = useState("30days");

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!data) setLoading(true);
            try {
                const res = await api.get('admin/getDashboardOverview.php', { timelineFilter });
                setData(res.data);
            } catch (err) {
                setError("Failed to load dashboard data.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [timelineFilter]);

    const getTimelineDateRange = () => {
        const end = new Date();
        const start = new Date();
        
        if (timelineFilter === "30days") {
            start.setDate(end.getDate() - 30);
        } else {
            start.setFullYear(end.getFullYear() - 1);
        }
        
        const formatOpts = { month: 'short', day: 'numeric', year: 'numeric' };
        return `${start.toLocaleDateString("en-US", formatOpts)} — ${end.toLocaleDateString("en-US", formatOpts)}`;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 text-center py-10 font-bold">{error}</div>;
    }

    const { kpis, financialSnapshot, charts } = data;

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-start flex-wrap gap-3 mb-2">
                <PageHeading title="System Overview" sub="Real-time platform activity and operational health." />
                <div className="flex items-center gap-2.5 py-2 px-4 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 shadow-[0_1px_4px_rgba(0,0,0,0.04)] cursor-default">
                    {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    <FontAwesomeIcon icon={faCalendarDays} className="text-gray-400" />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
                <AdminSummaryCard accent="green"  icon={faStore} title="Active Shops" count={kpis.activeShops} />
                <AdminSummaryCard accent="orange" icon={faShieldHalved} title="Pending Queue" count={kpis.pendingVerifications} />
                <AdminSummaryCard accent="blue"   icon={faChartLine} title="Requests This Month" count={kpis.mtdServiceRequests} />
                <AdminSummaryCard accent="violet" icon={faUsers} title="Active Customers" count={kpis.activeCustomers} />
            </div>

            {/* Financial Snapshot Redirect Card */}
            <div 
                onClick={() => setCurrentPage && setCurrentPage("revenue")}
                className="group relative overflow-hidden bg-white rounded-[20px] border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
                <div className="flex items-center gap-5 relative z-10">
                    <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                        <FontAwesomeIcon icon={faMoneyCheckDollar} className="text-2xl" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 m-0">Financial Action Required</h3>
                        <p className="text-sm font-medium text-gray-500 mt-1 mb-0 flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span className="flex items-center gap-1">
                                <FontAwesomeIcon icon={faTriangleExclamation} className="text-orange-400" />
                                {financialSnapshot.pendingInvoices} Pending Slips
                            </span>
                            <span className="flex items-center gap-1">
                                <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-500" />
                                {financialSnapshot.overdueInvoices} Overdue Invoices
                            </span>
                        </p>
                    </div>
                </div>
                <div className="relative z-10 flex items-center gap-2 text-green-600 font-bold text-sm bg-green-50 px-4 py-2 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
                    Go to Revenue Ledger <FontAwesomeIcon icon={faArrowRight} />
                </div>
                {/* Decorative background circle */}
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-gray-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Timeline Chart (Takes up 2 columns on large screens) */}
                <div className="xl:col-span-2 bg-white rounded-[20px] border border-gray-100 p-6 shadow-sm min-h-[350px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-base font-bold text-gray-900 m-0">Service Request Volume</h3>
                            {timelineFilter === "30days" && (
                                <p className="text-xs text-gray-500 font-medium mt-1 tracking-wide">{getTimelineDateRange()}</p>
                            )}
                        </div>
                        <select 
                            value={timelineFilter} 
                            onChange={(e) => setTimelineFilter(e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-2 outline-none cursor-pointer"
                        >
                            <option value="30days">Last 30 Days</option>
                            <option value="12months">Last 12 Months</option>
                        </select>
                    </div>
                    <div className="flex-1 w-full min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={charts.serviceRequestsTimeline} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                                <RechartsTooltip 
                                    content={<CustomTimelineTooltip />}
                                    cursor={{ stroke: '#e5e7eb', strokeWidth: 2, strokeDasharray: '5 5' }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="requests" 
                                    stroke="#10b981" 
                                    strokeWidth={4}
                                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                    activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Donut & Bar Charts (Stacked in 1 column) */}
                <div className="flex flex-col gap-6">
                    {/* Categories Donut */}
                    <div className="bg-white rounded-[20px] border border-gray-100 p-6 shadow-sm flex-1 min-h-[250px] flex flex-col">
                        <h3 className="text-base font-bold text-gray-900 mb-2">Shop Categories</h3>
                        <div className="flex-1 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={charts.shopCategoryDistribution}
                                        innerRadius="50%"
                                        outerRadius="75%"
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                        cx="50%"
                                        cy="45%"
                                    >
                                        {charts.shopCategoryDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip content={<CustomSimpleTooltip />} />
                                    <Legend 
                                        iconType="circle" 
                                        verticalAlign="bottom"
                                        align="center"
                                        wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} 
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Roles Bar Chart */}
                    <div className="bg-white rounded-[20px] border border-gray-100 p-6 shadow-sm flex-1 min-h-[220px] flex flex-col">
                        <h3 className="text-base font-bold text-gray-900 mb-4">User Base</h3>
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.userRoleDistribution} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#374151', fontWeight: 600 }} width={90} />
                                    <RechartsTooltip cursor={{ fill: '#f9fafb' }} content={<CustomSimpleTooltip />} />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24}>
                                        {charts.userRoleDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? "#8b5cf6" : "#3b82f6"} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Dashboard;
