import { existsSync } from "node:fs";

// Load local secrets for database tests (CI provides real env vars instead).
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
