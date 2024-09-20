import app from './server.js'
const port = process.env.PORT || 4000
const hostname = process.env.HOSTNAME || 'localhost'

app.listen(port, hostname, () => {
  console.log(`\n Server is running on ${hostname} port ${port}\n`)
})
