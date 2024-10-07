const saaSRequsteEmail = (c_name, c_email, c_package, c_package_type) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title></title>
    <style>
      body {
        background: #f8f7fb;
      }
      .container {
        max-width: 600px;
        overflow: hidden;
        height: 100vh;
        margin: 0 auto;
        background-color: #fff;
        position: relative;

      }

      .logo {
        width: 354px;
        height: 75px;
      }

      .content {
        width: 470px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
      .heading {
        text-align: center;
        width: 420px;
        font-weight: 700;
        font-size: 36px;
      }

      .description {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .btn__vector {
        position: absolute;

        width: 290px;

        right: 0;
        bottom: -5rem;
      }
      .right__line {
        width: 456px;
        position: absolute;
        right: 0%;
      }

      .left__line {
        width: 500px;
        position: absolute;
        bottom: 0;
        left: 0;
      }
      .footer {
        text-align: center;
      }

      ul{
        list-style: none;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <img src="/public/topVector.png" alt="vector" />
      <img src="/public/rightLine.png" alt="vector" class="right__line" />

      <div class="content">
        <img src="/public//logo.png" alt="logo" class="logo" />

        <h1 class="heading">Welcome to Celsius LMS by Jaamun</h1>

        <div class="description">
          <strong style="font-weight: 700; margin-bottom: 6px"
            >Dear ${c_name},</strong
          >

          You have successfully requested a new SaaS service from ${c_name}. Our team will review your request, and an admin will need to approve it before proceeding. We will get back to you shortly with further details.
        </div>

        <ul class="list">
          <li><strong>Company Name:</strong> ${c_name}</li>
          <li><strong>Email:</strong> ${c_email}</li>
          <li><strong>Request Package:</strong> ${c_package}</li>
          <li><strong>Request Package Type:</strong> ${c_package_type}</li>
      </ul>

        <div class="footer" style="font-size: 16px">
          <p>Best regards,</p>
          <p>Jaamun Team</p>
        </div>
      </div>

      <img src="/public/leftLine.png" alt="vector" class="left__line" />

      <img src="/public/buttonVector.png" alt="" class="btn__vector" />
    </div>
  </body>
</html>



`;

export default saaSRequsteEmail;
