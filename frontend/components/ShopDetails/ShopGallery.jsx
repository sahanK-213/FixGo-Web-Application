import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faTimes } from "@fortawesome/free-solid-svg-icons";
import { UPLOADS_URL } from "../../src/services/api";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

// NEW: Upgraded SafeImage with Darker Backgrounds & Lightbox Support
export const SafeImage = ({ src, alt, className, isLightbox = false }) => {
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    // Dark grey for the grid, deep slate for the fullscreen Lightbox
    const bgClass = isLightbox ? "bg-slate-800 text-slate-500 w-full h-[60vh] rounded-2xl" : "bg-slate-200 text-slate-500 h-full w-full";
    // Strip out object-cover/contain so the fallback div doesn't act weird
    const cleanClassName = className ? className.replace('object-cover', '').replace('object-contain', '') : '';
    
    return (
      <div className={`flex flex-col items-center justify-center ${bgClass} ${cleanClassName}`}>
        <FontAwesomeIcon icon={faImage} className={`${isLightbox ? 'text-6xl mb-4' : 'text-3xl mb-2'} opacity-40`} />
        <span className={`${isLightbox ? 'text-sm' : 'text-[11px]'} font-bold uppercase tracking-wider`}>No Photo</span>
      </div>
    );
  }
  
  return (
    <img 
      src={src} 
      alt={alt} 
      className={className} 
      onError={() => setHasError(true)} 
    />
  );
};

