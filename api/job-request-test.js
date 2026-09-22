module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Muebleria 3R <website@muebleria3r.com>";

  if (!apiKey) {
    return res.status(503).json({ ok: false, error: "Email environment is not configured" });
  }

  const safe = {
    name: "Carlos Martinez",
    phone: "(909) 555-0147",
    email: "carlos@example.com",
    cityZip: "Los Angeles, CA 90023",
    projectType: "Custom Cabinetry & Furniture",
    preferredContact: "Phone call",
    language: "English",
    message: "I’m looking to replace my current kitchen cabinets with custom cabinets and add a matching pantry. I’d like a clean modern finish and would like to schedule a time to discuss measurements, materials, and an estimate."
  };

  const subject = `New Muebleria 3R lead — ${safe.projectType} — ${safe.cityZip}`;

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
        to: ["otrservicesie@gmail.com"],
        subject,
        html
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(502).json({ ok: false, providerStatus: response.status });
    }

    return res.status(200).json({ ok: true, messageId: data.id || null });
  } catch (error) {
    return res.status(500).json({ ok: false });
  }
};