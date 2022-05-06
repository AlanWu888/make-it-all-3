const mysql = require('mysql');
//local mysql db connection
const dbConn = mysql.createConnection({
  host: "localhost",
  user: "teamb020",
  password: "5EXRtJg8aY",
  database: "teamb020"
});

dbConn.connect(function(err) {
  if (err) throw err;
  console.log("Database Connected!");
});

dbConn.query("SELECT * FROM userAuth", function (err, result, fields) {
  if (err) throw err;
    console.log(result);
});

module.exports = dbConn;