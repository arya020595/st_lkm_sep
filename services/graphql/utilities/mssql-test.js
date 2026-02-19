require("dotenv").config({
  path: "../../../.env",
});
const mongodbConnection = require("../mongodb-connection");
const dayjs = require("dayjs");
const { v4: uuidv4 } = require("uuid");
const schedule = require("node-schedule");

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
  console.log({ sqlConfig });
  const mssqlPool = await sql.connect(sqlConfig);
  console.log("MSSQL Connect");

  const transaction = new sql.Transaction(mssqlPool);

  const { collection, mongodb, mongoClient } = await mongodbConnection();

  const jobHarian = schedule.scheduleJob("1 15 * * *", async () => {
    console.log("Schedule at Everyday at 15:00");

    const currentDate = dayjs().format("YYYY-MM-DD");

    const centres = await collection("Centres")
      .find({
        description: {
          $in: ["Tawau", "Kuching", "Raub"],
        },
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

    const prevDate = dayjs(currentDate).subtract(1, "day").format("YYYY-MM-DD");
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

    const latestData = await collection("DailyDomesticCocoaPriceLogs")
      .find({
        centreId: {
          $in: centres.map(c => c._id),
        },
      })
      .toArray();

    let counter = latestData.length;
    let counterFutureMarket = await collection("GlobalPriceFutureMarketReuters")
      .find({})
      .count();
    for (const centre of centres) {
      counter += 1;
      let newData = {
        counter,
        centreId: centre._id,
        name: centre.name,
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
        smc1Average = smc1Average.toFixed(4);

        const smc2PriceArray = indexedPriceByCentre[centre._id].map(
          p => p.smc2,
        );
        const smc2High = Math.max(...smc2PriceArray);
        const smc2Low = Math.min(...smc2PriceArray);
        let smc2Average =
          smc2PriceArray.reduce((acc, curr) => acc + curr, 0) /
          smc2PriceArray.length;
        smc2Average = smc2Average.toFixed(4);

        const smc3PriceArray = indexedPriceByCentre[centre._id].map(
          p => p.smc3,
        );
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
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      //Save to mongodDB
      console.log("Save to Mongo DB");
      await collection("DailyDomesticCocoaPriceLogs").insertOne(newData);

      //Save to Mysql
      var post = {
        recid: counter,
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
        SEQ: newData.sequence,
      };

      console.log({ post });
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
      console.log("Saving dbo.tmp_hharian ");
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
    }
    counterFutureMarket += 1;
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
    if (foundFutureMarketPrice) {
      transaction.begin(err => {
        if (err) {
          console.log("Error transaction begin", err);
        }

        const request = new sql.Request(transaction);
        request.query(
          `INSERT INTO dbo.tmp_i_tmpweb (recid, MDATE, CENTRECODE, CENTRE, FUTURE, LOW, HIGH, AVE, PRICE, EXRATE_STR, EXRATE_US,
            PCLOSE, DT_UPDATED, SOURCES) VALUES (${counterFutureMarket}, '${currentDate}', 'NYK', 'NEW YORK (CSCE)', ${
            foundFutureMarketPrice.nyLow
          }, 
            ${foundFutureMarketPrice.nyHigh}, ${
            foundFutureMarketPrice.nyAvg
          }, ${foundFutureMarketPrice.nyPrice}, ${
            foundFutureMarketPrice.nyEx
          }, 0, 
            ${
              foundPreviousFutureMarketPrice.nyPrice
                ? foundPreviousFutureMarketPrice.nyPrice
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
      console.log("Saving dbo.tmp_i_tmpweb NY ");
      await sleep(10000);

      transaction.begin(err => {
        if (err) {
          console.log("Error transaction begin", err);
        }

        const request = new sql.Request(transaction);
        request.query(
          `INSERT INTO dbo.tmp_i_tmpweb (recid, MDATE, CENTRECODE, CENTRE, FUTURE, LOW, HIGH, AVE, PRICE, EXRATE_STR, EXRATE_US,
            PCLOSE, DT_UPDATED, SOURCES) VALUES (${counter}, '${currentDate}', 'LDN', 'LONDON (LIFFE)', ${
            foundFutureMarketPrice.londonLow
          }, 
            ${foundFutureMarketPrice.londonHigh}, ${
            foundFutureMarketPrice.londonAvg
          }, ${foundFutureMarketPrice.londonPrice}, ${
            foundFutureMarketPrice.londonEx
          }, 0, 
            ${
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
      console.log("Saving dbo.tmp_i_tmpweb LONDON ");
      await sleep(10000);
    }
  });

  const jobBulan = schedule.scheduleJob("1 0 1 * *", async () => {
    console.log("Schedule every month");

    const currentDate = dayjs().format("YYYY-MM-DD");
    const previous = dayjs(currentDate)
      .subtract(1, "month")
      .format("YYYY-MM-DD");

    const startDate = dayjs(previous).startOf("month").format("YYYY-MM-DD");
    const endDate = dayjs(previous).endOf("month").format("YYYY-MM-DD");

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

    let counter = latestData.length;
    for (const centre of centres) {
      counter += 1;
      let newData = {
        counter,
        centreId: centre._id,
        name: centre.name,
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
        smc1Average = smc1Average.toFixed(4);

        const smc2PriceArray = indexedPriceByCentre[centre._id].map(
          p => p.smc2,
        );
        const smc2High = Math.max(...smc2PriceArray);
        const smc2Low = Math.min(...smc2PriceArray);
        let smc2Average =
          smc2PriceArray.reduce((acc, curr) => acc + curr, 0) /
          smc2PriceArray.length;
        smc2Average = smc2Average.toFixed(4);

        const smc3PriceArray = indexedPriceByCentre[centre._id].map(
          p => p.smc3,
        );
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
        await collection("MonthlyDomesticCocoaPriceLogs").insertOne(newData);

        //Save to Mysql
        var post = {
          recid: counter,
          TARIKH: currentDate,
          PUSAT_KOD: centre.name.slice(0, 20),
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
          DT_UPDATED: dayjs().format("YYYY-MM-DD"),
          SEQ: newData.sequence,
        };

        console.log({ post });
        transaction.begin(err => {
          if (err) {
            console.log("Error transaction begin", err);
          }

          const request = new sql.Request(transaction);
          request.query(
            `INSERT INTO dbo.tmp_hhbulan (recid, TARIKH, PUSAT_KOD, PUSAT, BSH_TGG, BSH_RDH, BSH_PUR, SMC1A_TGG, SMC1A_RDH, SMC1A_PUR, SMC1B_TGG, SMC1B_RDH, 
            SMC1B_PUR, SMC1C_TGG, SMC1C_RDH, SMC1C_PUR, SEQ) VALUES (${post.recid},'${post.TARIKH}','${post.PUSAT_KOD}','${post.PUSAT}', ${post.BSH_TGG}, ${post.BSH_RDH}, ${post.BSH_PUR},
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
        });
        console.log("MSSQL Done");
        await sleep(10000);
      }

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
    }
  });

  const jobTahun = schedule.scheduleJob("1 0 1 1 *", async () => {
    console.log("Schedule every year");

    const currentDate = dayjs().format("YYYY-MM-DD");
    const previous = dayjs(currentDate)
      .subtract(1, "year")
      .format("YYYY-MM-DD");

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
        name: centre.name,
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
        smc1Average = smc1Average.toFixed(4);

        const smc2PriceArray = indexedPriceByCentre[centre._id].map(
          p => p.smc2,
        );
        const smc2High = Math.max(...smc2PriceArray);
        const smc2Low = Math.min(...smc2PriceArray);
        let smc2Average =
          smc2PriceArray.reduce((acc, curr) => acc + curr, 0) /
          smc2PriceArray.length;
        smc2Average = smc2Average.toFixed(4);

        const smc3PriceArray = indexedPriceByCentre[centre._id].map(
          p => p.smc3,
        );
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
      transaction.begin(err => {
        if (err) {
          console.log("Error transaction begin", err);
        }

        const request = new sql.Request(transaction);
        request.query(
          `INSERT INTO dbo.tmp_htahunan (Year, Pusat, Pusat_Kod, CentreID, CentreDesc, BSH_High, BSH_Low, BSH_Avg, SMC1A_High, SMC1A_Low,
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
      console.log("MSSQL Done");
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
    }
  });

  console.log("Done...");
};
start();

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
