/* Generate a bcrypt hash for the admin password.
 *
 *   npm run hash:password -- 'my-super-secret'
 *
 * Copy the printed hash into ADMIN_PASSWORD_HASH in your .env. The plaintext
 * password is never stored anywhere.
 */
import bcrypt from 'bcryptjs';

async function main() {
  const password = process.argv[2];
  if (!password) {
    console.error('Usage: npm run hash:password -- <password>');
    process.exit(1);
  }
  if (password.length < 10) {
    console.error('Refusing to hash: choose a password of at least 10 characters.');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);
  console.log('\nADMIN_PASSWORD_HASH=' + hash + '\n');
}

main();
