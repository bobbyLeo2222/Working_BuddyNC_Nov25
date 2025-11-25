import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authHeaderPattern = /^Bearer\s+(.+)$/i;

export default async function authenticate(req, res, next) {
  try {
    const { authorization } = req.headers || {};

    if (!authorization || !authHeaderPattern.test(authorization)) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const match = authorization.match(authHeaderPattern);
    const token = match?.[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('Missing JWT_SECRET environment variable');
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }

    const user = await User.findById(payload.sub).exec();
    if (!user) {
      return res.status(401).json({ message: 'Account not found.' });
    }

    req.user = user;
    req.token = token;
    return next();
  } catch (error) {
    return next(error);
  }
}
