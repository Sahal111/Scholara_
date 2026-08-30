import { useAuth } from "../../contexts/AuthContext";

export default function OperatorFooter() {
  const { school } = useAuth();
  const schoolName = school?.nama ?? "Scholara";

  return (
    <footer className="w-full py-10 px-8 flex flex-col md:flex-row justify-between items-center bg-white border-t border-[#bfc9c4]/30 mt-auto z-10 font-bold pb-24 md:pb-10 relative overflow-hidden islamic-pattern">
      <div className="absolute inset-0 bg-gradient-to-r from-[#00342b]/5 via-transparent to-[#006e2a]/5 pointer-events-none" />
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-2 md:gap-4">
        <span
          className="font-bold text-[#00342b] tracking-wide text-xs"
          style={{ letterSpacing: "0.2em" }}
        >
          © {new Date().getFullYear()} {schoolName}. All rights reserved.
        </span>
        <span className="hidden md:inline text-[#bfc9c4]">•</span>
        <span
          className="text-[#006e2a] font-medium italic text-sm"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Modern Islamic Excellence.
        </span>
      </div>
      <div className="relative z-10 flex gap-8 mt-4 md:mt-0">
        {["Privacy Policy", "Terms of Service", "Help Desk"].map((link) => (
          <a
            key={link}
            href="#"
            className="group flex items-center gap-1 text-[#3f4945] hover:text-[#006e2a] transition-all duration-300 hover:-translate-y-0.5 text-xs font-bold"
            style={{ letterSpacing: "0.15em" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#006e2a] opacity-0 group-hover:opacity-100 transition-opacity" />
            {link}
          </a>
        ))}
      </div>
    </footer>
  );
}
