const saaSRequsteConfirmEmail = (c_name, c_email, c_username, c_password) => `
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
                              <img src="https://jmkcrsmn.s3.us-east-2.amazonaws.com/email_teamplate/logo.png" alt="logo" style="width: 354px; height: 75px;" />
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
                                  We are pleased to inform you that your request for our SaaS service has been successfully verified.
                                  You can now access the features and resources of our platform. If you have any questions or need further
                                  assistance, feel free to reach out to our support team at info@jaamun.com. Thank you for choosing Jaamun. We look
                                  forward to supporting your needs.
                              </p>
                          </td>
                      </tr>
                      <tr>
                          <td align="center" style="padding: 10px;">
                              <table style="width: 100%; text-align: left; font-size: 14px; line-height: 1.6;">
                                  <tr><td><strong>Your Admin Url:</strong> ${c_username}.admin.celsisuslms.com</td></tr>
                                  <tr><td><strong>Your Company Username:</strong> ${c_username}</td></tr>
                                  <tr><td><strong>Admin user id:</strong> ${c_email}</td></tr>
                                  <tr><td><strong>Admin Password:</strong> ${c_password}</td></tr>
                                  <tr><td><strong>Student Pannel Url:</strong> ${c_username}.student.celsisuslms.com</td></tr>
                                  <tr><td><strong>Trainer Pannel Url:</strong> ${c_username}.trainer.celsisuslms.com</td></tr>
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

export default saaSRequsteConfirmEmail;
