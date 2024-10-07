const saaSRequsteConfirmEmail = (c_name, c_email, c_username, c_password) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title></title>
  </head>
  <body style="background: #f8f7fb;">
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
      <!-- <img src="/public/topVector.png" alt="vector" />
      <img
        src="/public/rightLine.png"
        alt="vector"
        class="right__line"
        style="width: 456px; position: absolute; right: 0%;"
      /> -->

      <div
        class="content"
        style="
          width: 470px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        "
      >
        <!-- <img
          src="/public/logo.png"
          alt="logo"
          class="logo"
          style="width: 354px; height: 75px;"
        /> -->

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

        <div
          class="description"
          style="
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
          "
        >
          <strong style="font-weight: 700; margin-bottom: 6px;">Dear ${c_name},</strong>

          We are pleased to inform you that your request for our SaaS service has
          been successfully verified. You can now access the features and
          resources of our platform. If you have any questions or need further
          assistance, feel free to reach out to our support team at
          info@jaamun.com. Thank you for choosing Jaamun. We look forward to
          supporting your needs.
        </div>

        <ul class="list" style="list-style: none;">
          <li>
            <strong>Your Admin Url:</strong> ${c_username}.admin.jaamun.com
          </li>
          <li>
            <strong>Admin user id:</strong> ${c_email}
          </li>
          <li>
            <strong>Admin Password:</strong> ${c_password}
          </li>
          <li>
            <strong>Student Pannel Url:</strong> ${c_username}.student.jaamun.com
          </li>
          <li>
            <strong>Trainer Pannel Url:</strong> ${c_username}.trainer.jaamun.com
          </li>
        </ul>

        <div class="footer" style="font-size: 16px; text-align: center;">
          <p>Best regards,</p>
          <p>Jaamun Team</p>
        </div>
      </div>

      <!-- <img
        src="/public/leftLine.png"
        alt="vector"
        class="left__line"
        style="width: 500px; position: absolute; bottom: 0; left: 0;"
      />

      <img
        src="/public/buttonVector.png"
        alt=""
        class="btn__vector"
        style="position: absolute; width: 270px; right: 0; bottom: -5rem;"
      /> -->
    </div>
  </body>
</html>


`;

export default saaSRequsteConfirmEmail;
