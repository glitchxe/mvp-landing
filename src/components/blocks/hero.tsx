import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import HeroBadge from "@/components/ui/hero-badge";

const ease = [0.16, 1, 0.3, 1];

interface HeroContentProps {
  title: string;
  titleHighlight?: string;
  description: string;
  subtitle?: string;
  primaryAction?: { href: string; text: string; icon?: React.ReactNode };
  secondaryAction?: { href: string; text: string; icon?: React.ReactNode };
}

function HeroContent({ title, titleHighlight, description, subtitle, primaryAction, secondaryAction }: HeroContentProps) {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col gap-3">
        <motion.h1
          className="font-heading text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl leading-[1.0] text-[#E5E5E5]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease }}
        >
          {title}
        </motion.h1>
        {titleHighlight && (
          <motion.p
            className="font-heading text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl leading-[1.0] text-[#C9A84C]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8, ease }}
          >
            {titleHighlight}
          </motion.p>
        )}
      </div>
      <motion.p
        className="max-w-[42rem] leading-relaxed text-[#999] sm:text-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8, ease }}
      >
        {description}
      </motion.p>
      <motion.div
        className="flex flex-col sm:flex-row gap-4 pt-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease }}
      >
        {primaryAction && (
          <a
            href={primaryAction.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#C9A84C] text-[#0D0D0D] font-bold text-base hover:bg-[#D4B45C] transition-colors cursor-pointer w-full sm:w-auto"
            )}
          >
            {primaryAction.icon}
            {primaryAction.text}
          </a>
        )}
        {secondaryAction && (
          <a
            href={secondaryAction.href}
            className={cn(
              "inline-flex items-center justify-center gap-2 px-8 py-4 border border-[#2A2A2A] text-[#E5E5E5] font-semibold text-base hover:border-[#C9A84C] transition-colors cursor-pointer w-full sm:w-auto"
            )}
          >
            {secondaryAction.icon}
            {secondaryAction.text}
          </a>
        )}
      </motion.div>
      {subtitle && (
        <motion.p
          className="text-sm text-[#777] font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.8, ease }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}

interface HeroProps {
  pill?: {
    href?: string;
    text: string;
    icon?: React.ReactNode;
    endIcon?: React.ReactNode;
    variant?: "default" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
    className?: string;
  };
  content: HeroContentProps;
  preview?: React.ReactNode;
}

export function Hero({ pill, content, preview }: HeroProps) {
  return (
    <div className="relative overflow-hidden">
      <div className="flex min-h-[calc(100vh-72px)] flex-col lg:flex-row items-center py-16 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto gap-12">
        <div className={`flex flex-col gap-6 w-full ${preview ? 'lg:max-w-2xl' : ''}`}>
          {pill && <HeroBadge {...pill} />}
          <HeroContent {...content} />
        </div>
        {preview && (
          <div className="w-full lg:flex-1 lg:pl-8">
            {preview}
          </div>
        )}
      </div>
    </div>
  );
}
