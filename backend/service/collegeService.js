// services/college.service.js
const pool = require("../config/db");

// Sort values come from this fixed map, never from raw user input.
const SORTS = {
  ranking: "c.ranking ASC NULLS LAST, c.id ASC",
  fees_asc: "p.min_fees ASC NULLS LAST, c.id ASC",
  fees_desc: "p.min_fees DESC NULLS LAST, c.id ASC",
  name: "c.name ASC, c.id ASC",
};

// Escape % and _ so a search like "100%" is matched literally
const escapeLike = (s) => s.replace(/[\\%_]/g, "\\$&");

const formatCollege = (c) => {
  const extra = c.extra_info || {};
  return {
    id: c.slug || String(c.id),
    backendId: c.id,
    name: c.name,
    slug: c.slug,
    shortName: extra.shortName || c.name.split(" ")[0] || c.name,
    code: extra.code || extra.logoText || (c.name.match(/\b([A-Z])/g) || []).join(""),
    logoText: extra.logoText || extra.code || "CC",
    city: c.city,
    state: c.state,
    location: extra.location || `${c.city}, ${c.state}`,
    ranking: c.ranking,
    nirfRank: extra.nirfRank || c.ranking,
    nirfCategory:
      extra.nirfCategory ||
      (c.category ? c.category.charAt(0).toUpperCase() + c.category.slice(1) : "Engineering"),
    category: c.category,
    type: c.type,
    ownership:
      extra.ownership ||
      (c.type === "government" ? "Government / National Importance" : "Private"),
    stream:
      extra.stream ||
      (c.category ? c.category.charAt(0).toUpperCase() + c.category.slice(1) : "Engineering"),
    entranceExams:
      extra.entranceExams ||
      (c.category === "management" ? ["CAT"] : ["JEE Advanced", "JEE Main"]),
    tagline: c.description || extra.tagline || "",
    avatarBg: extra.avatarBg || "bg-slate-900 text-white",
    heroImage:
      extra.heroImage ||
      c.logo_url ||
      "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1200&auto=format&fit=crop",
    is_featured: c.is_featured,
    website: c.website || extra.website,
    establishedYear: c.established_year || extra.establishedYear,
    min_fees: c.min_fees,
    program_count: c.program_count || (extra.programs ? extra.programs.length : 0),
    stats: extra.stats || {
      medianSalary: "₹20.0 LPA",
      medianSalaryNum: 20.0,
      avgSalary: "₹22.0 LPA",
      highestDomestic: "₹60.0 LPA",
      highestInternational: "₹1.5 Cr",
      placementPercent: 95,
      btechFeesPerYear: c.min_fees ? `₹${(c.min_fees / 400000).toFixed(1)} Lakhs` : "₹2.2 Lakhs",
      totalDegreeFee: c.min_fees ? `₹${(c.min_fees / 100000).toFixed(1)} Lakhs` : "₹8.8 Lakhs",
      totalDegreeFeeNum: c.min_fees ? Number((c.min_fees / 100000).toFixed(1)) : 8.8,
      hostelFeePerYear: "₹40,000",
      roiRating: "9.5 / 10",
      topBranchCutoff: "Top 500",
    },
    pros: extra.pros || [],
    cons: extra.cons || [],
    badges: extra.badges || [`NIRF Rank #${c.ranking}`],
    topRecruiters: extra.topRecruiters || ["Google", "Microsoft", "Goldman Sachs"],
    programs: extra.programs || [],
    extra_info: extra,
  };
};

