/** Shared spring ("twang") motion presets used across the app. */
export const springTransition = { type: 'spring', stiffness: 400, damping: 15 } as const;

/** Spread onto motion.button / motion.select so they physically bounce on hover and tap. */
export const bounce = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.9 },
  transition: springTransition,
} as const;

/** Backdrop fade for modal overlays. */
export const overlayFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} as const;

/** Bouncy scale-drop for modal panels. */
export const modalPop = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
  transition: springTransition,
} as const;
