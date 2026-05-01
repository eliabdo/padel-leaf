/**
 * Hash an admin password with bcrypt.
 *
 * Usage: npm run admin:hash -- "your-password-here"
 * Then paste the output into ADMIN_PASSWORD_HASH in .env.local
 */
import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error("Usage: npm run admin:hash -- 'your-password'");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
const b64  = Buffer.from(hash).toString("base64");
console.log("\nADMIN_PASSWORD_HASH=" + b64 + "\n");
console.log("Paste the line above into your .env.local file.");
console.log("(Stored as base64 to prevent dotenv from mangling the $ signs in the bcrypt hash.)");
