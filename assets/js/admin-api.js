/**
 * Admin dashboard API helpers (separate session from delete-account user auth).
 */
(function (global) {
  const site = global.LinkedUpSite || {};
  const TOKEN_KEY = 'matchedin_admin_token';
  const USER_KEY = 'matchedin_admin_user';

  function apiBase() {
    return (site.apiBaseUrl || 'http://localhost:5001').replace(/\/$/, '');
  }

  function getToken() {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch (_) {
      return null;
    }
  }

  function setSession(token, admin) {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      if (token) sessionStorage.setItem(TOKEN_KEY, token);
      if (admin) sessionStorage.setItem(USER_KEY, JSON.stringify(admin));
    } catch (_) {
      /* ignore */
    }
  }

  function clearSession() {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (_) {
      /* ignore */
    }
  }

  function getAdmin() {
    try {
      const raw = sessionStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  async function request(path, options = {}) {
    const headers = { Accept: 'application/json', ...(options.headers || {}) };
    if (options.json !== undefined) headers['Content-Type'] = 'application/json';
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${apiBase()}${path}`, {
      ...options,
      headers,
      body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
    });

    let data = null;
    const text = await res.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (_) {
        data = { message: text };
      }
    }

    if (!res.ok) {
      if (res.status === 401 && path !== '/admin/login') clearSession();
      const err = new Error(data?.message || res.statusText || 'Request failed');
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  global.MatchedInAdminApi = {
    getToken,
    getAdmin,
    setSession,
    clearSession,
    login: (username, password) =>
      request('/admin/login', { method: 'POST', json: { username, password } }),
    logout: () => request('/admin/logout', { method: 'POST' }),
    credentialsHint: () => request('/admin/credentials-hint'),
    stats: () => request('/admin/stats'),
    pricing: () => request('/admin/pricing'),
    updatePricing: (plans) =>
      request('/admin/pricing', {
        method: 'PUT',
        json: { plans },
      }),
    users: (params = {}) => {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') q.set(k, v);
      });
      return request(`/admin/users?${q}`);
    },
    user: (id) => request(`/admin/users/${encodeURIComponent(id)}`),
    grantPremium: (id, plan = 'month') =>
      request(`/admin/users/${encodeURIComponent(id)}/premium`, {
        method: 'POST',
        json: { plan },
      }),
    revokePremium: (id) =>
      request(`/admin/users/${encodeURIComponent(id)}/premium`, { method: 'DELETE' }),
    ban: (id, banned = true) =>
      request(`/admin/users/${encodeURIComponent(id)}/ban`, {
        method: 'POST',
        json: { banned },
      }),
    deleteUser: (id) =>
      request(`/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    reports: () => request('/admin/reports'),
    launchPromo: () => request('/admin/launch-promo'),
    updateLaunchPromo: (payload) =>
      request('/admin/launch-promo', {
        method: 'PUT',
        json: payload,
      }),
  };
})(window);
