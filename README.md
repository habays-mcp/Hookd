# hookd

Hyfa's crochet app: granny squares, bags, colours, stitches and yarn, with realistic photos made by Cloudflare Workers AI (FLUX.2 [klein]).

## Folders
- `public/index.html` – the landing page (features and install steps)
- `public/app/` – the hookd app itself
- `src/worker.js` – serves the app and makes realistic photos at `/api/render`
- `wrangler.jsonc` – Cloudflare settings (turns on Workers AI as `AI`)

## Deploy (GitHub → Cloudflare)
1. Create a private GitHub repo called `hookd` and upload everything in this folder.
2. Cloudflare dashboard → Workers & Pages → Create → Import a repository → pick `hookd` → Deploy.
   Cloudflare reads `wrangler.jsonc`, so the app and the Workers AI connection are set up for you.
3. Open the `hookd.<your-subdomain>.workers.dev` link on her iPhone in Safari → Share → Add to Home Screen.

## Optional passcode
Workers & Pages → hookd → Settings → Variables and Secrets → add a secret `HOOKD_KEY`.
Then enter the same passcode in hookd → Settings → Realistic photos.

## Costs
Workers AI includes 10,000 free Neurons a day. On the free Workers plan the photo button simply stops
for the day when that's used up; nothing is charged.

## Updating
Upload the new files to the repo; Cloudflare redeploys automatically.
