const counsellingService = require('../service/counsellingService');

const fail = (res, status, error) => res.status(status).json({ success: false, error });


const MOBILE_RE = /^\+?\d{10,14}$/;                 // max 15 chars incl. "+", fits VARCHAR(15)
const HAS_TZ_RE = /(Z|[+-]\d{2}:?\d{2})$/i;          // slot must carry an offset
const MAX_MESSAGE = 1000;

// Returns { error } or { value }
function validateCounsellingBody(body = {}) {
  let { comparisonId, preferredSlot, message, mobile } = body;

  // mobile (required)
  if (typeof mobile !== 'string') return { error: 'mobile is required' };
  mobile = mobile.replace(/[\s-]/g, '');
  if (!MOBILE_RE.test(mobile)) return { error: 'mobile must be 10 to 14 digits, optional leading +' };

  // comparisonId (optional)
  if (comparisonId !== undefined && comparisonId !== null) {
    if (!Number.isInteger(comparisonId) || comparisonId <= 0 || comparisonId > 2147483647) {
      return { error: 'comparisonId must be a positive integer' };
    }
  } else {
    comparisonId = null;
  }

  // preferredSlot (optional)
  if (preferredSlot !== undefined && preferredSlot !== null) {
    if (typeof preferredSlot !== 'string' || !HAS_TZ_RE.test(preferredSlot.trim())) {
      return { error: 'preferredSlot must be an ISO date with a time zone, e.g. 2026-11-10T11:00:00+05:30' };
    }
    const ms = Date.parse(preferredSlot);
    if (Number.isNaN(ms)) return { error: 'preferredSlot is not a valid date' };
    if (ms <= Date.now()) return { error: 'preferredSlot must be in the future' };
    preferredSlot = new Date(ms).toISOString();
  } else {
    preferredSlot = null;
  }

  // message (optional)
  if (message !== undefined && message !== null) {
    if (typeof message !== 'string') return { error: 'message must be a string' };
    message = message.trim();
    if (message.length > MAX_MESSAGE) return { error: `message must be at most ${MAX_MESSAGE} characters` };
    if (message === '') message = null;
  } else {
    message = null;
  }

  // Give the counsellor something to act on
  if (!preferredSlot && !message) {
    return { error: 'Provide a preferredSlot or a message' };
  }

  return { value: { comparisonId, preferredSlot, message, mobile } };
}

async function createCounselling(req, res, next) {
  try {
    const { error, value } = validateCounsellingBody(req.body);
    if (error) return fail(res, 400, error);

    // user id from the JWT; any userId or status in the body is ignored
    const result = await counsellingService.createCounsellingRequest(req.user.id, value);

    switch (result.error) {
      case 'USER_NOT_FOUND':
        return fail(res, 401, 'Account no longer exists');
      case 'LIMIT':
        return fail(res, 429,
          `You already have ${counsellingService.MAX_PENDING} pending requests. Please wait for a counsellor to respond.`);
      case 'COMPARISON_NOT_FOUND':
        return fail(res, 404, 'Comparison not found');
    }

    res.status(201).json({ success: true, data: result.request });
  } catch (err) {
    next(err);
  }
}


// POST	/api/admin/counsellors	Add a counsellor






const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// const MOBILE_RE = /^\+?\d{10,14}$/;

// Returns { error } or { value }
function validateCounsellorBody(body = {}) {
  let { name, email, mobile, specialization, isActive } = body;

  // name (required, VARCHAR(100))
  if (typeof name !== 'string' || name.trim() === '') return { error: 'name is required' };
  name = name.trim();
  if (name.length > 100) return { error: 'name must be at most 100 characters' };

  // email (required, VARCHAR(150))
  if (typeof email !== 'string') return { error: 'email is required' };
  email = email.trim().toLowerCase();
  if (email.length > 150 || !EMAIL_RE.test(email)) return { error: 'email is not valid' };

  // mobile (optional, VARCHAR(15))
  if (mobile !== undefined && mobile !== null && mobile !== '') {
    if (typeof mobile !== 'string') return { error: 'mobile must be a string' };
    mobile = mobile.replace(/[\s-]/g, '');
    if (!MOBILE_RE.test(mobile)) return { error: 'mobile must be 10 to 14 digits, optional leading +' };
  } else {
    mobile = null;
  }

  // specialization (optional, VARCHAR(30)); missing or empty = generalist
  if (specialization !== undefined && specialization !== null && specialization !== '') {
    if (typeof specialization !== 'string') return { error: 'specialization must be a string' };
    specialization = specialization.trim();
    if (specialization.length > 30) return { error: 'specialization must be at most 30 characters' };
  } else {
    specialization = null;
  }

  // isActive (optional, defaults to true)
  if (isActive === undefined || isActive === null) {
    isActive = true;
  } else if (typeof isActive !== 'boolean') {
    return { error: 'isActive must be true or false' };
  }

  return { value: { name, email, mobile, specialization, isActive } };
}

