# Nodejs with Apollo Server

## How to run project

1. clone projet from github
2. Run: npm i -f 
3. Run: npm run dev
4. open [`http://localhost:4000/graphql`](http://localhost:4000/graphql)

## Tests and coverage

```bash
npm ci --ignore-scripts
npm test -- --runInBand
npm run test:coverage
```

The coverage command enforces at least 80% statements, branches, functions, and
lines **for each application JavaScript file**, including controllers, utilities,
server startup, database lifecycle, schema/resolvers, and the seed script.
Configuration, test helpers, dependencies, assets, and generated files are excluded.
Open `coverage/index.html` for the HTML report; machine-readable results are in
`coverage/coverage-summary.json`.

Tests mock Prisma, S3, Mailgun, OpenAI, and server listeners. They need no `.env`
file, credentials, running database, or external services. They cover resolver
behavior and error handling; they do not replace integration tests against real
services. The deployment workflow runs the coverage check before copying files.

## Database checkup
- npx prisma studio ( open databse on port:5555 )
- npx prisma db pull ( pull all table and column from databse )
- npx prisma db push ( push all your database modals changes to databse )
- npx prisma generate ( generate prisma client )

## Deployment
- AWS live server [`server.jamuntek.com`](https://server.jamuntek.com/)
- AWS test server [`test env`](http://43.204.184.252:4000/graphql)
- Local server [`local env`](http://localhost:4000/graphql)

## How to Deploy
- Push your chamges to git 
- Login AWS EC2 using ssh link and .key file
- Goto backend-server git pull your changes 
- Remove currently runnning pm2 servers ( this step is only for test env ) ( pm2 list and pm2 delete ids ex: pm2 delete 1 2 3 )
- Run npm run build ( npm i if any packages changes )
- Run : npm run pm2
- check pm2 server : pm2 list

## aws and mailgun 
- AWS Buket name : jmkcrsmn ( use : userImages , corse videos , email template images , course PDF )
- mailgun : handle formsubmit mails



# SSL Certificate Management with Certbot

## Renew Certificate
To renew the SSL certificate for all domains, use the following command:

```bash
sudo certbot renew --dry-run
```
## Command Used for Certbot SSL Certificate
```bash
sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  -d '*.admin.celsiuslms.com' \
  -d '*.student.celsiuslms.com' \
  -d '*.trainer.celsiuslms.com' \
  -d admin.jaamun.com \
  -d jaamun.com \
  -d server.jaamun.com \
  -d www.celsiuslms.com \
  -d celsiuslms.com \
  -d www.jaamun.com \
  -d www.arlcg.net \
  -d arlcg.net \
  -d www.jobsupport.us
  ````

  run
  
