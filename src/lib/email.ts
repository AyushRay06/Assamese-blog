import nodemailer from "nodemailer";

interface SendContactEmailParams {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export async function sendContactNotificationEmail({
  name,
  email,
  subject,
  message,
}: SendContactEmailParams): Promise<{ sent: boolean; messageId?: string; error?: string }> {
  const receiverEmail = process.env.CONTACT_RECEIVER_EMAIL || "topg270673@gmail.com";
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || `"Website Inquiry" <${smtpUser || "no-reply@surajitborkotokey.in"}>`;

  const emailSubject = `[Website Inquiry] ${subject?.trim() || "New message from " + name}`;

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 8px; background-color: #ffffff; color: #18181b;">
      <div style="border-bottom: 1px solid #e4e4e7; padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 600; color: #18181b;">New Message from Website</h2>
        <p style="margin: 0; font-size: 13px; color: #71717a;">A visitor has reached out via the academic portal contact form.</p>
      </div>

      <div style="margin-bottom: 20px; background-color: #f4f4f5; padding: 14px 16px; border-radius: 6px; font-size: 14px;">
        <p style="margin: 0 0 6px 0;"><strong>Sender Name:</strong> ${name}</p>
        <p style="margin: 0 0 6px 0;"><strong>Sender Email:</strong> <a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a></p>
        ${subject ? `<p style="margin: 0;"><strong>Topic / Subject:</strong> ${subject}</p>` : ""}
      </div>

      <div style="margin-bottom: 24px;">
        <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a;">Message Content</p>
        <div style="font-size: 15px; line-height: 1.6; color: #27272a; white-space: pre-wrap; background-color: #fafafa; border: 1px solid #e4e4e7; padding: 16px; border-radius: 6px;">
${message}
        </div>
      </div>

      <div style="border-top: 1px solid #e4e4e7; padding-top: 14px; font-size: 12px; color: #71717a;">
        <p style="margin: 0;">You can reply directly to this email to respond to <strong>${name}</strong> (${email}).</p>
      </div>
    </div>
  `;

  // If SMTP credentials are configured, send real email via nodemailer
  if (smtpUser && smtpPass) {
    try {
      const cleanPass = smtpPass.replace(/\s+/g, "");
      const isGmail = (smtpHost && smtpHost.includes("gmail")) || smtpUser.includes("@gmail.com");

      const transporter = isGmail
        ? nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: smtpUser,
              pass: cleanPass,
            },
          })
        : nodemailer.createTransport({
            host: smtpHost || "smtp.gmail.com",
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
              user: smtpUser,
              pass: cleanPass,
            },
          });

      const info = await transporter.sendMail({
        from: smtpFrom,
        to: receiverEmail,
        replyTo: `"${name}" <${email}>`,
        subject: emailSubject,
        text: `From: ${name} (${email})\nSubject: ${subject || "Inquiry"}\n\nMessage:\n${message}`,
        html: emailHtml,
      });

      console.log(`[Email Service] Live email dispatched successfully to ${receiverEmail}. Message ID: ${info.messageId}`);
      return { sent: true, messageId: info.messageId };
    } catch (err: any) {
      console.error("[Email Service Error] Failed to send email via SMTP:", err);
      return { sent: false, error: err?.message || "Failed to dispatch email via SMTP" };
    }
  }

  // When SMTP is not configured: log clearly that live dispatch is inactive
  console.warn(`
══════════════════════════════════════════════════════════════════
[CONTACT FORM: NO SMTP CONFIGURED — LIVE EMAIL NOT SENT]
To: ${receiverEmail}
From: "${name}" <${email}>
Subject: ${emailSubject}
------------------------------------------------------------------
${message}
══════════════════════════════════════════════════════════════════
Notice: To receive live emails in your inbox, set SMTP_USER and SMTP_PASS in .env.
(For Gmail: use your Gmail address and a 16-character Google App Password).
The inquiry was saved safely in the PostgreSQL database.
  `);

  return { sent: false, error: "SMTP credentials (SMTP_USER and SMTP_PASS) not configured" };
}
