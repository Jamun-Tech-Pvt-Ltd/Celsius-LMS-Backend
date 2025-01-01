const saaSRequsteEmail = (c_name, c_email, c_package, c_package_type) => `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title></title>
    </head>
    <body style="background: #f8f7fb; margin: 0; padding: 0; font-family: Arial, sans-serif;">
      <table align="center" width="100%" cellpadding="0" cellspacing="0" style="background: #f8f7fb; padding: 20px;">
          <tr>
              <td align="center">
                  <table width="600px" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; padding: 20px;">
                      <tr>
                          <td align="center" style="padding: 20px 0;">
                              <img
                                src="https://jmkcrsmn.s3.us-east-2.amazonaws.com/email_teamplate/logo.png"
                                alt="logo"
                                style="width: 354px; height: 75px;"
                              />
                          </td>
                      </tr>
                      <tr>
                          <td align="center" style="padding: 10px;">
                              <h1 style="font-size: 24px; color: #333333; margin: 0;">Welcome to Celsius LMS by Jaamun</h1>
                          </td>
                      </tr>
                      <tr>
                          <td align="center" style="padding: 10px 20px; color: #555555; line-height: 1.6;">
                              <p>
                                  <strong style="font-weight: 700;">Dear ${c_name},</strong> <br>
                                  You have successfully requested a new SaaS service from testuser. Our team will review your request, and an admin will need to approve it before proceeding. We will get back to you shortly with further details.
                              </p>
                          </td>
                      </tr>
                      <tr>
                          <td align="center" style="padding: 10px;">
                              <table style="width: 100%; text-align: left; font-size: 14px; line-height: 1.6;">
                                  <tr><td><strong>Company Name:</strong> ${c_name}</td></tr>
                                  <tr><td><strong>Email:</strong> ${c_email}</td></tr>
                                  <tr><td><strong>Request Package:</strong> ${c_package}</td></tr>
                                  <tr><td><strong>Request Package Type:</strong> ${c_package_type}</td></tr>
                              </table>
                          </td>
                      </tr>
                      <tr>
                          <td align="center" style="padding: 20px 0; color: #555555;">
                              <p>Best regards,</p>
                              <p>Jaamun Team</p>
                          </td>
                      </tr>
                  </table>
              </td>
          </tr>
      </table>
    </body>
  </html>
`;

export default saaSRequsteEmail;
