const compareService = require('../service/compareService');
const comparisonService = compareService;

async function getCompareOptions(req, res, next) {
  try {
    const programId = Number(req.query.programId);
    if (!Number.isInteger(programId) || programId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'A valid programId is required',
      });
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

    if (!(await compareService.programExists(programId))) {
      return res.status(404).json({ success: false, error: 'Program not found' });
    }

    const options = await compareService.getCompareOptions(programId, limit);
    res.json({ success: true, data: options });
  } catch (err) {
    next(err);
  }
}



const fail = (res, status, error) => res.status(status).json({ success: false, error });

async function createComparison(req, res, next) {
  try {
    const userId = req.user.id; // from the JWT, never from the body
    const { programAId, programBId } = req.body || {};

    // 1. Body validation (numbers only, so "10" is rejected)
    if (!Number.isInteger(programAId) || programAId <= 0 ||
        !Number.isInteger(programBId) || programBId <= 0) {
      return fail(res, 400, 'programAId and programBId must be positive integers');
    }
    if (programAId === programBId) {
      return fail(res, 400, 'Cannot compare a program with itself');
    }

    // 2. Both programs must exist
    const programs = await comparisonService.getPrograms([programAId, programBId]);
    const a = programs[programAId];
    const b = programs[programBId];
    if (!a || !b) return fail(res, 404, 'Program not found');

    // 3. Business rules (keep in sync with GET /compare/options)
    if (a.degree !== b.degree || a.branch !== b.branch) {
      return fail(res, 400, 'Only programs with the same degree and branch can be compared');
    }
    if (a.collegeId === b.collegeId) {
      return fail(res, 400, 'Choose programs from two different colleges');
    }
    if (a.mode !== b.mode) {
      return fail(res, 400, 'Programs must have the same mode (online or offline)');
    }

    // 4. Compute the label on the server, then save (deduped)
    const matchLevel = comparisonService.computeMatchLevel(a, b);
    const { comparison, created } = await comparisonService.saveComparison(
      userId, programAId, programBId, matchLevel
    );

    // 5. Respond with both programs in the order the user sent them
    res.status(created ? 201 : 200).json({
      success: true,
      data: {
        id: comparison.id,
        matchLevel: comparison.matchLevel,
        createdAt: comparison.createdAt,
        programA: a,
        programB: b,
      },
    });
  } catch (err) {
    next(err);
  }
}


async function getComparison(req, res, next) {
  try {
    const id = Number(req.params.id);
    // 2147483647 = max Postgres INT, larger values would cause a 500
    if (!Number.isInteger(id) || id <= 0 || id > 2147483647) {
      return fail(res, 400, 'Invalid comparison id');
    }

    const comparison = await comparisonService.getComparisonForUser(id, req.user.id);
    if (!comparison) {
      return fail(res, 404, 'Comparison not found');
    }

    res.json({ success: true, data: comparison });
  } catch (err) {
    next(err);
  }
}



module.exports = { getCompareOptions,createComparison,getComparison };