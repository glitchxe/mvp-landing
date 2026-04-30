import { motion, useAnimation, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1];

interface HeroBadgeProps {
  href?: string;
  text: string;
  icon?: React.ReactNode;
  endIcon?: React.ReactNode;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

const badgeVariants: Record<string, string> = {
  default: "bg-[#141414] hover:bg-[#1A1A1A] border-[#2A2A2A]",
  outline: "border-2 border-[#f03a28]/40 hover:bg-[#141414]",
  ghost: "hover:bg-[#141414]/50",
};

const sizeVariants: Record<string, string> = {
  sm: "px-3 py-1 text-xs gap-1.5",
  md: "px-4 py-1.5 text-sm gap-2",
  lg: "px-5 py-2 text-base gap-2.5",
};

const iconAnimationVariants: Variants = {
  initial: { rotate: 0 },
  hover: { rotate: -10 },
};

export default function HeroBadge({
  href,
  text,
  icon,
  endIcon,
  variant = "default",
  size = "md",
  className,
  onClick,
}: HeroBadgeProps) {
  const controls = useAnimation();

  const baseClassName = cn(
    "inline-flex items-center rounded-full border transition-colors text-[#E5E5E5]",
    badgeVariants[variant],
    sizeVariants[size],
    className
  );

  const inner = (
    <motion.div
      className={baseClassName}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease }}
      onHoverStart={() => controls.start("hover")}
      onHoverEnd={() => controls.start("initial")}
    >
      {icon && (
        <motion.div
          className="text-[#f03a28] transition-colors"
          variants={iconAnimationVariants}
          initial="initial"
          animate={controls}
          transition={{ type: "spring", stiffness: 300, damping: 10 }}
        >
          {icon}
        </motion.div>
      )}
      <span>{text}</span>
      {endIcon && <motion.div className="text-[#6B6B6B]">{endIcon}</motion.div>}
    </motion.div>
  );

  if (href) {
    return (
      <a href={href} className="group cursor-pointer">
        {inner}
      </a>
    );
  }

  return (
    <motion.button onClick={onClick} className="group cursor-pointer">
      {inner}
    </motion.button>
  );
}
