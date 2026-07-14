import { injectable, inject } from "tsyringe";

// Re-export tsyringe decorators for consistent imports across the app
// Instead of importing from tsyringe directly everywhere, import from here
export { injectable as Injectable, inject as Inject };