import { SIGNATURE_TEXT, SIGNATURE_HTML } from "./signature.js";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Plain-text letters use blank lines between paragraphs; wrap each as <p>
// so line breaks survive in HTML email clients instead of collapsing.
function textToHtml(text) {
  return text
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

// Appends the fixed signature to a letter body, once, so both the actual
// send and the sent_emails log always reflect exactly what was mailed.
export function buildEmailBody(letterText) {
  return {
    text: `${letterText}\n\n${SIGNATURE_TEXT}`,
    html: `${textToHtml(letterText)}\n${SIGNATURE_HTML}`,
  };
}

export async function sendMail({ to, toName, subject, text, html }) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.CONTACT_EMAIL;
  const senderName = process.env.CONTACT_NAME;
  if (!apiKey || !senderEmail) {
    throw new Error("BREVO_API_KEY and CONTACT_EMAIL must be configured");
  }

  const res = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: senderName || senderEmail, email: senderEmail },
      to: [{ email: to, name: toName || undefined }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo API error ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}