const listColleges = async (filters) => {
  const {
    category,
    state,
    city,
    degree,
    branch,
    specialization,
    mode,
    minFees,
    maxFees,
    q,
    sort,
    page,
    limit,
  } = filters;

  const params = [];
  const add = (value) => {
    params.push(value);
    return `$${params.length}`;
  };

  const collegeWhere = [];
  const programWhere = [];

  // --- filters that live in `colleges` ---
  if (category) collegeWhere.push(`lower(c.category) = lower(${add(category)})`);
  if (state) collegeWhere.push(`lower(c.state) = lower(${add(state)})`);
  if (city) collegeWhere.push(`lower(c.city) = lower(${add(city)})`);

  if (q) {
    const searchPattern = `%${escapeLike(q)}%`;
    collegeWhere.push(`(
      c.name ILIKE ${add(searchPattern)} OR
      c.slug ILIKE ${add(searchPattern)} OR
      c.city ILIKE ${add(searchPattern)} OR
      c.state ILIKE ${add(searchPattern)} OR
      COALESCE(c.extra_info->>'shortName', '') ILIKE ${add(searchPattern)} OR
      COALESCE(c.extra_info->>'code', '') ILIKE ${add(searchPattern)}
    )`);
  }

  // --- filters that live in `courses` and `college_programs` ---
  if (degree) programWhere.push(`lower(co.degree) = lower(${add(degree)})`);
  if (branch) programWhere.push(`lower(co.branch) = lower(${add(branch)})`);
  if (specialization) programWhere.push(`lower(co.specialization) = lower(${add(specialization)})`);
  if (mode) programWhere.push(`cp.mode = ${add(mode)}`);
  if (minFees != null) programWhere.push(`cp.total_fees >= ${add(minFees)}`);
  if (maxFees != null) programWhere.push(`cp.total_fees <= ${add(maxFees)}`);

  // If any program-level filter is used, hide colleges with no matching program.
  if (programWhere.length) collegeWhere.push("p.program_count > 0");

  const limitPlaceholder = add(limit);
  const offsetPlaceholder = add((page - 1) * limit);

  const sql = `
    SELECT c.id, c.name, c.slug, c.category, c.type, c.city, c.state,
           c.ranking, c.is_featured, c.logo_url, c.description, c.extra_info,
           c.established_year, c.website,
           p.min_fees, p.program_count,
           COUNT(*) OVER() AS total_count
    FROM colleges c
    LEFT JOIN LATERAL (
      SELECT MIN(cp.total_fees) AS min_fees,
             COUNT(*)::int      AS program_count
      FROM college_programs cp
      JOIN courses co ON co.id = cp.course_id
      WHERE cp.college_id = c.id
      ${programWhere.length ? "AND " + programWhere.join(" AND ") : ""}
    ) p ON true
    ${collegeWhere.length ? "WHERE " + collegeWhere.join(" AND ") : ""}
    ORDER BY ${SORTS[sort] || SORTS.ranking}
    LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}
  `;

  const { rows } = await pool.query(sql, params);

  const total = rows.length ? Number(rows[0].total_count) : 0;
  const data = rows.map(({ total_count, ...c }) => formatCollege(c));

  return { data, total };
};

// /colleges/:slug
const COLLEGE_DETAIL_SQL = `
  SELECT
    c.id, c.name, c.slug, c.category, c.type, c.city, c.state,
    c.established_year, c.ranking, c.is_featured, c.website,
    c.logo_url, c.description, c.extra_info,
    COALESCE(
      json_agg(
        json_build_object(
          'id',               p.id,
          'name',             p.display_name,
          'displayName',      p.display_name,
          'mode',             p.mode,
          'durationYears',    p.duration_years,
          'duration',         COALESCE(p.duration_years::text || ' Years', '4 Years'),
          'totalFees',        p.total_fees,
          'seats',            p.seats,
          'placementAvg',     p.placement_avg,
          'avgCTC',           CASE WHEN p.placement_avg IS NOT NULL THEN ('₹' || round((p.placement_avg::numeric / 100000), 1)::text || ' LPA') ELSE '₹20.0 LPA' END,
          'placementHighest', p.placement_highest,
          'placementRate',    p.placement_rate,
          'infrastructure',   p.infrastructure,
          'admissionLink',    p.admission_link,
          'course', json_build_object(
            'id',             co.id,
            'degree',         co.degree,
            'branch',         co.branch,
            'specialization', co.specialization,
            'domain',         co.domain
          )
        )
        ORDER BY co.degree, co.branch, co.specialization NULLS FIRST
      ) FILTER (WHERE p.id IS NOT NULL),
      '[]'
    ) AS programs
  FROM colleges c
  LEFT JOIN college_programs p ON p.college_id = c.id
  LEFT JOIN courses co         ON co.id = p.course_id
  WHERE lower(c.slug) = lower($1) OR c.id::text = $1
  GROUP BY c.id
`;

