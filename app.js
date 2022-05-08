const mysql = require('mysql')
const express = require('express')
const session = require('express-session')
const path = require('path')

const connection = mysql.createConnection({
    host: "localhost",
    user: "teamb020",
    password: "5EXRtJg8aY",
    database: "teamb020"
  })

const app = express()

app.set('view engine', 'ejs')   // set view engine

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"))

// http://localhost:3000/
app.get('/', (req, res) => {
	// Render login template
	res.sendFile(path.join(__dirname + '/login.html'))
})

// http://localhost:3000/login
app.get('/login', (req, res) => {
	// Render login template
	//res.sendFile(path.join(__dirname + '/login.html'))
	res.sendFile(path.join(__dirname + '/login.html'))
})

app.get('/auth', (req, res) => {
	res.render('login', { errormessage: 'Something went wrong please try again' })
})

// http://localhost:3000/auth
app.post('/auth', (req, res) => {
	// Capture the input fields
	var username = req.body.username;
	var password = req.body.password;
	// Ensure the input fields exists and are not empty
	if (username && password) {
		// Execute SQL query that'll select the account from the database based on the specified username and password
		connection.query('SELECT username, password, userType FROM userAuth WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			// If there is an issue with the query, output the error
			if (error) throw error;
			// If the account exists
			if (results.length > 0) {
				// Authenticate the user
				req.session.loggedin = true;
				req.session.username = username;
				// Redirect to home page based off userType
                var usertype = results[0].userType
                if(usertype === 'admin') {
                    res.render('admin')
                }
                if(usertype === 'employee') {
                    res.render('selfhelp', { name: username })
                }
                if(usertype === 'specialist') {
                    res.render('specialist', { name: username })
                }
			} else {
				res.render('login', { errormessage: 'Incorrect Username and/or Password!'})
				// res.send('Incorrect Username and/or Password!')
			}			
			res.end();
		});
	} else {
		res.render('login', { errormessage: 'Please enter Username and Password!'})
		// res.send('Please enter Username and Password!')
		res.end();
	}
});

// http://localhost:3000/home
app.get('/home', (req, res) => {
	// If the user is loggedin
	if (req.session.loggedin) {
		// Output username
		res.send('Welcome back, ' + res.session.username + '!')
	} else {
		// Not logged in
		res.send('Please login to view this page!')
	}
	res.end();
});

app.listen(5020);
