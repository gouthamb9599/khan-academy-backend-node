const { Client } = require("pg");

const client = new Client({
  user: "postgres",
  password: "abc123",
  host: "localhost",
  port: 5432,
  database: "database"
});
client.connect().then(() => console.log("connected database"));
module.exports = client;