async function getCollegeBySlug(slugOrId) {
  const { rows } = await pool.query(COLLEGE_DETAIL_SQL, [slugOrId]);
  const c = rows[0];
  if (!c) return null;

  const extra = c.extra_info || {};
  return {
    id: c.slug || String(c.id),
    backendId: c.id,
    name: c.name,
    slug: c.slug,
    shortName: extra.shortName || c.name.split(" ")[0] || c.name,
    code: extra.code || extra.logoText || (c.name.match(/\b([A-Z])/g) || []).join(""),
    city: c.city,
    state: c.state,
    location: extra.location || `${c.city}, ${c.state}`,
    nirfRank: extra.nirfRank || c.ranking,
    nirfCategory:
      extra.nirfCategory ||
      (c.category ? c.category.charAt(0).toUpperCase() + c.category.slice(1) : "Engineering"),
    nirfScore: extra.nirfScore || 85.0,
    establishedYear: c.established_year || extra.establishedYear,
    ownership:
      extra.ownership ||
      (c.type === "government" ? "Government / Institute of National Importance" : "Private"),
    campusSize: extra.campusSize || "300+ Acres",
    naacGrade: extra.naacGrade || "A++",
    rating: extra.rating || 4.8,
    reviewsCount: extra.reviewsCount || 450,
    stream:
      extra.stream ||
      (c.category ? c.category.charAt(0).toUpperCase() + c.category.slice(1) : "Engineering"),
    entranceExams:
      extra.entranceExams ||
      (c.category === "management" ? ["CAT"] : ["JEE Advanced"]),
    tagline: c.description || extra.tagline || "",
    logoText: extra.logoText || extra.code || "CC",
    avatarBg: extra.avatarBg || "bg-slate-900 text-white",
    heroImage:
      extra.heroImage ||
      c.logo_url ||
      "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1200&auto=format&fit=crop",
    website: c.website || extra.website,
    stats: extra.stats || {
      medianSalary: "₹21.0 LPA",
      medianSalaryNum: 21,
      avgSalary: "₹24.0 LPA",
      highestDomestic: "₹60.0 LPA",
      highestInternational: "₹1.5 Cr",
      placementPercent: 95,
      btechFeesPerYear: "₹2.2 Lakhs",
      totalDegreeFee: "₹8.8 Lakhs",
      totalDegreeFeeNum: 8.8,
      hostelFeePerYear: "₹40,000",
      roiRating: "9.5 / 10",
      topBranchCutoff: "Top 500",
    },
    pros: extra.pros || [],
    cons: extra.cons || [],
    badges: extra.badges || [`NIRF Rank #${c.ranking}`],
    topRecruiters: extra.topRecruiters || ["Google", "Microsoft", "Goldman Sachs"],
    feeBreakdown: extra.feeBreakdown || null,
    campusHighlights: extra.campusHighlights || null,
    counsellorNotes: extra.counsellorNotes || null,
    programs: c.programs && c.programs.length > 0 ? c.programs : extra.programs || [],
    extra_info: extra,
  };
}

const PROGRAMS_SQL = `
  SELECT
    cp.id,
    cp.display_name   AS "displayName",
    cp.mode,
    cp.duration_years::float AS "durationYears",
    cp.total_fees     AS "totalFees",
    co.degree,
    co.branch,
    co.specialization
  FROM college_programs cp
  JOIN courses co ON co.id = cp.course_id
  WHERE cp.college_id = $1
  ORDER BY co.degree, co.branch, co.specialization NULLS FIRST, cp.mode
`;

async function collegeExists(id) {
  const { rowCount } = await pool.query(
    "SELECT 1 FROM colleges WHERE id = $1 OR lower(slug) = lower($2)",
    [isNaN(Number(id)) ? 0 : Number(id), String(id)]
  );
  return rowCount > 0;
}

async function getProgramsByCollegeId(collegeId) {
  const { rows } = await pool.query(PROGRAMS_SQL, [collegeId]);
  return rows;
}

module.exports = {
  listColleges,
  SORTS,
  getCollegeBySlug,
  collegeExists,
  getProgramsByCollegeId,
};
