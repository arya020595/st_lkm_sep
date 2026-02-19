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
  // const query = await mssqlPool.request().query("SELECT * FROM dbo.tmp_i_tmpweb ORDER BY recid DESC")

  // await sql.close();

  const dailyJob = schedule.scheduleJob("0 15 * * *", async () => {
    console.log("This job runs every day at 15:00 PM!");

    await scheduleHarian({ collection, transaction, mssqlPool });
    // await scheduleBulanan({
    //   collection,
    //   transaction,
    //   mssqlPool,
    //   date: dayjs().format("YYYY-MM-DD"),
    // });
    // await scheduleTahunan({ collection, transaction, mssqlPool });
  });

  const backupJob = schedule.scheduleJob("0 16 * * *", async () => {
    console.log("This Backup runs every day at 16:00 PM!");

    // await dailyBackup();
  });

  const monthlyJob = schedule.scheduleJob("15 0 1 * *", async () => {
    console.log("This job runs every day at 00:15 AM!");
    // await scheduleBulanan({ collection, transaction, mssqlPool });
  });

  const yearlyJob = schedule.scheduleJob("30 0 1 * *", async () => {
    console.log("This job runs every day at 00:30 AM!");
    // await scheduleBulanan({ collection, transaction, mssqlPool });
  });
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
  const mongodumpCommand = `mongodump --archive=${path.join(
    backupDir,
    archiveFile,
  )}`;

  // Execute the mongodump command
  exec(mongodumpCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing mongodump: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`mongodump stderr: ${stderr}`);
      return;
    }
    console.log(
      `mongodump completed successfully. Dump file saved at ${path.join(
        backupDir,
        archiveFile,
      )}`,
    );
  });
};

