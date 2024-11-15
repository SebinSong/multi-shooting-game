const path = require('path')
const express = require('express')
const app = express()
const PORT = 5050

const publicPath = path.join(__dirname, 'public')

app.use(express.static(publicPath))
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}...`)
})