/**
 * MatchedIn site configuration — override via <meta> tags in HTML head.
 */
(function (global) {
  const PRODUCTION_API =
    'http://promatch-api-env.eba-rt5gymna.ap-south-1.elasticbeanstalk.com';

  function metaContent(name) {
    const el = document.querySelector(`meta[name="${name}"]`);
    return el?.getAttribute('content')?.trim() || '';
  }

  function useApiProxy() {
    return metaContent('linkedup-api-proxy') === 'true';
  }

  function resolveApiBaseUrl() {
    const fromMeta = metaContent('linkedup-api-url');
    if (fromMeta) return fromMeta.replace(/\/$/, '');

    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5000';
    }

    // Netlify build sets proxy meta — API calls go to same origin (/auth, /users)
    if (useApiProxy()) {
      return window.location.origin;
    }

    return PRODUCTION_API;
  }

  global.LinkedUpSite = {
    apiBaseUrl: resolveApiBaseUrl(),
    supportEmail: metaContent('linkedup-support-email') || 'help@matchedin.app',
    authTokenKey: 'linkedup_auth_token',
    authUserKey: 'linkedup_auth_user',
  };
})(window);
