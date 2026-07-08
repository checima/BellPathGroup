// ============================================================================
// Bell Path Group — contact form relay
// Receives a contact-form submission from the browser and forwards it to
// Web3Forms *server-side*, attaching the access key from an environment
// variable (WEB3FORMS_ACCESS_KEY). The key therefore never appears in the
// repository or in anything sent to the browser.
//
// Free spam protection (replaces Web3Forms' paid "Allowed Domains" feature):
//   1. Origin allow-list  — reject submissions not coming from our own site.
//   2. Honeypot           — silently drop bots that fill the hidden field.
//   3. Basic validation   — require a name + a real-looking email.
//
// Runtime: Netlify Functions on Node 18+ (global `fetch` is built in — no
// dependencies, no package.json required).
// ============================================================================

// The only sites allowed to submit this form. Add your Netlify preview URL
// (e.g. 'https://bellpathgroup.netlify.app') here if you want to test there.
var ALLOWED_ORIGINS = [
  'https://www.bellpathgroup.com',
  'https://bellpathgroup.com'
];

exports.handler = async function (event) {
  // Only accept POST.
  if (event.httpMethod !== 'POST') {
    return json(405, { success: false, message: 'Method not allowed.' });
  }

  // ---- 1. Origin check (free "domain restriction") -----------------------
  // Real browsers always send an Origin header on a POST from our own pages.
  // Off-site abuse (a form embedded elsewhere) carries a different Origin,
  // and header-less bots send none — both are rejected here.
  var origin = header(event, 'origin');
  var referer = header(event, 'referer');
  var fromAllowedSite = ALLOWED_ORIGINS.some(function (o) {
    return origin === o || referer === o || referer.indexOf(o + '/') === 0;
  });
  if (!fromAllowedSite) {
    return json(403, { success: false, message: 'Forbidden.' });
  }

  var accessKey = process.env.WEB3FORMS_ACCESS_KEY;
  if (!accessKey) {
    // Misconfiguration guard: fail loudly server-side, generically client-side.
    return json(500, { success: false, message: 'Form is not configured. Please email us directly.' });
  }

  // Parse the submission. The browser sends JSON; be tolerant of urlencoded.
  var fields;
  try {
    var contentType = (header(event, 'content-type')).toLowerCase();
    if (contentType.indexOf('application/x-www-form-urlencoded') !== -1) {
      fields = {};
      new URLSearchParams(event.body || '').forEach(function (value, key) { fields[key] = value; });
    } else {
      fields = JSON.parse(event.body || '{}');
    }
  } catch (e) {
    return json(400, { success: false, message: 'Invalid submission.' });
  }

  // ---- 2. Honeypot -------------------------------------------------------
  // The hidden `botcheck` field is invisible to humans. If it's filled, a bot
  // did it — return a fake success so the bot moves on, but send nothing.
  if (fields.botcheck) {
    return json(200, { success: true, message: 'Thank you.' });
  }

  // ---- 3. Basic validation ----------------------------------------------
  var name = (fields.name || '').trim();
  var email = (fields.email || '').trim();
  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { success: false, message: 'Please provide your name and a valid email.' });
  }

  // The client must never be able to set or override the access key.
  delete fields.access_key;

  var payload = Object.assign({}, fields, { access_key: accessKey });

  try {
    var res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });
    var data = await res.json();
    // Pass Web3Forms' own JSON straight back so the front-end can keep
    // checking `data.success` exactly as before.
    return json(res.status, data);
  } catch (e) {
    return json(502, { success: false, message: 'Could not reach the mail service. Please try again.' });
  }
};

// Read a header case-insensitively (Netlify lower-cases them, but be safe).
function header(event, name) {
  var h = event.headers || {};
  return h[name] || h[name.toLowerCase()] || h[name.toUpperCase()] || '';
}

function json(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}
