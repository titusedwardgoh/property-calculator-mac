/** Public site header bar (`Header` + logged-in overlay on mobile). */
export const PUBLIC_HEADER_GLASS_STYLE = {
  background:
    'linear-gradient(180deg, rgba(255, 252, 250, 0.72) 0%, rgba(255, 248, 245, 0.65) 100%)',
  backdropFilter: 'blur(20px) saturate(125%)',
  WebkitBackdropFilter: 'blur(20px) saturate(125%)',
  border: '1px solid rgba(255, 255, 255, 0.25)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow:
    '0 4px 24px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
};

/**
 * @deprecated Use PUBLIC_HEADER_GLASS_STYLE — kept for any legacy imports.
 */
export const LOGGED_IN_HEADER_GLASS_STYLE = PUBLIC_HEADER_GLASS_STYLE;

/** Fixed menu/backdrop top offset — matches logged-in header height per breakpoint. */
export const MOBILE_HEADER_MENU_TOP_CLASS = 'top-[60px] sm:top-[68px] md:top-20';

/**
 * Margin below fixed logged-in header so page bg shows through glass header
 * (not green accent). Mobile: py-3 + h-9 ≈ 60px. Desktop: sm:py-4 + h-12 = 80px.
 */
export const LOGGED_IN_HEADER_CLEARANCE_MARGIN_CLASS = 'max-md:mt-15 md:mt-20';

/** @deprecated Use LOGGED_IN_HEADER_CLEARANCE_MARGIN_CLASS */
export const MOBILE_HEADER_CLEARANCE_MARGIN_CLASS = LOGGED_IN_HEADER_CLEARANCE_MARGIN_CLASS;

/** Mobile full-screen menu drawer background (public + logged-in overlays). */
export const MOBILE_MENU_OVERLAY_STYLE = {
  background: `
    radial-gradient(ellipse 92% 68% at 12% 26%, rgba(67, 151, 117, 0.06), transparent 74%),
    radial-gradient(ellipse 82% 60% at 82% 24%, rgba(226, 149, 120, 0.06), transparent 76%),
    radial-gradient(ellipse 78% 58% at 76% 78%, rgba(67, 151, 117, 0.04), transparent 78%),
    linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.96) 70%, rgba(248,255,241,0.95) 100%)
  `,
};

/**
 * Same recipe as the header, slightly whiter fill; visibility on white cards comes mainly from a defined border + light shadow.
 */
export const MOBILE_MAP_FAB_GLASS_STYLE = {
  background: 'rgba(255, 255, 255, 0.38)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '2px solid rgba(0, 24, 86, 0.18)',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.55)',
};
