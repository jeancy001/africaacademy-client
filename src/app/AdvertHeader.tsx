import { Megaphone, ArrowRight } from "lucide-react";

interface AdvertHeaderProps {
  message: string;
  ctaText?: string;
  ctaLink?: string;
}

const AdvertHeader: React.FC<AdvertHeaderProps> = ({
  message,
  ctaText,
  ctaLink,
}) => {
  return (
    <div className="w-full bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
        
        {/* MESSAGE */}
        <div className="flex items-center gap-2 text-sm sm:text-base font-medium text-center sm:text-left">
          <Megaphone size={18} className="shrink-0" />
          <span>{message}</span>
        </div>

        {/* CTA */}
        {ctaText && ctaLink && (
          <a
            href={ctaLink}
            className="flex items-center gap-1 text-sm sm:text-base font-semibold underline underline-offset-4 hover:text-indigo-100 transition"
          >
            {ctaText}
            <ArrowRight size={16} />
          </a>
        )}
      </div>
    </div>
  );
};

export default AdvertHeader;
