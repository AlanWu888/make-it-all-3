var mysql = require('mysql');
const conn = mysql.createConnection({
    host: "localhost",
    user: "teamb020",
    password: "5EXRtJg8aY",
    database: "teamb020"
  })
conn.connect(function(err) {
  if (err) throw err;
  console.log('Database is connected successfully !');
});
module.exports = conn;