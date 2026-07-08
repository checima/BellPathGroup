// ============================================================================
// Bell Path Group — contact form relay
// Receives a contact-form submission from the browser and forwards it to
// Web3Forms *server-side*, attaching the access key from an environment
// variable (WEB3FORMS_ACCESS_KEY). The key therefore never appears in the
// repository or in anything sent to the browser.
//
// Runtime: Netlify Functions on Node 18+ (global `fetch` is built in — no
// dependencies, no package.json required).
// ============================================================================

exports.handler = async function (event) {
  // Only accept POST.
  if (event.httpMethod !== 'POST') {
    return json(405, { success: false, message: 'Method not allowed.' });
  }

  var accessKey = process.env.WEB3FORMS_ACCESS_KEY;
  if (!accessKey) {
    // Misconfiguration guard: fail loudly server-side, generically client-side.
    return json(500, { success: false, message: 'Form is not configured. Please email us directly.' });
  }

  // Parse the submission. The browser sends JSON; be tolerant of urlencoded.
  var fields;
  try {
    var contentType = (event.headers['content-type'] || event.headers['Content-Type'] || '').toLowerCase();
    if (contentType.indexOf('application/x-www-form-urlencoded') !== -1) {
      fields = {};
      new URLSearchParams(event.body || '').forEach(function (value, key) { fields[key] = value; });
    } else {
      fields = JSON.parse(event.body || '{}');
    }
  } catch (e) {
    return json(400, { success: false, message: 'Invalid submission.' });
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

function json(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}
