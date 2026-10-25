import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password with salted bcrypt
 */
export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

/**
 * Check if a stored string is already a valid bcrypt hash
 */
export function isBcryptHash(value?: string | null): boolean {
  if (!value) return false;
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
}

/**
 * Verify a candidate password against a stored password or hash.
 * If the stored password is plain-text and matches, flags needsRehash=true
 * so the system can transparently upgrade it to a bcrypt hash.
 */
export async function verifyPassword(
  candidate: string,
  stored?: string | null
): Promise<{ isValid: boolean; needsRehash: boolean }> {
  if (!stored || !candidate) {
    return { isValid: false, needsRehash: false };
  }

  if (isBcryptHash(stored)) {
    const isValid = await bcrypt.compare(candidate, stored);
    return { isValid, needsRehash: false };
  }

  // Fallback for legacy / initial plain-text entries
  const isValid = candidate === stored;
  return {
    isValid,
    needsRehash: isValid, // Upgrade to bcrypt hash upon successful match
  };
}
