const meService = require('../service/meService');

const fail = (res, status, error) => res.status(status).json({ success: false, error });

async function getMyComparisons(req, res, next) {
  try {
    // default 10, hard cap 50
    const limit  = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    const data = await meService.getComparisonHistory(req.user.id, { limit, offset });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function deleteComparison(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0 || id > 2147483647) {
      return fail(res, 400, 'Invalid comparison id');
    }

    const deleted = await meService.deleteComparisonForUser(id, req.user.id);
    if (!deleted) {
      return fail(res, 404, 'Comparison not found');
    }

    res.status(204).send(); // success, no body
  } catch (err) {
    next(err);
  }
}


const STATUSES = ['pending', 'contacted', 'closed'];

async function getMyCounselling(req, res, next) {
  try {
    const { status } = req.query;
    if (status !== undefined && !STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `status must be one of: ${STATUSES.join(', ')}`,
      });
    }

    const limit  = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    const data = await meService.getCounsellingRequests(req.user.id, { status, limit, offset });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMyComparisons, deleteComparison ,getMyCounselling};

