const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;
const rateStore = globalThis.__m3rRateStore || new Map();
globalThis.__m3rRateStore = rateStore;

function clean(value, max = 1200) {
  return String(value ?? "").trim().slice(0, max);
}

function escapeHtml(value) {
  return clean(value, 5000)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function rateAllowed(ip) {
  const now = Date.now();
  const current = rateStore.get(ip) || [];
  const recent = current.filter((time) => now - time < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) return false;
  recent.push(now);
  rateStore.set(ip, recent);
  return true;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const ip = clean(
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    "unknown",
    100
  );

  if (!rateAllowed(ip)) {
    return res.status(429).json({ ok: false, error: "Too many requests" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

  // Honeypot: real visitors never see or fill this field.
  if (clean(body.website, 200)) {
    return res.status(200).json({ ok: true });
  }

  const startedAt = Number(body.startedAt || 0);
  if (startedAt && Date.now() - startedAt < 1800) {
    return res.status(400).json({ ok: false, error: "Please try again" });
  }

  const name = clean(body.name, 120);
  const phone = clean(body.phone, 80);
  const email = clean(body.email, 180);
  const cityZip = clean(body.cityZip, 180);
  const projectType = clean(body.projectType, 180);
  const preferredContact = clean(body.preferredContact, 100);
  const message = clean(body.message, 4000);
  const language = clean(body.language, 10) === "es" ? "Spanish" : "English";

  if (!name || !phone || !cityZip || !projectType || !message) {
    return res.status(400).json({ ok: false, error: "Missing required fields" });
  }

  const phoneDigits = phone.replace(/\D/g, "");
  if (phoneDigits.length < 7) {
    return res.status(400).json({ ok: false, error: "Invalid phone number" });
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: "Invalid email" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL || "franro1988@gmail.com";
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Muebleria 3R <website@muebleria3r.com>";

  if (!apiKey) {
    console.error("RESEND_API_KEY is not configured.");
    return res.status(503).json({ ok: false, error: "Email service is not configured" });
  }

  const safe = {
    name: escapeHtml(name),
    phone: escapeHtml(phone),
    email: escapeHtml(email || "Not provided"),
    cityZip: escapeHtml(cityZip),
    projectType: escapeHtml(projectType),
    preferredContact: escapeHtml(preferredContact || "Not specified"),
    message: escapeHtml(message).replace(/\n/g, "<br>"),
    language: escapeHtml(language)
  };

  const subject = `New Muebleria 3R lead — ${projectType} — ${cityZip}`;

  const html = `
    <div style="font-family:Arial,sans-serif;color:#171513;line-height:1.55;max-width:680px;margin:auto">
      <div style="background:#171513;color:#fff;padding:24px 28px;border-radius:14px 14px 0 0">
        <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#f3a11b;font-weight:700">New website lead</div>
        <h1 style="margin:8px 0 0;font-size:28px">Muebleria 3R</h1>
      </div>
      <div style="border:1px solid #e5ded4;border-top:0;padding:28px;border-radius:0 0 14px 14px;background:#fff">
        <table style="border-collapse:collapse;width:100%;font-size:15px">
          <tr><td style="padding:7px 0;color:#777;width:170px">Name</td><td style="padding:7px 0;font-weight:700">${safe.name}</td></tr>
          <tr><td style="padding:7px 0;color:#777">Phone</td><td style="padding:7px 0"><a href="tel:${safe.phone}" style="color:#171513;font-weight:700">${safe.phone}</a></td></tr>
          <tr><td style="padding:7px 0;color:#777">Email</td><td style="padding:7px 0">${safe.email}</td></tr>
          <tr><td style="padding:7px 0;color:#777">City / ZIP</td><td style="padding:7px 0">${safe.cityZip}</td></tr>
          <tr><td style="padding:7px 0;color:#777">Project</td><td style="padding:7px 0">${safe.projectType}</td></tr>
          <tr><td style="padding:7px 0;color:#777">Preferred contact</td><td style="padding:7px 0">${safe.preferredContact}</td></tr>
          <tr><td style="padding:7px 0;color:#777">Site language</td><td style="padding:7px 0">${safe.language}</td></tr>
        </table>
        <div style="height:1px;background:#eee6dc;margin:22px 0"></div>
        <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#777;font-weight:700;margin-bottom:8px">Project details</div>
        <div style="font-size:16px">${safe.message}</div>
      </div>
    </div>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: email || undefined,
        subject,
        html
      })
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Resend error:", result);
      return res.status(502).json({ ok: false, error: "Unable to send email" });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Contact endpoint error:", error);
    return res.status(500).json({ ok: false, error: "Unable to send email" });
  }
};
