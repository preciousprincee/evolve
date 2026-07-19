export const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export const staggerChildren = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export const messageBubbleIn = {
  hidden: { opacity: 0, y: 8, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25, ease: 'easeOut' } },
};

export const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const orbBreathe = {
  animate: {
    scale: [1, 1.06, 1],
    opacity: [0.8, 1, 0.8],
    transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
  },
};