const scheduleHarian = async ({ collection, transaction, mssqlPool }) => {
  const currentDate = dayjs().format("YYYY-MM-DD");
  console.log("Executed At ", dayjs().format("YYYY-MM-DD HH:MM:ss"));

  let centres = await collection("Centres")
    .find({
      // description: {
      //   $in: ["Tawau", "Kuching", "Raub"],
      // },
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();

  await collection("GlobalPriceFutureMarketReuters").createIndex({
    date: 1,
  });
  await collection("DomesticCocoaPrices").createIndex({
    date: 1,
  });

  const domesticPrices = await collection("DomesticCocoaPrices")
    .find({
      centreId: {
        $in: centres.map(c => c._id),
      },
      date: currentDate, //currentDate,
    })
    .toArray();

  let prevDate = dayjs(currentDate).subtract(1, "day").format("YYYY-MM-DD");
  if (dayjs(currentDate).get("day") === 1) {
    prevDate = dayjs(currentDate).subtract(2, "day").format("YYYY-MM-DD");
  }
  let foundFutureMarketPrice = await collection(
    "GlobalPriceFutureMarketReuters",
  ).findOne({
    date: prevDate,
    _deletedAt: {
      $exists: false,
    },
  });

  if (foundFutureMarketPrice) {
    if (!foundFutureMarketPrice.nyLow) {
      foundFutureMarketPrice.nyLow = 0;
    }
    if (!foundFutureMarketPrice.nyHigh) {
      foundFutureMarketPrice.nyHigh = 0;
    }
    if (!foundFutureMarketPrice.nyAvg) {
      foundFutureMarketPrice.nyAvg = 0;
    }
  }

  let previousDay = "";
  if (dayjs(prevDate).get("day") === 1) {
    previousDay = dayjs(prevDate).subtract(3, "day").format("YYYY-MM-DD");
  } else {
    previousDay = dayjs(prevDate).subtract(1, "day").format("YYYY-MM-DD");
  }
  const foundPreviousFutureMarketPrice = await collection(
    "GlobalPriceFutureMarketReuters",
  ).findOne({
    date: previousDay,
    _deletedAt: {
      $exists: false,
    },
  });

  const indexedPriceByCentre = domesticPrices.reduce((all, price) => {
    if (!all[price.centreId]) {
      all[price.centreId] = [];
    }
    all[price.centreId].push(price);
    return all;
  }, {});

  const latestHHarian = await mssqlPool
    .request()
    .query("SELECT * FROM dbo.tmp_hharian ORDER BY recid DESC");

  // let counterFutureMarket = await collection("GlobalPriceFutureMarketReuters")
  //   .find({})
  //   .count();
  let hharianRecId = 0;
  if (latestHHarian.recordset) {
    hharianRecId = latestHHarian.recordset[0].recid + 1;
  }
  for (const centre of centres) {
    await sleep(10000)
    let newData = {
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
      let wetPriceArray = indexedPriceByCentre[centre._id].map(p => p.wetPrice);
      wetPriceArray = wetPriceArray.filter(p => p > 0);

      let wetHigh = 0,
        wetLow = 0,
        wetAverage = 0;
      if (wetPriceArray.length > 0) {
        wetHigh = Math.max(...wetPriceArray);
        wetLow = Math.min(...wetPriceArray);
        let wetAverageTmp =
          wetPriceArray.reduce((acc, curr) => acc + curr, 0) /
          wetPriceArray.length;
        wetAverage = wetAverageTmp.toFixed(4);
      }

      let smc1PriceArray = indexedPriceByCentre[centre._id].map(p => p.smc1);
      smc1PriceArray = smc1PriceArray.filter(p => p > 0);

      let smc1High = 0,
        smc1Low = 0,
        smc1Average = 0;
      if (smc1PriceArray.length > 0) {
        smc1High = Math.max(...smc1PriceArray);
        smc1Low = Math.min(...smc1PriceArray);
        let smc1AverageTmp =
          smc1PriceArray.reduce((acc, curr) => acc + curr, 0) /
          smc1PriceArray.length;

        smc1Average = parseFloat(smc1AverageTmp.toFixed(4));
      }

      let smc2PriceArray = indexedPriceByCentre[centre._id].map(p => p.smc2);
      smc2PriceArray = smc2PriceArray.filter(p => p > 0);

      let smc2Low = 0,
        smc2High = 0,
        smc2Average = 0;
      if (smc2PriceArray.length > 0) {
        smc2High = Math.max(...smc2PriceArray);
        smc2Low = Math.min(...smc2PriceArray);

        let smc2AverageTmp =
          smc2PriceArray.reduce((acc, curr) => acc + curr, 0) /
          smc2PriceArray.length;
        smc2Average = parseFloat(smc2AverageTmp.toFixed(4));
      }

      let smc3PriceArray = indexedPriceByCentre[centre._id].map(p => p.smc3);
      smc3PriceArray = smc3PriceArray.filter(p => p > 0);
      let smc3High = 0,
        smc3Average = 0,
        smc3Low = 0;

      if (smc3PriceArray.length > 0) {
        smc3High = Math.max(...smc3PriceArray);
        smc3Low = Math.min(...smc3PriceArray);
        let smc3AverageTmp =
          smc3PriceArray.reduce((acc, curr) => acc + curr, 0) /
          smc3PriceArray.length;

        smc3Average = parseFloat(smc3AverageTmp.toFixed(4));
      }

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
    }

    newData = {
      _id: uuidv4(),
      ...newData,
      date: dayjs().format("YYYY-MM-DD"),
      timeStamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
    };

    //Save to mongodDB
    console.log("Save to Mongo DB");
    await collection("DailyDomesticCocoaPriceLogs").insertOne(newData);

    //Save to Mysql
    var post = {
      recid: hharianRecId,
      TARIKH: newData.date,
      PUSAT: centre.code,
      BSH_TGG: newData.wetHigh,
      BSH_RDH: newData.wetLow,
      BSH_PUR: newData.wetAverage,
      SMC1A_TGG: newData.smc1High,
      SMC1A_RDH: newData.smc1Low,
      SMC1A_PUR: newData.smc1Average,
      SMC1B_TGG: newData.smc2High,
      SMC1B_RDH: newData.smc2Low,
      SMC1B_PUR: newData.smc2Average,
      SMC1C_TGG: newData.smc3High,
      SMC1C_RDH: newData.smc3Low,
      SMC1C_PUR: newData.smc3Average,
      SEQ: centre.seq,
    };

    if (typeof post.SEQ === "number") {
      post.SEQ = parseFloat(post.SEQ);
    }

    const total =
      newData.smc1Average + newData.smc2Average + newData.smc3Average;
    console.log({ total, centre: centre.description });
    if (total > 0) {
      console.log("Pushed with total", total, "Centre", centre.description);
      transaction.begin(err => {
        if (err) {
          console.log("Error transaction begin", err);
        }

        const request = new sql.Request(transaction);
        request.query(
          `INSERT INTO dbo.tmp_hharian (recid, TARIKH, PUSAT, BSH_TGG, BSH_RDH, BSH_PUR, SMC1A_TGG, SMC1A_RDH, SMC1A_PUR, SMC1B_TGG, SMC1B_RDH,
              SMC1B_PUR, SMC1C_TGG, SMC1C_RDH, SMC1C_PUR, SEQ) VALUES (${post.recid},'${post.TARIKH}','${post.PUSAT}', ${post.BSH_TGG}, ${post.BSH_RDH}, ${post.BSH_PUR},
              ${post.SMC1A_TGG}, ${post.SMC1A_RDH}, ${post.SMC1A_PUR}, ${post.SMC1B_TGG}, ${post.SMC1B_RDH}, ${post.SMC1B_PUR}, ${post.SMC1C_TGG}, ${post.SMC1C_RDH}, ${post.SMC1C_PUR}, ${post.SEQ})`,
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
      });
    }

    console.log("Saving dbo.tmp_hharian ");

    // let smc1 = 0,
    //   smc2 = 0,
    //   smc3 = 0;
    // if (
    //   indexedPriceByCentre[centre._id] &&
    //   indexedPriceByCentre[centre._id].length > 0
    // ) {
    //   let counter = 0;
    //   for (const price of indexedPriceByCentre[centre._id]) {
    //     counter += 1;
    //     smc1 += price.smc1;
    //     smc2 += price.smc2;
    //     smc3 += price.smc3;
    //   }

    //   smc1 = parseFloat(smc1 / counter);
    //   smc2 = parseFloat(smc2 / counter);
    //   smc3 = parseFloat(smc3 / counter);
    // }

    // const newData = {
    //   _id: uuidv4(),
    //   centreId: centre._id,
    //   description: centre.description,
    //   smc1,
    //   smc2,
    //   smc3,
    //   date: dayjs().format("YYYY-MM-DD"),
    //   timeStamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    //   _createdAt: new Date().toISOString(),
    //   _updatedAt: new Date().toISOString(),
    // };

    // await collection("DailyDomesticCocoaPriceLogs").insertOne(newData);

    hharianRecId += 1;
  }
  console.log("Run for dbo.tmp_i_tmpweb");
  /* 
    [recid] [int] NOT NULL,
	[MDATE] [datetime] NULL,
	[CENTERCODE] [nvarchar](3) NULL,
	[CENTER] [nvarchar](20) NULL,
	[FUTURE] [nvarchar](5) NULL,
	[LOW] [float] NULL,
	[HIGH] [float] NULL,
	[AVE] [float] NULL,
	[PRICE] [float] NULL,
	[EXRATE_STR] [float] NULL,
	[EXRATE_US] [float] NULL,
	[PCLOSE] [float] NULL,
	[DT_UPDATED] [datetime] NULL,
	[SOURCES] [nvarchar](20) NULL
    */
  const currentData = await mssqlPool
    .request()
    .query("SELECT * FROM dbo.tmp_i_tmpweb ORDER BY recid DESC");
  let list = currentData;
  console.log("recsete", list.recordset.length);
  console.log({
    foundFutureMarketPrice,
    foundPreviousFutureMarketPrice,
    prevDate,
  });

  if (list.recordset) {
    if (foundFutureMarketPrice) {
      let recid = list.recordset[0].recid + 1;

      await collection("GlobalPriceFutureMarketReutersPushedLogs").insertOne({
        _id: uuidv4(),
        futureMarketLogs: {
          ...foundFutureMarketPrice,
        },
        previousMarketLogs: {
          ...foundPreviousFutureMarketPrice,
        },
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      });
      transaction.begin(err => {
        if (err) {
          console.log("Error transaction begin", err);
        }

        const request = new sql.Request(transaction);
        request.query(
          `INSERT INTO dbo.tmp_i_tmpweb (
            recid, 
            MDATE, 
            CENTERCODE, 
            CENTER, 
            FUTURE, 
            LOW, 
            HIGH, 
            AVE, 
            PRICE,
            EXRATE_STR, 
            EXRATE_US,
            PCLOSE, 
            DT_UPDATED, 
            SOURCES
          ) VALUES (
            ${recid}, 
            '${prevDate}', 
            'NYK', 
            'NEW YORK (CSCE)', 
            '${foundFutureMarketPrice.label}',
            ${foundFutureMarketPrice.nyLow}, 
            ${foundFutureMarketPrice.nyHigh}, 
            ${foundFutureMarketPrice.nyAvg}, 
            ${foundFutureMarketPrice.nyPrice}, 
            ${foundFutureMarketPrice.nyEx}, 
            0, 
            ${
              foundPreviousFutureMarketPrice &&
              foundPreviousFutureMarketPrice.nyAvg
                ? foundPreviousFutureMarketPrice.nyAvg
                : 0
            }, '${dayjs().format("YYYY-MM-DD HH:mm:ss")}', '9'
          )`,
          (err, result) => {
            if (err) {
              console.log("Error MSSQL", err);
            }
            transaction.commit(err => {
              if (err) {
                console.log("Error Transaction", err);
              }
              console.log("Transaction Ommited");
            });
          },
        );
      });
      console.log("Saving dbo.tmp_i_tmpweb NY ");
      await sleep(10000);

      recid += 1;
      transaction.begin(err => {
        if (err) {
          console.log("Error transaction begin", err);
        }

        const request = new sql.Request(transaction);
        request.query(
          `INSERT INTO dbo.tmp_i_tmpweb (
            recid, 
            MDATE, 
            CENTERCODE, 
            CENTER, 
            FUTURE, 
            LOW, 
            HIGH, 
            AVE, 
            PRICE, 
            EXRATE_STR, 
            EXRATE_US,
            PCLOSE, 
            DT_UPDATED, 
            SOURCES
          ) VALUES (
            ${recid}, 
            '${prevDate}', 
            'LDN', 
            'LONDON (LIFFE)', 
            '${foundFutureMarketPrice.label}',
            ${foundFutureMarketPrice.londonLow},
            ${foundFutureMarketPrice.londonHigh}, 
            ${foundFutureMarketPrice.londonAvg}, 
            ${foundFutureMarketPrice.londonPrice},
            ${foundFutureMarketPrice.londonEx}, 
            0,
            ${
              foundPreviousFutureMarketPrice &&
              foundPreviousFutureMarketPrice.londonAvg
                ? foundPreviousFutureMarketPrice.londonAvg
                : 0
            }, '${dayjs().format("YYYY-MM-DD HH:mm:ss")}', ''
          )`,
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
      });
      console.log("Saving dbo.tmp_i_tmpweb LONDON ");
      await sleep(10000);
    }
  }
};

const scheduleBulanan = async ({
  collection,
  transaction,
  mssqlPool,
  date,
}) => {
  console.log("Schedule every month");

  const currentDate = date;
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
    .query("SELECT * FROM dbo.tmp_hhbulan ORDER BY recid DESC");

  let hhbulanRecId = 0;
  if (latestHHBulan.recordset) {
    hhbulanRecId = latestHHBulan.recordset[0].recid + 1;
  }
  let counter = latestData.length;

  try {
    transaction.begin(async err => {
      if (err) {
        console.log("Error transaction begin", err);
      }

      for (const centre of centres) {
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
          const request = new sql.Request(transaction);

          const res = await request.query(
            "SELECT TOP 1 * FROM dbo.tmp_hhbulan ORDER BY recid DESC",
          );
          let latestRecord = res.recordsets[0][0];

          post.recid = latestRecord.recid + 1;
          console.log({ post });

          request.query(
            `INSERT INTO dbo.tmp_hhbulan (recid, TARIKH, PUSAT_KOD, PUSAT, BSH_TGG, BSH_RDH, BSH_PUR, SMC1A_TGG, SMC1A_RDH, SMC1A_PUR, SMC1B_TGG, SMC1B_RDH,
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
          await sleep(10000);
        }
      }
    });

    hhbulanRecId += 1;
  } catch (err) {
    console.log(err);
  }
  console.log("MSSQL Done");
};

const scheduleTahunan = async ({ collection, transaction, mssqlPool }) => {
  console.log("Schedule every year");

  const currentDate = dayjs().format("YYYY-MM-DD");
  const getDate = dayjs(currentDate).get("date");
  const getMonth = dayjs(currentDate).get("month") + 1;
  if (getDate !== 1 && getMonth !== 1) {
    return;
  }
  const previous = dayjs(currentDate).subtract(1, "year").format("YYYY-MM-DD");

  const startDate = dayjs(previous).startOf("year").format("YYYY-MM-DD");
  const endDate = dayjs(previous).endOf("year").format("YYYY-MM-DD");

  const centres = await collection("Centres")
    .find({
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();

  const regions = await collection("Regions")
    .find({
      _id: {
        $in: centres.map(c => c.regionId),
      },
    })
    .toArray();

  const indexedRegion = regions.reduce((all, reg) => {
    if (!all[reg._id]) {
      all[reg._id] = {};
    }
    all[reg._id] = reg;
    return all;
  }, {});
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

  let counter = latestData.length;
  for (const centre of centres) {
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

      const smc1PriceArray = indexedPriceByCentre[centre._id].map(p => p.smc1);
      const smc1High = Math.max(...smc1PriceArray);
      const smc1Low = Math.min(...smc1PriceArray);
      let smc1Average =
        smc1PriceArray.reduce((acc, curr) => acc + curr, 0) /
        smc1PriceArray.length;
      smc1Average = smc1Average.toFixed(4);

      const smc2PriceArray = indexedPriceByCentre[centre._id].map(p => p.smc2);
      const smc2High = Math.max(...smc2PriceArray);
      const smc2Low = Math.min(...smc2PriceArray);
      let smc2Average =
        smc2PriceArray.reduce((acc, curr) => acc + curr, 0) /
        smc2PriceArray.length;
      smc2Average = smc2Average.toFixed(4);

      const smc3PriceArray = indexedPriceByCentre[centre._id].map(p => p.smc3);
      const smc3High = Math.max(...smc3PriceArray);
      const smc3Low = Math.min(...smc3PriceArray);
      let smc3Average =
        smc3PriceArray.reduce((acc, curr) => acc + curr, 0) /
        smc3PriceArray.length;
      smc3Average = smc3Average.toFixed(4);

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
    }

    newData = {
      _id: uuidv4(),
      ...newData,
      date: dayjs().format("YYYY-MM-DD"),
      timeStamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),

      priceForStartDate: startDate,
      priceForEndDate: endDate,
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
    };

    //Save to mongodDB
    console.log("Save to Mongo DB");
    await collection("YearlyDomesticCocoaPriceLogs").insertOne(newData);

    //Save to Mysql
    let centreId = 0;
    if (centre.originalFieldObj) {
      centreId = parseInt(centre.originalFieldObj.ID);
    }
    var post = {
      Year: parseInt(dayjs(startDate).get("year")),
      Pusat: centre.code,
      Pusat_Kod: centre.description.slice(0, 50),
      CentreID: centreId,
      CentreDesc: centre.description,
      BSH_High: parseFloat(newData.wetHigh),
      BSH_Low: parseFloat(newData.wetLow),
      BSH_Avg: parseFloat(newData.wetAverage),
      SMC1A_High: parseFloat(newData.smc1High),
      SMC1A_Low: parseFloat(newData.smc1Low),
      SMC1A_Avg: parseFloat(newData.smc1Average),
      SMC1B_High: parseFloat(newData.smc2High),
      SMC1B_Low: parseFloat(newData.smc2Low),
      SMC1B_Avg: parseFloat(newData.smc2Average),
      SMC1C_High: parseFloat(newData.smc3High),
      SMC1C_Low: parseFloat(newData.smc3Low),
      SMC1C_Avg: parseFloat(newData.smc3Average),
      CentreSeq: parseInt(centre.sequence ? centre.sequence : 0),
      RegionID: indexedRegion[centre.regionId]
        ? indexedRegion[centre.regionId].code
        : "",
      RegionDesc: indexedRegion[centre.regionId]
        ? indexedRegion[centre.regionId]
        : "",
    };

    if (post.SMC1A_Avg > 0 && post.SMC1B_Avg > 0 && post.SMC1B_Avg > 0) {
      transaction.begin(err => {
        if (err) {
          console.log("Error transaction begin", err);
        }

        const request = new sql.Request(transaction);
        request.query(
          `INSERT INTO dbo.htahunan (Year, Pusat, Pusat_Kod, CentreID, CentreDesc, BSH_High, BSH_Low, BSH_Avg, SMC1A_High, SMC1A_Low,
                  SMC1A_Avg, SMC1B_High, SMC1B_Low, SMC1B_Avg, SMC1C_High, SMC1C_Low, SMC1C_Avg, CentreSeq, RegionID, RegionDesc) VALUES (
                    ${post.Year}, '${post.Pusat}', '${post.Pusat_Kod}', ${post.CentreID}, '${post.CentreDesc}', ${post.BSH_High}, ${post.BSH_Low}, ${post.BSH_Avg},
                    ${post.SMC1A_High}, ${post.SMC1A_Low}, ${post.SMC1A_Avg}, ${post.SMC1B_High}, ${post.SMC1B_Low}, ${post.SMC1B_Avg}, 
                    ${post.SMC1C_High}, ${post.SMC1C_Low}, ${post.SMC1C_Avg}, ${post.CentreSeq}, '${post.RegionID}', '${post.RegionDesc}'
                  )`,
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
      });
    }

    console.log("MSSQL Done");
    await sleep(10000);
  }
};

start();

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
