"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [0.5, 0]);

  return (
    <main>
      <div
        className={cn(
          "relative flex flex-col h-[100vh] items-center justify-center bg-zinc-50 dark:bg-background text-slate-950 transition-bg",
          className
        )}
        {...props}
      >
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            style={{ opacity }}
            className={cn(
              `
            [--white-gradient:repeating-linear-gradient(100deg,var(--color-white)_0%,var(--color-white)_7%,var(--color-transparent)_10%,var(--color-transparent)_12%,var(--color-white)_16%)]
            [--dark-gradient:repeating-linear-gradient(100deg,var(--color-black)_0%,var(--color-black)_7%,var(--color-transparent)_10%,var(--color-transparent)_12%,var(--color-black)_16%)]
            [--aurora:repeating-linear-gradient(100deg,var(--color-aurora-1)_10%,var(--color-aurora-2)_15%,var(--color-aurora-3)_20%,var(--color-aurora-4)_25%,var(--color-aurora-5)_30%)]
            [background-image:var(--white-gradient),var(--aurora)]
            dark:[background-image:var(--dark-gradient),var(--aurora)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            filter blur-[10px] invert dark:invert-0
            after:content-[""] after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)] 
            after:dark:[background-image:var(--dark-gradient),var(--aurora)]
            after:[background-size:200%,_100%] 
            after:animate-aurora after:[background-attachment:fixed] after:mix-blend-difference
            pointer-events-none
            absolute -inset-[10px] will-change-transform`,

              showRadialGradient &&
                `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--color-transparent)_70%)]`
            )}
          ></motion.div>
        </div>
        {children}
      </div>
    </main>
  );
};
