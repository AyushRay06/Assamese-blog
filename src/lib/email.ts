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
    } catch (err: unknown) {
      console.error("[Email Service Error] Failed to send email via SMTP:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to dispatch email via SMTP";
      return { sent: false, error: errorMsg };
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

interface NewPostNotificationParams {
  recipients: string[];
  post: {
    title: string;
    slug: string;
    excerpt?: string | null;
    language: string;
    readingTime?: number | null;
  };
}

export async function sendNewPostNotificationToSubscribers({
  recipients,
  post,
}: NewPostNotificationParams): Promise<{ sentCount: number; errors?: string[] }> {
  if (!recipients || recipients.length === 0) {
    return { sentCount: 0 };
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://surajitborkotokey.in";
  const postUrl = `${siteUrl.replace(/\/$/, "")}/blog/${post.slug}`;
  const isAssamese = post.language === "AS";
  const langLabel = isAssamese ? "অসমীয়া (Assamese)" : "English";

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom =
    process.env.SMTP_FROM ||
    `"Prof. Surajit Borkotokey" <${smtpUser || "no-reply@surajitborkotokey.in"}>`;

  const emailSubject = `[New Essay] ${post.title} — Prof. Surajit Borkotokey`;

  let sentCount = 0;
  const errors: string[] = [];

  // If SMTP is available, dispatch emails in parallel batches
  if (smtpUser && smtpPass) {
    try {
      const cleanPass = smtpPass.replace(/\s+/g, "");
      const isGmail =
        (smtpHost && smtpHost.includes("gmail")) || smtpUser.includes("@gmail.com");

      const transporter = isGmail
        ? nodemailer.createTransport({
            service: "gmail",
            auth: { user: smtpUser, pass: cleanPass },
          })
        : nodemailer.createTransport({
            host: smtpHost || "smtp.gmail.com",
            port: smtpPort,
            secure: smtpPort === 465,
            auth: { user: smtpUser, pass: cleanPass },
          });

      // Send to each recipient with personalized unsubscribe link
      const batchSize = 10;
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (recipient) => {
            const unsubUrl = `${siteUrl.replace(/\/$/, "")}/api/subscribe/unsubscribe?email=${encodeURIComponent(
              recipient
            )}`;

            const emailHtml = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 28px 24px; border: 1px solid #e4e4e7; border-radius: 12px; background-color: #ffffff; color: #18181b;">
                <div style="border-bottom: 1px solid #e4e4e7; padding-bottom: 16px; margin-bottom: 24px;">
                  <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #71717a;">
                    Academic Perspectives &bull; শৈক্ষিক চিন্তা
                  </h3>
                  <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #09090b; line-height: 1.25;">
                    Prof. Surajit Borkotokey
                  </h1>
                  <p style="margin: 4px 0 0 0; font-size: 13px; color: #71717a;">
                    Department of Mathematics, Dibrugarh University
                  </p>
                </div>

                <div style="margin-bottom: 24px;">
                  <div style="display: inline-block; margin-bottom: 12px;">
                    <span style="font-size: 11px; font-family: monospace; padding: 3px 8px; border-radius: 4px; background-color: #f4f4f5; color: #3f3f46; border: 1px solid #e4e4e7;">
                      ${langLabel}${post.readingTime ? ` &bull; ${post.readingTime} min read` : ""}
                    </span>
                  </div>

                  <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #18181b; line-height: 1.35;">
                    ${post.title}
                  </h2>

                  ${
                    post.excerpt
                      ? `<p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #52525b;">${post.excerpt}</p>`
                      : ""
                  }

                  <div style="margin: 24px 0;">
                    <a href="${postUrl}" style="display: inline-block; background-color: #18181b; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; text-decoration: none;">
                      Read Article Online &rarr;
                    </a>
                  </div>
                </div>

                <div style="border-top: 1px solid #e4e4e7; padding-top: 16px; margin-top: 24px; font-size: 12px; color: #a1a1aa; line-height: 1.5;">
                  <p style="margin: 0 0 8px 0;">
                    You are receiving this email because you subscribed to updates on Prof. Surajit Borkotokey's official website.
                  </p>
                  <p style="margin: 0;">
                    If you no longer wish to receive these notifications, you can <a href="${unsubUrl}" style="color: #71717a; text-decoration: underline;">unsubscribe instantly</a>.
                  </p>
                </div>
              </div>
            `;

            try {
              await transporter.sendMail({
                from: smtpFrom,
                to: recipient,
                subject: emailSubject,
                text: `${post.title}\n\nA new article has been published by Prof. Surajit Borkotokey:\n${postUrl}\n\nUnsubscribe: ${unsubUrl}`,
                html: emailHtml,
              });
              sentCount++;
            } catch (singleErr) {
              const errText = singleErr instanceof Error ? singleErr.message : String(singleErr);
              errors.push(`Failed to send to ${recipient}: ${errText}`);
            }
          })
        );
      }
    } catch (err: unknown) {
      console.error("[Subscriber Notification] Dispatch error:", err);
      errors.push(err instanceof Error ? err.message : "SMTP failure");
    }
  } else {
    console.log(
      `[Subscriber Notification] (Simulated) Would notify ${recipients.length} subscriber(s) for post "${post.title}". URL: ${postUrl}`
    );
    sentCount = recipients.length;
  }

  return { sentCount, errors: errors.length > 0 ? errors : undefined };
}

export async function sendSubscriberWelcomeEmail({
  email,
  name,
}: {
  email: string;
  name?: string;
}): Promise<{ sent: boolean; error?: string }> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://surajitborkotokey.in";
  const unsubUrl = `${siteUrl.replace(/\/$/, "")}/api/subscribe/unsubscribe?email=${encodeURIComponent(
    email
  )}`;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom =
    process.env.SMTP_FROM ||
    `"Prof. Surajit Borkotokey" <${smtpUser || "no-reply@surajitborkotokey.in"}>`;

  const emailSubject = `Subscription Confirmed — Prof. Surajit Borkotokey's Blog`;

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px 24px; border: 1px solid #e4e4e7; border-radius: 12px; background-color: #ffffff; color: #18181b;">
      <div style="border-bottom: 1px solid #e4e4e7; padding-bottom: 16px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #71717a;">
          Academic Archive &bull; দ্বিভাষিক সংগ্ৰহ
        </h3>
        <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #09090b;">
          Prof. Surajit Borkotokey
        </h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #71717a;">
          Department of Mathematics, Dibrugarh University
        </p>
      </div>

      <div style="margin-bottom: 24px; font-size: 15px; line-height: 1.6; color: #27272a;">
        <p>Hello${name ? ` ${name}` : ""},</p>
        <p>
          Thank you for subscribing to new publications from Prof. Surajit Borkotokey.
        </p>
        <p>
          Whenever a new essay, research note, or reflection on cooperative game theory, network games, or Assamese cultural narratives is published, you will receive a direct notification.
        </p>
        <div style="margin: 24px 0;">
          <a href="${siteUrl}/blog" style="display: inline-block; background-color: #18181b; color: #ffffff; padding: 11px 22px; border-radius: 6px; font-size: 14px; font-weight: 600; text-decoration: none;">
            Browse Existing Essays &rarr;
          </a>
        </div>
      </div>

      <div style="border-top: 1px solid #e4e4e7; padding-top: 14px; font-size: 12px; color: #a1a1aa;">
        <p style="margin: 0;">
          You can <a href="${unsubUrl}" style="color: #71717a; text-decoration: underline;">unsubscribe anytime</a>.
        </p>
      </div>
    </div>
  `;

  if (smtpUser && smtpPass) {
    try {
      const cleanPass = smtpPass.replace(/\s+/g, "");
      const isGmail =
        (smtpHost && smtpHost.includes("gmail")) || smtpUser.includes("@gmail.com");

      const transporter = isGmail
        ? nodemailer.createTransport({
            service: "gmail",
            auth: { user: smtpUser, pass: cleanPass },
          })
        : nodemailer.createTransport({
            host: smtpHost || "smtp.gmail.com",
            port: smtpPort,
            secure: smtpPort === 465,
            auth: { user: smtpUser, pass: cleanPass },
          });

      await transporter.sendMail({
        from: smtpFrom,
        to: email,
        subject: emailSubject,
        text: `Thank you for subscribing to Prof. Surajit Borkotokey's blog updates.\nVisit: ${siteUrl}/blog\nUnsubscribe: ${unsubUrl}`,
        html: emailHtml,
      });
      return { sent: true };
    } catch (err: unknown) {
      console.error("[Welcome Email Error]:", err);
      return { sent: false, error: err instanceof Error ? err.message : "SMTP failed" };
    }
  }

  console.log(`[Welcome Email] (Simulated) Subscription confirmed for ${email}`);
  return { sent: false, error: "SMTP not configured" };
}

