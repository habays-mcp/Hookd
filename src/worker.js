// hookd Worker
// Serves the app from /public and handles POST /api/render, which turns a design
// into a realistic photo with Cloudflare Workers AI (FLUX.2 [klein]).
// Optional: add a secret called HOOKD_KEY in the Cloudflare dashboard, and enter the
// same passcode in hookd > Settings > Realistic photos, so only your phones can use it.

const MODELS = [
  '@cf/black-forest-labs/flux-2-klein-4b', // Quick
  '@cf/black-forest-labs/flux-2-klein-9b', // Best quality
];

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const clamp = (v, lo, hi, d) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};

async function handleRender(request, env) {
  if (request.method !== 'POST') return json({ error: 'Use POST.' }, 405);
  if (env.HOOKD_KEY && request.headers.get('X-Hookd-Key') !== env.HOOKD_KEY) {
    return json({ error: 'Wrong passcode. Check it in hookd Settings.' }, 401);
  }

  let input;
  try {
    input = await request.formData();
  } catch {
    return json({ error: 'The request could not be read.' }, 400);
  }

  const prompt = String(input.get('prompt') || '').slice(0, 2000);
  if (!prompt) return json({ error: 'Missing description.' }, 400);
  const model = MODELS.includes(input.get('model')) ? input.get('model') : MODELS[0];

  // Workers AI FLUX.2 models take multipart form data; input images must be under 512×512.
  const form = new FormData();
  form.append('prompt', prompt);
  form.append('width', String(clamp(input.get('width'), 256, 1280, 768)));
  form.append('height', String(clamp(input.get('height'), 256, 1280, 1024)));
  for (let i = 0; i < 4; i++) {
    const file = input.get(`input_image_${i}`);
    if (file && typeof file !== 'string' && file.size) {
      if (file.size > 4_000_000) return json({ error: 'A photo is too large.' }, 413);
      form.append(`input_image_${i}`, file, file.name || `image${i}`);
    }
  }

  try {
    const body = new Response(form);
    const out = await env.AI.run(model, {
      multipart: { body: body.body, contentType: body.headers.get('content-type') },
    });
    const image = out?.image ?? out?.result?.image;
    if (!image) return json({ error: 'No photo came back. Please try again.' }, 502);
    return json({ image });
  } catch (e) {
    const msg = String(e?.message || e);
    if (/limit|quota|neuron|429|exceeded/i.test(msg)) {
      return json({ error: 'Today’s free allowance for photos is used up. It resets once a day; please try again tomorrow.' }, 429);
    }
    return json({ error: 'The photo service had a problem: ' + msg.slice(0, 200) }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/render') return handleRender(request, env);
    return env.ASSETS.fetch(request);
  },
};
