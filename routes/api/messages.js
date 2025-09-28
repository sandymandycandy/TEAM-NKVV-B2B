const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Message = require('../../models/Message');
const User = require('../../models/User');

// simple auth middleware for API (expects x-auth-token)
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token invalid' });
  }
};

// GET /api/messages/conversations
// Returns list of conversation partners for current user (most recent message preview)
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const agg = await Message.aggregate([
      { $match: { $or: [{ from: new mongoose.Types.ObjectId(userId) }, { to: new mongoose.Types.ObjectId(userId) }] } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$conversationId', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } }
    ]);

    // map to partner info
    const convs = await Promise.all(agg.map(async m => {
      const partnerId = (m.from.toString() === userId) ? m.to : m.from;
      const user = await User.findById(partnerId).select('name fullName role');
      const displayName = user?.fullName || user?.name || 'Unknown';
      return { partnerId, partnerName: displayName, lastMessage: m.text, time: m.createdAt };
    }));

    res.json({ success: true, data: convs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/messages/history/:userId  -> messages between current user and :userId
router.get('/history/:userId', auth, async (req, res) => {
  try {
    const me = req.user.id;
    const other = req.params.userId;
    // conversationId is deterministic: smallerId_largerId
    const conversationId = [me, other].sort().join('_');
    const msgs = await Message.find({ conversationId }).sort({ createdAt: 1 }).populate('from', 'name fullName').populate('to', 'name fullName');
    // map messages to include display names
    const out = msgs.map(m => ({
      _id: m._id,
      from: m.from._id || m.from,
      to: m.to._id || m.to,
      text: m.text,
      createdAt: m.createdAt,
      fromName: (m.from && (m.from.fullName || m.from.name)) || 'Unknown',
      toName: (m.to && (m.to.fullName || m.to.name)) || 'Unknown'
    }));
    res.json({ success: true, data: out });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/messages/send
router.post('/send', auth, async (req, res) => {
  try {
    const { to, text } = req.body;
    const from = req.user.id;
    const conversationId = [from, to].sort().join('_');
    const newMsg = new Message({ conversationId, from, to, text });
    await newMsg.save();
    res.json({ success: true, data: newMsg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
