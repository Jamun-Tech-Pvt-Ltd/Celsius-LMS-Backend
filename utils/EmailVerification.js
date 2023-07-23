const emailVerificationHTML = (token) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Email Verification</title>
</head>
<body>
    <h1>Email Verification</h1>
    <p>Dear user,</p>
    <p>Thank you for signing up! To complete your registration, please click the button below to verify your email address:</p>
    <a href="http://localhost:3001/TrainerVerification?token=${token}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 4px;">Verify Email</a>
    <p>If you did not sign up for this service, you can safely ignore this email.</p>
    <p>Best regards,<br>Your Company</p>
</body>
</html>

`


export default emailVerificationHTML