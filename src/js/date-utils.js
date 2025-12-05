/**
 * DateUtils - Backward compatibility layer for centralized utilities
 * 
 * This file maintains backward compatibility by re-exporting the centralized
 * DateUtils from core/utils.js. All new code should import directly from core/utils.js.
 */

import { DateUtils } from './core/utils.js';

// Re-export the centralized DateUtils as default for backward compatibility
export default DateUtils;