export const ShopGallery = ({ validGallery }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  return (
    <>
      <div className="relative mb-8 rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-200">
        {validGallery && validGallery.length > 0 ? (
          <>
            {/* MOBILE: Swiper Carousel */}
            <div className="block md:hidden">
              <Swiper
                modules={[Pagination, Navigation]}
                pagination={{ clickable: true }}
                navigation={true}
                slidesPerView={1}
                onSlideChange={(swiper) => setCurrentImage(swiper.activeIndex)}
              >
                {validGallery.map((imgUrl, index) => (
                  <SwiperSlide key={index}>
                    <div className="h-[240px] w-full">
                      <SafeImage src={`${UPLOADS_URL}/${imgUrl.replace(/\\/g, '/')}`} alt={`Gallery ${index}`} className="h-full w-full object-cover" />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* DESKTOP: Premium Bento Grid Layout */}
            <div className="hidden md:block h-[260px] lg:h-[320px] w-full p-2 lg:p-3 bg-white">
              {validGallery.length === 1 && (
                <div onClick={() => openLightbox(0)} className="w-full h-full cursor-pointer">
                  <SafeImage src={`${UPLOADS_URL}/${validGallery[0].replace(/\\/g, '/')}`} alt="Shop View" className="w-full h-full object-cover rounded-xl transition-transform duration-500 hover:scale-[1.02]" />
                </div>
              )}

              {validGallery.length === 2 && (
                <div className="grid grid-cols-2 gap-3 h-full">
                  <div onClick={() => openLightbox(0)} className="h-full overflow-hidden rounded-xl cursor-pointer">
                    <SafeImage src={`${UPLOADS_URL}/${validGallery[0].replace(/\\/g, '/')}`} alt="Shop View" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                  </div>
                  <div onClick={() => openLightbox(1)} className="h-full overflow-hidden rounded-xl cursor-pointer">
                    <SafeImage src={`${UPLOADS_URL}/${validGallery[1].replace(/\\/g, '/')}`} alt="Shop View" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                  </div>
                </div>
              )}

              {validGallery.length === 3 && (
                <div className="grid grid-cols-3 gap-3 h-full">
                  <div onClick={() => openLightbox(0)} className="col-span-2 h-full overflow-hidden rounded-xl cursor-pointer">
                    <SafeImage src={`${UPLOADS_URL}/${validGallery[0].replace(/\\/g, '/')}`} alt="Shop View" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                  </div>
                  <div className="col-span-1 grid grid-rows-2 gap-3 h-full">
                    <div onClick={() => openLightbox(1)} className="h-full overflow-hidden rounded-xl cursor-pointer">
                      <SafeImage src={`${UPLOADS_URL}/${validGallery[1].replace(/\\/g, '/')}`} alt="Shop View" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                    </div>
                    <div onClick={() => openLightbox(2)} className="h-full overflow-hidden rounded-xl cursor-pointer">
                      <SafeImage src={`${UPLOADS_URL}/${validGallery[2].replace(/\\/g, '/')}`} alt="Shop View" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                    </div>
                  </div>
                </div>
              )}

              {validGallery.length === 4 && (
                <div className="grid grid-cols-5 grid-rows-2 gap-3 h-full">
                  <div onClick={() => openLightbox(0)} className="col-span-3 row-span-2 h-full overflow-hidden rounded-xl cursor-pointer">
                    <SafeImage src={`${UPLOADS_URL}/${validGallery[0].replace(/\\/g, '/')}`} alt="Shop View" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                  </div>
                  <div onClick={() => openLightbox(1)} className="col-span-1 row-span-1 h-full overflow-hidden rounded-xl cursor-pointer">
                    <SafeImage src={`${UPLOADS_URL}/${validGallery[1].replace(/\\/g, '/')}`} alt="Shop View" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                  </div>
                  <div onClick={() => openLightbox(2)} className="col-span-1 row-span-1 h-full overflow-hidden rounded-xl cursor-pointer">
                    <SafeImage src={`${UPLOADS_URL}/${validGallery[2].replace(/\\/g, '/')}`} alt="Shop View" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                  </div>
                  <div onClick={() => openLightbox(3)} className="col-span-2 row-span-1 h-full overflow-hidden rounded-xl cursor-pointer">
                    <SafeImage src={`${UPLOADS_URL}/${validGallery[3].replace(/\\/g, '/')}`} alt="Shop View" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                  </div>
                </div>
              )}

              {validGallery.length >= 5 && (
                <div className="grid grid-cols-5 grid-rows-2 gap-3 h-full">
                  <div onClick={() => openLightbox(0)} className="col-span-3 row-span-2 h-full relative group overflow-hidden rounded-xl cursor-pointer">
                    <SafeImage src={`${UPLOADS_URL}/${validGallery[0].replace(/\\/g, '/')}`} alt="Main Shop" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  
                  <div onClick={() => openLightbox(1)} className="col-span-1 row-span-1 h-full relative group overflow-hidden rounded-xl cursor-pointer">
                    <SafeImage src={`${UPLOADS_URL}/${validGallery[1].replace(/\\/g, '/')}`} alt="Shop View" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  
                  <div onClick={() => openLightbox(2)} className="col-span-1 row-span-1 h-full relative group overflow-hidden rounded-xl cursor-pointer">
                    <SafeImage src={`${UPLOADS_URL}/${validGallery[2].replace(/\\/g, '/')}`} alt="Shop View" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  
                  <div onClick={() => openLightbox(3)} className="col-span-1 row-span-1 h-full relative group overflow-hidden rounded-xl cursor-pointer">
                    <SafeImage src={`${UPLOADS_URL}/${validGallery[3].replace(/\\/g, '/')}`} alt="Shop View" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>

                  <div onClick={() => openLightbox(4)} className="col-span-1 row-span-1 h-full relative group overflow-hidden rounded-xl cursor-pointer">
                    <SafeImage src={`${UPLOADS_URL}/${validGallery[4].replace(/\\/g, '/')}`} alt="Shop View" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    {validGallery.length > 5 && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white transition-colors group-hover:bg-black/60 backdrop-blur-[2px]">
                        <span className="text-2xl font-bold">+{validGallery.length - 5}</span>
                        <span className="text-sm font-medium tracking-wide">View all photos</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* DYNAMIC EMPTY STATE: When a shop has 0 images in the database */
          <div className="h-[240px] lg:h-[300px] w-full flex flex-col items-center justify-center bg-slate-50 rounded-xl border-2 border-slate-200 border-dashed text-slate-400 transition-all hover:bg-slate-100 m-2" style={{ width: 'calc(100% - 16px)' }}>
            <FontAwesomeIcon icon={faImage} className="text-4xl sm:text-5xl mb-3 opacity-30 text-slate-400" />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">No Gallery Images</span>
            <span className="text-[11px] sm:text-xs font-medium mt-1 text-slate-400">This shop hasn't uploaded any photos yet.</span>
          </div>
        )}
      </div>

      {isLightboxOpen && validGallery.length > 0 && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute top-0 left-0 right-0 z-[101] flex items-center justify-between p-4 sm:p-6 text-white bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
            <div className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-sm font-semibold tracking-wide pointer-events-auto">
              {lightboxIndex + 1} / {validGallery.length}
            </div>
            <button 
              onClick={() => setIsLightboxOpen(false)} 
              className="p-2 w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors pointer-events-auto"
            >
              <FontAwesomeIcon icon={faTimes} className="text-2xl" />
            </button>
          </div>
          <div className="flex-1 w-full h-full flex items-center justify-center">
            <Swiper
              modules={[Navigation, Pagination]}
              navigation={true}
              initialSlide={lightboxIndex}
              onSlideChange={(swiper) => setLightboxIndex(swiper.activeIndex)}
              className="w-full h-full max-w-6xl mx-auto"
            >
              {validGallery.map((imgUrl, idx) => (
                <SwiperSlide key={idx} className="flex items-center justify-center p-4 sm:p-12">
                  <SafeImage 
                    src={`${UPLOADS_URL}/${imgUrl.replace(/\\/g, '/')}`} 
                    alt={`Fullscreen Gallery ${idx}`} 
                    className="max-h-full max-w-full object-contain drop-shadow-2xl select-none rounded-xl"
                    isLightbox={true}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      )}
    </>
  );
};
