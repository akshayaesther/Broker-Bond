const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Broker = require('../models/Broker');
const FamilyPortalSession = require('../models/FamilyPortalSession');
const Candidate = require('../models/Candidate');
const Match = require('../models/Match');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

exports.registerBroker = async (req, res) => {
  try {
    const { name, email, password, phone, agencyName } = req.body;
    const normalizedName = typeof name === 'string' ? name.trim() : '';
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedName) {
      return res.status(400).json({ message: 'Full name is required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Enter a valid email address' });
    }
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await Broker.findOne({ email: normalizedEmail });
    if (existing) return res.status(400).json({ message: 'Broker already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const broker = new Broker({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      phone: typeof phone === 'string' ? phone.trim() : phone,
      agencyName
    });
    await broker.save();

    const token = jwt.sign({ brokerId: broker._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, broker: { id: broker._id, name: normalizedName, email: normalizedEmail } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Broker already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

exports.loginBroker = async (req, res) => {
  try {
    const { email, password } = req.body;
    const broker = await Broker.findOne({ email });
    if (!broker) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, broker.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ brokerId: broker._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ token, broker: { id: broker._id, name: broker.name, email } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Family OTP using Ethereal
exports.requestFamilyOTP = async (req, res) => {
  try {
    const { email, candidateId } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedCandidateId = typeof candidateId === 'string' ? candidateId.trim() : '';
    if (!normalizedEmail || !mongoose.Types.ObjectId.isValid(normalizedCandidateId)) {
      return res.status(400).json({ message: 'Invalid Candidate ID' });
    }
    const candidate = await Candidate.findById(normalizedCandidateId);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    const authorizedEmails = [candidate.familyEmail, candidate.email]
      .filter(value => typeof value === 'string')
      .map(value => value.trim().toLowerCase())
      .filter(Boolean);
    if (!authorizedEmails.includes(normalizedEmail)) {
      return res.status(403).json({ message: "Email doesn't match our records for this candidate." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60000); // 15 mins

    await FamilyPortalSession.findOneAndUpdate(
      { email: normalizedEmail, candidateId: candidate._id },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    // Send email using Ethereal
    let testAccount = await nodemailer.createTestAccount();
    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    let info = await transporter.sendMail({
      from: '"Broker-Bond Admin" <admin@brokerbond.com>',
      to: normalizedEmail,
      subject: "Your Family Portal OTP",
      text: `Your OTP for accessing candidate status is: ${otp}`,
    });

    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    res.status(200).json({ message: 'OTP sent to email', previewUrl: nodemailer.getTestMessageUrl(info) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyFamilyOTP = async (req, res) => {
  try {
    const { email, candidateId, otp } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedCandidateId = typeof candidateId === 'string' ? candidateId.trim() : '';
    const normalizedOtp = typeof otp === 'string' ? otp.trim() : '';
    if (!normalizedEmail || !mongoose.Types.ObjectId.isValid(normalizedCandidateId)) {
      console.warn('Family OTP verification rejected: invalid credentials');
      return res.status(400).json({ code: 'INVALID_CREDENTIALS', message: 'Invalid family portal credentials' });
    }

    const candidate = await Candidate.findById(normalizedCandidateId);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    const session = await FamilyPortalSession.findOne({
      email: normalizedEmail,
      candidateId: candidate._id
    });
    if (!session) {
      console.warn('Family OTP verification rejected: session not found');
      return res.status(400).json({ code: 'SESSION_NOT_FOUND', message: 'OTP request not found. Please request a new OTP.' });
    }

    if (session.expiresAt < new Date()) {
      console.warn('Family OTP verification rejected: OTP expired');
      return res.status(400).json({ code: 'OTP_EXPIRED', message: 'Your OTP has expired. Please request a new OTP.' });
    }

    if (session.otp !== normalizedOtp) {
      console.warn('Family OTP verification rejected: OTP mismatch');
      return res.status(400).json({ code: 'OTP_MISMATCH', message: 'Incorrect OTP. Please check the latest email and try again.' });
    }

    const matches = await Match.find({
      $or: [{ candidate1: candidate._id }, { candidate2: candidate._id }]
    }).populate('candidate1', 'name gender age city phone email privacyMasking').populate('candidate2', 'name gender age city phone email privacyMasking');

    const portalMatches = matches.map(match => {
      const matchedCandidate = match.candidate1._id.equals(candidate._id)
        ? match.candidate2
        : match.candidate1;
      const approved = match.stage === 'Family Approved' || match.stage === 'Married';
      const masking = matchedCandidate.privacyMasking || {};
      return {
        _id: matchedCandidate._id,
        name: matchedCandidate.name,
        gender: matchedCandidate.gender,
        age: matchedCandidate.age,
        city: approved && masking.exactLocation === false ? matchedCandidate.city : '•••••••',
        phone: approved && masking.phone === false ? matchedCandidate.phone : '••••••••••',
        email: approved && masking.email === false ? matchedCandidate.email : '••••••••••',
        unlocked: approved,
        status: match.stage
      };
    });
    const status = matches[0]?.stage || 'Interested';
    const token = jwt.sign(
      { candidateId: candidate._id.toString(), role: 'family' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.status(200).json({
      token,
      message: 'OTP verified successfully',
      portalData: {
        status,
        candidateName: candidate.name,
        pastorVerified: candidate.pastorVerified === true,
        brokerVerified: candidate.brokerVerified === true,
        lastUpdated: candidate.lastUpdated,
        matches: portalMatches
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
