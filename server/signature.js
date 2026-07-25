// Fixed email signature, appended to every outreach letter at send time
// (server/mailer.js) -- never edited per-company, never AI-generated.

export const SIGNATURE_TEXT = `Marco Maffei
+393926449096 🇮🇹
+32471553623 🇧🇪
https://www.tech-paw.com/
Tech Paw
BE0802503665
marco@tech-paw.com

Twitter: https://x.com/MarcoMaffei3
LinkedIn: https://www.linkedin.com/in/marco-maffei-ninja-io/
GitHub: https://github.com/orso081980`;

// Icons are hosted as real PNG files (public/email-icons/, pushed to the
// public job-seeker GitHub repo) and referenced by a normal https:// URL --
// NOT inline <svg> and NOT a data: URI. Both of those get stripped by some
// webmail clients (Zoho in particular strips data: URIs outright as an
// anti-spam measure) regardless of whether the image itself is valid. A
// plain hosted <img src="https://..."> is the one approach that reliably
// survives every client's sanitizer.
const ICONS_BASE = "https://raw.githubusercontent.com/orso081980/job-seeker/main/public/email-icons";

function icon(name, alt) {
  return `<img src="${ICONS_BASE}/${name}.png" width="16" height="16" alt="${alt}" style="vertical-align:middle;border:0">`;
}

export const SIGNATURE_HTML = `<p>
<strong>Marco Maffei</strong><br>
+393926449096 🇮🇹<br>
+32471553623 🇧🇪<br>
${icon("website", "Website")} <a href="https://www.tech-paw.com/">https://www.tech-paw.com/</a><br>
<strong>Tech Paw</strong><br>
BE0802503665<br>
marco@tech-paw.com
</p>
<p>
<a href="https://x.com/MarcoMaffei3" title="Twitter">${icon("twitter", "Twitter")}</a>&nbsp;&nbsp;
<a href="https://www.linkedin.com/in/marco-maffei-ninja-io/" title="LinkedIn">${icon("linkedin", "LinkedIn")}</a>&nbsp;&nbsp;
<a href="https://github.com/orso081980" title="GitHub">${icon("github", "GitHub")}</a>
</p>`;
