import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from app.config import (
    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD,
    SMTP_FROM_EMAIL, SMTP_ENABLED,
)


def _send(to_email: str, subject: str, html: str) -> None:
    if not SMTP_ENABLED:
        print(f"[EMAIL SKIPPED] {subject} → {to_email}")
        return
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = SMTP_FROM_EMAIL
    msg["To"]      = to_email
    msg.attach(MIMEText(html, "html"))
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
            s.ehlo(); s.starttls()
            s.login(SMTP_USER, SMTP_PASSWORD)
            s.sendmail(SMTP_FROM_EMAIL, to_email, msg.as_string())
        print(f"[EMAIL SENT] {subject} → {to_email}")
    except Exception as exc:
        print(f"[EMAIL ERROR] {to_email}: {exc}")


def _wrap(body: str) -> str:
    return f"""<html><body style="font-family:Arial,sans-serif;background:#000;color:#fff;padding:20px;margin:0">
  <div style="max-width:600px;margin:0 auto;background:#111;padding:30px;border-radius:12px;border:1px solid #333">
    <h1 style="color:#dc2626;margin-top:0;font-size:24px">XSPEED Motorsports</h1>
    {body}
    <p style="color:#555;font-size:12px;margin-top:30px;border-top:1px solid #222;padding-top:16px">
      XSPEED Motorsports &nbsp;|&nbsp; Do not reply to this email
    </p>
  </div>
</body></html>"""


def send_registration_email(
    to_email: str, full_name: str, team_name: str,
    registration_id: str, event_name: str,
) -> None:
    body = f"""
    <p>Hi <strong>{full_name}</strong>,</p>
    <p>Your team <strong>{team_name}</strong> has been successfully registered for <strong>{event_name}</strong>.</p>
    <div style="background:#1a1a1a;padding:20px;border-radius:8px;margin:24px 0;border:1px solid #2a2a2a;text-align:center">
      <p style="color:#888;font-size:11px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px">Registration ID</p>
      <p style="font-family:monospace;font-size:26px;color:#4ade80;margin:0;font-weight:bold;letter-spacing:2px">{registration_id}</p>
    </div>
    <p>Please save this ID — you will need it for document submission and on event day.</p>
    <h3 style="color:#dc2626">Next Steps</h3>
    <ol style="line-height:1.8">
      <li>Upload required documents (NOC, College ID, Government ID, Driving License)</li>
      <li>Complete fee payment via Razorpay</li>
      <li>Await admin approval — you will be notified by email</li>
    </ol>"""
    _send(to_email, f"XSPEED Registration Confirmed — {registration_id}", _wrap(body))


def send_team_status_email(
    to_email: str, full_name: str, team_name: str,
    registration_id: str, event_name: str,
    status: str, note: Optional[str] = None,
) -> None:
    status_messages = {
        "approved":     ("Registration Approved", "#4ade80", "Your registration has been approved! We look forward to seeing you at the event."),
        "rejected":     ("Registration Not Approved", "#f87171", "Unfortunately, your registration could not be approved at this time."),
        "waitlisted":   ("Registration Waitlisted", "#facc15", "Your team has been added to the waitlist. We will notify you if a spot becomes available."),
        "under_review": ("Registration Under Review", "#60a5fa", "Your registration is currently being reviewed by our team."),
        "cancelled":    ("Registration Cancelled", "#9ca3af", "Your registration has been cancelled."),
    }
    label, color, msg_text = status_messages.get(status, ("Status Update", "#fff", f"Your registration status has been updated to: {status}"))

    note_block = f"""<div style="background:#1a1a1a;border-left:3px solid {color};padding:12px 16px;border-radius:0 6px 6px 0;margin:16px 0">
      <p style="color:#aaa;font-size:12px;margin:0 0 4px">Note from admin:</p>
      <p style="margin:0;color:#fff">{note}</p>
    </div>""" if note else ""

    body = f"""
    <p>Hi <strong>{full_name}</strong>,</p>
    <p>There is an update on your <strong>{event_name}</strong> registration for team <strong>{team_name}</strong>.</p>
    <div style="background:#1a1a1a;padding:16px;border-radius:8px;margin:16px 0;border:1px solid #2a2a2a">
      <p style="color:#888;font-size:11px;margin:0 0 4px;text-transform:uppercase">Registration ID</p>
      <p style="font-family:monospace;font-size:18px;color:#4ade80;margin:0 0 12px;font-weight:bold">{registration_id}</p>
      <p style="color:#888;font-size:11px;margin:0 0 4px;text-transform:uppercase">New Status</p>
      <p style="font-size:18px;color:{color};margin:0;font-weight:bold;text-transform:capitalize">{label}</p>
    </div>
    <p>{msg_text}</p>
    {note_block}"""
    _send(to_email, f"XSPEED — {label}: {registration_id}", _wrap(body))


