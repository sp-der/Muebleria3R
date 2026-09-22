module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !toEmail || !fromEmail) {
    return res.status(503).json({
      ok: false,
      configured: {
        resend: Boolean(apiKey),
        destination: Boolean(toEmail),
        sender: Boolean(fromEmail)
      }
    });
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
        to: [toEmail],
        subject: "Muebleria 3R website email test",
        html: "<p>The production website contact email connection is working. No action is needed.</p>"
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
