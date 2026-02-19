require("dotenv").config({
  path: "../../../.env",
});
const mongodbConnection = require("../mongodb-connection");
const { v4: uuidv4 } = require("uuid");
const dayjs = require("dayjs");
const schedule = require("node-schedule");
const { exec } = require("child_process");
const path = require("path");
const zlib = require("zlib");
const os = require("os");
const fs = require("fs");
const readlineSync = require("readline-sync");
const { createReadStream, createWriteStream } = require("fs");
const sql = require("mssql");
const scheduleMode = process.env.SCHEDULE_MODE

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();

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

  const mssqlPool = scheduleMode !== "DEV" ? await sql.connect(sqlConfig) : null;
  const transaction = scheduleMode !== "DEV" ? new sql.Transaction(mssqlPool) : null;

  schedule.scheduleJob("0 15 * * *", async () => {
    console.log('Scheduler "harian" is running, This job runs every day at 15:00 PM!');

    const date = dayjs().format("YYYY-MM-DD");

    // await scheduleHarian({ collection, transaction, mssqlPool, date });
  });

  schedule.scheduleJob("15 0 1 * *", async () => {
    console.log('Scheduler "bulanan" is running. This job runs every month on the 1st at 00:15 PM!');

    const date = dayjs().format("YYYY-MM-DD");

    await scheduleBulanan({ collection, transaction, mssqlPool, date });
  });

  schedule.scheduleJob("15 1 1 1 *", async () => {
    console.log('Scheduler "tahunan" is running. This job runs every year on the 1st of January at 01:15 PM!');

    const date = dayjs().format("YYYY-MM-DD");

    await scheduleTahunan({ collection, transaction, mssqlPool, date });
  });

};