async function createCounsellor(req, res, next) {
  try {
    const { error, value } = validateCounsellorBody(req.body);
    if (error) return fail(res, 400, error);

    const result = await counsellingService.createCounsellor(value);

    switch (result.error) {
      case 'BAD_SPECIALIZATION':
        return fail(res, 400,
          `specialization must match a college category: ${result.categories.join(', ') || '(no categories exist yet)'}`);
      case 'EMAIL_EXISTS':
        return fail(res, 409, 'A counsellor with this email already exists');
    }

    res.status(201).json({ success: true, data: result.counsellor });
  } catch (err) {
    next(err);
  }
}

// GET	/api/admin/counsellors	List counsellors
const SORT_KEYS = ['name', 'newest', 'load'];

async function listCounsellors(req, res, next) {
  try {
    const { sort, specialization, q } = req.query;

    // ?isActive=true|false (omit for all)
    let isActive = null;
    if (req.query.isActive !== undefined) {
      if (!['true', 'false'].includes(req.query.isActive)) {
        return fail(res, 400, "isActive must be 'true' or 'false'");
      }
      isActive = req.query.isActive === 'true';
    }

    if (sort !== undefined && !SORT_KEYS.includes(sort)) {
      return fail(res, 400, `sort must be one of: ${SORT_KEYS.join(', ')}`);
    }
    if (q !== undefined && (typeof q !== 'string' || q.length > 100)) {
      return fail(res, 400, 'q must be a string of at most 100 characters');
    }

    const limit  = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    const data = await counsellingService.listCounsellors({
      isActive,
      specialization: typeof specialization === 'string' ? specialization.trim() : null,
      q: typeof q === 'string' ? q.trim() : null,
      sort, limit, offset,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// PATCH	/api/admin/counsellors/:id	Edit details, or activate/deactivate
// Validates only the fields that were sent. Returns { error } or { value }
function validatePatch(body = {}) {
  const value = {};

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim() === '') {
      return { error: 'name must be a non-empty string' };
    }
    if (body.name.trim().length > 100) return { error: 'name must be at most 100 characters' };
    value.name = body.name.trim();
  }

  if (body.email !== undefined) {
    if (typeof body.email !== 'string') return { error: 'email must be a string' };
    const email = body.email.trim().toLowerCase();
    if (email.length > 150 || !EMAIL_RE.test(email)) return { error: 'email is not valid' };
    value.email = email;
  }

  // null or '' clears the mobile
  if (body.mobile !== undefined) {
    if (body.mobile === null || body.mobile === '') {
      value.mobile = null;
    } else {
      if (typeof body.mobile !== 'string') return { error: 'mobile must be a string or null' };
      const mobile = body.mobile.replace(/[\s-]/g, '');
      if (!MOBILE_RE.test(mobile)) return { error: 'mobile must be 10 to 14 digits, optional leading +' };
      value.mobile = mobile;
    }
  }

  // null or '' makes the counsellor a generalist
  if (body.specialization !== undefined) {
    if (body.specialization === null || body.specialization === '') {
      value.specialization = null;
    } else {
      if (typeof body.specialization !== 'string') {
        return { error: 'specialization must be a string or null' };
      }
      const spec = body.specialization.trim();
      if (spec.length > 30) return { error: 'specialization must be at most 30 characters' };
      value.specialization = spec;
    }
  }

  if (body.isActive !== undefined) {
    if (typeof body.isActive !== 'boolean') return { error: 'isActive must be true or false' };
    value.isActive = body.isActive;
  }

  if (Object.keys(value).length === 0) {
    return { error: 'Provide at least one of: name, email, mobile, specialization, isActive' };
  }
  return { value };
}

async function updateCounsellor(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0 || id > 2147483647) {
      return fail(res, 400, 'Invalid counsellor id');
    }

    const { error, value } = validatePatch(req.body);
    if (error) return fail(res, 400, error);

    const result = await counsellingService.updateCounsellor(id, value);

    switch (result.error) {
      case 'NOT_FOUND':
        return fail(res, 404, 'Counsellor not found');
      case 'BAD_SPECIALIZATION':
        return fail(res, 400,
          `specialization must match a college category: ${result.categories.join(', ') || '(no categories exist yet)'}`);
      case 'EMAIL_EXISTS':
        return fail(res, 409, 'A counsellor with this email already exists');
    }

    res.json({ success: true, data: result.counsellor });
  } catch (err) {
    next(err);
  }
}



module.exports = { createCounselling ,createCounsellor,listCounsellors,updateCounsellor};