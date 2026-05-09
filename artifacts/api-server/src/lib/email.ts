import nodemailer from "nodemailer";
import { logger } from "./logger";

const MEMBER_NAME = "Dax Emry Brooks";
const MEMBER_EMAIL = "daxemry5855@gmail.com";

function createTransporter() {
  const pass = process.env.GMAIL_APP_PASSWORD;
  const user = process.env.GMAIL_USER ?? process.env.ADMIN_EMAIL ?? MEMBER_EMAIL;
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
    body { font-family: Georgia, 'Times New Roman', serif; background: #f4f6fa; margin: 0; padding: 24px; color: #1a1a2e; }
    .card { background: #ffffff; border-radius: 12px; max-width: 540px; margin: 0 auto; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { background: #1a2b5e; padding: 24px 28px; }
    .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.3px; }
    .header p { color: rgba(255,255,255,0.6); margin: 4px 0 0; font-size: 12px; font-family: Arial, sans-serif; }
    .body { padding: 28px; }
    .body h2 { margin: 0 0 16px; font-size: 17px; color: #1a2b5e; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; font-family: Arial, sans-serif; }
    .row:last-of-type { border-bottom: none; }
    .label { color: #888; }
    .value { color: #111; font-weight: 600; }
    .amount { color: #1a2b5e; font-size: 24px; font-weight: 700; margin: 16px 0 20px; font-family: Arial, sans-serif; }
    .ref { font-family: monospace; background: #f0f4ff; border: 1px solid #c7d4ff; padding: 8px 14px; border-radius: 6px; font-size: 15px; color: #1a2b5e; font-weight: 700; display: inline-block; margin: 4px 0 16px; }
    .footer { padding: 16px 28px; background: #f8f9fc; font-family: Arial, sans-serif; font-size: 11px; color: #aaa; border-top: 1px solid #ececec; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-family: Arial, sans-serif; font-weight: 600; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-pending { background: #fef9c3; color: #854d0e; }
    .badge-reversed { background: #dbeafe; color: #1e40af; }
    .alert { background: #fff7ed; border-left: 4px solid #ea580c; padding: 12px 16px; border-radius: 6px; font-size: 13px; font-family: Arial, sans-serif; margin-top: 12px; color: #7c2d12; }
    .note { background: #f0f9ff; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 6px; font-size: 13px; font-family: Arial, sans-serif; margin-top: 12px; color: #0c4a6e; }
    .reversal-banner { background: #dbeafe; border-radius: 8px; padding: 14px 18px; margin-bottom: 16px; font-family: Arial, sans-serif; font-size: 14px; color: #1e40af; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Heritage Credit Union</h1>
      <p>Charleston, SC 29401 · Member FDIC</p>
    </div>
    <div class="body">
      <h2>${title}</h2>
      ${body}
    </div>
    <div class="footer">
      This is an automated alert from your Heritage Credit Union online banking portal.<br/>
      If you did not initiate this action, please contact us immediately at (843) 555-0100.<br/>
      &copy; ${new Date().getFullYear()} Heritage Credit Union. All rights reserved.
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
      from: `Heritage Credit Union <${to}>`,
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
      from: `Heritage Credit Union <${to}>`,
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
      from: `Heritage Credit Union <${to}>`,
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
  if (!transporter) return;
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
      from: `Heritage Credit Union <${to}>`,
      to,
      subject: "Sign-In Alert — Heritage Credit Union",
      html: htmlWrapper("New Sign-In Detected", body),
    });
  } catch (err) {
    logger.error(err, "Failed to send login email");
  }
}

export async function sendBillPayAlert(opts: {
  payeeName: string;
  amount: number;
  fromAccount: string;
  payDate: string;
}) {
  const transporter = createTransporter();
  if (!transporter) return;
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
      from: `Heritage Credit Union <${to}>`,
      to,
      subject: `Bill Payment — ${fmt(opts.amount)} to ${opts.payeeName}`,
      html: htmlWrapper("Bill Payment Confirmation", body),
    });
  } catch (err) {
    logger.error(err, "Failed to send bill pay email");
  }
}
