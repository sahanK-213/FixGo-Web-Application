import HeroSection from "./HeroSection";
import FAQSection from "./FAQSection";
import ContactInfo from "./ContactInfo";
import HelpResources from "./HelpResources";
import ReviewSection from "./ReviewSection";
import TeamSection from "./TeamSection";

const SupportPage = () => {
  return (
    <div className="bg-[#f7f8fa] min-h-screen">
      <HeroSection />
      <FAQSection />
      <ContactInfo />
      <HelpResources />
      <ReviewSection />
      <TeamSection />
    </div>
  );
};

export default SupportPage;
