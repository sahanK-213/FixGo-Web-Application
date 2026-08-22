import { FaLinkedinIn } from "react-icons/fa";

import sahanImg from "../../src/assets/sahan_kavinda.jpeg";
import sanduniImg from "../../src/assets/sanduni_jayawardhana.jpeg";
import sarangaImg from "../../src/assets/saranga_pradeep.jpeg";
import irushiImg from "../../src/assets/irushi_prabodhya.jpeg";

const teamData = [
  {
    name: "Sahan Kavinda",
    role: "Team Lead , Backend Developer",
    bio: "Leads FixGo with a vision to revolutionize automoive industry.",
    img: sahanImg,
  },
  {
    name: "Sanduni Jayawardena",
    role: "Frontend & Backend Developer",
    bio: "Ensures smooth operations and excellent support for our customers.",
    img: sanduniImg,
  },
  {
    name: "Saranga Pradeep",
    role: "Frontend & Backend Developer",
    bio: "Driving innovation and building reliable solutions for FixGo.",
    img: sarangaImg,
  },
  {
    name: "Irushi Prabodhya",
    role: "Frontend & Backend Developer",
    bio: "Focused on delivering exceptional customer experiences.",
    img: irushiImg,
  },
];

const TeamCard = ({ name, role, bio, img }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
    <img
      src={img}
      alt={name}
      className="w-20 h-20 rounded-full object-cover object-top border-4 border-green-100 shadow-sm mb-4"
    />
    <p className="font-bold text-gray-900 text-base">{name}</p>
    <p className="text-[#16a34a] text-xs font-semibold mt-0.5 mb-2">{role}</p>
    <p className="text-gray-400 text-xs leading-relaxed mb-4">{bio}</p>
    <a
      href="#"
      id={`linkedin-${name.replace(/\s+/g, "-").toLowerCase()}`}
      className="w-8 h-8 rounded-full bg-[#0077B5] hover:bg-[#006097] flex items-center justify-center text-white transition-colors"
    >
      <FaLinkedinIn size={13} />
    </a>
  </div>
);

const TeamSection = () => {
  return (
    <section className="max-w-6xl mx-auto px-4 pb-16">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Meet the FixGo Team</h2>
      <p className="text-gray-500 text-sm mb-7">
        We're a passionate team working to make vehicle care simple and reliable for everyone.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {teamData.map((member) => (
          <TeamCard key={member.name} {...member} />
        ))}
      </div>
    </section>
  );
};

export default TeamSection;
