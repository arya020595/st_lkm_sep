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
  schedule.scheduleJob("0 15 1 * *", async () => {
    console.log("This job runs every day at 15:00 PM!");

    await scheduleBulanan({ collection, transaction, mssqlPool });
    
  });

  // const backupJob = schedule.scheduleJob("0 16 * * *", async () => {
  //   console.log("This Backup runs every day at 16:00 PM!");

  //   // await dailyBackup();
  // });

  // const monthlyJob = schedule.scheduleJob("15 0 1 * *", async () => {
  //   console.log("This job runs every day at 00:15 AM!");
  // await scheduleBulanan({
  //   collection,
  //   transaction,
  //   mssqlPool,
  //   date: dayjs("2024-03-01").format("YYYY-MM-DD"),
  // });
  // });

  // const yearlyJob = schedule.scheduleJob("30 0 1 * *", async () => {
  //   console.log("This job runs every day at 00:30 AM!");
  //   // await scheduleBulanan({ collection, transaction, mssqlPool });
  // });
};

const dailyBackup = async () => {
  const dbName = "db-sep-v2";
  const backupDir = path.join(
    os.homedir(),
    "Desktop",
    "mongo-backups",
    dayjs().format("YYYY-MM-DD"),
  );

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = dayjs().format("YYYY-MM-DD");
  const archiveFile = `${dbName}-${timestamp}`;
  const archivePath = path.join(backupDir, archiveFile);

  // const command = `mongodump --db=${dbName} --archive=${archivePath}`;

  // exec(command, (error, stdout, stderr) => {
  //   if (error) {
  //     console.error(`mongodump error: ${error}`);
  //     return;
  //   }

  //   console.log(`mongodump stdout:\n${stdout}`);
  //   console.error(`mongodump stderr:\n${stderr}`);
  //   const readStream = createReadStream(archivePath);
  //   // const gzip = zlib.createGzip();
  //   const writeStream = createWriteStream(archivePath);

  //   // readStream.pipe(gzip).pipe(writeStream);
  // });

  // Build the mongodump command with the --archive option and output directory
//   const mongodumpCommand = `mongodump --archive=${path.join(
//     backupDir,
//     archiveFile,
//   )}`;

//   // Execute the mongodump command
//   exec(mongodumpCommand, (error, stdout, stderr) => {
//     if (error) {
//       console.error(`Error executing mongodump: ${error.message}`);
//       return;
//     }
//     if (stderr) {
//       console.error(`mongodump stderr: ${stderr}`);
//       return;
//     }
//     console.log(
//       `mongodump completed successfully. Dump file saved at ${path.join(
//         backupDir,
//         archiveFile,
//       )}`,
//     );
//   });
};


