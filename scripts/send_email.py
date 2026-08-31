#!/usr/bin/env python3
import smtplib
import sys
import json
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_contact_emails(data):
    """Send contact form emails using Python's built-in SMTP"""
    
    # Get environment variables
    smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', 587))
    smtp_user = os.getenv('SMTP_USER')
    smtp_password = os.getenv('SMTP_PASSWORD')
    business_email = os.getenv('BUSINESS_EMAIL', 'successpcinstitute@gmail.com')
    
    if not smtp_user or not smtp_password:
        raise Exception("SMTP credentials not found in environment")
    
    print(f"[python-mailer] Using SMTP: {smtp_host}:{smtp_port}")
    print(f"[python-mailer] Business email: {business_email}")
    
    try:
        # Create SMTP connection
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        
        # Send business notification email
        business_msg = MIMEMultipart('alternative')
        business_msg['From'] = f"Success Point Website <{smtp_user}>"
        business_msg['To'] = business_email
        business_msg['Subject'] = f"New contact from {data['name']}"
        if data.get('email'):
            business_msg['Reply-To'] = data['email']
        
        # Create HTML and text versions
        business_text = f"""You received a new contact submission:

Name: {data['name']}
Email: {data.get('email', 'N/A')}

Message:
{data['message']}"""
        
        business_html = f"""<p>You received a new contact submission:</p>
<ul>
    <li><strong>Name:</strong> {data['name']}</li>
    <li><strong>Email:</strong> {data.get('email', 'N/A')}</li>
</ul>
<p><strong>Message:</strong></p>
<p style="white-space: pre-line;">{data['message']}</p>"""
        
        business_msg.attach(MIMEText(business_text, 'plain'))
        business_msg.attach(MIMEText(business_html, 'html'))
        
        server.send_message(business_msg)
        print(f"[python-mailer] Business email sent successfully to: {business_email}")
        
        # Send user acknowledgment if email provided
        if data.get('email'):
            user_msg = MIMEMultipart('alternative')
            user_msg['From'] = f"Success Point Website <{smtp_user}>"
            user_msg['To'] = data['email']
            user_msg['Subject'] = "We received your message – Success Point Computer"
            user_msg['Reply-To'] = business_email
            
            user_text = f"""Hi {data['name']},

Thanks for reaching out to Success Point Computer. We received your message and will get back to you soon.

Your message:
{data['message']}

Regards,
Success Point Computer"""
            
            user_html = f"""<p>Hi {data['name']},</p>
<p>Thanks for reaching out to <strong>Success Point Computer</strong>. We received your message and will get back to you soon.</p>
<p><strong>Your message:</strong></p>
<p style="white-space: pre-line;">{data['message']}</p>
<p>Regards,<br/>Success Point Computer</p>"""
            
            user_msg.attach(MIMEText(user_text, 'plain'))
            user_msg.attach(MIMEText(user_html, 'html'))
            
            server.send_message(user_msg)
            print(f"[python-mailer] User acknowledgment sent successfully to: {data['email']}")
        
        server.quit()
        return {"success": True, "message": "Emails sent successfully"}
        
    except Exception as e:
        print(f"[python-mailer] Error: {str(e)}")
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    try:
        # Read JSON data from stdin
        input_data = sys.stdin.read()
        data = json.loads(input_data)
        
        result = send_contact_emails(data)
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {"success": False, "error": str(e)}
        print(json.dumps(error_result))
        sys.exit(1)