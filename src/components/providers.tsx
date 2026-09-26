import { MotionConfig } from "motion/react";
import { SmoothScroll } from "@/components/smooth-scroll";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </SmoothScroll>
  );
}
