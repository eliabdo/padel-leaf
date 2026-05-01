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
console.log("\nADMIN_PASSWORD_HASH=" + hash + "\n");
console.log("Paste the line above into your .env.local file.");
