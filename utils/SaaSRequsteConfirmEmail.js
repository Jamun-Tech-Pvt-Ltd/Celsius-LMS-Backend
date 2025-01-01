const saaSRequsteConfirmEmail = (c_name, c_email, c_username, c_password) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title></title>
  </head>
  <body style="background: #f8f7fb">
    <div
      class="container"
      style="
        max-width: 600px;
        overflow: hidden;
        height: 100vh;
        margin: 0 auto;
        background-color: #fff;
        position: relative;
      "
    >

      <div class="content" style="width: 470px; margin: 98px auto 0 auto; display: flex; align-items: center; flex-direction: column;">
        <img
          src="https://jmkcrsmn.s3.us-east-2.amazonaws.com/email_teamplate/logo.png"
          alt="logo"
          class="logo"
  style="width: 354px; height: 75px"
        />

        <h1
          class="heading"
          style="
            text-align: center;
            width: 420px;
            font-weight: 700;
            font-size: 36px;
          "
        >
          Welcome to Celsius LMS by Jaamun
        </h1>

        <div class="description" style="text-align: center">
          <strong style="font-weight: 700; margin-bottom: 6px"
            >Dear ${c_name},</strong 
          > <br>
          We are pleased to inform you that your request for our SaaS service has been successfully verified. You can now access the features and resources of our platform. If you have any questions or need further assistance, feel free to reach out to our support team at info@jaamun.com. Thank you for choosing Jaamun. We look forward to supporting your needs.
        </div>

        <ul class="list" style="list-style: none">
          <li><strong>Your Admin Url:</strong>${c_username}.admin.celsisuslms.com</li>
          <li><strong>Your Company Username:</strong>${c_username}</li>
          <li><strong>Admin user id:</strong>${c_email}</li>
          <li><strong>Admin Password:</strong>${c_password}</li>
          <li><strong>Student Pannel Url:</strong>${c_username}.student.celsisuslms.com</li>
          <li><strong>Trainer Pannel Url:</strong>${c_username}.trainer.celsisuslms.com</li>
        </ul>

        <div class="footer" style="font-size: 16px; text-align: center">
          <p>Best regards,</p>
          <p>Jaamun Team</p>
        </div>
      </div>
    </div>
  </body>
</html>

`;

export default saaSRequsteConfirmEmail;
