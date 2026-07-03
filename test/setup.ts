// Load .env so integration tests that reach the DB see DATABASE_URL. Pure
// unit tests don't depend on this; it's harmless for them.
import "dotenv/config";
