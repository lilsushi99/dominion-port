// backend/src/scripts/create-admin.ts — CLI script to create an admin account
import readline from 'readline';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import { env } from '../config/env';

async function main() {
  console.log('==============================================');
  console.log('  Dominion Portfolio — Create Admin Account   ');
  console.log('==============================================\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  const linesIterator = rl[Symbol.asyncIterator]();

  async function ask(question: string): Promise<string> {
    process.stdout.write(question);
    const next = await linesIterator.next();
    if (next.done) return '';
    return (next.value || '').trim();
  }

  try {
    const email = await ask('Admin Email: ');
    if (!email || !email.includes('@')) {
      console.error('\n[ERROR] A valid email address is required.');
      rl.close();
      process.exit(1);
    }

    const username = await ask('Admin Username: ');
    if (!username || username.length < 3) {
      console.error('\n[ERROR] Username must be at least 3 characters long.');
      rl.close();
      process.exit(1);
    }

    const password = await ask('Password: ');
    if (!password || password.length < 8) {
      console.error('\n[ERROR] Password must be at least 8 characters long.');
      rl.close();
      process.exit(1);
    }

    const confirmPassword = await ask('Confirm Password: ');
    if (password !== confirmPassword) {
      console.error('\n[ERROR] Passwords do not match.');
      rl.close();
      process.exit(1);
    }

    rl.close();

    console.log('\nHashing password securely (bcrypt salt rounds = 12)...');
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    console.log(`Connecting to database at ${env.DB_HOST}:${env.DB_PORT}...`);
    const db = await mysql.createConnection({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      charset: 'utf8mb4'
    });

    const [existing] = await db.query<any[]>(
      'SELECT id FROM admin_users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existing && existing.length > 0) {
      console.error(`[ERROR] An admin user with email '${email}' or username '${username}' already exists.`);
      await db.end();
      process.exit(1);
    }

    await db.query(
      'INSERT INTO admin_users (email, username, password_hash) VALUES (?, ?, ?)',
      [email, username, passwordHash]
    );

    console.log(`\n[SUCCESS] Admin user '${username}' <${email}> created successfully!`);
    console.log('You can now log in at /admin/login using these credentials.');
    await db.end();
    process.exit(0);
  } catch (err) {
    rl.close();
    console.error('\n[FATAL] Failed to create admin user:', err);
    process.exit(1);
  }
}

main();
