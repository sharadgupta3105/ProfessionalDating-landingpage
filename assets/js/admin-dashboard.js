/**
 * MatchedIn admin dashboard UI.
 */
(function () {
  const api = window.MatchedInAdminApi;
  if (!api) return;

  let page = 1;
  let totalPages = 1;
  let searchTimer = null;

  const loginView = document.getElementById('login-view');
  const dashView = document.getElementById('dash-view');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const loginHint = document.getElementById('login-hint');
  const toastEl = document.getElementById('toast');

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.style.display = 'block';
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => {
      toastEl.style.display = 'none';
    }, 2800);
  }

  function showLogin() {
    loginView.classList.remove('hidden');
    dashView.classList.add('hidden');
  }

  function showDash() {
    loginView.classList.add('hidden');
    dashView.classList.remove('hidden');
    const admin = api.getAdmin();
    document.getElementById('admin-name').textContent = admin?.username
      ? `Signed in as ${admin.username}`
      : '';
  }

  function fmtDate(v) {
    if (!v) return '—';
    try {
      return new Date(v).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (_) {
      return String(v);
    }
  }

  function escapeHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function loadStats() {
    const s = await api.stats();
    const items = [
      ['Users', s.users],
      ['Onboarded', s.onboarded],
      ['Premium', s.premium],
      ['Active subs', s.activeSubscriptions],
      ['Banned', s.banned],
      ['Matches', s.matches],
      ['Reports', s.reports],
    ];
    document.getElementById('stats-grid').innerHTML = items
      .map(
        ([label, n]) => `
      <div class="stat-card p-4">
        <div class="text-2xl font-semibold">${n ?? 0}</div>
        <div class="text-xs uppercase tracking-wide text-stone-500 mt-1">${label}</div>
      </div>`,
      )
      .join('');
  }

  async function loadPricing() {
    const data = await api.pricing();
    const plans = Array.isArray(data?.plans) ? data.plans : [];
    const tbody = document.getElementById('pricing-tbody');
    if (!plans.length) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="text-stone-400 py-6 text-center">No pricing plans found</td></tr>';
      return;
    }
    tbody.innerHTML = plans
      .map(
        (plan) => `<tr data-plan-id="${escapeHtml(plan.id)}">
          <td>
            <div class="font-medium">${escapeHtml(plan.title)}</div>
            <div class="text-xs text-stone-500">${escapeHtml(plan.periodLabel)}</div>
          </td>
          <td><code class="text-xs text-stone-500">${escapeHtml(plan.productId)}</code></td>
          <td>
            <label class="sr-only" for="price-${escapeHtml(plan.id)}">${escapeHtml(plan.title)} price</label>
            <div class="flex items-center gap-2">
              <span class="text-stone-500">₹</span>
              <input id="price-${escapeHtml(plan.id)}" data-price-input type="number" min="1" max="1000000" step="1"
                value="${Number(plan.priceInr) || ''}" class="w-32" required/>
            </div>
          </td>
          <td data-price-preview class="font-semibold">${escapeHtml(plan.priceLabel)}</td>
        </tr>`,
      )
      .join('');
    const latest = plans
      .map((plan) => plan.updatedAt)
      .filter(Boolean)
      .sort()
      .pop();
    document.getElementById('pricing-updated').textContent = latest
      ? `Last updated ${fmtDate(latest)}`
      : 'Using default display prices';
  }

  async function loadUsers() {
    const q = document.getElementById('user-q').value.trim();
    const filter = document.getElementById('user-filter').value;
    const data = await api.users({ q, filter, page, limit: 25 });
    totalPages = data.totalPages || 1;
    document.getElementById('users-meta').textContent = `${data.total} users · page ${data.page}/${totalPages}`;
    document.getElementById('btn-prev').disabled = page <= 1;
    document.getElementById('btn-next').disabled = page >= totalPages;

    const tbody = document.getElementById('users-tbody');
    if (!data.users?.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="text-stone-400 py-8 text-center">No users found</td></tr>';
      return;
    }

    tbody.innerHTML = data.users
      .map((u) => {
        const badges = [];
        if (u.is_banned) badges.push('<span class="badge badge-bad">Banned</span>');
        if (u.is_premium) badges.push('<span class="badge badge-ok">Premium</span>');
        if (!u.onboarding_complete) badges.push('<span class="badge badge-warn">Incomplete</span>');
        if (u.linkedin_verified) badges.push('<span class="badge badge-muted">Verified</span>');
        if (!badges.length) badges.push('<span class="badge badge-muted">Active</span>');

        const sub =
          u.subscription?.plan
            ? `<div class="text-xs text-stone-400 mt-0.5">${escapeHtml(u.subscription.plan)} · until ${fmtDate(u.subscription.expires_at)}</div>`
            : '';

        return `<tr data-id="${escapeHtml(u.id)}">
          <td>
            <div class="font-medium">${escapeHtml(u.name || '—')}</div>
            <div class="text-xs text-stone-500">${escapeHtml(u.email)}</div>
            <div class="text-xs text-stone-400">${escapeHtml(u.profession || '')}${u.company ? ' · ' + escapeHtml(u.company) : ''}</div>
          </td>
          <td>${escapeHtml(u.city || '—')}</td>
          <td><div class="flex flex-wrap gap-1">${badges.join(' ')}</div></td>
          <td>${sub || '<span class="text-stone-400">—</span>'}</td>
          <td>${fmtDate(u.created_at)}</td>
          <td>
            <div class="flex flex-wrap gap-1">
              ${
                u.is_premium
                  ? `<button type="button" class="btn btn-ghost" data-act="revoke">Revoke</button>`
                  : `<button type="button" class="btn btn-gold" data-act="premium">Grant</button>`
              }
              ${
                u.is_banned
                  ? `<button type="button" class="btn btn-ghost" data-act="unban">Unban</button>`
                  : `<button type="button" class="btn btn-ghost" data-act="ban">Ban</button>`
              }
              <button type="button" class="btn btn-danger" data-act="delete">Delete</button>
            </div>
          </td>
        </tr>`;
      })
      .join('');
  }

  async function loadReports() {
    const data = await api.reports();
    const tbody = document.getElementById('reports-tbody');
    if (!data.reports?.length) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="text-stone-400 py-6 text-center">No reports</td></tr>';
      return;
    }
    tbody.innerHTML = data.reports
      .map(
        (r) => `<tr>
        <td>${fmtDate(r.created_at)}</td>
        <td>
          <div>${escapeHtml(r.reporter_name || '—')}</div>
          <div class="text-xs text-stone-500">${escapeHtml(r.reporter_email || r.reporter_id)}</div>
        </td>
        <td>
          <div>${escapeHtml(r.reported_name || '—')}</div>
          <div class="text-xs text-stone-500">${escapeHtml(r.reported_email || r.reported_id)}</div>
        </td>
        <td>${escapeHtml(r.reason || '—')}</td>
      </tr>`,
      )
      .join('');
  }

  async function refreshAll() {
    await Promise.all([loadStats(), loadPricing(), loadUsers(), loadReports()]);
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');
    try {
      const data = await api.login(
        document.getElementById('login-user').value.trim(),
        document.getElementById('login-pass').value,
      );
      api.setSession(data.token, data.admin);
      showDash();
      await refreshAll();
      toast('Signed in');
    } catch (err) {
      loginError.textContent = err.message || 'Login failed';
      loginError.classList.remove('hidden');
    }
  });

  document.getElementById('btn-logout').addEventListener('click', () => {
    api.clearSession();
    showLogin();
  });

  document.getElementById('btn-refresh').addEventListener('click', () => {
    refreshAll().then(() => toast('Refreshed')).catch((e) => toast(e.message));
  });
  document.getElementById('pricing-tbody').addEventListener('input', (e) => {
    const input = e.target.closest('[data-price-input]');
    if (!input) return;
    const preview = input.closest('tr')?.querySelector('[data-price-preview]');
    const value = Number(input.value);
    if (preview) {
      preview.textContent = Number.isFinite(value) && value > 0
        ? `₹${value.toLocaleString('en-IN')}`
        : '—';
    }
  });
  document.getElementById('pricing-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = document.getElementById('btn-save-pricing');
    const plans = [...document.querySelectorAll('#pricing-tbody tr[data-plan-id]')].map((row) => ({
      id: row.dataset.planId,
      priceInr: Number(row.querySelector('[data-price-input]')?.value),
    }));
    try {
      button.disabled = true;
      await api.updatePricing(plans);
      await loadPricing();
      toast('Display prices updated');
    } catch (err) {
      toast(err.message || 'Could not update pricing');
    } finally {
      button.disabled = false;
    }
  });
  document.getElementById('btn-reports').addEventListener('click', () => {
    loadReports().catch((e) => toast(e.message));
  });
  document.getElementById('btn-prev').addEventListener('click', () => {
    if (page > 1) {
      page -= 1;
      loadUsers().catch((e) => toast(e.message));
    }
  });
  document.getElementById('btn-next').addEventListener('click', () => {
    if (page < totalPages) {
      page += 1;
      loadUsers().catch((e) => toast(e.message));
    }
  });
  document.getElementById('user-filter').addEventListener('change', () => {
    page = 1;
    loadUsers().catch((e) => toast(e.message));
  });
  document.getElementById('user-q').addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      page = 1;
      loadUsers().catch((e) => toast(e.message));
    }, 300);
  });

  document.getElementById('users-tbody').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const tr = btn.closest('tr[data-id]');
    const id = tr?.dataset?.id;
    if (!id) return;
    const act = btn.dataset.act;
    try {
      btn.disabled = true;
      if (act === 'premium') {
        const plan = window.prompt('Plan: day, week, month, or year', 'month') || 'month';
        await api.grantPremium(id, plan.trim());
        toast('Premium granted');
      } else if (act === 'revoke') {
        if (!window.confirm('Revoke Premium for this user?')) return;
        await api.revokePremium(id);
        toast('Premium revoked');
      } else if (act === 'ban') {
        if (!window.confirm('Ban this user? They will not be able to log in.')) return;
        await api.ban(id, true);
        toast('User banned');
      } else if (act === 'unban') {
        await api.ban(id, false);
        toast('User unbanned');
      } else if (act === 'delete') {
        if (!window.confirm('Permanently delete this user and all related data?')) return;
        await api.deleteUser(id);
        toast('User deleted');
      }
      await refreshAll();
    } catch (err) {
      toast(err.message || 'Action failed');
    } finally {
      btn.disabled = false;
    }
  });

  // Boot
  api.credentialsHint?.().then((h) => {
    if (h?.hint) loginHint.textContent = h.hint;
    else if (h?.defaultUsername) loginHint.textContent = `Default user: ${h.defaultUsername}`;
  }).catch(() => {});

  if (api.getToken()) {
    showDash();
    refreshAll().catch((e) => {
      toast(e.message || 'Session expired');
      api.clearSession();
      showLogin();
    });
  } else {
    showLogin();
  }
})();
