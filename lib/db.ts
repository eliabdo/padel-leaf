import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { loadEnvConfig } from "@next/env";
import * as schema from "./schema";

loadEnvConfig(process.cwd());

// #region agent log
fetch("http://127.0.0.1:7589/ingest/dca80672-932e-4ef8-bfcb-5f2627301044",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"e69d34"},body:JSON.stringify({sessionId:"e69d34",runId:"prebuild-sweep-1",hypothesisId:"H1",location:"lib/db.ts:5",message:"db module evaluation",data:{hasDatabaseUrl:Boolean(process.env.DATABASE_URL),nodeEnv:process.env.NODE_ENV},timestamp:Date.now()})}).catch(()=>{});
// #endregion

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add your Neon connection string to .env.local");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
export { schema };
