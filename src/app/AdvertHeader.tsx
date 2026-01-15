import {
  Megaphone,
  ArrowRight,
  ArrowLeft,
  Languages,
  Code,
  GraduationCap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AdvertHeaderProps {
  message: string;
  ctaText?: string;
  ctaLink?: string;
}

const rotatingMessages = [
  {
    text: "Learn French & English with certified teachers",
    icon: Languages,
  },
  {
    text: "Programming courses designed for young minds",
    icon: Code,
  },
  {
    text: "Building confidence, skills, and academic excellence",
    icon: GraduationCap,
  },
];

const AdvertHeader: React.FC<AdvertHeaderProps> = ({
  message,
  ctaText,
  ctaLink,
}) => {
  const messages = [{ text: message, icon: Megaphone }, ...rotatingMessages];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [messages.length]);

  const Icon = messages[index].icon;

  return (
    <div className="w-full bg-gradient-to-r from-indigo-700 via-blue-600 to-sky-500 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">

        {/* LEFT: BACK + MESSAGE */}
        <div className="flex items-center gap-4">

          {/* BACK BUTTON */}
          <motion.button
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.history.back()}
            className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20 transition"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Back</span>
          </motion.button>

          {/* ROTATING MESSAGE */}
          <div className="relative h-6 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="flex items-center gap-2 text-sm sm:text-base font-medium"
              >
                <Icon size={18} className="opacity-90 shrink-0" />
                <span>{messages[index].text}</span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT: CTA */}
        {ctaText && ctaLink && (
          <motion.a
            href={ctaLink}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm sm:text-base font-semibold text-indigo-700 shadow hover:bg-indigo-50 transition"
          >
            <span>{ctaText}</span>
            <ArrowRight size={16} />
          </motion.a>
        )}
      </div>
    </div>
  );
};

export default AdvertHeader;
