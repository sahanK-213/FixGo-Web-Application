import { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import image1 from '../../src/assets/image1.jpg';
import image2 from '../../src/assets/image2.jpg';
import image3 from '../../src/assets/image3.jpg';
import image4 from '../../src/assets/image4.jpg';

const slides = [
    {
        image: image2,
        title: (
            <>
                Find Trusted <br />
                Vehicle <span className="text-[#10b981] md:text-[#16a34a]">Repair Shops</span> <br />
                Near You
            </>
        ),
        subtitle: "Search verified garages, compare ratings, and book services instantly."
    },
    {
        image: image3,
        title: (
            <>
                Professional <br />
                Car <span className="text-[#10b981] md:text-[#16a34a]">Diagnostics</span> & <br />
                Maintenance
            </>
        ),
        subtitle: "Connect with certified auto experts to keep your vehicle running smoothly."
    },
    {
        image: image1,
        title: (
            <>
                Transparent Pricing <br />
                & <span className="text-[#10b981] md:text-[#16a34a]">Quality Service</span> <br />
                Guaranteed
            </>
        ),
        subtitle: "Get upfront quotes, read authentic customer reviews, and enjoy peace of mind."
    },
    {
        image: image4,
        title: (
            <>
                Quick Service <br />
                When You Need It <span className="text-[#10b981] md:text-[#16a34a]">Most</span>
            </>
        ),
        subtitle: "Find emergency towing, roadside assistance, and urgent repairs instantly."
    }
];

const LandingImage = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [resetTrigger, setResetTrigger] = useState(0);

    const SLIDE_DURATION = 6000; // 6 seconds

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, SLIDE_DURATION);

        return () => clearInterval(interval);
    }, [resetTrigger]);

    const nextSlide = (e) => {
        e.stopPropagation();
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setResetTrigger((prev) => prev + 1);
    };

    const prevSlide = (e) => {
        e.stopPropagation();
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
        setResetTrigger((prev) => prev + 1);
    };

    return (
        <div 
            className="relative min-h-[75vh] flex items-center justify-start py-20 px-6 md:px-16 lg:px-24 overflow-hidden group select-none"
        >
            {/* Background Images Cross-Fade */}
            {slides.map((slide, index) => (
                <img
                    key={index}
                    src={slide.image}
                    alt=""
                    className={`absolute top-0 left-0 w-full h-full object-cover object-center ${index === currentSlide ? 'z-10' : 'z-0'}`}
                    style={{
                        transform: index === currentSlide ? 'scale(1.05) rotate(0.02deg) translateZ(0)' : 'scale(1) rotate(0.02deg) translateZ(0)',
                        opacity: index === currentSlide ? 1 : 0,
                        pointerEvents: 'none',
                        transition: 'opacity 1000ms ease-in-out, transform 6000ms ease-out',
                        willChange: 'transform, opacity',
                        WebkitBackfaceVisibility: 'hidden',
                        backfaceVisibility: 'hidden',
                        transformOrigin: 'center center'
                    }}
                />
            ))}<div className="absolute inset-0 z-10 w-full h-full bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>

            {/* Content Container */}
            <div className="relative z-20 w-full max-w-2xl">
                {slides.map((slide, index) => {
                    const isActive = index === currentSlide;
                    return (
                        <div
                            key={index}
                            className={`transition-all duration-1000 ease-in-out ${
                                isActive 
                                    ? "relative opacity-100 pointer-events-auto" 
                                    : "absolute top-0 left-0 opacity-0 pointer-events-none"
                            } w-full`}
                        >
                            {/* Main Title Heading */}
                            <h1
                                className="text-4xl md:text-5xl lg:text-6xl text-white font-mono font-extrabold tracking-tight leading-tight text-left transition-all duration-1000 ease-out"
                                style={{
                                    transform: isActive ? "translateY(0)" : "translateY(24px)",
                                    opacity: isActive ? 1 : 0,
                                    transitionDelay: isActive ? "200ms" : "0ms"
                                }}
                            >
                                {slide.title}
                            </h1>

                            {/* Subtitle / Description */}
                            <p
                                className="text-sm md:text-base lg:text-lg text-gray-200 font-mono mt-6 text-left max-w-lg leading-relaxed transition-all duration-1000 ease-out"
                                style={{
                                    transform: isActive ? "translateY(0)" : "translateY(24px)",
                                    opacity: isActive ? 1 : 0,
                                    transitionDelay: isActive ? "450ms" : "0ms"
                                }}
                            >
                                {slide.subtitle}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 p-3 rounded-full bg-black/40 hover:bg-[#10b981] text-white backdrop-blur-sm transition-all duration-300 hover:scale-110 md:left-8 cursor-pointer border border-white/10 shadow-lg"
                aria-label="Previous slide"
            >
                <FaChevronLeft className="w-5 h-5" />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 p-3 rounded-full bg-black/40 hover:bg-[#10b981] text-white backdrop-blur-sm transition-all duration-300 hover:scale-110 md:right-8 cursor-pointer border border-white/10 shadow-lg"
                aria-label="Next slide"
            >
                <FaChevronRight className="w-5 h-5" />
            </button>
        </div>
    );
};

export default LandingImage;