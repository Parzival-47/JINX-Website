# Validation — revised editorial edition

- All 7 existing server tests passed. Email-provider calls were mocked; no real inquiry email was sent.
- Home, Music, Visuals, About, Shop, Contact and Privacy checked at 1440 px desktop and 390 px mobile widths.
- Opening-screen composition additionally checked at 320 × 568, 390 × 844, 768 × 1024, 1440 × 900 and 1920 × 1080.
- Logo and entry button are visible in the opening viewport at all five sizes. Artist crops were visually reviewed on desktop, phone and tablet.
- No missing image assets, horizontal overflow or browser errors in the completed page checks.
- Mobile menu, Objects inquiry prefill, gallery filters, lightbox and streaming dialogs passed.
- Spotify loads only after the visitor requests its embedded player.
- Blank and whitespace-only explanations cannot submit; a valid form was checked with a mocked success response.
- Public copy and metadata checked for retired wording, profanity and location details. Existing official social account handles remain only in their links.
- Final artwork uses the approved likeness as reference; all generated portraits are labelled editorial concepts in the gallery.
- Reduced-motion settings disable motion. The normal-motion header, logo reflection and scroll reveal behavior remain in place.

Real email delivery still needs the private Brevo key and verified sender described in README.md.
