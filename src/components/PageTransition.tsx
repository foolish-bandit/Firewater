import { type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useNavigationDirection } from '../hooks/useNavigationDirection';

export default function PageTransition({ children }: { children: ReactNode }) {
  const direction = useNavigationDirection();

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: direction === 'forward' ? '8%' : '-4%',
      }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}
