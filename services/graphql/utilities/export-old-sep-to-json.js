require("dotenv").config({
  path: "../../../.env",
});

const dayjs = require("dayjs");
const { v4: uuidv4 } = require("uuid");
const sql = require("mssql");
const fs = require("fs");
const path = require("path");
const JSONStream = require("JSONStream");

const start = async () => {
  const sqlConfig = {
    user: "app_sep",
    password: "LD2022",
    database: "SEP",
    server: "192.168.1.77\\mcbcloud",
    options: {
      encrypt: false,
      trustServerCertificate: true,
      // enableArithAbort: true,
      // trustConnection: true
    },
  };
  console.log({ sqlConfig });

  const backupFolderPath = path.join(
    require("os").homedir(),
    "Desktop",
    "backupJSON",
  );

  try {
    // Create backup folder if it doesn't exist
    if (!fs.existsSync(backupFolderPath)) {
      fs.mkdirSync(backupFolderPath);
    }
    // Create a pool of connections
    const pool = await sql.connect(sqlConfig);

    const result = await pool
      .request()
      .query(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'`,
      );

    // const result = await pool
    //   .request()
    //   .query(
    //     `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_CATALOG = 'ECocoa.Cms'`,
    //   );

    // Iterate through each table name
    for (const table of result.recordset) {


      if(table.TABLE_NAME === 'tbMainLocalDailyPrices_Buyer') {

      console.log(`Process table ${table.TABLE_NAME}`)
      // Query to retrieve all rows from the table
      const { recordset } = await pool
        .request()
        .query(`SELECT * FROM ${table.TABLE_NAME}`);

      // Save the table data as a JSON file
      const filename = `${table.TABLE_NAME}.json`;
      var transformStream = JSONStream.stringify();
      var outputStream = fs.createWriteStream(
        backupFolderPath + `/${filename}`,
      );
      transformStream.pipe(outputStream);
      recordset.forEach(transformStream.write);
      transformStream.end();
      outputStream.on("finish", () => {
        console.log("done")
      })

      // const data = JSON.stringify(recordset);

      // fs.writeFile(path.join(backupFolderPath, filename), data, err => {
      //   if (err) throw err;
      //   console.log(`Saved ${table.TABLE_NAME} data to ${filename}`);
      // });

      console.log(`Saved ${table.TABLE_NAME} data to ${filename}`);        
      }

      // console.log(`Process table ${table.TABLE_NAME}`)
      // // Query to retrieve all rows from the table
      // const { recordset } = await pool
      //   .request()
      //   .query(`SELECT * FROM ${table.TABLE_NAME}`);

      // // Save the table data as a JSON file
      // const filename = `${table.TABLE_NAME}.json`;
      // var transformStream = JSONStream.stringify();
      // var outputStream = fs.createWriteStream(
      //   backupFolderPath + `/${filename}`,
      // );
      // transformStream.pipe(outputStream);
      // recordset.forEach(transformStream.write);
      // transformStream.end();
      // outputStream.on("finish", () => {
      //   console.log("done")
      // })

      // // const data = JSON.stringify(recordset);

      // // fs.writeFile(path.join(backupFolderPath, filename), data, err => {
      // //   if (err) throw err;
      // //   console.log(`Saved ${table.TABLE_NAME} data to ${filename}`);
      // // });

      // console.log(`Saved ${table.TABLE_NAME} data to ${filename}`);
    }

    console.log("Closing Done..!!!")
    pool.close();
  } catch (err) {
    console.error(err);
  }
};

start();

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
