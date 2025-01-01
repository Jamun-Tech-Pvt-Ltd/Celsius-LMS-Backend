const saaSRequsteEmail = (c_name, c_email, c_package, c_package_type) => `
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
        You have successfully requested a new SaaS service from testuser. Our team will review your request, and an admin will need to approve it before proceeding. We will get back to you shortly with further details.
        </div>

        <ul class="list" style="list-style: none">
          <li><strong>Company Name:</strong> ${c_name}</li>
          <li><strong>Email:</strong> ${c_email}</li>
          <li><strong>Request Package:</strong> ${c_package}</li>

          <li><strong>Request Package Type:</strong> ${c_package_type}</li>

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

export default saaSRequsteEmail;
