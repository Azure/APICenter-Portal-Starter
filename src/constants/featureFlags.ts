/**
 * Feature flags for gating incomplete or preview functionality.
 * Flip to `true` when the corresponding backend support is available.
 */

/** Show evaluation score badges on homepage API/skill cards.
 *  Requires the list endpoint to return evaluation summary data. */
export const ENABLE_LIST_EVAL_BADGES = false;