def send_admin_message_email(
    to_email: str, full_name: str, team_name: str,
    registration_id: str, event_name: str,
    subject: str, message: str,
) -> None:
    body = f"""
    <p>Hi <strong>{full_name}</strong>,</p>
    <p>You have received a message from the XSPEED admin team regarding your registration for <strong>{event_name}</strong>.</p>
    <div style="background:#1a1a1a;padding:16px;border-radius:8px;margin:16px 0;border:1px solid #2a2a2a">
      <p style="color:#888;font-size:11px;margin:0 0 4px;text-transform:uppercase">Team / Reg ID</p>
      <p style="font-size:15px;color:#fff;margin:0 0 2px;font-weight:bold">{team_name}</p>
      <p style="font-family:monospace;font-size:13px;color:#4ade80;margin:0">{registration_id}</p>
    </div>
    <div style="background:#1a1a1a;border-left:3px solid #dc2626;padding:16px 20px;border-radius:0 8px 8px 0;margin:16px 0">
      <p style="color:#aaa;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px">Message from Admin</p>
      <p style="margin:0;color:#fff;line-height:1.7;white-space:pre-line">{message}</p>
    </div>
    <p style="color:#888;font-size:13px">If you have any questions, please log in to your dashboard or reply to this email.</p>"""
    _send(to_email, f"XSPEED — {subject}", _wrap(body))


def send_document_review_email(
    to_email: str, full_name: str, team_name: str,
    doc_label: str, status: str, note: Optional[str] = None,
) -> None:
    status_cfg = {
        "approved":           ("Document Approved",       "#4ade80", "has been approved."),
        "rejected":           ("Document Rejected",       "#f87171", "has been rejected. Please re-upload a corrected version."),
        "reupload_requested": ("Re-upload Requested",     "#facc15", "requires re-upload. Please upload a new copy."),
    }
    label, color, action = status_cfg.get(status, ("Document Update", "#fff", f"status changed to {status}."))

    note_block = f"""<div style="background:#1a1a1a;border-left:3px solid {color};padding:12px 16px;border-radius:0 6px 6px 0;margin:16px 0">
      <p style="color:#aaa;font-size:12px;margin:0 0 4px">Reviewer note:</p>
      <p style="margin:0;color:#fff">{note}</p>
    </div>""" if note else ""

    body = f"""
    <p>Hi <strong>{full_name}</strong>,</p>
    <p>An admin has reviewed a document submitted by team <strong>{team_name}</strong>.</p>
    <div style="background:#1a1a1a;padding:16px;border-radius:8px;margin:16px 0;border:1px solid #2a2a2a">
      <p style="color:#888;font-size:11px;margin:0 0 4px;text-transform:uppercase">Document</p>
      <p style="font-size:16px;color:#fff;margin:0 0 12px;font-weight:bold">{doc_label}</p>
      <p style="color:#888;font-size:11px;margin:0 0 4px;text-transform:uppercase">Status</p>
      <p style="font-size:16px;color:{color};margin:0;font-weight:bold">{label}</p>
    </div>
    <p>Your <strong>{doc_label}</strong> {action}</p>
    {note_block}
    <p>Log in to your dashboard to view the status and re-upload if required.</p>"""
    _send(to_email, f"XSPEED — {label}: {doc_label}", _wrap(body))
