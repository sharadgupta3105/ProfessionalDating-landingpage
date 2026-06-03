/**
 * LinkedUp API client for the marketing / compliance web portal.
 */
(function (global) {
  const { apiBaseUrl, authTokenKey, authUserKey } = global.LinkedUpSite || {};

  function getToken() {
    try {
      return localStorage.getItem(authTokenKey);
    } catch (_) {
      return null;
    }
  }

  function setSession(token, user) {
    try {
      if (token) localStorage.setItem(authTokenKey, token);
      if (user) localStorage.setItem(authUserKey, JSON.stringify(user));
    } catch (_) {
      /* private browsing */
    }
  }

  function clearSession() {
    try {
      localStorage.removeItem(authTokenKey);
      localStorage.removeItem(authUserKey);
    } catch (_) {
      /* ignore */
    }
  }

  function getStoredUser() {
    try {
      const raw = localStorage.getItem(authUserKey);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  async function request(path, options = {}) {
    const headers = { Accept: 'application/json', ...(options.headers || {}) };
    if (options.json !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${apiBaseUrl}${path}`, {
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
      const err = new Error(data?.message || res.statusText || 'Request failed');
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  global.LinkedUpApi = {
    getToken,
    getStoredUser,
    setSession,
    clearSession,
    health: () => request('/health'),
    sendLoginOtp: (email) => request('/auth/login', { method: 'POST', json: { email } }),
    verifyOtp: (email, code) =>
      request('/auth/verify-otp', { method: 'POST', json: { email, code } }),
    deleteMyAccount: () => request('/users/me', { method: 'DELETE' }),
    logout: () => request('/auth/logout', { method: 'POST' }).catch(() => {}),
  };
})(window);
