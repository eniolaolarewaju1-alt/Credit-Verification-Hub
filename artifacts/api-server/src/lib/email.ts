import nodemailer from "nodemailer";
import { logger } from "./logger";

const MEMBER_NAME = "Dax Emry Brooks";
const MEMBER_EMAIL = "daxemry5855@gmail.com";

function senderAddress(): string {
  return process.env.GMAIL_USER ?? process.env.ADMIN_EMAIL ?? MEMBER_EMAIL;
}

function createTransporter() {
  const pass = process.env.GMAIL_APP_PASSWORD;
  const user = senderAddress();
  if (!pass) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

function scTime(isoOrDate?: string | Date): string {
  const d = isoOrDate ? new Date(isoOrDate) : new Date();
  return d.toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function htmlWrapper(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 24px; color: #111; }
    .card { background: #ffffff; border-radius: 6px; max-width: 560px; margin: 0 auto; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06); border: 1px solid #e5e7eb; }
    .topbar { height: 6px; background: #1A5C38; }
    .header { background: #ffffff; padding: 22px 28px; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; }
    .logo { width: 38px; height: 38px; background: #1A5C38; display: inline-block; vertical-align: middle; margin-right: 12px; position: relative; }
    .logo::before, .logo::after { content: ''; position: absolute; background: #ffffff; }
    .logo::before { top: 4px; bottom: 4px; left: 18px; width: 2px; }
    .logo::after { left: 4px; right: 4px; top: 18px; height: 2px; }
    .header h1 { color: #1A5C38; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.2px; display: inline-block; vertical-align: middle; }
    .header p { color: #6b7280; margin: 2px 0 0; font-size: 11px; letter-spacing: 0.5px; text-transform: uppercase; display: block; }
    .body { padding: 28px; }
    .body h2 { margin: 0 0 4px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; }
    .amount { color: #1A5C38; font-size: 36px; font-weight: 700; margin: 4px 0 18px; letter-spacing: -1px; }
    .row { display: flex; justify-content: space-between; padding: 11px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
    .row:last-of-type { border-bottom: none; }
    .label { color: #6b7280; }
    .value { color: #111827; font-weight: 600; }
    .ref-row { background: #f9fafb; border-top: 1px solid #f0f0f0; border-bottom: 1px solid #f0f0f0; padding: 14px 28px; margin: 16px -28px; display: flex; justify-content: space-between; align-items: center; }
    .ref-label { color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
    .ref { font-family: 'Courier New', monospace; color: #1A5C38; font-weight: 700; font-size: 14px; }
    .footer { padding: 18px 28px; background: #f9fafb; font-size: 11px; color: #9ca3af; border-top: 1px solid #f0f0f0; text-align: center; line-height: 1.6; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; border: 1px solid; }
    .badge-success { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }
    .badge-pending { background: #fffbeb; color: #854d0e; border-color: #fde68a; }
    .badge-reversed { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }
    .alert { background: #fffbeb; border-left: 3px solid #f59e0b; padding: 12px 16px; font-size: 13px; margin-top: 12px; color: #78350f; border-radius: 0 4px 4px 0; }
    .note { background: #f0fdf4; border-left: 3px solid #1A5C38; padding: 12px 16px; font-size: 13px; margin-top: 12px; color: #14532d; border-radius: 0 4px 4px 0; }
    .reversal-banner { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; padding: 12px 16px; margin-bottom: 16px; font-size: 14px; color: #166534; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="topbar"></div>
    <div class="header">
      <span class="logo"></span>
      <span>
        <h1 style="display:block;">Heritage Bank</h1>
        <p>Charleston, SC · Member FDIC</p>
      </span>
    </div>
    <div class="body">
      <h2>${title}</h2>
      ${body}
    </div>
    <div class="footer">
      This is an automated message from Heritage Bank. For questions, call <strong>(843) 555-0100</strong>.<br/>
      &copy; ${new Date().getFullYear()} Heritage Bank, N.A. Member FDIC. Equal Housing Lender.
    </div>
  </div>
</body>
</html>`;
}

export async function sendTransferConfirmation(opts: {
  referenceNumber: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  memo?: string;
}) {
  const transporter = createTransporter();
  if (!transporter) {
    logger.warn("GMAIL_APP_PASSWORD not set — skipping transfer confirmation email");
    return;
  }
  const to = MEMBER_EMAIL;
  const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
  const body = `
    <div class="amount">${fmt(opts.amount)}</div>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#555;margin:0 0 8px;">Reference Number</p>
    <div class="ref">${opts.referenceNumber}</div>
    <div class="row"><span class="label">Member</span><span class="value">${MEMBER_NAME}</span></div>
    <div class="row"><span class="label">From</span><span class="value">${opts.fromAccount}</span></div>
    <div class="row"><span class="label">To</span><span class="value">${opts.toAccount}</span></div>
    ${opts.memo ? `<div class="row"><span class="label">Memo</span><span class="value">${opts.memo}</span></div>` : ""}
    <div class="row"><span class="label">Status</span><span class="value"><span class="badge badge-pending">Pending Reversal</span></span></div>
    <div class="row"><span class="label">Date / Time</span><span class="value">${scTime()}</span></div>
    <div class="note">This is a demo transfer. The funds will be automatically returned to your account within 5 minutes. No real money has moved.</div>
  `;
  try {
    await transporter.sendMail({
      from: `Heritage Bank <${senderAddress()}>`,
      to,
      subject: `Transfer Initiated — ${fmt(opts.amount)} · Ref ${opts.referenceNumber}`,
      html: htmlWrapper("Transfer Confirmation Receipt", body),
    });
    logger.info({ to, ref: opts.referenceNumber }, "Transfer confirmation email sent");
  } catch (err) {
    logger.error(err, "Failed to send transfer confirmation email");
  }
}

export async function sendTransferReversalEmail(opts: {
  referenceNumber: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  memo?: string;
}) {
  const transporter = createTransporter();
  if (!transporter) {
    logger.warn("GMAIL_APP_PASSWORD not set — skipping reversal email");
    return;
  }
  const to = MEMBER_EMAIL;
  const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
  const body = `
    <div class="reversal-banner">✓ Transfer Reversed — Funds Returned</div>
    <div class="amount">${fmt(opts.amount)}</div>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#555;margin:0 0 8px;">Reference Number</p>
    <div class="ref">${opts.referenceNumber}</div>
    <div class="row"><span class="label">Member</span><span class="value">${MEMBER_NAME}</span></div>
    <div class="row"><span class="label">Original From</span><span class="value">${opts.fromAccount}</span></div>
    <div class="row"><span class="label">Original To</span><span class="value">${opts.toAccount}</span></div>
    ${opts.memo ? `<div class="row"><span class="label">Memo</span><span class="value">${opts.memo}</span></div>` : ""}
    <div class="row"><span class="label">Status</span><span class="value"><span class="badge badge-reversed">Reversed</span></span></div>
    <div class="row"><span class="label">Reversed At</span><span class="value">${scTime()}</span></div>
    <div class="note">Your funds have been returned to <strong>${opts.fromAccount}</strong>. This demo transfer has been fully reversed and your balance has been restored.</div>
  `;
  try {
    await transporter.sendMail({
      from: `Heritage Bank <${senderAddress()}>`,
      to,
      subject: `Transfer Reversed — ${fmt(opts.amount)} Returned · Ref ${opts.referenceNumber}`,
      html: htmlWrapper("Transfer Reversal Confirmation", body),
    });
    logger.info({ to, ref: opts.referenceNumber }, "Transfer reversal email sent");
  } catch (err) {
    logger.error(err, "Failed to send reversal email");
  }
}

export async function sendTransferAlert(opts: {
  type: "internal" | "external";
  fromAccount: string;
  toAccount: string;
  amount: number;
  memo?: string;
  status?: string;
}) {
  const transporter = createTransporter();
  if (!transporter) {
    logger.warn("GMAIL_APP_PASSWORD not set — skipping transfer email");
    return;
  }
  const to = MEMBER_EMAIL;
  const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
  const label = opts.type === "internal" ? "Internal Transfer" : "External Transfer / Wire";
  const body = `
    <div class="amount">${fmt(opts.amount)}</div>
    <div class="row"><span class="label">Member</span><span class="value">${MEMBER_NAME}</span></div>
    <div class="row"><span class="label">Type</span><span class="value">${label}</span></div>
    <div class="row"><span class="label">From</span><span class="value">${opts.fromAccount}</span></div>
    <div class="row"><span class="label">To</span><span class="value">${opts.toAccount}</span></div>
    ${opts.memo ? `<div class="row"><span class="label">Memo</span><span class="value">${opts.memo}</span></div>` : ""}
    <div class="row"><span class="label">Status</span><span class="value"><span class="badge badge-${opts.status === "completed" ? "success" : "pending"}">${opts.status ?? "Pending"}</span></span></div>
    <div class="row"><span class="label">Date / Time</span><span class="value">${scTime()}</span></div>
  `;
  try {
    await transporter.sendMail({
      from: `Heritage Bank <${senderAddress()}>`,
      to,
      subject: `Transfer Alert — ${fmt(opts.amount)} ${opts.type === "internal" ? "between your accounts" : "sent to " + opts.toAccount}`,
      html: htmlWrapper("Transfer Confirmation", body),
    });
    logger.info({ to, amount: opts.amount }, "Transfer email sent");
  } catch (err) {
    logger.error(err, "Failed to send transfer email");
  }
}

export async function sendLoginAlert(opts: { ip?: string }) {
  const transporter = createTransporter();
  if (!transporter) {
    logger.warn("GMAIL_APP_PASSWORD not set — skipping login alert email");
    return;
  }
  const to = MEMBER_EMAIL;
  const body = `
    <div class="row"><span class="label">Member</span><span class="value">${MEMBER_NAME}</span></div>
    <div class="row"><span class="label">Account</span><span class="value">${to}</span></div>
    <div class="row"><span class="label">Date / Time</span><span class="value">${scTime()}</span></div>
    ${opts.ip ? `<div class="row"><span class="label">IP Address</span><span class="value">${opts.ip}</span></div>` : ""}
    <div class="alert">If you did not sign in just now, change your password immediately and contact support.</div>
  `;
  try {
    await transporter.sendMail({
      from: `Heritage Bank <${senderAddress()}>`,
      to,
      subject: "Sign-In Alert — Heritage Bank",
      html: htmlWrapper("New Sign-In Detected", body),
    });
    logger.info({ to }, "Login alert email sent");
  } catch (err) {
    logger.error(err, "Failed to send login email");
  }
}

export async function sendOtpEmail(opts: { code: string; expiresAt: Date }) {
  const transporter = createTransporter();
  if (!transporter) {
    logger.warn("GMAIL_APP_PASSWORD not set — skipping OTP email");
    return;
  }
  const to = MEMBER_EMAIL;
  const body = `
    <div class="amount" style="font-size:48px;letter-spacing:0.25em;font-family:monospace;color:#1A5C38;text-align:center;padding:20px 0;">${opts.code}</div>
    <div class="row"><span class="label">Member</span><span class="value">${MEMBER_NAME}</span></div>
    <div class="row"><span class="label">Expires At</span><span class="value">${scTime(opts.expiresAt)}</span></div>
    <div class="note">Enter this code on the Heritage Bank login page to complete sign-in. This code expires in 10 minutes and can only be used once.</div>
    <div class="alert">If you did not attempt to sign in, contact us immediately at (843) 555-0100.</div>
  `;
  try {
    await transporter.sendMail({
      from: `Heritage Bank <${senderAddress()}>`,
      to,
      subject: `Your Sign-In Code: ${opts.code} — Heritage Bank`,
      html: htmlWrapper("Two-Factor Verification Code", body),
    });
    logger.info({ to }, "OTP email sent");
  } catch (err) {
    logger.error(err, "Failed to send OTP email");
  }
}

export async function sendBillPayAlert(opts: {
  payeeName: string;
  amount: number;
  fromAccount: string;
  payDate: string;
}) {
  const transporter = createTransporter();
  if (!transporter) {
    logger.warn("GMAIL_APP_PASSWORD not set — skipping bill pay alert email");
    return;
  }
  const to = MEMBER_EMAIL;
  const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
  const body = `
    <div class="amount">${fmt(opts.amount)}</div>
    <div class="row"><span class="label">Member</span><span class="value">${MEMBER_NAME}</span></div>
    <div class="row"><span class="label">Payee</span><span class="value">${opts.payeeName}</span></div>
    <div class="row"><span class="label">From Account</span><span class="value">${opts.fromAccount}</span></div>
    <div class="row"><span class="label">Payment Date</span><span class="value">${opts.payDate}</span></div>
    <div class="row"><span class="label">Submitted</span><span class="value">${scTime()}</span></div>
    <div class="row"><span class="label">Status</span><span class="value"><span class="badge badge-success">Scheduled</span></span></div>
  `;
  try {
    await transporter.sendMail({
      from: `Heritage Bank <${senderAddress()}>`,
      to,
      subject: `Bill Payment — ${fmt(opts.amount)} to ${opts.payeeName}`,
      html: htmlWrapper("Bill Payment Confirmation", body),
    });
  } catch (err) {
    logger.error(err, "Failed to send bill pay email");
  }
}
