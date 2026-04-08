import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Template
from .config import settings


WELCOME_TEMPLATE = """
<html>
<body style="font-family: Arial, sans-serif; background: #f0f4f8; padding: 40px;">
  <div style="max-width: 500px; margin: auto; background: white; border-radius: 12px; padding: 40px;">
    <h1 style="color: #1e3a5f;">Welcome to ScribeAI</h1>
    <p>Hi {{ name }},</p>
    <p>Your account has been created successfully. ScribeAI helps you read handwritten text using advanced AI, especially designed for accessibility.</p>
    <p>Start by uploading a handwriting sample and let our AI do the reading for you.</p>
    <a href="{{ frontend_url }}" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">Get Started</a>
    <p style="color: #888; margin-top: 24px; font-size: 12px;">&copy; Humanoid Maker &mdash; www.humanoidmaker.com</p>
  </div>
</body>
</html>
"""

RESET_TEMPLATE = """
<html>
<body style="font-family: Arial, sans-serif; background: #f0f4f8; padding: 40px;">
  <div style="max-width: 500px; margin: auto; background: white; border-radius: 12px; padding: 40px;">
    <h1 style="color: #1e3a5f;">Reset Your Password</h1>
    <p>Hi {{ name }},</p>
    <p>Use the code below to reset your password. It expires in 15 minutes.</p>
    <div style="background: #f0f4f8; padding: 16px; border-radius: 8px; text-align: center; font-size: 28px; letter-spacing: 6px; font-weight: bold; color: #1e3a5f;">{{ code }}</div>
    <p style="color: #888; margin-top: 24px; font-size: 12px;">&copy; Humanoid Maker &mdash; www.humanoidmaker.com</p>
  </div>
</body>
</html>
"""


async def send_email(to: str, subject: str, html_body: str):
    if not settings.SMTP_USER or not settings.SMTP_PASS:
        print(f"[EMAIL SKIP] SMTP not configured. Would send to {to}: {subject}")
        return

    msg = MIMEMultipart("alternative")
    msg["From"] = settings.FROM_EMAIL
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html"))

    await aiosmtplib.send(
        msg,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        start_tls=True,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASS,
    )


async def send_welcome_email(to: str, name: str):
    html = Template(WELCOME_TEMPLATE).render(name=name, frontend_url=settings.FRONTEND_URL)
    await send_email(to, "Welcome to ScribeAI", html)


async def send_reset_email(to: str, name: str, code: str):
    html = Template(RESET_TEMPLATE).render(name=name, code=code)
    await send_email(to, "ScribeAI — Password Reset Code", html)
