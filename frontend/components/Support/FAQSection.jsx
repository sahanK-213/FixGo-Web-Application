import { useState } from "react";
import { FaArrowRight } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";

const faqData = [
  {
    question: "How do I book a service?",
    answer: "You can book a service by finding a shop on our platform, selecting your preferred time slot, and confirming the booking. You'll receive a confirmation email with all the details.",
  },
  {
    question: "What if I'm not satisfied with the service?",
    answer: "We take quality seriously. If you're not satisfied, please contact us within 48 hours of the service. We'll work with the shop to resolve the issue or offer a refund where applicable.",
  },
  {
    question: "Can I cancel or reschedule my booking?",
    answer: "Yes, you can cancel or reschedule your booking up to 2 hours before the appointment time through your dashboard. Late cancellations may incur a small fee.",
  },
  {
    question: "How does roadside assistance work?",
    answer: "Our roadside assistance connects you with the nearest available mechanic in real time. Simply tap the Roadside Help button, share your location, and a technician will be dispatched to you.",
  },
  {
    question: "How do reviews and ratings work?",
    answer: "After each completed service, you can leave a star rating and written review for the shop. Reviews are verified and help other customers make informed decisions.",
  },
  {
    question: "How do I contact a service center?",
    answer: "You can contact any service center directly through their shop profile page. Click the 'Contact Shop' button to send them a message or call them directly.",
  },
  {
    question: "What areas do you serve?",
    answer: "FixGo currently operates across the Western Province of Sri Lanka, including Colombo, Gampaha, and Kalutara districts. We're rapidly expanding to other provinces.",
  },
];

const FAQItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border border-gray-200 rounded-xl transition-all duration-300 overflow-hidden ${open ? "shadow-md" : "shadow-sm"}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
        id={`faq-${question.replace(/\s+/g, "-").toLowerCase()}`}
      >
        <span className="font-medium text-gray-800 text-sm">{question}</span>
        <FontAwesomeIcon
          icon={open ? faChevronUp : faChevronDown}
          className={`text-xs transition-transform duration-300 ml-3 shrink-0 ${open ? "text-[#16a34a]" : "text-gray-400"}`}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-48 opacity-100" : "max-h-0 opacity-0"}`}>
        <p className="px-5 pb-4 text-gray-500 text-sm leading-relaxed border-t border-gray-100 pt-3">
          {answer}
        </p>
      </div>
    </div>
  );
};

const FAQSection = () => {
  const leftFaqs = faqData.filter((_, i) => i % 2 === 0);
  const rightFaqs = faqData.filter((_, i) => i % 2 !== 0);

  return (
    <section className="max-w-6xl mx-auto px-4 py-14">
      <div className="flex items-center justify-between mb-7">
        <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
        <a id="view-all-articles-link" href="#" className="text-[#16a34a] text-sm font-semibold hover:underline flex items-center gap-1">
          View all articles <FaArrowRight className="text-xs" />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-3">
          {leftFaqs.map((faq) => (
            <FAQItem key={faq.question} {...faq} />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {rightFaqs.map((faq) => (
            <FAQItem key={faq.question} {...faq} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
