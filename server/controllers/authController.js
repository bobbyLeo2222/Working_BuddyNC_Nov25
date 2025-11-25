import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { generateNumericCode } from '../utils/generateCode.js';
import { sendEmail } from '../utils/sendEmail.js';

const JWT_EXPIRES_IN = '7d';

const hashVerificationCode = (code) =>
  crypto.createHash('sha256').update(code).digest('hex');

const issueToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('Missing JWT_SECRET environment variable');
  }

  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

const sendVerificationEmail = async (user, code) => {
  const verifyWindowMinutes = Number(process.env.EMAIL_CODE_TTL_MINUTES || 15);

  const subject = 'Verify your BuddyNC account';
  const text = [
    `Hi${user.name ? ` ${user.name}` : ''},`,
    '',
    'Welcome to BuddyNC! Use the verification code below to activate your account:',
    '',
    `Verification code: ${code}`,
    '',
    `This code is valid for ${verifyWindowMinutes} minutes.`,
    '',
    'If you did not request this, please ignore this email.'
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2933;">
      <h2 style="margin-bottom: 0.5rem;">Confirm your BuddyNC Account</h2>
      <p>Hi${user.name ? ` ${user.name}` : ''},</p>
      <p>Thanks for signing up! Enter the verification code below to activate your account:</p>
      <p style="font-size: 1.75rem; font-weight: bold; letter-spacing: 0.3rem; color: #2563eb;">${code}</p>
      <p>This code will expire in ${verifyWindowMinutes} minutes.</p>
      <p style="margin-top: 2rem; font-size: 0.875rem; color: #4b5563;">
        If you didn't create an account, you can safely ignore this email.
      </p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject,
    text,
    html
  });
};

const createVerificationChallenge = () => {
  const code = generateNumericCode(6);
  const hash = hashVerificationCode(code);
  const ttlMinutes = Number(process.env.EMAIL_CODE_TTL_MINUTES || 15);

  return {
    code,
    hash,
    expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000)
  };
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Invalid payload.' });
    }

    const normalisedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalisedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const { code, hash, expiresAt } = createVerificationChallenge();

    const user = await User.create({
      name: name?.trim(),
      email: normalisedEmail,
      passwordHash,
      verificationCodeHash: hash,
      verificationCodeExpiresAt: expiresAt
    });

    await sendVerificationEmail(user, code);

    res.status(201).json({
      message: 'Registration successful. Check your email for the verification code.',
      user: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body || {};

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required.' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    if (!user.verificationCodeHash || !user.verificationCodeExpiresAt) {
      return res.status(400).json({ message: 'No verification code found. Please request a new code.' });
    }

    if (user.verificationCodeExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: 'Verification code has expired. Request a new code.' });
    }

    const submittedHash = hashVerificationCode(code.trim());
    if (submittedHash !== user.verificationCodeHash) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    user.isVerified = true;
    user.verificationCodeHash = null;
    user.verificationCodeExpiresAt = null;
    await user.save();

    const token = issueToken(user);

    res.json({
      message: 'Email verified successfully.',
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }

    const token = issueToken(user);

    res.json({
      message: 'Login successful.',
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

export const resendCode = async (req, res, next) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Account is already verified.' });
    }

    const { code, hash, expiresAt } = createVerificationChallenge();
    user.verificationCodeHash = hash;
    user.verificationCodeExpiresAt = expiresAt;
    await user.save();

    await sendVerificationEmail(user, code);

    res.json({ message: 'A new verification code has been sent to your email.' });
  } catch (error) {
    next(error);
  }
};
