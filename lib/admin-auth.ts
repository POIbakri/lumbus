import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';

export function checkAdminAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  const base64Credentials = authHeader.substring(6);
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || '';

  if (!adminPasswordHash) {
    console.warn('ADMIN_PASSWORD_HASH not set');
    return false;
  }

  if (username !== adminUsername) {
    return false;
  }

  return bcrypt.compareSync(password, adminPasswordHash);
}

export function requireAuth(req: NextRequest) {
  const isAuthenticated = checkAdminAuth(req);

  if (!isAuthenticated) {
    return new Response('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Lumbus Admin"',
      },
    });
  }

  return null; // Authenticated
}
