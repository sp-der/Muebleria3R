module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    return res.status(503).json({ ok: false, error: "Email environment is not configured" });
  }

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
        subject: "Muebleria 3R contact form test",
        html: `
          <div style="font-family:Arial,sans-serif;color:#171513;line-height:1.5">
            <h2 style="margin-bottom:8px">Muebleria 3R</h2>
            <p>This is a live production email test from the website's Vercel + Resend configuration.</p>
            <p>If you received this, outbound form email delivery is working correctly.</p>
          </div>
        `
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
