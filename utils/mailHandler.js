import mailgun from 'mailgun-js'
const DOMAIN = 'www.jaamun.com'
const mg = mailgun({ apiKey: process.env.MAIL_GUN, domain: DOMAIN })

const sendMail = async (email, subject, template) => {
  const data = {
    from: 'Jaamun <no-reply@jaamun.com>',
    to: email,
    subject: subject,
    html: template,
  }
  await mg.messages().send(data, function (error, body) {
    console.log(body)
    console.log('error', error)
  })
}

export { sendMail }
