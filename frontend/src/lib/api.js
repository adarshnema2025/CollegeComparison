const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Helper for local token storage
export const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cc_auth_token");
};

export const setToken = (token) => {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("cc_auth_token", token);
  } else {
    localStorage.removeItem("cc_auth_token");
  }
};

// Generic fetch wrapper with auth header
async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(
        data?.error || data?.message || `Request failed with status ${res.status}`
      );
    }

    return data;
  } catch (err) {
    console.warn(`[API] ${endpoint} request error:`, err.message);
    throw err;
  }
}

// 1. Auth APIs
export const authApi = {
  login: async ({ email, password }) => {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (data?.token) {
      setToken(data.token);
    }
    return data;
  },

  register: async (userData) => {
    // Backend supports /auth/signup and /auth/register
    const data = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
    return data;
  },

  getProfile: async () => {
    return request("/api/users/me/profile");
  },

  updateProfile: async (userData) => {
    return request("/api/users/me/profile", {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  },

  logout: () => {
    setToken(null);
  },
};

// 2. Colleges APIs
export const collegesApi = {
  list: async (filters = {}) => {
    const query = new URLSearchParams();
    if (filters.q) query.set("q", filters.q);
    if (filters.category) query.set("category", filters.category);
    if (filters.state) query.set("state", filters.state);
    if (filters.city) query.set("city", filters.city);
    if (filters.degree) query.set("degree", filters.degree);
    if (filters.branch) query.set("branch", filters.branch);
    if (filters.specialization) query.set("specialization", filters.specialization);
    if (filters.mode) query.set("mode", filters.mode);
    if (filters.minFees != null) query.set("minFees", filters.minFees);
    if (filters.maxFees != null) query.set("maxFees", filters.maxFees);
    if (filters.sort) query.set("sort", filters.sort);
    if (filters.page) query.set("page", filters.page);
    if (filters.limit) query.set("limit", filters.limit);

    const queryString = query.toString();
    return request(`/colleges${queryString ? `?${queryString}` : ""}`);
  },

  getBySlug: async (slug) => {
    return request(`/colleges/${encodeURIComponent(slug)}`);
  },

  getPrograms: async (collegeId) => {
    return request(`/colleges/${encodeURIComponent(collegeId)}/programs`);
  },
};

// 3. Comparison APIs
export const compareApi = {
  getOptions: async (programId, limit = 20) => {
    return request(`/compare/options?programId=${programId}&limit=${limit}`);
  },

  create: async ({ programAId, programBId }) => {
    return request("/compare/comparisons", {
      method: "POST",
      body: JSON.stringify({ programAId, programBId }),
    });
  },

  getById: async (id) => {
    return request(`/compare/comparisons/${id}`);
  },
};

// 4. Counselling APIs
export const counsellingApi = {
  create: async ({ comparisonId, preferredSlot, message, mobile }) => {
    return request("/counselling", {
      method: "POST",
      body: JSON.stringify({ comparisonId, preferredSlot, message, mobile }),
    });
  },

  getAvailability: async () => {
    return request("/counselling/availability");
  },

  createBooking: async ({ slot, mobile, message, comparisonId }) => {
    return request("/counselling/bookings", {
      method: "POST",
      body: JSON.stringify({ slot, mobile, message, comparisonId }),
    });
  },

  getMyBookings: async ({ when, limit = 20, offset = 0 } = {}) => {
    const q = new URLSearchParams({ limit, offset });
    if (when) q.set("when", when);
    return request(`/counselling/bookings/me?${q.toString()}`);
  },

  getBooking: async (id) => {
    return request(`/counselling/bookings/${encodeURIComponent(id)}`);
  },

  cancelBooking: async (id) => {
    return request(`/counselling/bookings/${encodeURIComponent(id)}/cancel`, {
      method: "PATCH",
    });
  },
};

// 5. User & Profile ("Me") APIs
export const meApi = {
  getComparisons: async (limit = 10, offset = 0) => {
    return request(`/me/comparisons?limit=${limit}&offset=${offset}`);
  },

  deleteComparison: async (id) => {
    return request(`/me/${id}`, {
      method: "DELETE",
    });
  },

  getCounselling: async (status, limit = 10, offset = 0) => {
    const q = new URLSearchParams({ limit, offset });
    if (status) q.set("status", status);
    return request(`/me/counselling?${q.toString()}`);
  },
};

// 6. Courses APIs
export const coursesApi = {
  getCatalog: async (offeredOnly = false) => {
    return request(`/courses${offeredOnly ? "?offered=true" : ""}`);
  },

  getCollegesByCourse: async (
    courseId,
    { sort = "ranking", mode, limit = 50, offset = 0 } = {}
  ) => {
    const q = new URLSearchParams({ sort, limit, offset });
    if (mode && mode !== "all") q.set("mode", mode);
    return request(
      `/courses/${encodeURIComponent(courseId)}/colleges?${q.toString()}`
    );
  },
};

// 7. Admin APIs 🛡️
export const adminApi = {
  getUsers: async () => request("/admin/users"),

  createCollege: async (data) =>
    request("/admin/colleges", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateCollege: async (id, data) =>
    request(`/admin/colleges/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteCollege: async (id) =>
    request(`/admin/colleges/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),

  patchCollegeFeatured: async (id, data) =>
    request(`/admin/colleges/${encodeURIComponent(id)}/featured`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  addProgram: async (collegeId, data) =>
    request(`/admin/colleges/${encodeURIComponent(collegeId)}/programs`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateProgram: async (id, data) =>
    request(`/admin/programs/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteProgram: async (id) =>
    request(`/admin/programs/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),

  createCourse: async (data) =>
    request("/admin/courses", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateCourse: async (id, data) =>
    request(`/admin/courses/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getCounselling: async (status) => {
    const q = new URLSearchParams();
    if (status && status !== "all") q.set("status", status);
    const query = q.toString();
    return request(`/admin/counselling${query ? `?${query}` : ""}`);
  },

  patchCounsellingStatus: async (id, status) =>
    request(`/admin/counselling/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  importColleges: async (payload) =>
    request("/admin/colleges/import", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Counsellors Management
  getCounsellors: async ({
    isActive,
    specialization,
    q,
    sort = "newest",
    limit = 50,
    offset = 0,
  } = {}) => {
    const params = new URLSearchParams();
    if (isActive !== undefined && isActive !== null && isActive !== "all") {
      params.set("isActive", String(isActive));
    }
    if (specialization && specialization !== "all") {
      params.set("specialization", specialization);
    }
    if (q) params.set("q", q);
    if (sort) params.set("sort", sort);
    params.set("limit", String(limit));
    params.set("offset", String(offset));
    const query = params.toString();
    return request(`/admin/counsellors${query ? `?${query}` : ""}`);
  },

  createCounsellor: async (data) =>
    request("/admin/counsellors", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateCounsellor: async (id, data) =>
    request(`/admin/counsellors/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  downloadExport: async (type, range = "all") => {
    const token = getToken();
    const res = await fetch(
      `${API_BASE_URL}/admin/export/${type}?range=${encodeURIComponent(range)}`,
      {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(
        err?.error || err?.message || `Export failed with status ${res.status}`
      );
    }

    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") || "";
    let filename = `${type}_export_${range}.csv`;
    const match = disposition.match(/filename=["']?([^"']+)["']?/);
    if (match && match[1]) {
      filename = match[1];
    }

    if (typeof window !== "undefined") {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }

    return { success: true, filename };
  },
};


