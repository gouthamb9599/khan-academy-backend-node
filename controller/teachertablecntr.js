const client = require("../db/db");
const TeacherController = () => {
}
TeacherController.addAdminTeachers = (params, res) => {
    let { name, email, pass, dept } = params
    client.query(`insert into teacherdetails(name,email,password,department) values($1,$2,$3,$4) RETURNING *`,
        [name, email, pass, dept], (err, result) => {
            if (err) console.log(err, res);
            else {
                res.send({ success: true });
            }
        })
}
TeacherController.modifyTeacherAdmin=(params,res)=>{
client.query(`update 
teacherdetails set name='${params.name}'
,email='${params.email}'
,department='${params.dept}'
,password='${params.pass}'
 where teacherid='${params.teacherid}'`, (err, result) => {
  if (err) console.log(err);
  else {
    res.send({ success: true });
  }
})}
TeacherController.deleteAdminTeachers=(params, res)=>{
client.query(`delete from teacherdetails where teacherid='${params}'`, (err, result) => {
  if (err) console.log(err);
  else {
    res.send({ success: true })
  }
})}

TeacherController.getAdminTeachers = (params, res) => {
    let { name, email, dept, pass, limit, offset } = params;
    var rowcount;
    // console.log("limit", limit, "offset", offset);
    client.query('select count(*) from teacherdetails', (err, results) => {
        if (err) console.log(err);
        else {
            console.log("hello");
            rowcount = results.rows[0].count;
        }
    })
    client.query(`select * from teacherdetails where name like '%${name}%' and email like '%${email}' and department like '%${dept}' and password like '%${pass}%' order by teacherid limit ${limit} offset ${offset}`,
        (err, result) => {
            if (err) console.log(err);
            else {
                console.log(result.rows);
                res.send({ success: true, result: result.rows, rowCount: rowcount });
            }
        })
}
module.exports = TeacherController