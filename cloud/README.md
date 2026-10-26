# Cloud browser for the web version

In the web version (GitHub Pages), most big websites refuse to be shown inside the Naenara browser.
With the cloud browser, each Naenara tab shows a real Chrome running on [Hyperbeam](https://hyperbeam.com) servers, so every website works.
The desktop app (`Red Star OS.bat`) does not need any of this.

This small server (a Cloudflare Worker) keeps the Hyperbeam API key secret and limits usage.

## 1. Get the two accounts

- **Hyperbeam**: create an account and get an API key from the dashboard. Their documentation says to contact them on Discord or by email if you don't get one. Sessions use Hyperbeam credits.
- **Cloudflare**: a free account is enough for the Worker.

## 2. Deploy the Worker

Requires [Node.js](https://nodejs.org). In a terminal, inside this `cloud` folder:

```bash
npx wrangler login
```

```bash
npx wrangler secret put HB_API_KEY
```

Paste the Hyperbeam API key when asked. It is stored encrypted by Cloudflare and never appears in the code.

```bash
npx wrangler deploy
```

At the end, Wrangler prints the Worker address, for example `https://redstar-cloud-browser.yourname.workers.dev`.

## 3. Turn it on in the site

Put that address in `js/cloud-config.js`:

```js
window.RS_CLOUD = {
  endpoint: 'https://redstar-cloud-browser.yourname.workers.dev'
};
```

Commit and push. GitHub Pages updates the site in about a minute.

## Limits (to protect your credits)

Set in `wrangler.toml`, then run `npx wrangler deploy` again:

| Setting | Default | Meaning |
|---|---|---|
| `ALLOWED_ORIGINS` | `https://adrenaline91.github.io` | Only this site can open cloud browsers |
| `MAX_SESSIONS` | `3` | Maximum cloud browsers open at the same time. Others see "too many people" |
| `MAX_SECONDS` | `1800` | A session stops after 30 minutes |
| `REGION` | `EU` | Server region (`EU`, `NA` or `AS`) |

A session also stops after 10 minutes without activity, when its tab is closed, and when the page is closed.
