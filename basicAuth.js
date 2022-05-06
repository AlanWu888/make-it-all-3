function authUser(req, res, next) {
  // middleware to check: if the user exists & if they are logged in, continue
  // otherwise, throw error
  if (req.user == null) {
    res.status(403) // 403 Forbidden: do not have permission to access this
    return res.send('You need to sign in')
  }

  next()
}

function authRole(role) {
  // Authenticate user roles
  return (req, res, next) => {
    if (req.user.role !== role) {
      res.status(401) // 401 Authorisation required
      return res.send('Not allowed')
    }

    next()
  }
}

module.exports = {
  authUser,
  authRole
}