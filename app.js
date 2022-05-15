const mysql = require('mysql')
const express = require('express')
const session = require('express-session')
const path = require('path')
const connection = require('./database')	// requires database.js
const app = express()
const bodyParser = require('body-parser')
const conn = require('./database')

////////////////////////////////////////////////////////////////////////

function getDate() {
	var today = new Date();
	var dd = String(today.getDate()).padStart(2, '0');
	var mm = String(today.getMonth() + 1).padStart(2, '0');
	var yyyy = today.getFullYear();
	today = yyyy + "-" + mm + "-" + dd;

	return today;
}

////////////////////////////////////////////////////////////////////////

app.set('view engine', 'ejs')   // set view engine

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"))
app.use(bodyParser.json())

////////////////////////////////////////////////////////////////////////

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

app.get('/employee', (req, res) => {
	res.render('login', { errormessage: 'Something went wrong please try again' })
})

app.get('/admin', (req, res) => {
	res.render('admin', { errormessage: 'Something went wrong please try again' })
})

app.post('/solutionOutcome', (req, res) => {
	var username;
	var user_id = req.body.user_session_id;
	var values = req.body.selectAcion;
	var action = values.substring(0,1);
	var case_id =  values.substr(-(values.length-2));

	console.log(req.body.user_session_id);

	var sql_status_assign = "UPDATE Cases " +
							"SET status_code = 'Assigned' "+
							"WHERE case_id = ?"
	var sql_status_closed = "UPDATE Cases " +
							"SET status_code = 'Closed' "+
							"WHERE case_id = ?"
	if (action==="1"){
		connection.query(sql_status_closed, [case_id], function(error, results, fields) {
			if (error) throw error;
			console.log("change succesful - closed case");
		})
	}
	if (action==="2") {
		connection.query(sql_status_assign, [case_id], function(error, results, fields) {
			if (error) throw error;
			console.log("change succesful - assigned to specialist");
		})
	}

	// get username
	connection.query('SELECT username FROM `userAuth` WHERE userID = ?', [user_id], function (error, user_results, fields) {
		if (error) throw error;
		console.log(user_results)
		// username = user_results[0].username
		// console.log("current user is: " + username)
	})

	// redirect to selfhelp page
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
		"WHERE c.user_id = ? " +
		"ORDER BY case_id DESC"
	var sql_make = "SELECT HardwareMake.hardware_make_name FROM HardwareMake"
	var sql_model = "SELECT HardwareModels.model_name FROM HardwareModels"
	var sql_software = "SELECT Software.software_name FROM Software"
	var sql_desc = "SELECT Problem.problem_title FROM Problem"

	connection.query(sql_cases, [user_id], function (err_cases, cases_data, fields_cases) {
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

						res.render('selfhelp', { userName: username, userData: cases_data, makes: makes_data, models: model_data, desc: desc_data, soft: softw_data, curr_user: user_id })
					});
				});
			});
		});
	});
})

app.post('/employee', (req, res) => {
	var username;
	var user_id = req.body.user_id_field;
	var date = req.body.newProblem_date;
	var model = req.body.selectModel;
	var software = req.body.selectSoftware;
	var problem = req.body.selectDescription;
	var problem2 = req.body.unseenProblem;

	if (problem != 999) {
		// INSERT INTO `Cases` (`case_id`, `user_id`, `date_opened`, `software_id`, `hardware_id`, `problem_id`, `status_code`) VALUES (NULL, '2', '2022-05-02', '3', '1', '1', 'Pending');
		var sql_insert = "INSERT INTO `Cases` (`case_id`, `user_id`, `date_opened`, `software_id`, `hardware_id`, `problem_id`, `status_code`) VALUES (NULL, ?, ?, ?, ?, ?, 'Pending')";
		connection.query(sql_insert, [user_id, date, software, model, problem], function (error, results, fields) {
			if (error) throw error;
			console.log("successfully added");
		})
	} else {
		// add new row to the problems table
		// get the id of the new problem
		// add new row to columns table
	}

	// get username
	connection.query('SELECT username FROM `userAuth` WHERE userID = ?', [user_id], function (error, results, fields) {
		if (error) throw error;
		username = results[0].username
		// console.log("current user is: " + username)
	})

	// redirect to selfhelp page
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
		"WHERE c.user_id = ? " +
		"ORDER BY case_id DESC"
	var sql_make = "SELECT HardwareMake.hardware_make_name FROM HardwareMake"
	var sql_model = "SELECT HardwareModels.model_name FROM HardwareModels"
	var sql_software = "SELECT Software.software_name FROM Software"
	var sql_desc = "SELECT Problem.problem_title FROM Problem"

	connection.query(sql_cases, [user_id], function (err_cases, cases_data, fields_cases) {
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

						res.render('selfhelp', { userName: username, userData: cases_data, makes: makes_data, models: model_data, desc: desc_data, soft: softw_data, curr_user: user_id })
					});
				});
			});
		});
	});
})

