import { FaWrench, FaClock } from "react-icons/fa";

export const ShopServices = ({ services }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-slate-900 m-0">Our Services</h2>
      </div>
      
      {services && services.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {services.map((service, index) => (
            <div key={index} className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-green-300 hover:shadow-md">
              {/* Top Section: Icon, Name & Category */}
              <div>
                <div className="flex items-start gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-50 border border-green-100/60 mt-0.5">
                    <FaWrench className="text-xs text-green-600" />
                  </div>
                  
                  <div className="flex flex-col min-w-0 flex-1">
                    {service.category && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded w-fit mb-1 border border-green-100">
                        {service.category}
                      </span>
                    )}
                    <h3 className="text-[14px] leading-snug font-bold text-slate-900 break-words m-0">
                      {service.name}
                    </h3>
                  </div>
                </div>

                {/* Starting Price Banner */}
                <div className="mt-2">
                  <span className="text-xs font-extrabold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-md inline-block">
                    from {service.price}
                  </span>
                </div>
              </div>

              {/* Bottom Section: Duration */}
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <FaClock className="text-slate-400 text-xs shrink-0" />
                <span>{service.duration}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
          <FaWrench className="text-2xl text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700 m-0">No Services Listed Yet</p>
          <p className="text-xs text-slate-400 mt-1 m-0">This workshop has not added specific services to their menu yet.</p>
        </div>
      )}
    </div>
  );
};
