const mysql = require('mysql')
const express = require('express')
const session = require('express-session')
const path = require('path')
const connection = require('./database')	// requires database.js
const app = express()
const bodyParser = require('body-parser')

///////////////////////////////////////////////////////////////////////////////////////////////////

function getDate() {
	// Author : Alan
	var today = new Date();
	var dd = String(today.getDate()).padStart(2, '0');
	var mm = String(today.getMonth() + 1).padStart(2, '0');
	var yyyy = today.getFullYear();
	today = yyyy + "-" + mm + "-" + dd;

	return today;
}

function generatePassword() {
	// Auhtor : Jordan
	// generate random 8 character password:
	var pass = '';
	var str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
		'abcdefghijklmnopqrstuvwxyz0123456789@#$';

	for (let i = 1; i <= 8; i++) {
		var char = Math.floor(Math.random()
			* str.length + 1);

		pass += str.charAt(char)
	}
	return pass;
}

///////////////////////////////////////////////////////////////////////////////////////////////////

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

///////////////////////////////////////////////////////////////////////////////////////////////////

app.get('/auth/delete/:employee_ID', function (req, res, next) {
	// Author: Raynell
	var id = req.params.employee_ID;

	var deleteUser = `DELETE FROM Users WHERE employee_id = "${id}"`
	var deleteAuth = `DELETE FROM userAuth WHERE employeeID = "${id}"`
	var sql_users = "SELECT userAuth.employeeID as employee_ID, Users.firstname, userAuth.userType as userType, Users.speciality, Users.contract_type, Users.start_date " + 
					"FROM `Users` " + 
					"INNER JOIN userAuth " + 
					"ON Users.employee_id = userAuth.employeeID"
					
	connection.query(deleteUser, function (err_userDelete, userDelete_results, userDelete_fields) {
		if (err_userDelete) throw err_userDelete;
		connection.query(deleteAuth, function (err_userAuthDelete, userAuthDelete_results, userAuthDelete_fields) {
			if (err_userAuthDelete) throw err_userAuthDelete;

			connection.query(sql_users, function (err_users, users_data, fields_users) {
				if (err_users) throw err_users
				res.render('admin', {userData: users_data })
			});
		})
	})
});

// http://localhost:3000/
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname + '/public/login.html'))
})

// http://localhost:3000/login
app.get('/login', (req, res) => {
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
	// Author : Alan
	// used for updating card status codes
	var username;
	var user_id = req.body.user_session_id;
	var values = req.body.selectAcion;
	var action = values.substring(0, 1);
	var case_id = values.substr(-(values.length - 2));

	// console.log(req.body.user_session_id);

	var sql_status_assign = "UPDATE Cases " +
		"SET status_code = 'Assigned' " +
		"WHERE case_id = ?"
	var sql_status_closed = "UPDATE Cases " +
		"SET status_code = 'Closed' " +
		"WHERE case_id = ?"
	if (action === "1") {
		connection.query(sql_status_closed, [case_id], function (error, results, fields) {
			if (error) throw error;
			console.log("change succesful - closed case");
		})
	}
	if (action === "2") {
		connection.query(sql_status_assign, [case_id], function (error, results, fields) {
			if (error) throw error;
			console.log("change succesful - assigned to specialist");
		})
	}

	// get username
	connection.query('SELECT username FROM `userAuth` WHERE userID = ?', [user_id], function (error, user_results, fields) {
		if (error) throw error;
		// console.log(user_results)
		username = user_results[0].username
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

		connection.query(sql_make, function (err_makes, makes_data, fields_makes) {
			if (err_makes) throw err_makes

			connection.query(sql_model, function (err_model, model_data, fields_model) {
				if (err_model) throw err_model

				connection.query(sql_desc, function (err_desc, desc_data, fields_desc) {
					if (err_desc) throw err_desc
					connection.query(sql_software, function (err_softw, softw_data, fields_model) {
						if (err_softw) throw err_softw

						res.render('selfhelp', { userName: username, userData: cases_data, makes: makes_data, models: model_data, desc: desc_data, soft: softw_data, curr_user: user_id })
					});
				});
			});
		});
	});
})

app.post('/employee', (req, res) => {
	// Author : Alan
	// used to add new problems
	var username;
	var user_id = req.body.user_id_field;
	var date = req.body.newProblem_date;
	var model = req.body.selectModel;
	var software = req.body.selectSoftware;
	var problem = req.body.selectDescription;
	var problem2 = req.body.unseenProblem;

	if (problem != 999) {		// this is for "problem not listed, funcionality was not added due to time restraints... see else clause"
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

		connection.query(sql_make, function (err_makes, makes_data, fields_makes) {
			if (err_makes) throw err_makes

			connection.query(sql_model, function (err_model, model_data, fields_model) {
				if (err_model) throw err_model

				connection.query(sql_desc, function (err_desc, desc_data, fields_desc) {
					if (err_desc) throw err_desc

					connection.query(sql_software, function (err_softw, softw_data, fields_model) {
						if (err_softw) throw err_softw

						res.render('selfhelp', { userName: username, userData: cases_data, makes: makes_data, models: model_data, desc: desc_data, soft: softw_data, curr_user: user_id })
					});
				});
			});
		});
	});
})

