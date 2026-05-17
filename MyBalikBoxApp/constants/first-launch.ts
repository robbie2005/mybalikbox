/** AsyncStorage key: set after user taps Get Started once. */
export const HAS_COMPLETED_FIRST_LAUNCH_KEY = 'mybalikbox.has_completed_first_launch';
/** Set when user explicitly creates or joins a box (not auth bootstrap alone). */
export const HAS_USER_BOX_KEY = 'mybalikbox.has_user_box';
/** Box UUID from create/join; used to resolve checklist + home widget. */
export const ACTIVE_BOX_ID_KEY = 'mybalikbox.active_box_id';
export const ACTIVE_BOX_TITLE_KEY = 'mybalikbox.active_box_title';
/** Join code from create-box flow (e.g. GF2026). */
export const ACTIVE_BOX_CODE_KEY = 'mybalikbox.active_box_code';
/** Optional caps from create flow; when absent, home uses defaults ($100 / 40kg). */
export const ACTIVE_BOX_BUDGET_USD_KEY = 'mybalikbox.active_box_budget_usd';
export const ACTIVE_BOX_WEIGHT_KG_KEY = 'mybalikbox.active_box_weight_kg';
