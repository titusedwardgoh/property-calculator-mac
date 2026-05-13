/**
 * “Liquid glass” for the logged-in header bar (`LoggedInHeaderOverlay`).
 */
export const LOGGED_IN_HEADER_GLASS_STYLE = {
  background: 'rgba(255, 255, 255, 0.15)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.25)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
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
