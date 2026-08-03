/**
 * MatchedIn admin dashboard UI.
 */
(function () {
  const api = window.MatchedInAdminApi;
  if (!api) return;

  let page = 1;
  let totalPages = 1;
  let searchTimer = null;
  let premiumTargetId = null;
  let currentTab = 'overview';

  const loginView = document.getElementById('login-view');
  const dashView = document.getElementById('dash-view');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const loginHint = document.getElementById('login-hint');
  const toastEl = document.getElementById('toast');
  const drawer = document.getElementById('user-drawer');
  const drawerBackdrop = document.getElementById('drawer-backdrop');
  const premiumModal = document.getElementById('premium-modal');
  const promoToggle = document.getElementById('promo-enabled');

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
      return new Date(v).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
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

  function apiBase() {
    return (window.LinkedUpSite?.apiBaseUrl || 'http://localhost:5001').replace(/\/$/, '');
  }

  /** Make /uploads/... and other relative photo paths loadable from the admin origin. */
  function resolvePhotoUrl(url) {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) return trimmed;
    if (trimmed.startsWith('/')) return `${apiBase()}${trimmed}`;
    return trimmed;
  }

  function collectPhotoUrls(user) {
    const list = [];
    const push = (u) => {
      const resolved = resolvePhotoUrl(u);
      if (resolved && !list.includes(resolved)) list.push(resolved);
    };
    if (Array.isArray(user?.photo_urls)) user.photo_urls.forEach(push);
    push(user?.photo_url || user?.imageUrl || user?.photo);
    return list;
  }

  function avatarHtml(url, name, sizeClass = 'h-10 w-10') {
    const src = resolvePhotoUrl(url);
    const initial = escapeHtml(String(name || '?').trim().charAt(0).toUpperCase() || '?');
    if (!src) {
      return `<div class="${sizeClass} rounded-full bg-stone-200 text-stone-600 grid place-items-center text-sm font-bold shrink-0">${initial}</div>`;
    }
    return `<img src="${escapeHtml(src)}" alt="" class="${sizeClass} rounded-full object-cover bg-stone-100 shrink-0" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling&&(this.nextElementSibling.style.display='grid');"/><div class="${sizeClass} rounded-full bg-stone-200 text-stone-600 place-items-center text-sm font-bold shrink-0" style="display:none">${initial}</div>`;
  }

  /** ISO → value for datetime-local in local timezone */
  function toLocalInput(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function fromLocalInput(value) {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  function setTab(tab) {
    currentTab = tab;
    document.querySelectorAll('#dash-nav .nav-tab').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.panel-section').forEach((panel) => {
      panel.classList.toggle('is-active', panel.id === `panel-${tab}`);
    });
    try {
      history.replaceState(null, '', `#${tab}`);
    } catch (_) {
      /* ignore */
    }
  }

  function promoStatusLabel(p) {
    if (!p) return { text: 'Unknown', cls: 'badge-muted' };
    if (p.activeNow) return { text: 'Live now', cls: 'badge-ok' };
    if (p.enabled) return { text: 'Scheduled / waiting', cls: 'badge-warn' };
    return { text: 'Off', cls: 'badge-muted' };
  }

  function renderLaunchForm(p) {
    const badge = promoStatusLabel(p);
    document.getElementById('launch-status-badge').innerHTML =
      `<span class="badge ${badge.cls}">${badge.text}</span>`;

    promoToggle.classList.toggle('on', Boolean(p?.enabled));
    promoToggle.setAttribute('aria-pressed', p?.enabled ? 'true' : 'false');
    document.getElementById('promo-start').value = toLocalInput(p?.start);
    document.getElementById('promo-end').value = toLocalInput(p?.end);

    document.getElementById('launch-meta').textContent = p?.configSource
      ? `Settings source: ${p.configSource}${p.updatedAt ? ` · saved ${fmtDate(p.updatedAt)}` : ''}`
      : '';

    document.getElementById('launch-stats').innerHTML = [
      ['Free months granted', p?.grantsTotal ?? 0],
      ['Still active', p?.grantsActive ?? 0],
      ['Grant plan', p?.grantPlan || 'month'],
      ['Grant length', `${p?.grantDays || 30} days`],
    ]
      .map(
        ([label, n]) => `
      <div class="stat-card p-4">
        <div class="text-xl font-semibold">${escapeHtml(String(n))}</div>
        <div class="text-xs uppercase tracking-wide text-stone-500 mt-1">${escapeHtml(label)}</div>
      </div>`,
      )
      .join('');

    const overview = document.getElementById('overview-promo-card');
    overview.innerHTML = `
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div class="text-sm font-semibold">Launch offer</div>
          <div class="text-sm text-stone-500 mt-1">
            ${
              p?.activeNow
                ? 'New signups are getting 30 days Premium free.'
                : p?.enabled
                  ? `Enabled · window ${fmtDate(p.start)} → ${fmtDate(p.end)}`
                  : 'Currently off. Turn it on from the Launch offer tab.'
            }
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="badge ${badge.cls}">${badge.text}</span>
          <button type="button" class="btn btn-ghost" data-goto="launch">Manage</button>
        </div>
      </div>`;
  }

  async function loadStats() {
    const s = await api.stats();
    const promo = s.launchPromo || {};
    const items = [
      ['Users', s.users],
      ['Onboarded', s.onboarded],
      ['Premium', s.premium],
      ['Active subs', s.activeSubscriptions],
      ['Launch grants', promo.grantsActive ?? s.launchPromoGrants ?? 0],
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
    renderLaunchForm(promo);
  }

  async function loadLaunchPromo() {
    const p = await api.launchPromo();
    renderLaunchForm(p);
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

  function sourceLabel(source) {
    if (source === 'launch_promo') return 'Launch offer';
    if (source === 'admin_dashboard') return 'Admin grant';
    if (!source) return '';
    return String(source);
  }

  async function loadUsers() {
    const q = document.getElementById('user-q').value.trim();
    const filter = document.getElementById('user-filter').value;
    const data = await api.users({ q, filter, page, limit: 25 });
    totalPages = data.totalPages || 1;
    document.getElementById('users-meta').textContent =
      `${data.total} users · page ${data.page}/${totalPages}`;
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
        if (u.subscription?.source === 'launch_promo') {
          badges.push('<span class="badge badge-gold">Launch offer</span>');
        }
        if (!u.onboarding_complete) badges.push('<span class="badge badge-warn">Incomplete</span>');
        if (u.linkedin_verified) badges.push('<span class="badge badge-muted">Verified</span>');
        if (!badges.length) badges.push('<span class="badge badge-muted">Active</span>');

        const sub = u.subscription?.plan
          ? `<div class="text-xs text-stone-400 mt-0.5">${escapeHtml(u.subscription.plan)} · until ${fmtDate(u.subscription.expires_at)}${
              u.subscription.source
                ? `<br/>${escapeHtml(sourceLabel(u.subscription.source))}`
                : ''
            }</div>`
          : '';

        return `<tr data-id="${escapeHtml(u.id)}">
          <td>
            <button type="button" class="text-left flex items-center gap-3" data-act="view">
              ${avatarHtml(u.photo_url, u.name)}
              <span class="min-w-0">
                <div class="font-medium">${escapeHtml(u.name || '—')}</div>
                <div class="text-xs text-stone-500 truncate">${escapeHtml(u.email)}</div>
                <div class="text-xs text-stone-400 truncate">${escapeHtml(u.profession || '')}${
                  u.work_environment ? ' · ' + escapeHtml(u.work_environment) : ''
                }</div>
              </span>
            </button>
          </td>
          <td>${escapeHtml(u.city || '—')}</td>
          <td><div class="flex flex-wrap gap-1">${badges.join(' ')}</div></td>
          <td>${sub || '<span class="text-stone-400">—</span>'}</td>
          <td>${fmtDate(u.created_at)}</td>
          <td>
            <div class="flex flex-wrap gap-1">
              <button type="button" class="btn btn-ghost" data-act="view">View</button>
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

  async function openUserDrawer(id) {
    drawer.classList.add('open');
    drawerBackdrop.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    const body = document.getElementById('user-drawer-body');
    body.innerHTML = 'Loading…';
    try {
      const data = await api.user(id);
      const u = data.user || {};
      const sub = data.subscription;
      const st = data.stats || {};
      const photos = collectPhotoUrls(u);
      const photosHtml = photos.length
        ? `<div class="grid grid-cols-3 gap-2">
            ${photos
              .map(
                (src, i) => `
              <a href="${escapeHtml(src)}" target="_blank" rel="noopener noreferrer" class="block aspect-[3/4] rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                <img src="${escapeHtml(src)}" alt="Photo ${i + 1}" class="h-full w-full object-cover" loading="lazy" referrerpolicy="no-referrer"/>
              </a>`,
              )
              .join('')}
          </div>`
        : `<div class="flex items-center gap-3 rounded-xl border border-dashed border-stone-200 p-4 text-stone-400">
            ${avatarHtml(null, u.name, 'h-14 w-14')}
            <span class="text-sm">No profile photos uploaded</span>
          </div>`;

      body.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-start gap-3">
            ${avatarHtml(photos[0] || u.photo_url, u.name, 'h-16 w-16')}
            <div class="min-w-0">
              <div class="text-lg font-semibold text-stone-900">${escapeHtml(u.name || '—')}</div>
              <div class="text-stone-500 truncate">${escapeHtml(u.email || '')}</div>
              <div class="text-xs text-stone-400 mt-1 break-all">ID: ${escapeHtml(u.id || id)}</div>
            </div>
          </div>
          <div>
            <div class="font-semibold text-stone-800 mb-2">Photos${photos.length ? ` · ${photos.length}` : ''}</div>
            ${photosHtml}
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="stat-card p-3"><div class="font-semibold">${st.likesSent ?? 0}</div><div class="text-xs text-stone-500">Likes sent</div></div>
            <div class="stat-card p-3"><div class="font-semibold">${st.likesReceived ?? 0}</div><div class="text-xs text-stone-500">Likes received</div></div>
            <div class="stat-card p-3"><div class="font-semibold">${st.matches ?? 0}</div><div class="text-xs text-stone-500">Matches</div></div>
            <div class="stat-card p-3"><div class="font-semibold">${u.is_banned ? 'Yes' : 'No'}</div><div class="text-xs text-stone-500">Banned</div></div>
          </div>
          <div class="text-sm space-y-1">
            <div><span class="text-stone-400">City</span> · ${escapeHtml(u.city || '—')}</div>
            <div><span class="text-stone-400">Profession</span> · ${escapeHtml(u.profession || '—')}</div>
            <div><span class="text-stone-400">Gender</span> · ${escapeHtml(u.gender || '—')}</div>
            <div><span class="text-stone-400">Age</span> · ${escapeHtml(u.age ?? '—')}</div>
            <div><span class="text-stone-400">Onboarded</span> · ${u.onboarding_complete ? 'Yes' : 'No'}</div>
            <div><span class="text-stone-400">LinkedIn</span> · ${u.linkedin_verified ? 'Verified' : 'No'}</div>
          </div>
          <div class="border-t border-stone-100 pt-4">
            <div class="font-semibold text-stone-800 mb-1">Subscription</div>
            ${
              sub
                ? `<div>${escapeHtml(sub.plan || '')} · until ${fmtDate(sub.expires_at)}</div>
                   <div class="text-xs text-stone-500">${escapeHtml(sourceLabel(sub.source) || sub.source || '')}</div>`
                : '<div class="text-stone-400">None</div>'
            }
          </div>
          <div class="flex flex-wrap gap-2 pt-2" data-drawer-actions data-id="${escapeHtml(id)}">
            ${
              sub
                ? `<button type="button" class="btn btn-ghost" data-act="revoke">Revoke Premium</button>`
                : `<button type="button" class="btn btn-gold" data-act="premium">Grant Premium</button>`
            }
            ${
              u.is_banned
                ? `<button type="button" class="btn btn-ghost" data-act="unban">Unban</button>`
                : `<button type="button" class="btn btn-ghost" data-act="ban">Ban</button>`
            }
          </div>
        </div>`;
    } catch (err) {
      body.innerHTML = `<p class="text-red-600">${escapeHtml(err.message || 'Failed to load')}</p>`;
    }
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    drawerBackdrop.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
  }

  function openPremiumModal(id, label) {
    premiumTargetId = id;
    document.getElementById('premium-modal-user').textContent = label || id;
    document.getElementById('premium-plan').value = 'month';
    premiumModal.classList.add('open');
  }

  function closePremiumModal() {
    premiumTargetId = null;
    premiumModal.classList.remove('open');
  }

  async function loadReports() {
    const data = await api.reports();
    const tbody = document.getElementById('reports-tbody');
    if (!data.reports?.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="text-stone-400 py-6 text-center">No reports yet</td></tr>';
      return;
    }
    tbody.innerHTML = data.reports
      .map(
        (r) => `<tr data-reported-id="${escapeHtml(r.reported_id || '')}">
        <td>${fmtDate(r.created_at)}</td>
        <td>
          <div>${escapeHtml(r.reporter_name || '—')}</div>
          <div class="text-xs text-stone-500">${escapeHtml(r.reporter_email || r.reporter_id)}</div>
        </td>
        <td>
          <div>${escapeHtml(r.reported_name || '—')}</div>
          <div class="text-xs text-stone-500">${escapeHtml(r.reported_email || r.reported_id)}</div>
          ${r.reported_banned ? '<span class="badge badge-bad mt-1">Banned</span>' : ''}
        </td>
        <td>${escapeHtml(r.reason || '—')}</td>
        <td class="max-w-[220px] text-xs text-stone-600">${escapeHtml(r.details || '—')}</td>
        <td>
          <div class="flex flex-wrap gap-1">
            ${
              r.reported_id
                ? `<button type="button" class="btn btn-ghost" data-act="view-reported">View</button>`
                : ''
            }
            ${
              r.reported_id && !r.reported_banned
                ? `<button type="button" class="btn btn-danger" data-act="ban-reported">Ban</button>`
                : ''
            }
          </div>
        </td>
      </tr>`,
      )
      .join('');
  }

  async function refreshAll() {
    await Promise.all([loadStats(), loadPricing(), loadUsers(), loadReports(), loadLaunchPromo()]);
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
      const hash = (location.hash || '').replace('#', '');
      if (['overview', 'launch', 'users', 'pricing', 'safety'].includes(hash)) setTab(hash);
      await refreshAll();
      toast('Signed in');
    } catch (err) {
      loginError.textContent = err.message || 'Login failed';
      loginError.classList.remove('hidden');
    }
  });

  document.getElementById('btn-logout').addEventListener('click', async () => {
    try {
      await api.logout();
    } catch (_) {
      /* Clear the browser session even if the API is unavailable. */
    } finally {
      api.clearSession();
      showLogin();
    }
  });

  document.getElementById('dash-nav').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tab]');
    if (!btn) return;
    setTab(btn.dataset.tab);
  });

  document.querySelectorAll('[data-goto]').forEach((el) => {
    el.addEventListener('click', () => setTab(el.dataset.goto));
  });
  document.getElementById('overview-promo-card').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-goto]');
    if (btn) setTab(btn.dataset.goto);
  });

  document.getElementById('btn-refresh-all').addEventListener('click', () => {
    refreshAll().then(() => toast('Refreshed')).catch((e) => toast(e.message));
  });
  document.getElementById('btn-refresh-users').addEventListener('click', () => {
    loadUsers().then(() => toast('Users refreshed')).catch((e) => toast(e.message));
  });

  promoToggle.addEventListener('click', () => {
    promoToggle.classList.toggle('on');
    promoToggle.setAttribute(
      'aria-pressed',
      promoToggle.classList.contains('on') ? 'true' : 'false',
    );
  });

  document.getElementById('btn-save-promo').addEventListener('click', async () => {
    const start = fromLocalInput(document.getElementById('promo-start').value);
    const end = fromLocalInput(document.getElementById('promo-end').value);
    if (!start || !end) {
      toast('Set both start and end dates');
      return;
    }
    const btn = document.getElementById('btn-save-promo');
    try {
      btn.disabled = true;
      const data = await api.updateLaunchPromo({
        enabled: promoToggle.classList.contains('on'),
        start,
        end,
      });
      renderLaunchForm(data.launchPromo || data);
      await loadStats();
      toast('Launch offer saved');
    } catch (err) {
      toast(err.message || 'Could not save launch offer');
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById('btn-view-promo-users').addEventListener('click', () => {
    document.getElementById('user-filter').value = 'promo';
    page = 1;
    setTab('users');
    loadUsers().catch((e) => toast(e.message));
  });

  document.getElementById('pricing-tbody').addEventListener('input', (e) => {
    const input = e.target.closest('[data-price-input]');
    if (!input) return;
    const preview = input.closest('tr')?.querySelector('[data-price-preview]');
    const value = Number(input.value);
    if (preview) {
      preview.textContent =
        Number.isFinite(value) && value > 0 ? `₹${value.toLocaleString('en-IN')}` : '—';
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

  async function runUserAction(act, id, label) {
    if (act === 'view' || act === 'view-reported') {
      await openUserDrawer(id);
      return;
    }
    if (act === 'premium') {
      openPremiumModal(id, label);
      return;
    }
    if (act === 'revoke') {
      if (!window.confirm('Revoke Premium for this user?')) return;
      await api.revokePremium(id);
      toast('Premium revoked');
    } else if (act === 'ban' || act === 'ban-reported') {
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
      closeDrawer();
    }
    await refreshAll();
    if (drawer.classList.contains('open') && act !== 'delete') {
      await openUserDrawer(id);
    }
  }

  document.getElementById('users-tbody').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const tr = btn.closest('tr[data-id]');
    const id = tr?.dataset?.id;
    if (!id) return;
    const label = tr.querySelector('.font-medium')?.textContent || id;
    try {
      btn.disabled = true;
      await runUserAction(btn.dataset.act, id, label);
    } catch (err) {
      toast(err.message || 'Action failed');
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById('user-drawer-body').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-act]');
    const wrap = e.target.closest('[data-drawer-actions]');
    if (!btn || !wrap) return;
    try {
      btn.disabled = true;
      await runUserAction(btn.dataset.act, wrap.dataset.id);
    } catch (err) {
      toast(err.message || 'Action failed');
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById('reports-tbody').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const tr = btn.closest('tr[data-reported-id]');
    const id = tr?.dataset?.reportedId;
    if (!id) return;
    try {
      btn.disabled = true;
      await runUserAction(btn.dataset.act, id);
    } catch (err) {
      toast(err.message || 'Action failed');
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById('btn-close-drawer').addEventListener('click', closeDrawer);
  drawerBackdrop.addEventListener('click', closeDrawer);

  document.getElementById('btn-premium-cancel').addEventListener('click', closePremiumModal);
  premiumModal.addEventListener('click', (e) => {
    if (e.target === premiumModal) closePremiumModal();
  });
  document.getElementById('btn-premium-confirm').addEventListener('click', async () => {
    if (!premiumTargetId) return;
    const userId = premiumTargetId;
    const plan = document.getElementById('premium-plan').value || 'month';
    const btn = document.getElementById('btn-premium-confirm');
    try {
      btn.disabled = true;
      await api.grantPremium(userId, plan);
      toast('Premium granted');
      closePremiumModal();
      await refreshAll();
      if (drawer.classList.contains('open')) await openUserDrawer(userId);
    } catch (err) {
      toast(err.message || 'Grant failed');
    } finally {
      btn.disabled = false;
    }
  });

  // Boot
  api
    .credentialsHint?.()
    .then((h) => {
      if (h?.hint) loginHint.textContent = h.hint;
      else if (h?.defaultUsername) loginHint.textContent = `Default user: ${h.defaultUsername}`;
    })
    .catch(() => {});

  if (api.getToken()) {
    showDash();
    const hash = (location.hash || '').replace('#', '');
    if (['overview', 'launch', 'users', 'pricing', 'safety'].includes(hash)) setTab(hash);
    refreshAll().catch((e) => {
      toast(e.message || 'Session expired');
      api.clearSession();
      showLogin();
    });
  } else {
    showLogin();
  }
})();
