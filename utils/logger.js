import jwt from 'jsonwebtoken'
import IP from 'ip'
import { PrismaClient } from '@prisma/client'
import { format } from 'date-fns'

const prisma = new PrismaClient()
export default async function logger(req, res, next) {
  const { authorization } = req.headers
  const ip_address = IP.address()
  const { operationName } = req.body
  const dateTime = new Date()
  if (authorization) {
    const { userId, role } = jwt.verify(
      authorization,
      process.env.JWT_SECRET_KEY
    )
    if (userId && role && operationName) {
      await prisma.jmkloginfo.create({
        data: {
          log_desc: `${ip_address} ${userId} ${role} ${operationName} ${dateTime}`,
        },
      })
    }
  } else {
    await prisma.jmkloginfo.create({
      data: {
        log_desc: `${ip_address} 0 Guest null null              `,
      },
    })
  }
  return next()
}
