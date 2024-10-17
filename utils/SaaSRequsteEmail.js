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
      
          "
        >
          <strong style="font-weight: 700; margin-bottom: 6px"
            >Dear ${c_name},</strong
          >
          You have successfully requested a new SaaS service from ${c_name}. Our
          team will review your request, and an admin will need to approve it
          before proceeding. We will get back to you shortly with further
          details.
        </div>

        <ul class="list" style="list-style: none; ">
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

      <!-- <img
        src="/leftLine.png"
        alt="vector"
        class="left__line"
        style="width: 500px; position: absolute; bottom: 0; left: 0;"
      />

      <img
        src="/public/buttonVector.png"
        alt=""
        class="btn__vector"
        style="position: absolute; width: 290px; right: 0; bottom: -5rem;"
      /> -->
    </div>
  </body>
</html>

`;

export default saaSRequsteEmail;
