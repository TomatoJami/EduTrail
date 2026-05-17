import { vi } from "vitest";

vi.stubEnv("NODE_ENV", "test");
vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
