require("dotenv").config({
  path: "../../../.env",
});
const mongodbConnection = require("../mongodb-connection");
const dayjs = require("dayjs");
const { v4: uuidv4 } = require("uuid");
const schedule = require("node-schedule");
const { exec } = require("child_process");
const path = require("path");
const zlib = require("zlib");
const os = require("os");
const fs = require("fs");
const { createReadStream, createWriteStream } = require("fs");

const sql = require("mssql");
const start = async () => {
  const sqlConfig = {
    user: "app_sep",
    password: "LD2022",
    database: "hharian",
    server: "192.168.1.77\\mcbcloud",
    options: {
      encrypt: false,
      trustServerCertificate: true,
      // enableArithAbort: true,
      // trustConnection: true
    },
  };

  const { collection, mongodb, mongoClient } = await mongodbConnection();

  // Run every day at 12:00 PM
  const mssqlPool = await sql.connect(sqlConfig);
  const transaction = new sql.Transaction(mssqlPool);

  // await scheduleHarian({ collection, transaction, mssqlPool });
  // const query = await mssqlPool.request().query("SELECT * FROM dbo.i_tmpweb ORDER BY recid DESC")

  // await sql.close();
  const checkduplicate = await mssqlPool
      .request()
      .query(
        `SELECT * FROM dbo.hharian WHERE TARIKH = '2024-05-08' AND PUSAT = '1202'`,
      );
    if (checkduplicate.recordset.length > 0) {
      console.log("Duplicate Record");
      return;
    }
};


start();

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
