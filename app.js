const bodyParser = require("body-parser");
const express = require("express");

const db = require("./db/db");


const app = express();
var cors = require("cors");
app.use(cors());
const route = require("./route/approute");
// var allowCrossDomain = function(req, res, next) {
//   res.header('Access-Control-Allow-Origin', "*");
//   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
//   res.header('Access-Control-Allow-Headers', 'Content-Type');
//   next();
// }
// app.configure(function() {
//   app.use(allowCrossDomain);
 
// }); 

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
route(app);
app.use('/images',express.static(__dirname+"/images"));
const PORT = 5233;
app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
// var http=require('http');

// var server=http.createServer(function(req,res){
//   res.end('test');
// });

// server.on('listening',function(){
//   console.log('ok, server is running');
// });

// server.listen(80);
// app.post("/api/v1/user", (req, res) => {
//   if (!req.body.firstname) {
//     return res.status(400).send({
//       success: "false",
//       message: "first name is required"
//     });
//   } else if (!req.body.lastname) {
//     return res.status(400).send({
//       success: "false",
//       message: "last name is required"
//     });
//   } else if (!req.body.email) {
//     return res.status(400).send({
//       success: "false",
//       message: "email is required"
//     });
//   }
//   const user = {
//     id: db.length + 1,
//     firstname: req.body.firstname,
//     lastname: req.body.lastname,
//     email: req.body.email,
//     password: req.body.password
//   };
//   db.push(user);
//   return res.status(201).send({
//     success: "true",
//     message: "user added successfully",
//     user
//   });
// });
// app.get("/api/v1/user", (req, res) => {
//   res.status(200).send({
//     success: "true",
//     message: "user retrived",
//     user: db
//   });
// });
