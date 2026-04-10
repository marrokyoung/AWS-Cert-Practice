/**
 * API client boundary.
 *
 * All frontend-to-backend traffic goes through this module.
 * No ad-hoc fetch calls should exist in UI components.
 */

export {
  ApiClientError,
  getHealth,
  getVersion,
  getConfig,
  createGuestSession,
} from "./client";