// http://localhost:3000/auth
app.post('/auth', (req, res) => {
	// Capture the input fields
	var username = req.body.username;
	var password = req.body.password;
	var current_user = 0;
	// Ensure the input fields exists and are not empty
	if (username && password) {
		// get the user ID of the current session user
		connection.query('SELECT userID FROM `userAuth` WHERE username = ?', [username], function (error, results, fields) {
			current_user = results[0].userID
			// console.log("current user is: " + current_user)
		})

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
					var sql_users = "SELECT userAuth.employeeID, Users.firstname, userAuth.userType, Users.speciality, Users.contract_type, Users.start_date FROM `Users` INNER JOIN userAuth ON Users.employee_id = userAuth.employeeID"
					connection.query(sql_users, function (err_users, users_data, fields_users) {
						if (err_users) throw err_users
						console.log(users_data)
						res.render('admin', { userName: username, userData: users_data })
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
						"WHERE c.user_id = ? " +
						"ORDER BY case_id DESC"
					var sql_make = "SELECT HardwareMake.hardware_make_name FROM HardwareMake"
					var sql_model = "SELECT HardwareModels.model_name FROM HardwareModels"
					var sql_software = "SELECT Software.software_name FROM Software"
					var sql_desc = "SELECT Problem.problem_title FROM Problem"
					// Could have allowed "multipleStatements" but this is generally unsafe to use as it exposes to sqlinjection

					connection.query(sql_cases, [current_user], function (err_cases, cases_data, fields_cases) {
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

										res.render('selfhelp', { userName: username, userData: cases_data, makes: makes_data, models: model_data, desc: desc_data, soft: softw_data, curr_user: current_user })
									});
								});
							});
						});
					});
				}

				// If specialist user signs in
				if (usertype === 'specialist') {
					var sql_cases = "SELECT case_id, date_opened, status_code, software_name, hardware_make_name, model_name, problem_title, solution " +
						"FROM Cases as c " +
						"INNER JOIN " +
						"Problem as prob  " +
						"ON c.problem_id=prob.problem_id " +
						"INNER JOIN " +
						"HardwareModels as models " +
						"ON c.hardware_id=models.model_id " +
						"INNER JOIN " +
						"HardwareMake as make " +
						"ON models.make_id=make.hardware_make_id " +
						"INNER JOIN " +
						"Software as soft " +
						"ON c.software_id=soft.software_id " +
						"INNER JOIN " +
						"Solutions as solu " +
						"ON prob.problem_id=solu.problem_id " +
						"WHERE status_code = 'Assigned' " +
						"ORDER BY date_opened DESC"
					connection.query(sql_cases, [current_user], function (err_cases, cases_data, fields_cases) {
						if (err_cases) throw err_cases
						// console.log(cases_data)
						res.render('specialist', { name: username, userData: cases_data })
					})
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

// admin page: insert new user to table
app.post('/admin', (req, res) => {

	var userID = parseInt(req.body.userID.trim());
	var firstname = req.body.firstname.trim();
	var surname = req.body.surname.trim();
	var userType;
	var speciality = req.body.speciality;
	var contractType;
	var date = getDate();

	switch (parseInt(req.body.userType)) {
		case 0:
			userType = 'admin';
		case 1:
			userType = 'employee';
		case 2:
			userType = 'specialist';
	}

	switch (parseInt(req.body.contractType)) {
		case 0:
			contractType = 'Permanent';
		case 1:
			contractType = 'Temporary';
	}

	// create unique username
	var username = firstname.substring(0, 1).toLowerCase() + surname.substring(0, 4).toLowerCase() + Math.floor(Math.random() * (999 - 100 + 1) + 100).toString();

	// sql queries
	var sqlAddtoUsers = "INSERT INTO `Users` (`employee_id`, `firstname`, `surname`, `speciality`, `contract_type`, `start_date`) VALUES (?, ?, ?, ?, ?, ?)";
	var sqlAddtoUserAuth = "INSERT INTO `userAuth` (`userID`, `username`, `password`, `userType`, `employeeID`) VALUES (?, ?, 'test123', ?, ?)";

	// check fields are not empty
	if (firstname && surname) {
		connection.query(sqlAddtoUserAuth, [userID, username, userType, userID], function (err_userAuth, userAuth_results, userAuth_fields) {
			if (err_userAuth) throw err_userAuth;
			connection.query(sqlAddtoUsers, [userID, firstname, surname, speciality, contractType, date], function (err_users, users_results, fields_users) {
				if (err_users) throw err_users;
				// res.render('admin', { userName: username, userData: users_results});
				// back to admin page ??
				console.log("successfully added");

			});
		});


	}

});

app.listen(5020);