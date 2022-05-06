const express = require('express')
const app = express()
const { ROLE, users } = require('./data')
const { authUser, authRole } = require('./basicAuth')

app.set('view engine', 'ejs')   // set view engine

app.use(express.json())
app.use(setUser)
app.use(express.static("public"))   // diplay static pages - CSS AND JS HERE (and any pages which do not have dynamic data)

app.get('/', (req, res) => {
  res.render('index')
})

app.get('/admin', authUser, authRole(ROLE.ADMIN), (req, res) => {
  // auth user - check user is logged in
  // auth role - check user has the correct role type to access this page
  res.render('admin')
})

app.get('/selfhelp', authUser, authRole(ROLE.EMPLOYEE), (req, res) => {
  res.render('selfhelp')
})

app.get('/specialist', authUser, authRole(ROLE.SPECIALIST), (req, res) => {
  res.render('specialist')
})

function setUser(req, res, next) {
  // set user to be signed in
  const userId = req.body.userId
  if (userId) {
    req.user = users.find(user => user.id === userId)
  }
  next()
}

app.listen(3000)