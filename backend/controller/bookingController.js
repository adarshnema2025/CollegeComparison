const bookingService = require('../service/bookingService');

const fail = (res, status, error) => res.status(status).json({ success: false, error });

const MOBILE_RE = /^\+?\d{10,14}$/;
const HAS_TZ_RE = /(Z|[+-]\d{2}:?\d{2})$/i;
const MAX_MESSAGE = 1000;

function validateBody(body = {}) {
  let { slot, mobile, message, comparisonId } = body;

  // slot (required)
  if (typeof slot !== 'string' || !HAS_TZ_RE.test(slot.trim())) {
    return { error: 'slot must be an ISO date with a time zone, e.g. 2026-11-15T11:00:00+05:30' };
  }
  const ms = Date.parse(slot);
  if (Number.isNaN(ms)) return { error: 'slot is not a valid date' };
  if (ms <= Date.now()) return { error: 'slot must be in the future' };
  slot = new Date(ms).toISOString();

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

  // message (optional)
  if (message !== undefined && message !== null) {
    if (typeof message !== 'string') return { error: 'message must be a string' };
    message = message.trim();
    if (message.length > MAX_MESSAGE) return { error: `message must be at most ${MAX_MESSAGE} characters` };
    if (message === '') message = null;
  } else {
    message = null;
  }

  return { value: { slot, mobile, message, comparisonId } };
}

async function createBooking(req, res, next) {
  try {
    const { error, value } = validateBody(req.body);
    if (error) return fail(res, 400, error);

    // user id comes from the JWT; any userId, counsellorId or status in the body is ignored
    const result = await bookingService.createBooking(req.user.id, value);

    switch (result.error) {
      case 'USER_NOT_FOUND':
        return fail(res, 401, 'Account no longer exists');
      case 'LIMIT':
        return fail(res, 429,
          `You already have ${bookingService.MAX_UPCOMING} upcoming bookings. Cancel one or wait until it is over.`);
      case 'COMPARISON_NOT_FOUND':
        return fail(res, 404, 'Comparison not found');
      case 'SLOT_TAKEN':
        return fail(res, 409, 'That time is no longer available. Please pick another slot.');
    }

    res.status(201).json({ success: true, data: result.booking });
  } catch (err) {
    next(err);
  }
}



const TZ = 'Asia/Calcutta';

// 'en-CA' formats as YYYY-MM-DD; the day is taken in IST, not UTC
const dayKey = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: TZ });

async function getAvailability(req, res, next) {
  try {
    const { from, to, slots } = await bookingService.getAvailability();

    // Group the flat, time-ordered list by IST calendar day
    const byDay = new Map();
    for (const s of slots) {
      const key = dayKey(s.start);
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key).push({ start: s.start, end: s.end });
    }

    const days = [...byDay].map(([date, daySlots]) => ({ date, slots: daySlots }));

    // Short cache only; a stale list causes avoidable 409s on booking
    res.set('Cache-Control', 'private, max-age=5');
    res.json({
      success: true,
      data: { timezone: TZ, from, to, days },
    });
  } catch (err) {
    next(err);
  }
}

// module.exports = { getAvailability };
// GET	/api/counselling/bookings/me	List the user’s bookings (upcoming and past)
async function getMyBookings(req, res, next) {
  try {
    const { when } = req.query;
    if (when !== undefined && !['upcoming', 'past'].includes(when)) {
      return fail(res, 400, "when must be 'upcoming' or 'past'");
    }

    const limit  = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    // user id comes from the JWT, never from the query or body
    const data = await bookingService.getMyBookings(req.user.id, { when, limit, offset });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}


// GET    /api/counselling/bookings/:id    Details of one booking
async function getBooking(req, res, next) {
  try {
    const id = Number(req.params.id);
    // 2147483647 = max Postgres INT, larger values would cause a 500
    if (!Number.isInteger(id) || id <= 0 || id > 2147483647) {
      return fail(res, 400, 'Invalid booking id');
    }

    // user id comes from the JWT, never from the request
    const booking = await bookingService.getBookingForUser(id, req.user.id);
    if (!booking) {
      return fail(res, 404, 'Booking not found');
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
}

// PATCH	/api/counselling/bookings/:id/cancel	Cancel a booking, which frees the slot
async function cancelBooking(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0 || id > 2147483647) {
      return fail(res, 400, 'Invalid booking id');
    }

    // user id comes from the JWT, never from the request
    const result = await bookingService.cancelBooking(id, req.user.id);

    switch (result.error) {
      case 'NOT_FOUND':
        return fail(res, 404, 'Booking not found');
      case 'NOT_CANCELLABLE':
        return fail(res, 409, `Booking is already ${result.status} and cannot be cancelled`);
      case 'TOO_LATE':
        return fail(res, 409, 'This session has started or is too close to be cancelled');
    }

    res.json({ success: true, data: result.booking });
  } catch (err) {
    next(err);
  }
}




module.exports = { createBooking, getMyBookings ,getAvailability,getBooking,cancelBooking};

