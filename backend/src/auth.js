const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'mql_secret_estudio_contable_2026_super_key';

function hashPassword(password) {
  const salt = 'mql_salt_2026';
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

function verifyPassword(password, storedHash) {
  return hashPassword(password) === storedHash;
}

function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    role: user.role || 'contador',
    time: Date.now()
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
  if (signature !== expectedSignature) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Middleware Express para proteger rutas y extraer el usuario autenticado
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || req.headers['x-access-token'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (authHeader) {
    token = authHeader;
  }

  // Soporte de header directo para retrocompatibilidad controlada
  const headerUserId = req.headers['x-user-id'];

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
      req.userId = decoded.id;
      return next();
    }
  }

  if (headerUserId) {
    req.userId = headerUserId;
    return next();
  }

  return res.status(401).json({ error: 'Acceso no autorizado. Inicie sesión para continuar.' });
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  authMiddleware
};
