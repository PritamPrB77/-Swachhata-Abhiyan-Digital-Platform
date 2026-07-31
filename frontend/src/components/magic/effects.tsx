import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function ShimmerButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "relative inline-flex h-11 items-center justify-center overflow-hidden rounded-md px-6 font-medium text-primary-foreground",
        "bg-[linear-gradient(110deg,#1b6b4a,45%,#3d9b6f,55%,#1b6b4a)] bg-[length:200%_100%] animate-shimmer shadow-md",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function GradientText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "bg-gradient-to-r from-emerald-800 via-teal-600 to-amber-600 bg-clip-text text-transparent",
        className,
      )}
    >
      {children}
    </span>
  );
}