const scheduleBulanan = async ({
  collection,
  transaction,
  mssqlPool,
  date,
}) => {
  console.log("Schedule every month");

  const currentDate = dayjs().format("YYYY-MM-DD")
  const getDate = dayjs(currentDate).get("date");
  if (getDate !== 1) {
    return;
  }
  const previous = dayjs(currentDate).subtract(1, "month").format("YYYY-MM-DD");

  const startDate = dayjs(previous).startOf("month").format("YYYY-MM-DD");
  const endDate = dayjs(previous).endOf("month").format("YYYY-MM-DD");

  // console.log({startDate, endDate})

  const centres = await collection("Centres")
    .find({
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();

  await collection("DomesticCocoaPrices").createIndex({
    date: 1,
    centreId: 1,
  });
  const domesticPrices = await collection("DomesticCocoaPrices")
    .find({
      centreId: {
        $in: centres.map(c => c._id),
      },
      date: {
        $gte: startDate,
        $lte: endDate,
      }, //currentDate,
    })
    .toArray();

  const indexedPriceByCentre = domesticPrices.reduce((all, price) => {
    if (!all[price.centreId]) {
      all[price.centreId] = [];
    }
    all[price.centreId].push(price);
    return all;
  }, {});

  const latestData = await collection("DailyDomesticCocoaPriceLogs")
    .find({
      centreId: {
        $in: centres.map(c => c._id),
      },
    })
    .toArray();

  const latestHHBulan = await mssqlPool
    .request()
    .query("SELECT * FROM dbo.hhbulan ORDER BY recid DESC");

  let hhbulanRecId = 0;
  if (latestHHBulan.recordset) {
    hhbulanRecId = latestHHBulan.recordset[0].recid + 1;
  }
  let counter = latestData.length;

  try {
    // transaction.begin(async err => {
    //   if (err) {
    //     console.log("Error transaction begin", err);
    //   }

    for (const centre of centres) {
      await sleep(10000);
      counter += 1;
      let newData = {
        counter,
        centreId: centre._id,
        name: centre.description,
        sequence: parseFloat(centre.sequence ? centre.sequence : 0),
        wetHigh: 0,
        wetLow: 0,
        wetAverage: 0,

        smc1High: 0,
        smc1Low: 0,
        smc1Average: 0,

        smc2High: 0,
        smc2Low: 0,
        smc2Average: 0,

        smc3High: 0,
        smc3Low: 0,
        smc3Average: 0,
      };

      if (indexedPriceByCentre[centre._id]) {
        const wetPriceArray = indexedPriceByCentre[centre._id].map(
          p => p.wetPrice,
        );
        const wetHigh = Math.max(...wetPriceArray);
        const wetLow = Math.min(...wetPriceArray);
        let wetAverage =
          wetPriceArray.reduce((acc, curr) => acc + curr, 0) /
          wetPriceArray.length;
        wetAverage = wetAverage.toFixed(4);

        const smc1PriceArray = indexedPriceByCentre[centre._id].map(
          p => p.smc1,
        );
        const smc1High = Math.max(...smc1PriceArray);
        const smc1Low = Math.min(...smc1PriceArray);
        let smc1Average =
          smc1PriceArray.reduce((acc, curr) => acc + curr, 0) /
          smc1PriceArray.length;
        smc1Average = parseFloat(smc1Average.toFixed(4));

        const smc2PriceArray = indexedPriceByCentre[centre._id].map(
          p => p.smc2,
        );
        const smc2High = Math.max(...smc2PriceArray);
        const smc2Low = Math.min(...smc2PriceArray);
        let smc2Average =
          smc2PriceArray.reduce((acc, curr) => acc + curr, 0) /
          smc2PriceArray.length;
        smc2Average = parseFloat(smc2Average.toFixed(4));

        const smc3PriceArray = indexedPriceByCentre[centre._id].map(
          p => p.smc3,
        );
        const smc3High = Math.max(...smc3PriceArray);
        const smc3Low = Math.min(...smc3PriceArray);
        let smc3Average =
          smc3PriceArray.reduce((acc, curr) => acc + curr, 0) /
          smc3PriceArray.length;
        smc3Average = parseFloat(smc3Average.toFixed(4));

        newData = {
          ...newData,
          wetHigh,
          wetLow,
          wetAverage,

          smc1High,
          smc1Low,
          smc1Average,

          smc2High,
          smc2Low,
          smc2Average,

          smc3High,
          smc3Low,
          smc3Average,
        };

        newData = {
          _id: uuidv4(),
          ...newData,
          date,
          timeStamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),

          priceForStartDate: startDate,
          priceForEndDate: endDate,
          _createdAt: new Date().toISOString(),
          _updatedAt: new Date().toISOString(),
        };

        //Save to mongodDB
        console.log("Save to Mongo DB");
        await collection("MonthlyDomesticCocoaPriceLogs").insertOne(newData);

        //Save to Mysql
        var post = {
          recid: hhbulanRecId,
          TARIKH: new Date(endDate).toISOString(),
          PUSAT_KOD: centre.description.slice(0, 20),
          PUSAT: centre.code,
          BSH_TGG: parseFloat(newData.wetHigh),
          BSH_RDH: parseFloat(newData.wetLow),
          BSH_PUR: parseFloat(newData.wetAverage),
          SMC1A_TGG: parseFloat(newData.smc1High),
          SMC1A_RDH: parseFloat(newData.smc1Low),
          SMC1A_PUR: parseFloat(newData.smc1Average),
          SMC1B_TGG: parseFloat(newData.smc2High),
          SMC1B_RDH: parseFloat(newData.smc2Low),
          SMC1B_PUR: parseFloat(newData.smc2Average),
          SMC1C_TGG: parseFloat(newData.smc3High),
          SMC1C_RDH: parseFloat(newData.smc3Low),
          SMC1C_PUR: parseFloat(newData.smc3Average),
          DT_UPDATED: dayjs(endDate).toISOString(),
          SEQ: newData.sequence,
        };

        // console.log({ post });
        const total =
          newData.smc1Average + newData.smc2Average + newData.smc3Average;
        console.log({ total, centre: centre.description });

        if (total === 0) {
          continue;
        }
        transaction.begin(async err => {
          if (err) {
            console.log("Error transaction begin", err);
          }
          const request = new sql.Request(transaction);

          const res = await request.query(
            "SELECT TOP 1 * FROM dbo.hhbulan ORDER BY recid DESC",
          );
          let latestRecord = res.recordsets[0][0];

          post.recid = latestRecord.recid + 1;
          console.log({ post });

          request.query(
            `INSERT INTO dbo.hhbulan (recid, TARIKH, PUSAT_KOD, PUSAT, BSH_TGG, BSH_RDH, BSH_PUR, SMC1A_TGG, SMC1A_RDH, SMC1A_PUR, SMC1B_TGG, SMC1B_RDH,
              SMC1B_PUR, SMC1C_TGG, SMC1C_RDH, SMC1C_PUR, DT_UPDATED,SEQ) VALUES (${post.recid},'${post.TARIKH}','${post.PUSAT_KOD}','${post.PUSAT}', ${post.BSH_TGG},
              ${post.BSH_RDH}, ${post.BSH_PUR},
              ${post.SMC1A_TGG}, ${post.SMC1A_RDH}, ${post.SMC1A_PUR}, ${post.SMC1B_TGG}, ${post.SMC1B_RDH}, ${post.SMC1B_PUR}, ${post.SMC1C_TGG},
              ${post.SMC1C_RDH}, ${post.SMC1C_PUR}, '${post.DT_UPDATED}', ${post.SEQ})`,
            (err, result) => {
              if (err) {
                console.log("Error MSSQL", err);
              }
              transaction.commit(err => {
                if (err) {
                  console.log("Error Transaction");
                }
                console.log("Transaction Ommited");
              });
            },
          );
          console.log("MSSQL Done");
        });
      }
    }
    // });

    hhbulanRecId += 1;
  } catch (err) {
    console.log(err);
  }
  console.log("MSSQL Done");
};

start();

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
