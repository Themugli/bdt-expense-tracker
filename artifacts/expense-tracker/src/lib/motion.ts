/** Shared spring ("twang") motion presets used across the app. */
export const springTransition = { type: 'spring', stiffness: 400, damping: 15 } as const;

/** Spread onto motion.button / motion.select so they physically bounce on hover and tap. */
export const bounce = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.9 },
  transition: springTransition,
} as const;

/** Smooth linear fade for modal backdrops (no bounce). */
export const overlayFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2, ease: 'linear' },
} as const;

/** Bouncy scale-drop for the modal card only. Opacity stays tween-based so it never oscillates. */
export const modalPop = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { ...springTransition, opacity: { duration: 0.15, ease: 'linear' } },
  style: { transformOrigin: 'center' },
} as const;
