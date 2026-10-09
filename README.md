# J!NX — Website · revised editorial edition

A complete rebuild for J!NX, using separate Home, Music, Visuals, About, Shop and Contact pages. The project opens on the artist and a slanted chrome wordmark in one full-screen composition. Reflective pink/chrome scenery, varied portraits, original release covers and a city-at-night footer carry the direction across all pages. It includes self-hosted fonts, an inquiry-only Objects collection and an email intake server.

## Run in Visual Studio Code

1. Extract the ZIP and open the **JINX-Website** folder in VS Code. Open the folder containing `package.json`, `server.js` and `public`.
2. In VS Code, open **Terminal → New Terminal** and select **Git Bash**.
3. Check that Node.js 22 or newer is installed:

   ```bash
   node --version
   ```

4. Start the project:

   ```bash
   npm ci
   npm start
   ```

5. Open **http://localhost:3000** in your browser. Stop the server with **Ctrl+C**.

For automatic restart when you edit the server, use `npm run dev`. Refresh the browser after changing page content, styles or artwork.

The pages and visual assets work locally before email setup. Until the email service is configured, a valid inquiry displays a delivery error and a direct email link. It does not claim that the message was sent.

## Enable inquiry emails with Brevo

The only public contact email is **vandalenzan102@gmail.com**. All website inquiries go to that address; the sender's address becomes the email's Reply-To.

1. Open a Brevo account, or use your existing account.
2. Add **vandalenzan102@gmail.com** as a sender with display name **J!NX Website**, and complete the verification Brevo sends to that inbox. This is a separate sender identity from any other brand in the account.
3. Create a Brevo API key. Keep it private. Do not put the key in the browser JavaScript, a public page or GitHub.
4. For local testing, copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

   Enter the real key in `.env`:

   ```dotenv
   BREVO_API_KEY=your_private_api_key_here
   BREVO_SENDER_EMAIL=vandalenzan102@gmail.com
   CONTACT_EMAIL=vandalenzan102@gmail.com
   APP_ORIGIN=https://zanepierre.onrender.com
   PORT=3000
   ```

5. Restart `npm start`. Submit one real inquiry with your own email address and a clear explanation. Check the artist's inbox and spam folder, and Brevo's transactional email log. The success message means Brevo accepted the email; inbox arrival still depends on email delivery.

The form requires name, email, a contact reason and a meaningful explanation. The explanation must contain at least 20 characters after whitespace is collapsed, and no more than 3,000 characters. The server enforces the same checks if browser validation is bypassed. It also includes a hidden spam field and a limit of five submissions per 15 minutes per client. No inquiry database or persistent disk is required.

**Only the configured artist mailbox receives an inquiry.** Visitor-submitted fields cannot change the recipient.

## Replace the existing GitHub / Render website

Preview locally first. Keep the existing repository's `.git` folder so its connection and history remain intact.

1. Create a working branch in your existing repository:

   ```bash
   git switch -c jinx-rebrand
   ```

2. Copy the contents of **JINX-Website** into the root of that repository. The new `package.json` and `server.js` replace the old versions. The new pages live inside `public/`.
3. The old root HTML, CSS, JavaScript, `images/` and `zp2/` are no longer needed for this build. Remove them from the working branch after confirming the new build. The new server serves only `public/`, so old root files cannot appear as live pages.
4. Do not upload `.env` or `node_modules`. The included `.gitignore` excludes them. If the old repository already tracks `node_modules`, remove those tracked copies from Git as part of the cleanup.
5. Commit and push the branch when your review is complete. Merge it into the branch your existing Render service deploys.

Use these settings for the existing **Render Web Service**:

| Setting | Value |
|---|---|
| Build command | `npm ci` |
| Start command | `npm start` |
| Health check path | `/api/health` |
| Runtime | Node.js 22 or newer |
| Root directory | Repository root, unless your repository places this project in a subfolder |

In Render's **Environment** tab, add `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `CONTACT_EMAIL` and `APP_ORIGIN` using the values above. Render supplies `PORT`; the server uses it and listens on `0.0.0.0`.

Use a Web Service for this project because sending inquiry emails requires the server. A static-only deployment will display the pages but cannot process the contact form.

The supplied canonical URLs and social-sharing image URLs use the existing **zanepierre.onrender.com** address. If you change the domain, replace that origin in the public HTML files and `APP_ORIGIN`. The Instagram username is retained only in its actual link; it is not displayed as part of the J!NX brand.

## Files you will edit

| Change | File |
|---|---|
| Entrance and Home content | `public/index.html` |
| Releases and original covers | `public/music.html` |
| Visual gallery | `public/visuals.html` |
| Artist story | `public/about.html` |
| Upcoming Objects and inquiries | `public/shop.html` |
| Required intake fields and public email | `public/contact.html` |
| Privacy copy | `public/privacy.html` |
| Revised layouts, textured backgrounds, colour and motion | `public/assets/editorial.css` |
| Shared controls and base styles | `public/assets/style.css` |
| Gallery, menus, stream links and client form behavior | `public/assets/app.js` |
| Email delivery and server validation | `server.js` |
| Image assets | `public/assets/images/` |
| Transparent full-resolution logo | `brand/JINX-Chrome-Logo.png` |

The navigation and footer are present in every HTML page, so changes to those shared elements should be applied across all pages.

## Release data

The original artwork and direct Spotify links were recovered from the artist profile supplied for this project. Previously released artist credits remain **Zane-Pierre**, matching the releases.

| Release | Direct Spotify link |
|---|---|
| Static Rebel | https://open.spotify.com/track/5EhdfUMwMjuetnnQ3K8duB |
| Chromatic Dreams | https://open.spotify.com/track/6YRsF8P7ioSrsn903rhSmI |

There are no invented release titles, release dates, product prices or music videos. The next music chapter stays unnamed. The Visuals page distinguishes editorial concepts, collection concepts, original release artwork and the artist photograph.

Spotify players are loaded only after the visitor chooses **Play here with Spotify**. Social and streaming links open the supplied official profiles or verified releases.

## Artwork and brand

The wordmark and fashion artwork were created with the built-in image generation tool. The artist's official profile photograph and approved first-build portraits were the likeness references; the supplied screenshots guided the slanted logo, styling and hero composition. These are new editorial concepts, rather than photographs documenting a real photoshoot.

The objects image is a collection concept. Final designs, prices and availability are not announced. There is no cart, payment checkout or purchase button. Category inquiries open the contact form with the relevant reason and interest selected, and still require a written explanation.

The public site contains clean language and no location details. **J!NX** is the brand; the earlier profile wording is not used as visible branding.

## Review previews

`preview/JINX-Home-Desktop-v2.png` and `preview/JINX-Home-Mobile-v2.png` show the opening screen. The other images in `preview/` show complete page layouts. The transparent full-resolution logo is in `brand/JINX-Chrome-Logo.png`.

## Validation

Run the server tests with:

```bash
npm test
```

The included tests check required explanations, recipient restrictions, email-provider failure handling, unconfigured delivery, contact fields, cross-site requests, rate limiting and restricted server files. They use a mocked email provider and do not send real emails.

Desktop and mobile layouts, menu behavior, Objects inquiry prefill, gallery filters, lightbox and streaming dialogs were checked in Chromium. The contact flow was checked with a mocked success response and blank-explanation rejection. A real mailbox delivery test still requires your Brevo key and verified sender.

## Documentation

- Brevo email API: https://developers.brevo.com/reference/send-transac-email
- Render Web Services and port binding: https://render.com/docs/web-services#port-binding
- Node.js: https://nodejs.org/

Font licenses are included with the self-hosted font assets.
