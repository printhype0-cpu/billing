import jwt from 'jsonwebtoken';
import type { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';

const secret: Secret = process.env.JWT_SECRET || 'dev-secret';
const expires = process.env.JWT_EXPIRES || '1h';

export function sign(payload: Record<string, unknown>): string {
  const opts: SignOptions = { expiresIn: expires as unknown as SignOptions['expiresIn'] };
  return jwt.sign(payload, secret, opts);
}

export function verify(token: string): Record<string, unknown> | null {
  try {
    const v = jwt.verify(token, secret);
    if (typeof v === 'string') return { sub: v };
    return v as JwtPayload;
  } catch {
    return null;
  }
}