// http://localhost:3000/auth
app.post('/auth', (req, res) => {
	// Author(s) : Alan, Raynell, Jordan
	// Routes users from login screen
	var username = req.body.username;
	var password = req.body.password;
	var current_user = 0;

	if (username && password) {																									// Ensure the input fields exists and are not empty
		connection.query('SELECT userID FROM `userAuth` WHERE username = ?', [username], function (error, results, fields) {	// get the user ID of the current session user
			current_user = results[0].userID
			// console.log("current user is: " + current_user)
		})

		// Execute SQL query that'll select the account from the database based on the specified username and password
		connection.query('SELECT username, password, userType FROM userAuth WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
			// If there is an issue with the query, output the error
			if (error) throw error;
			
			if (results.length > 0) {		// If the account exists, authenticate the user
				req.session.loggedin = true;
				req.session.username = username;
				var usertype = results[0].userType		// get user type to route different users

				if (usertype === 'admin') {		// If admin user signs in
					// Author : Raynell
					var sql_users = "SELECT userAuth.employeeID as employee_ID, Users.firstname, userAuth.userType as userType, Users.speciality, Users.contract_type, Users.start_date FROM `Users` INNER JOIN userAuth ON Users.employee_id = userAuth.employeeID"
					connection.query(sql_users, function (err_users, users_data, fields_users) {
						if (err_users) throw err_users
						// console.log(users_data)
						res.render('admin', {userData: users_data })
					});
				}
				
				if (usertype === 'employee') {	// If employee user signs in
					// Author : Alan
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
					// Could have allowed "multipleStatements" but this is generally unsafe to use as it exposes to sql injection vulnerabilities
					connection.query(sql_cases, [current_user], function (err_cases, cases_data, fields_cases) {
						// get cases
						if (err_cases) throw err_cases

						connection.query(sql_make, function (err_makes, makes_data, fields_makes) {
							// get hardware makes, to fill dropdown
							if (err_makes) throw err_makes

							connection.query(sql_model, function (err_model, model_data, fields_model) {
								// get hardware models, to fill dropdown
								if (err_model) throw err_model

								connection.query(sql_desc, function (err_desc, desc_data, fields_desc) {
									// get problem description titles, to fill dropdown
									if (err_desc) throw err_desc

									connection.query(sql_software, function (err_softw, softw_data, fields_model) {
										// get software types, to fill dropdown
										if (err_softw) throw err_softw

										// render selfhelp page with the results of the above sql queuries
										res.render('selfhelp', { userName: username, userData: cases_data, makes: makes_data, models: model_data, desc: desc_data, soft: softw_data, curr_user: current_user })
									});
								});
							});
						});
					});
				}

				if (usertype === 'specialist') {	// If specialist user signs in
					// Author : Alan
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
						// get cases for the specialists
						if (err_cases) throw err_cases
						res.render('specialist', { name: username, userData: cases_data })
					})
				}
			} else {
				res.render('login', { errormessage: 'Incorrect Username and/or Password!' })
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
	// Author : Jordan, editted by Alan
	var userID = parseInt(req.body.userID.trim());
	var firstname = req.body.firstname.trim();
	var surname = req.body.surname.trim();
	var userType = req.body.userType;
	var speciality = req.body.speciality;
	var contractType = req.body.contractType;
	var date = getDate();

	// create unique username
	var username = firstname.substring(0, 1).toLowerCase() + surname.substring(0, 4).toLowerCase() + Math.floor(Math.random() * (999 - 100 + 1) + 100).toString();
	var password = generatePassword();

	// sql queries
	var sqlAddtoUserAuth = "INSERT INTO `userAuth` (`userID`, `username`, `password`, `userType`, `employeeID`) VALUES (?, ?, ?, ?, ?)";
	var sqlAddtoUsers = "INSERT INTO `Users` (`employee_id`, `firstname`, `surname`, `speciality`, `contract_type`, `start_date`) VALUES (?, ?, ?, ?, ?, ?)";

	// check fields are not empty
	connection.query(sqlAddtoUserAuth, [userID, username, password, userType, userID], function (err_userAuth, userAuth_results, userAuth_fields) {
		if (err_userAuth) throw err_userAuth;
		connection.query(sqlAddtoUsers, [userID, firstname, surname, speciality, contractType, date], function (err_users, users_results, fields_users) {
			if (err_users) throw err_users;
			var sql_users = "SELECT userAuth.employeeID as employee_ID, Users.firstname, userAuth.userType as userType, Users.speciality, Users.contract_type, Users.start_date " + 
							"FROM `Users` " + 
							"INNER JOIN userAuth " + 
							"ON Users.employee_id = userAuth.employeeID"
			connection.query(sql_users, function (err_users, users_data, fields_users) {
				if (err_users) throw err_users
				res.render('admin', {userData: users_data })
			});
		});
	});
});

app.listen(5020);