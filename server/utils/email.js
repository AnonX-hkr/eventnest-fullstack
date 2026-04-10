const nodemailer = require("nodemailer");

// ─── Transporter singleton ────────────────────────────────────────────────────

let _transporter = null;

async function getTransporter() {
  if (_transporter) return _transporter;

  if (process.env.SMTP_HOST) {
    // Production SMTP (Gmail, SendGrid, etc.)
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Dev: auto-create Ethereal test account (catches outgoing email, never delivers)
    const testAccount = await nodemailer.createTestAccount();
    _transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log(`📧 [email] Using Ethereal test account: ${testAccount.user}`);
    console.log(`📧 [email] Preview at: https://ethereal.email`);
  }

  return _transporter;
}

// ─── HTML email template ──────────────────────────────────────────────────────

function buildTicketEmail({ order, tickets, event, buyerName }) {
  const eventDate = event.startDate
    ? new Date(event.startDate).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      })
    : "TBA";

  const ticketBlocks = tickets.map((t) => `
    <div style="background:#0d1f2d;border:1px solid rgba(255,255,255,0.1);border-radius:16px;margin-bottom:16px;overflow:hidden;">
      <div style="display:flex;align-items:center;gap:16px;padding:16px;">
        ${t.qrPayload ? `<img src="${t.qrPayload}" width="120" height="120" style="border-radius:8px;flex-shrink:0;" alt="QR Code" />` : ""}
        <div>
          <p style="color:#00d26a;font-family:monospace;font-size:18px;font-weight:bold;margin:0 0 6px;">${t.ticketCode}</p>
          <p style="color:#ffffff;font-size:14px;font-weight:600;margin:0 0 4px;">${t.tierSnapshot?.name ?? "Ticket"}</p>
          <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0;">${buyerName}</p>
          <span style="display:inline-block;margin-top:8px;padding:3px 10px;border-radius:20px;background:rgba(0,210,106,0.1);color:#00d26a;font-size:11px;font-weight:600;">✓ Valid</span>
        </div>
      </div>
    </div>
  `).join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Tickets — EventBookings</title>
</head>
<body style="margin:0;padding:0;background:#060f17;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-flex;align-items:center;gap:8px;">
        <div style="width:36px;height:36px;background:#00d26a;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;">
          <span style="color:#0c2230;font-size:20px;font-weight:bold;">🎫</span>
        </div>
        <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">
          Event<span style="color:#00d26a;">Bookings</span>
        </span>
      </div>
    </div>

    <!-- Hero -->
    <div style="background:#0d1f2d;border:1px solid rgba(0,210,106,0.2);border-radius:20px;padding:32px;margin-bottom:24px;text-align:center;">
      <div style="width:64px;height:64px;background:rgba(0,210,106,0.1);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:28px;">✅</span>
      </div>
      <h1 style="color:#ffffff;font-size:24px;font-weight:800;margin:0 0 8px;">Booking Confirmed!</h1>
      <p style="color:rgba(255,255,255,0.5);font-size:14px;margin:0;">
        Order <span style="color:#ffffff;font-family:monospace;">${order.orderNumber}</span>
      </p>
    </div>

    <!-- Event Details -->
    <div style="background:#0d1f2d;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:20px;margin-bottom:24px;">
      <h2 style="color:#ffffff;font-size:18px;font-weight:700;margin:0 0 16px;">${event.title ?? "Your Event"}</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="color:rgba(255,255,255,0.4);font-size:13px;padding:6px 0;">📅 Date</td>
          <td style="color:#ffffff;font-size:13px;text-align:right;">${eventDate}</td>
        </tr>
        ${event.venue ? `
        <tr>
          <td style="color:rgba(255,255,255,0.4);font-size:13px;padding:6px 0;">📍 Venue</td>
          <td style="color:#ffffff;font-size:13px;text-align:right;">${event.venue.name}, ${event.venue.city}</td>
        </tr>` : ""}
        <tr style="border-top:1px solid rgba(255,255,255,0.06);">
          <td style="color:rgba(255,255,255,0.4);font-size:13px;padding:10px 0 6px;">💳 Total Paid</td>
          <td style="color:#00d26a;font-size:16px;font-weight:700;text-align:right;">$${order.total?.toFixed(2)}</td>
        </tr>
      </table>
    </div>

    <!-- Tickets -->
    <h3 style="color:#ffffff;font-size:15px;font-weight:700;margin:0 0 12px;">
      Your Ticket${tickets.length > 1 ? "s" : ""} (${tickets.length})
    </h3>
    ${ticketBlocks}

    <!-- Instructions -->
    <div style="background:rgba(0,210,106,0.05);border:1px solid rgba(0,210,106,0.15);border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="color:#00d26a;font-size:13px;font-weight:600;margin:0 0 8px;">📱 At the event</p>
      <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:0;line-height:1.6;">
        Show the QR code above to the staff at the entrance. Each ticket has a unique code — one scan per ticket.
      </p>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/tickets"
        style="display:inline-block;background:#00d26a;color:#0c2230;font-size:14px;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;">
        View My Tickets →
      </a>
    </div>

    <!-- Footer -->
    <p style="color:rgba(255,255,255,0.2);font-size:12px;text-align:center;margin:0;">
      EventBookings · Questions? Reply to this email.
    </p>
  </div>
</body>
</html>`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

async function sendTicketEmail({ to, order, tickets, event, buyerName }) {
  try {
    const transporter = await getTransporter();
    const html = buildTicketEmail({ order, tickets, event, buyerName });

    const info = await transporter.sendMail({
      from: `"EventBookings" <${process.env.SMTP_FROM || process.env.SMTP_USER || "tickets@eventbookings.dev"}>`,
      to,
      subject: `🎫 Your tickets for ${event.title ?? "the event"} — Order ${order.orderNumber}`,
      html,
    });

    if (process.env.NODE_ENV !== "production") {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`📧 [email] Preview: ${previewUrl}`);
      }
    }

    return { ok: true, messageId: info.messageId };
  } catch (err) {
    // Never let email failure crash the order flow
    console.error("[email] Failed to send ticket email:", err.message);
    return { ok: false, error: err.message };
  }
}

module.exports = { sendTicketEmail };
