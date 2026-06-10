// ─────────────────────────────────────────────────────────────────────────────
// components/ui/PageTransitionWrapper.tsx
// Wraps every page with a smooth Framer Motion fade+slide entry animation.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { motion } from 'framer-motion';

const PAGE_VARIANTS = {
  hidden: {
    opacity: 0,
    y: 8,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1], // custom easing: fast-out-slow-in
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

export function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={PAGE_VARIANTS}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="h-full"
    >
      {children}
    </motion.div>
  );
}