/**
 * MATCHEDIN marketing site — navigation, forms, and API-backed account actions.
 */
(function () {
  const PAGES = {
    home: 'index.html',
    faq: 'faq.html',
    safety: 'safety.html',
    privacy: 'privacy.html',
    contact: 'contact.html',
    guidelines: 'community-guidelines.html',
    deleteAccount: 'delete-account.html',
    playStore: 'play-store-guide.html',
    /** Live listing — https://play.google.com/store/apps/details?id=com.linkedup.mobile */
    playStoreApp: 'https://play.google.com/store/apps/details?id=com.linkedup.mobile',
  };

  const NAV_ITEMS = [
    { key: 'home', label: 'Home', href: PAGES.home },
    { key: 'faq', label: 'FAQ', href: PAGES.faq },
    { key: 'safety', label: 'Safety', href: PAGES.safety },
    { key: 'privacy', label: 'Privacy', href: PAGES.privacy },
    { key: 'contact', label: 'Contact', href: PAGES.contact },
  ];

  const supportEmail = () =>
    (window.LinkedUpSite && window.LinkedUpSite.supportEmail) || 'help@matchedin.app';

  function currentPageKey() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    const map = {
      'index.html': 'home',
      'faq.html': 'faq',
      'safety.html': 'safety',
      'privacy.html': 'privacy',
      'contact.html': 'contact',
      'community-guidelines.html': 'guidelines',
      'delete-account.html': 'deleteAccount',
      'play-store-guide.html': 'playStore',
    };
    return map[path] || 'home';
  }

  function showMessage(el, text, type) {
    if (!el) return;
    el.textContent = text || '';
    el.classList.remove('hidden', 'text-error', 'text-primary', 'text-on-surface-variant');
    if (!text) {
      el.classList.add('hidden');
      return;
    }
    el.classList.remove('hidden');
    if (type === 'error') el.classList.add('text-error');
    else if (type === 'success') el.classList.add('text-primary');
    else el.classList.add('text-on-surface-variant');
  }

  function setBusy(btn, busy, busyLabel) {
    if (!btn) return;
    if (busy) {
      if (!btn.dataset.originalHtml) btn.dataset.originalHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[20px]">sync</span> ${busyLabel || 'Please wait…'}`;
    } else {
      btn.disabled = false;
      if (btn.dataset.originalHtml) btn.innerHTML = btn.dataset.originalHtml;
    }
  }

  function initMobileNav() {
    const panel = document.getElementById('mobile-nav-panel');
    const backdrop = document.getElementById('mobile-nav-backdrop');
    const menuButtons = document.querySelectorAll('[data-mobile-menu-toggle]');
    if (!panel || menuButtons.length === 0) return;

    const close = () => {
      panel.classList.add('translate-x-full');
      panel.setAttribute('aria-hidden', 'true');
      backdrop?.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    };

    const open = () => {
      panel.classList.remove('translate-x-full');
      panel.setAttribute('aria-hidden', 'false');
      backdrop?.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
    };

    menuButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const hidden = panel.classList.contains('translate-x-full');
        hidden ? open() : close();
      });
    });

    backdrop?.addEventListener('click', close);
    panel.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  function injectMobileNavIfMissing() {
    if (document.getElementById('mobile-nav-panel')) return;

    const active = currentPageKey();
    const linksHtml = NAV_ITEMS.map((item) => {
      const isActive = item.key === active;
      const cls = isActive
        ? 'text-secondary font-bold border-l-4 border-secondary pl-3'
        : 'text-on-surface-variant hover:text-primary pl-3';
      return `<a class="block py-3 font-body-md ${cls}" href="${item.href}">${item.label}</a>`;
    }).join('');

    const extra = `
      <a class="block py-3 pl-3 text-on-surface-variant hover:text-primary font-body-md" href="${PAGES.guidelines}">Community Guidelines</a>
      <a class="block py-3 pl-3 text-on-surface-variant hover:text-primary font-body-md" href="${PAGES.deleteAccount}">Delete Account</a>
    `;

    const html = `
      <div id="mobile-nav-backdrop" class="hidden fixed inset-0 z-[60] bg-black/40 md:hidden" aria-hidden="true"></div>
      <aside id="mobile-nav-panel" class="fixed top-0 right-0 z-[70] h-full w-72 max-w-[85vw] bg-surface-container-lowest shadow-xl transform translate-x-full transition-transform duration-300 md:hidden pt-20 px-6" aria-hidden="true">
        <p class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-4">Menu</p>
        <nav class="flex flex-col gap-1">${linksHtml}${extra}</nav>
      </aside>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  }

  function wireMenuButtons() {
    document.querySelectorAll('header button.md\\:hidden, header button[class*="md:hidden"], nav button.md\\:hidden').forEach((btn) => {
      if (btn.querySelector('.material-symbols-outlined')?.textContent?.trim() === 'menu') {
        btn.setAttribute('data-mobile-menu-toggle', '');
        btn.setAttribute('aria-label', 'Open menu');
        btn.setAttribute('type', 'button');
      }
    });
  }

  function initHeaderScroll() {
    const header = document.querySelector('header, nav.fixed');
    if (!header) return;
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('shadow-md');
        header.classList.remove('shadow-sm');
      } else {
        header.classList.remove('shadow-md');
        header.classList.add('shadow-sm');
      }
    });
  }

  function initLogoLinks() {
    document.querySelectorAll('header .font-headline-md.font-bold.text-primary, nav .font-headline-md.font-bold.text-primary').forEach((el) => {
      if (el.closest('a')) return;
      const a = document.createElement('a');
      a.href = PAGES.home;
      a.className = el.className;
      a.setAttribute('aria-label', 'MATCHEDIN Home');
      el.parentNode.insertBefore(a, el);
      a.appendChild(el);
    });
  }

  function initReportButtons() {
    document.querySelectorAll('button, a').forEach((el) => {
      const text = el.textContent?.trim();
      if (text === 'Report a Concern' && el.tagName === 'BUTTON' && !el.closest('a')) {
        el.addEventListener('click', () => {
          window.location.href = `${PAGES.contact}?topic=report`;
        });
      }
    });
  }

  function initSupportMailtoLinks() {
    const email = supportEmail();
    document.querySelectorAll('a[href^="mailto:"]').forEach((a) => {
      const href = a.getAttribute('href') || '';
      if (
        href.includes('linkedup.') ||
        href.includes('support@') ||
        href.includes('infomatchedin@gmail.com') ||
        href.includes('help@matchedin.app')
      ) {
        const query = href.includes('?') ? href.slice(href.indexOf('?')) : '';
        a.href = `mailto:${email}${query}`;
      }
    });
  }

  function initFaqAccordion() {
    if (typeof window.toggleAccordion === 'function') return;

    window.toggleAccordion = function toggleAccordion(button) {
      const parent = button.closest('.accordion-item');
      if (!parent) return;
      const isActive = parent.classList.contains('active');

      document.querySelectorAll('.accordion-item').forEach((item) => {
        item.classList.remove('active', 'bg-surface-container-high');
      });

      if (!isActive) {
        parent.classList.add('active', 'bg-surface-container-high');
      }
    };

    document.querySelectorAll('.accordion-item button').forEach((btn) => {
      if (btn.getAttribute('onclick')) return;
      btn.addEventListener('click', () => window.toggleAccordion(btn));
    });
  }

  function initContactForm() {
    const form = document.getElementById('contact-form') || document.getElementById('contactForm');
    if (!form) return;

    const topicSelect = form.querySelector('[name="topic"], select');
    const params = new URLSearchParams(window.location.search);
    const topicParam = params.get('topic');
    if (topicParam === 'report' && topicSelect) {
      const reportOption = Array.from(topicSelect.options).find((o) =>
        /report|abuse|concern/i.test(o.text),
      );
      if (reportOption) topicSelect.value = reportOption.value;
      else {
        const opt = document.createElement('option');
        opt.value = 'Report a concern';
        opt.textContent = 'Report a concern';
        opt.selected = true;
        topicSelect.insertBefore(opt, topicSelect.firstChild);
      }
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.querySelector('[name="name"]')?.value?.trim();
      const email = form.querySelector('[name="email"]')?.value?.trim();
      const topic = form.querySelector('[name="topic"]')?.value?.trim() || topicSelect?.value;
      const message = form.querySelector('[name="message"]')?.value?.trim();

      if (!name || !email?.includes('@') || !message) {
        alert('Please fill in your name, email, and message.');
        return;
      }

      const subject = encodeURIComponent(`MATCHEDIN: ${topic || 'Support'}`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\nTopic: ${topic || 'General'}\n\n${message}`,
      );
      window.location.href = `mailto:${supportEmail()}?subject=${subject}&body=${body}`;

      const status = document.getElementById('contact-form-status');
      if (status) {
        showMessage(status, 'Your email app should open with your message ready to send.', 'success');
      }
    });
  }

  function initDeleteAccountFlow() {
    const form = document.getElementById('delete-account-form');
    if (!form || !window.LinkedUpApi) return;

    const emailInput = form.querySelector('#delete-email, [name="email"]');
    const otpInput = form.querySelector('#delete-otp, [name="otp"]');
    const sendOtpBtn = form.querySelector('#delete-send-otp');
    const verifyOtpBtn = form.querySelector('#delete-verify-otp');
    const confirmStep = document.getElementById('delete-step-confirm');
    const verifyStep = document.getElementById('delete-step-verify');
    const successPanel = document.getElementById('delete-success');
    const verifiedEmailEl = document.getElementById('delete-verified-email');
    const statusEl = document.getElementById('delete-status');
    const otpHint = document.getElementById('delete-otp-hint');
    const submitBtn = form.querySelector('[type="submit"], #delete-submit-btn');
    const confirmCheckbox = form.querySelector('[data-confirm-delete]');

    let verifiedEmail = null;

    function hideStepsForSuccess() {
      verifyStep?.classList.add('hidden');
      confirmStep?.classList.add('hidden');
      form.querySelector('.delete-actions-initial')?.classList.add('hidden');
      successPanel?.classList.remove('hidden');
    }

    sendOtpBtn?.addEventListener('click', async () => {
      const email = emailInput?.value?.trim().toLowerCase();
      if (!email?.includes('@')) {
        showMessage(statusEl, 'Enter the email address registered on your MATCHEDIN account.', 'error');
        emailInput?.focus();
        return;
      }
      setBusy(sendOtpBtn, true, 'Sending…');
      showMessage(statusEl, '', '');
      try {
        const res = await window.LinkedUpApi.sendLoginOtp(email);
        showMessage(
          statusEl,
          res?.message || 'Verification code sent. Check your email (dev: use 123456).',
          'info',
        );
        otpInput?.removeAttribute('disabled');
        verifyOtpBtn?.removeAttribute('disabled');
        if (otpHint) otpHint.classList.remove('hidden');
      } catch (e) {
        showMessage(statusEl, e.message || 'Could not send code. Try again.', 'error');
      } finally {
        setBusy(sendOtpBtn, false);
      }
    });

    verifyOtpBtn?.addEventListener('click', async () => {
      const email = emailInput?.value?.trim().toLowerCase();
      const code = otpInput?.value?.trim();
      if (!email?.includes('@') || !code) {
        showMessage(statusEl, 'Enter your email and the verification code.', 'error');
        return;
      }
      setBusy(verifyOtpBtn, true, 'Verifying…');
      showMessage(statusEl, '', '');
      try {
        const res = await window.LinkedUpApi.verifyOtp(email, code);
        window.LinkedUpApi.setSession(res.token, res.user);
        verifiedEmail = res.user?.email || email;
        if (verifiedEmailEl) verifiedEmailEl.textContent = verifiedEmail;
        verifyStep?.classList.add('hidden');
        confirmStep?.classList.remove('hidden');
        showMessage(statusEl, 'Identity verified. Confirm deletion below.', 'success');
      } catch (e) {
        showMessage(statusEl, e.message || 'Invalid or expired code.', 'error');
      } finally {
        setBusy(verifyOtpBtn, false);
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!confirmStep || confirmStep.classList.contains('hidden')) return;

      if (confirmCheckbox && !confirmCheckbox.checked) {
        showMessage(statusEl, 'Please confirm that you understand this action is permanent.', 'error');
        return;
      }

      const sure = window.confirm(
        'Delete your account permanently? Your profile, matches, and messages will be removed. This cannot be undone.',
      );
      if (!sure) return;

      setBusy(submitBtn, true, 'Deleting…');
      showMessage(statusEl, '', '');
      try {
        await window.LinkedUpApi.deleteMyAccount();
        await window.LinkedUpApi.logout();
        window.LinkedUpApi.clearSession();
        hideStepsForSuccess();
        showMessage(statusEl, 'Your account and associated data have been deleted.', 'success');
      } catch (e) {
        showMessage(
          statusEl,
          e.message || 'Could not delete account. Sign in again or email support.',
          'error',
        );
      } finally {
        setBusy(submitBtn, false);
      }
    });

    const existing = window.LinkedUpApi.getToken();
    const user = window.LinkedUpApi.getStoredUser();
    if (existing && user?.email && confirmStep && verifyStep) {
      verifiedEmail = user.email;
      if (verifiedEmailEl) verifiedEmailEl.textContent = verifiedEmail;
      if (emailInput) emailInput.value = verifiedEmail;
      verifyStep.classList.add('hidden');
      confirmStep.classList.remove('hidden');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    injectMobileNavIfMissing();
    wireMenuButtons();
    initMobileNav();
    initHeaderScroll();
    initLogoLinks();
    initReportButtons();
    initSupportMailtoLinks();
    initFaqAccordion();
    initContactForm();
    initDeleteAccountFlow();
  });
})();
