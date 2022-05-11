const mysql = require('mysql')
const express = require('express')
const session = require('express-session')
const path = require('path')
const connection = require('./database')	// requires database.js
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
	res.sendFile(path.join(__dirname + '/public/login.html'))
})

// http://localhost:3000/login
app.get('/login', (req, res) => {
	// Render login template
	//res.sendFile(path.join(__dirname + '/login.html'))
	res.sendFile(path.join(__dirname + '/public/login.html'))
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
		connection.query('SELECT username, password, userType FROM userAuth WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
			// If there is an issue with the query, output the error
			if (error) throw error;
			// If the account exists
			if (results.length > 0) {
				// Authenticate the user
				req.session.loggedin = true;
				req.session.username = username;
				// Redirect to home page based off userType
				var usertype = results[0].userType

				// If admin user signs in
				if (usertype === 'admin') {
					var sql_users = "SELECT employee_id, firstname, surname, speciality, contract_type, start_date from Users"
					connection.query(sql_users, function (err_users, users_data, fields_users) {
						if (err_users) throw err_users
						console.log(users_data)
						res.render('admin', { userName: username, userData: users_data})
					});		
				}

				// If employee user signs in
				if (usertype === 'employee') {
					// app.get('selfhelp' , { name: username })
					var sql_cases = "SELECT case_id, date_opened, status_code, software_name, hardware_make_name, model_name, problem_title, solution " +
									"FROM Cases as c " + 
									"INNER JOIN Problem as prob " + 
									"ON c.problem_id=prob.problem_id " + 
									"INNER JOIN HardwareModels as models " +
									"ON c.hardware_id=models.model_id " +
									"INNER JOIN HardwareMake as make " +
									"ON models.make_id=make.hardware_make_id " +
									"INNER JOIN Software as soft " +
									"ON c.software_id=soft.software_id " +
									"INNER JOIN Solutions as solu " +
									"ON prob.problem_id=solu.problem_id " +
									"ORDER BY date_opened DESC"
					var sql_make = "SELECT HardwareMake.hardware_make_name FROM HardwareMake"
					var sql_model = "SELECT HardwareModels.model_name FROM HardwareModels"
					var sql_software = "SELECT Software.software_name FROM Software"
					var sql_desc = "SELECT Problem.problem_title FROM Problem"
					// Could have allowed "multipleStatements" but this is generally unsafe to use as it exposes to sqlinjection

					connection.query(sql_cases, function (err_cases, cases_data, fields_cases) {
						if (err_cases) throw err_cases
						// console.log(cases_data)

						connection.query(sql_make, function (err_makes, makes_data, fields_makes) {
							if (err_makes) throw err_makes
							// console.log(makes_data)

							connection.query(sql_model, function (err_model, model_data, fields_model) {
								if (err_model) throw err_model
								// console.log(model_data)

								connection.query(sql_desc, function (err_desc, desc_data, fields_desc) {
									if (err_desc) throw err_desc
									// console.log(desc_data)

									connection.query(sql_software, function (err_softw, softw_data, fields_model) {
										if (err_softw) throw err_softw
										// console.log(softw_data)
			
										res.render('selfhelp', { userName: username, userData: cases_data, makes: makes_data, models: model_data, desc: desc_data, soft: softw_data})
									});
								});
							});
						});
					});
				}

				// If specialist user signs in
				if (usertype === 'specialist') {
					res.render('specialist', { name: username })
				}
			} else {
				res.render('login', { errormessage: 'Incorrect Username and/or Password!' })
				// res.send('Incorrect Username and/or Password!')
			}
			
		});
	} else {
		res.render('login', { errormessage: 'Please enter Username and Password!' })
		// res.send('Please enter Username and Password!')
		res.end();
	}
});

app.listen(5020);
