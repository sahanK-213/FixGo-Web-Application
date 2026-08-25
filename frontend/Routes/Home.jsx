import { useNavigate, useLocation } from 'react-router-dom';
import { QuickSearchHub } from '../components/Home/QuickSearchHub';
import { NavBar } from '../components/NavBar'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBicycle, faSearch, faCar, faTruck, faWarehouse, faTriangleExclamation, faLocationDot, faUserTie, faArrowRight, faWrench, faRocket, faLocationCrosshairs } from "@fortawesome/free-solid-svg-icons";
import Sign from "../components/SignIn"
import { useState, useEffect } from 'react';
import car from "../src/assets/car.avif"
import serviceCenter from "../src/assets/service.jpg"
import { Footer } from "../components/footer"
import Customer from "../components/Registration/Customer";
import ShopOwner from "../components/Registration/ShopOwner"
import LandingImage from "../components/Home/LandingImage"
import About from '../components/Home/About';

function Home() {

    const [showSignIn, setShowSignIn] = useState(false);
    const location = useLocation();

    useEffect(() => {
        if (location.state?.scrollToRegister) {
            // Slight delay to allow DOM to render and ScrollToTop to finish
            setTimeout(() => {
                document.getElementById("register")?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        }
    }, [location]);

    return (

        <div>
            <NavBar />
            <main>

                <LandingImage />

                {/* THE NEW, CLEAN COMPONENT */}
                <QuickSearchHub onRequireAuth={() => setShowSignIn(true)} />

                {/* PROMO CARDS SECTION */}
                <section className="mt-10 px-4 md:px-8" id='register' >
                    <div className="w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">

                        <Customer />

                        <ShopOwner />
                    </div>
                </section>
                <About />
            </main>

            <Footer />

            {/* This ensures mock auth popup still works */}
            {showSignIn && <Sign />}

        </div>
    )
}

export default Home