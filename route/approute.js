const route = app => {
  var multer = require('multer')
  const storage = multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'images')
    },
    filename(req, file, cb) {
      console.log('HII', this.filename)
      var type = file.mimetype.replace('image/', '')
      cb(null, `${file.fieldname}-${Date.now()}.${type}`);
    }
  })
  var upload = multer({ storage: storage })

  const client = require("../db/db");
  const jwt = require("jsonwebtoken");
  function checkToken(req, res, next) {
    // console.log(req.headers);
    const header = req.headers["authorization"];
    // console.log(header.split(" "));
    if (typeof header !== "undefined") {
      const bearer = header.split(" ");
      const token = bearer[1];
      // console.log("token", token);
      jwt.verify(token, "secret", (err, data) => {
        if (err) {
          console.log(err);
          res.sendStatus(401);
        } else {
          req.body.token = token;
          // console.log("verified");
          next();
        }
      });
    } else {
      //If header is undefined return Forbidden (403)
      res.sendStatus(403);
    }
  }
  app.get("/getstudent", checkToken, (req, res) => {
    var role = req.query.role;
    // console.log(role, req.query.role);
    if (role === "1") {
      client.query(
        `select teacherid from teacherdetails where token='${req.body.token}'`,
        (err, result) => {
          if (err) console.log(err);
          else {
            var teacherid = result.rows[0].teacherid;
            // console.log(teacherid);
            client.query(
              `select userid,name from studentdetails where teacherid='${teacherid}'`,
              (err, result) => {
                if (err) console.log(err);
                else {
                  res.send({ success: true, result: result.rows });
                }
              }
            );
          }
        }
      );
    } else if (role === "2") {
      // console.log("hello");
      client.query(
        `select userid from studentdetails where token='${req.body.token}'`,
        (err, result) => {
          if (err) console.log(err);
          else {
            var student = result.rows[0].userid;
            client.query(`select coursename,courseheader,courseid from marks full outer join courses on marks.subject=courses.courseid where studentid='${student}'`,
              (err, result) => {
                if (err) console.log(err);
                else {
                  console.log(result.rows);
                  res.send({ success: true, result: result.rows });
                }
              }
            );
          }
        }
      );
    }
  }
  );


  app.post("/select", checkToken, (req, res) => {
    var courseid = req.body.course;
    client.query(
      `select userid,teacherid from studentdetails where token='${req.body.token}'`,
      (err, results) => {
        if (err) {
          res.send(err);
        } else {
          // console.log(results);
          var stdid = results.rows[0].userid;
          var teacherid = results.rows[0].teacherid;
          client.query(
            `insert into subject(studentid,courseid,teacherid) values($1,$2,$3) RETURNING * `,
            [stdid, courseid, teacherid],
            (err, results) => {
              if (err) res.send(err);
              else {
                res.send({ success: true, result: results.rows });
                client.query(
                  `select name from studentdetails where userid=${stdid}`,
                  (err, results) => {
                    if (err) console.log(err);
                    else {
                      var name = results.rows[0].name;
                      client.query(
                        "insert into marks(studentid,name,teacherid,subject) values($1,$2,$3,$4) RETURNING *",
                        [stdid, name, teacherid, courseid],
                        (err, results) => {
                          if (err) res.send(err);
                          else {
                            res.send({ success: true, });
                          }
                        }
                      );
                    }
                  }
                );
              }
            }
          );
        }
      }
    );
  });
  app.post("/removenotify",(req,res)=>{
    client.query(`select userid from studentdetails where token = $1`, [req.body.token],(err,result)=>{
      if(err) console.log(err)
      else{
        var x = result.rows[0].userid;
        client.query(`delete from notification where studentid =${x}`,(err,resu)=>{
          if(err) console.log(err);
          else{
            res.send({success:true})
          }
        })
      }
    })
  });
  app.post("/getnotified", (req, res) => {
    client.query(`select userid from studentdetails where token = $1`, [req.body.token],
     (err, results) => {
      if (err) console.log(err);
      else {
        console.log(results.rows);
        var x = results.rows[0].userid;
        console.log(x,results.rows[0].userid,);
        client.query(`select changedmarks,subject from notification where studentid = ${x}`, (err, result) => {
          if (err) console.log(err);
          else{
            console.log(result);
            
            res.send({ success: true, marks: result.rows ,notification:result.rowCount
             })
          }
        
        })
      }
    })
  })
  app.post("/changemark", (req, res) => {
    client.query(
      "UPDATE marks set marks = $1 where studentid = $2 and subject =$3 ",
      [req.body.mark, req.body.id, req.body.subject],
      (err, result) => {
        if (err) console.log(err);
        else {
          console.log(req.body.subject);
          client.query("insert into notification(studentid,changedmarks,subject) values($1,$2,$3)", [req.body.id, req.body.mark,req.body.subject], (err, results) => {
            if (err) console.log(err);
            else {
              console.log("notified to the student")
            }
          })
          console.log("marks updated successfully");
          res.send({ updated: true, result: result });
        }
      }
    );
  });
  app.post("/revokechange", (req, res) => {
    console.log(req.body.mark, req.body.id, req.body.subject);
    client.query("update marks set marks = $1 where studentid =$2 and subject=$3",
      [req.body.mark, req.body.id, req.body.subject], (err, result) => {
        if (err) console.log(err);
        else {
          console.log("previous updates are revoked");
          res.send({ updated: true, result: result })
        }
      })
  })


  app.post("/signup", upload.single('image'), (req, res) => {
    const path = req.file.path

    if (req.body.role === "2") {
      const image = `http://localhost:5233/${path}`
      console.log(image);
      client.query(
        "INSERT INTO studentdetails (name,email,password,image,teacherid) values($1,$2,$3,$4,$5) RETURNING *",
        [req.body.name, req.body.email, req.body.password, image, req.body.work],
        (err, result) => {
          if (err) console.log(err, res);
          else {
            console.log("data entered");
            if (result.rowCount == 0) {
              res.json({ success: false });
            }
            else {
              let token = jwt.sign({ exp: Math.floor(Date.now() / 1000) + 60 * 60 }, "secret");
              res.json({ success: true, token, role: req.body.role });
              client.query(
                "UPDATE studentdetails set token = $1 where userid = $2 ",
                [token, result.rows[0].userid],
                (err, res) => {
                  if (err) console.log(err, res);
                  else console.log("token entered succesfully");
                }
              );
            }
          }
        }
      );
    } else if (req.body.role === "1") {
      const image = `http://localhost:5233/${path}`
      console.log(image);
      var dept;
      client.query(
        "select courseheader from courses where courseid =$1",
        [req.body.course],
        (err, result) => {
          if (err) console.log(err);
          else {
            dept = result.rows[0].courseheader;
            client.query(
              "INSERT INTO teacherdetails (name,email,password,department,image) values($1,$2,$3,$4,$5) RETURNING * ",
              [req.body.name, req.body.email, req.body.password, dept, image],
              (err, results) => {
                if (err) console.log(err)
                else {
                  console.log("teacher data entered succesfully");
                  if (results.rowCount == 0) {
                    res.send({ success: false });
                  } else {
                    let token = jwt.sign(
                      { exp: Math.floor(Date.now() / 100) + 600 * 600 },
                      "secret"
                    );
                    client.query(
                      "UPDATE teacherdetails set token = $1 where teacherid = $2 ",
                      [token, results.rows[0].teacherid],
                      (err, res) => {
                        if (err) console.log(err, res);
                        else console.log("token entered succesfully");
                      }
                    );
                    res.send({ success: true, token, role: req.body.role });
                  }
                }
              }
            );
          }
        }
      );
    }
  });

  app.get("/marks", checkToken, function (req, res) {
    let role = req.query.isrole;
    if (role === "1") {
      client.query(
        `select name,teacherid from teacherdetails where token = '${req.body.token}'`,
        (err, result) => {
          if (err) console.log(err);
          else {
            let id = result.rows[0].teacherid;
            client.query(
              `select * from marks where teacherid= '${id}'`,
              (err, result) => {
                if (err) console.log(err);
                else {
                  console.log(result.rows);
                  res.send({ success: true, result: result.rows });
                }
              }
            );
          }
        }
      );
    } else if (role === "2") {
      client.query(
        `select userid from studentdetails where token= '${req.body.token}'`,
        (err, result) => {
          if (err) console.log(err);
          else {
            let id = result.rows[0].userid;

            client.query(
              `select * from marks where studentid='${id}'`,
              (err, result) => {
                if (err) console.log(err);
                else {
                  var subject = result.rows;
                  res.send({ success: true, result: result.rows });
                }
              }
            );
          }
        }
      );
    }
  });
  app.get("/", checkToken, function (req, res) {
    let data = req.query.role;

    if (data === "2") {
      client.query(
        `select * from studentdetails where token = '${req.body.token}'`,
        (err, results) => {
          if (err) {
            console.log(err);
          } else {
            res.send({
              success: true,
              result: results.rows[0]
            });
          }
        }
      );
    } else if (data === "1") {
      client.query(
        `select * from teacherdetails where token = '${req.body.token}'`,
        (err, results) => {
          if (err) {
            console.log(err);
          } else {
            res.send({
              success: true,
              result: results.rows[0]
            });
          }
        }
      );
    }
  });
  app.get("/getcourse", function (req, res) {
    var data = req.query.search;
    client.query(
      `select coursename from courses where coursename like '%${data}%' or courseheader like '%${data}%'`,
      (err, results) => {
        if (err) {
          console.log(err)
        } else {
          res.send({ success: true, result: results });
        }
      }
    );
  });
  app.get("/coursed", function (req, res) {
    client.query("select * from courses", (err, result) => {
      if (err) {
        throw err;
      } else {
        // console.log(result);
        res.send({ success: true, result: result.rows });
      }
    });
  });
  app.get("/getteacher", function (req, res) {
    client.query(
      `select name,teacherid from teacherdetails`,
      (error, results) => {
        res.send({ success: true, result: results.rows });
      }
    );
  })
  app.post("/selected", function (req, res) {
    let cid = req.body.course;
    console.log(req.body);
    client.query(`select * from courses where courseid=$1`, [cid], (err, result) => {
      console.log(result)
      res.send({ success: true, result: result.rows });
    })
  })
  app.get("/getdetails", function (req, res) {
    let role = req.query.isTeacher === "true" ? "1" : "2";
    if (role === "1") {
      client.query(
        `select name,teacherid from teacherdetails`,
        (error, results) => {
          // console.log(results);
          res.send({ success: true, result: results.rows });
        }
      );
    } else if (role === "2") {
      client.query(`select * from courses`, (err, results) => {
        // console.log(results);
        res.send({ success: true, result: results.rows });
      });
    }
  });


  app.post("/getforadminteachers", function (req, res) {
    var name = req.body.name;
    var email = req.body.email;
    var dept = req.body.dept;
    var pass = req.body.pass;
    var limit = req.body.limit;
    var offset = req.body.offset * limit;
    let params = { name, email, dept, pass, limit, offset };
    let controller = require('../controller/teachertablecntr');
    controller.getAdminTeachers(params, res);
  });
  app.post('/addteacherforadmin', function (req, res) {
    var name = req.body.name;
    var email = req.body.email;
    var pass = req.body.pass;
    var dept = req.body.dept;
    let params = { name, email, dept, pass };
    let controller = require('../controller/teachertablecntr');
    controller.addAdminTeachers(params, res);
  });
  app.post("/modifyteachers", function (req, res) {
    let params = req.body;
    let controller = require('../controller/teachertablecntr');
    controller.modifyTeacherAdmin(params, res);

  })
  app.post("/deleteteacher", function (req, res) {
    let params = req.body.teacherid;
    let controller = require('../controller/teachertablecntr');
    controller.deleteAdminTeachers(params, res);
  })
  app.post("/getforadminsstudents", function (req, res) {
    var name = req.body.name;
    var email = req.body.email;
    var pass = req.body.pass;
    var limit = req.body.limit;
    var offset = req.body.offset * limit;
    let params = { name, email, pass, limit, offset }
    const controller = require('../controller/studenttablecntr')
    controller.getAdminStudents(params, res)
  });
  app.post('/addstudentforadmin', function (req, res) {
    var name = req.body.name;
    var email = req.body.email;
    var pass = req.body.pass;
    let params = { name, email, pass };
    const controller = require('../controller/studenttablecntr')
    controller.addStudentsAdmin(params, res)
  });
  app.post("/deletestudent", function (req, res) {
    let params = req.body.userid
    const controller = require('../controller/studenttablecntr')
    controller.deleteStudentsAdmin(params, res)
  })
  app.post('/modifystudents', function (req, res) {
    let params = req.body;
    const controller = require('../controller/studenttablecntr')
    controller.modifyStudentsAdmin(params, res)
  })
  app.post("/searchcourseforadmin", function (req, res) {
    var coursename = req.body.coursename;
    var courseheader = req.body.courseheader;
    var limit = req.body.limit;
    var offset = req.body.offset * limit;
    console.log(coursename, courseheader);
    var rowcount;
    // console.log("limit", limit, "offset", offset);
    client.query('select count(*) from courses', (err, results) => {
      if (err) console.log(err);
      else {
        console.log("hello");
        rowcount = results.rows[0].count;
      }
    })
    client.query(`select * from courses where coursename like '%${coursename}%' and courseheader like '%${courseheader}%' order by courseid limit ${limit} offset ${offset}`,
      (err, result) => {
        if (err) console.log(err);
        else {
          res.send({ success: true, result: result.rows, rowCount: rowcount })
        }
      })
  })
  app.post("/addcourse", function (req, res) {
    console.log(req.body.coursename, req.body.courseheader);
    client.query(`insert into courses(coursename,courseheader) values($1,$2)`,
      [req.body.coursename, req.body.courseheader],
      (err, results) => {
        if (err) console.log(err);
        else {
          res.send({ success: true });
          console.log("inserted");
        }
      })
  })
  app.post("/deletecourse", function (req, res) {
    var courseid = req.body.courseid;
    client.query(`delete from courses where courseid='${courseid}'`,
      (err, results) => {
        if (err) console.log(err);
        else {
          res.send({ success: true })
        }
      })
  });
  app.post("/modifycourses", function (req, res) {
    // console.log(req.body.courseheader, req.body.coursename, req.body.courseid);
    client.query(`update courses set coursename='${req.body.coursename}',courseheader='${req.body.courseheader}'
    where courseid=${req.body.courseid}`, (err, result) => {
      if (err) console.log(err);
      else {
        console.log(result)
        res.send({ success: true });
      }
    })
  });


  app.post("/login", function (req, res) {
    if (req.body.role === 2) {
      client.query(
        "select * from studentdetails where email = $1 and password = $2",
        [req.body.email, req.body.password],
        (error, results) => {
          if (error) {
            throw error;
          } else {
            if (results.rowCount == 0) {
              res.json({ success: false });
            } else {
              let token = jwt.sign(
                { exp: Math.floor(Date.now() / 1000) + 60 * 60 },
                "secret"
              );
              client.query(
                "UPDATE studentdetails set token = $1 where userid = $2 ",
                [token, results.rows[0].userid],
                (err, result) => {
                  if (err) console.log(err, result);
                  // else console.log("token entered succesfully");
                  res.send({ success: true, token, role: req.body.role });
                }
              );
            }
          }
        }
      );
    } else if (req.body.role === 1) {
      client.query(
        "select * from teacherdetails where email = $1 and password = $2",
        [req.body.email, req.body.password],
        (error, results) => {
          if (error) {
            throw error;
          } else {
            if (results.rowCount == 0) {
              res.send({ success: false });
            } else {
              let token = jwt.sign(
                { exp: Math.floor(Date.now() / 1000) + 60 * 60 },
                "secret"
              );
              client.query(
                "UPDATE teacherdetails set token = $1 where teacherid = $2 ",
                [token, results.rows[0].teacherid],
                (err, result) => {
                  if (err) console.log(err, result);
                  // else console.log("token entered succesfully");
                  res.send({ success: true, token, role: req.body.role });
                }
              );
            }
          }
        }
      );
    }
  });
};
module.exports = route;