const scheduleHarian = async ({ collection, transaction, mssqlPool, date }) => {
  const currentDate = date;

  console.log("Getting data form date:", currentDate)

  const centres = await collection("Centres")
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

  const foundFutureMarketPrice = await collection(
    "GlobalPriceFutureMarketReuters",
  ).findOne({
    date: currentDate,
  });

  let prevDate = dayjs(currentDate).subtract(1, "day").format("YYYY-MM-DD");

  if (dayjs(currentDate).get("day") === 1) {
    prevDate = dayjs(currentDate).subtract(2, "day").format("YYYY-MM-DD");
  }

  const foundPreviousFutureMarketPrice = await collection(
    "GlobalPriceFutureMarketReuters",
  ).findOne({
    date: prevDate,
  });

  const indexedPriceByCentre = domesticPrices.reduce((all, price) => {
    if (!all[price.centreId]) {
      all[price.centreId] = [];
    }
    all[price.centreId].push(price);
    return all;
  }, {});

  let hharianRecId = 0;
  if (scheduleMode !== "DEV") {
    const latestHHarian = await mssqlPool
      .request()
      .query("SELECT * FROM dbo.hharian ORDER BY recid DESC");

    if (latestHHarian.recordset) {
      hharianRecId = latestHHarian.recordset[0].recid + 1;
    }
  }

  // let counterFutureMarket = await collection("GlobalPriceFutureMarketReuters")
  //   .find({})
  //   .count();

  for (const centre of centres) {
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
      date,
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

      if (scheduleMode !== "DEV") {
        transaction.begin(err => {
          if (err) {
            console.log("Error transaction begin", err);
          }

          const request = new sql.Request(transaction);
          request.query(
            `INSERT INTO dbo.hharian (recid, TARIKH, PUSAT, BSH_TGG, BSH_RDH, BSH_PUR, SMC1A_TGG, SMC1A_RDH, SMC1A_PUR, SMC1B_TGG, SMC1B_RDH,
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
    }

    console.log("Saving dbo.harian");
    await sleep(10000);

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
  console.log("Run for dbo.i_tmpweb");
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
  let list;
  if (scheduleMode !== "DEV") {
    const currentData = await mssqlPool
      .request()
      .query("SELECT * FROM dbo.i_tmpweb ORDER BY recid DESC");
    list = currentData;
    console.log("recsete", list.recordset.length);
  }

  console.log({
    foundFutureMarketPrice,
    foundPreviousFutureMarketPrice,
    prevDate,
  });

  if (scheduleMode !== "DEV") {
    if (list.recordset) {
      if (foundFutureMarketPrice) {
        let recid = list.recordset[0].recid + 1;
        if (scheduleMode !== "DEV") {
          transaction.begin(err => {
            if (err) {
              console.log("Error transaction begin", err);
            }

            const request = new sql.Request(transaction);
            request.query(
              `INSERT INTO dbo.i_tmpweb (
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
                   '${currentDate}', 
                   'NYK', 
                   'NEW YORK (CSCE)', 
                   '${foundFutureMarketPrice.label}',
                   ${foundFutureMarketPrice.nyLow}, 
                   ${foundFutureMarketPrice.nyHigh}, 
                   ${foundFutureMarketPrice.nyAvg}, 
                   ${foundFutureMarketPrice.nyPrice}, 
                   ${foundFutureMarketPrice.nyEx}, 
                   0, 
                   ${foundPreviousFutureMarketPrice &&
                foundPreviousFutureMarketPrice.nyPrice
                ? foundPreviousFutureMarketPrice.nyPrice
                : 0
              }, ${currentDate}, '9'
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
        }

        console.log("Saving dbo.i_tmpweb NY ");
        await sleep(10000);

        recid += 1;
        transaction.begin(err => {
          if (err) {
            console.log("Error transaction begin", err);
          }
          const request = new sql.Request(transaction);
          request.query(
            `INSERT INTO dbo.i_tmpweb (
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
                   '${currentDate}', 
                   'LDN', 
                   'LONDON (LIFFE)', 
                   '${foundFutureMarketPrice.label}',
                   ${foundFutureMarketPrice.londonLow},
                   ${foundFutureMarketPrice.londonHigh}, 
                   ${foundFutureMarketPrice.londonAvg}, 
                   ${foundFutureMarketPrice.londonPrice},
                   ${foundFutureMarketPrice.londonEx}, 
                   0,
                   ${foundPreviousFutureMarketPrice &&
              foundPreviousFutureMarketPrice.londonPrice
              ? foundPreviousFutureMarketPrice.londonPrice
              : 0
            }, ${currentDate}, ''
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

        console.log("Saving dbo.i_tmpweb LONDON ");
        await sleep(10000);
      }
    }
  }

  console.log("Scheduler daily done")
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
  console.log({ getDate });
  if (getDate !== 1) {
    return;
  }
  const previous = dayjs(currentDate).subtract(1, "month").format("YYYY-MM-DD");
  const startDate = dayjs(previous).startOf("month").format("YYYY-MM-DD");
  const endDate = dayjs(previous).endOf("month").format("YYYY-MM-DD");

  console.log({
    currentDate,
    Getting_data_form_date: { startDate, endDate }
  });

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

  let hhbulanRecId = 0;

  if (scheduleMode !== "DEV") {
    const latestHHBulan = await mssqlPool
      .request()
      .query("SELECT * FROM dbo.hhbulan ORDER BY recid DESC");

    if (latestHHBulan.recordset) {
      hhbulanRecId = latestHHBulan.recordset[0].recid + 1;
    }
  }

  let counter = latestData.length;

  try {
    for (const centre of centres) {
      counter += 1;
      let newData = {
        counter,
        centreId: centre._id,
        name: centre.description,
        sequence: parseFloat(centre.seq ? centre.seq : 0),
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
        let wetPriceArray = indexedPriceByCentre[centre._id].map(
          p => p.wetPrice,
        );
        wetPriceArray = wetPriceArray.filter(p => p !== 0);

        let wetHigh = 0,
          wetLow = 0,
          wetAverage = 0;
        if (wetPriceArray.length > 0) {
          wetHigh = Math.max(...wetPriceArray);
          wetLow = Math.min(...wetPriceArray);
          wetAverage =
            wetPriceArray.reduce((acc, curr) => acc + curr, 0) /
            wetPriceArray.length;

          wetAverage = wetAverage.toFixed(4);
        }

        let smc1PriceArray = indexedPriceByCentre[centre._id].map(p => p.smc1);
        smc1PriceArray = smc1PriceArray.filter(p => p !== 0);

        let smc1High = 0,
          smc1Low = 0,
          smc1Average = 0;
        if (smc1PriceArray.length > 0) {
          smc1High = Math.max(...smc1PriceArray);
          smc1Low = Math.min(...smc1PriceArray);
          smc1Average =
            smc1PriceArray.reduce((acc, curr) => acc + curr, 0) /
            smc1PriceArray.length;
          smc1Average = parseFloat(smc1Average.toFixed(4));
        }

        let smc2PriceArray = indexedPriceByCentre[centre._id].map(p => p.smc2);
        smc2PriceArray = smc2PriceArray.filter(p => p !== 0);

        let smc2High = 0,
          smc2Low = 0,
          smc2Average = 0;
        if (smc2PriceArray.length > 0) {
          smc2High = Math.max(...smc2PriceArray);
          smc2Low = Math.min(...smc2PriceArray);
          smc2Average =
            smc2PriceArray.reduce((acc, curr) => acc + curr, 0) /
            smc2PriceArray.length;
          smc2Average = parseFloat(smc2Average.toFixed(4));
        }

        let smc3PriceArray = indexedPriceByCentre[centre._id].map(p => p.smc3);

        smc3PriceArray = smc3PriceArray.filter(p => p !== 0);
        let smc3High = 0,
          smc3Low = 0,
          smc3Average = 0;
        if (smc3PriceArray.length > 0) {
          smc3High = Math.max(...smc3PriceArray);
          smc3Low = Math.min(...smc3PriceArray);
          smc3Average =
            smc3PriceArray.reduce((acc, curr) => acc + curr, 0) /
            smc3PriceArray.length;
          smc3Average = parseFloat(smc3Average.toFixed(4));
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
          TARIKH: new Date(startDate).toISOString(),
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
          DT_UPDATED: dayjs().toISOString(),
          SEQ: newData.sequence,
        };

        // console.log({ post });

        const total =
          newData.smc1Average + newData.smc2Average + newData.smc3Average;
        console.log({ total, centre: centre.description });

        if (total === 0) {
          continue;
        }
        if (scheduleMode !== "DEV") {
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

        await sleep(10000);

        hhbulanRecId += 1;
      }
    }
  } catch (err) {
    console.log(err);
  }
  console.log("Scheduler Monthly Done");
};

const scheduleTahunan = async ({
  collection,
  transaction,
  mssqlPool,
  date,
}) => {
  console.log("Schedule every year");

  const currentDate = date;
  const previous = dayjs(currentDate).subtract(1, "year").format("YYYY-MM-DD");

  const startDate = dayjs(previous).startOf("year").format("YYYY-MM-DD");
  const endDate = dayjs(previous).endOf("year").format("YYYY-MM-DD");

  console.log({
    currentDate,
    Getting_data_form_date: { startDate, endDate }
  });

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
    await sleep(10000)
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
      let wetPriceArray = indexedPriceByCentre[centre._id].map(p => p.wetPrice);
      wetPriceArray = wetPriceArray.filter(p => p !== 0);

      let wetHigh = 0,
        wetLow = 0,
        wetAverage = 0;
      if (wetPriceArray.length > 0) {
        wetHigh = Math.max(...wetPriceArray);
        wetLow = Math.min(...wetPriceArray);
        wetAverage =
          wetPriceArray.reduce((acc, curr) => acc + curr, 0) /
          wetPriceArray.length;
        wetAverage = parseFloat(wetAverage.toFixed(4));
      }

      let smc1PriceArray = indexedPriceByCentre[centre._id].map(p => p.smc1);
      smc1PriceArray = smc1PriceArray.filter(p => p !== 0);

      let smc1High = 0,
        smc1Low = 0,
        smc1Average = 0;
      if (smc1PriceArray.length > 0) {
        smc1High = Math.max(...smc1PriceArray);
        smc1Low = Math.min(...smc1PriceArray);
        smc1Average =
          smc1PriceArray.reduce((acc, curr) => acc + curr, 0) /
          smc1PriceArray.length;
        smc1Average = parseFloat(smc1Average.toFixed(4));
      }

      let smc2PriceArray = indexedPriceByCentre[centre._id].map(p => p.smc2);
      smc2PriceArray = smc2PriceArray.filter(p => p !== 0);

      let smc2High = 0,
        smc2Low = 0,
        smc2Average = 0;

      if (smc2PriceArray.length > 0) {
        smc2High = Math.max(...smc2PriceArray);
        smc2Low = Math.min(...smc2PriceArray);
        smc2Average =
          smc2PriceArray.reduce((acc, curr) => acc + curr, 0) /
          smc2PriceArray.length;
        smc2Average = parseFloat(smc2Average.toFixed(4));
      }

      let smc3PriceArray = indexedPriceByCentre[centre._id].map(p => p.smc3);
      smc3PriceArray = smc3PriceArray.filter(p => p !== 0);

      let smc3High = 0,
        smc3Low = 0,
        smc3Average = 0;
      if (smc3PriceArray.length > 0) {
        smc3High = Math.max(...smc3PriceArray);
        smc3Low = Math.min(...smc3PriceArray);
        smc3Average =
          smc3PriceArray.reduce((acc, curr) => acc + curr, 0) /
          smc3PriceArray.length;
        smc3Average = parseFloat(smc3Average.toFixed(4));
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
      date,
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
      BSH_High: newData.wetHigh,
      BSH_Low: newData.wetLow,
      BSH_Avg: newData.wetAverage,
      SMC1A_High: newData.smc1High,
      SMC1A_Low: newData.smc1Low,
      SMC1A_Avg: newData.smc1Average,
      SMC1B_High: newData.smc2High,
      SMC1B_Low: newData.smc2Low,
      SMC1B_Avg: newData.smc2Average,
      SMC1C_High: newData.smc3High,
      SMC1C_Low: newData.smc3Low,
      SMC1C_Avg: newData.smc3Average,
      CentreSeq: parseInt(centre.sequence ? centre.sequence : 0),
      RegionID: indexedRegion[centre.regionId]
        ? indexedRegion[centre.regionId].code
        : "",
      RegionDesc: indexedRegion[centre.regionId]
        ? indexedRegion[centre.regionId]
        : "",
    };

    console.log({ post });
    if (scheduleMode !== "DEV") {
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
  console.log("Scheduler Yearly Done");
};

start();

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
