import crypto from 'crypto';

export const hashPassword = (plain: string): string => {
  const salt = process.env.PASSWORD_SALT || 'twcrm';
  return crypto.createHash('sha256').update(`${plain}:${salt}`).digest('hex');
};
