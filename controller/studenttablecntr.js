const client = require("../db/db");
const StudentController = () => {
}
StudentController.addStudentsAdmin=(params,res)=>{
    let {name,email,pass}=params
client.query(`insert into studentdetails(name,email,password) values($1,$2,$3) RETURNING *`,
  [name, email, pass], (err, result) => {
    if (err) console.log(err, res);
    else {
      res.send({ success: true });
    }
  })
}
StudentController.modifyStudentsAdmin=(params,res)=>{
client.query(`update studentdetails set name='${params.name}'
,email='${params.email}'
,teacherid='${params.teacherid}'
,password='${params.pass}'
 where userid='${params.userid}'`, (err, results) => {
  if (err) console.log(err);
  else {
    res.send({ success: true })
  }

})}

StudentController.deleteStudentsAdmin=(params,res)=>{
client.query(`delete from studentdetails where userid='${params}'`, (err, results) => {
  if (err) console.log(err);
  else {
    res.send({ success: true })
  }
})}
StudentController.getAdminStudents = (params, res) => {
    let { name, email, pass, offset, limit } = params

    let rowcount
    client.query('select count(*) from studentdetails', (err, results) => {
        if (err) console.log(err);
        else {
            console.log("hello");
            rowcount = results.rows[0].count;
        }
    })
    client.query(`select * from studentdetails where name like '%${name}%' and email like '%${email}' and  password like '%${pass}' order by userid limit ${limit} offset ${offset}`, (err, result) => {
        if (err) console.log(err);
        else {

            res.send({ success: true, result: result.rows, rowCount: rowcount });

        }
    })
}
module.exports=StudentController