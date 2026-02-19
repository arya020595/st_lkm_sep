const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const dayjs = require("dayjs");
const { assertValidSession } = require("../../authentication");
const sql = require("mssql");
const TOKENIZE = process.env.TOKENIZE;
const jwt = require("jsonwebtoken");
const { status } = require("nprogress");

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

const resolvers = {
  Query: {
    futureMarketByDate: async (self, params, context) => {
      return await context
        .collection("GlobalPriceFutureMarketReuters")
        .findOne({
          ...NOT_DELETED_DOCUMENT_QUERY,
          date: params.date,
        });
    },
    allFutureMarkets: async (self, params, context) => {
      await context.collection("GlobalPriceFutureMarketReuters").createIndex({
        date: 1,
      });
      const startDate = dayjs(params.date)
        .startOf("month")
        .format("YYYY-MM-DD");

      const endDate = dayjs(params.date).endOf("month").format("YYYY-MM-DD");
      return await context
        .collection("GlobalPriceFutureMarketReuters")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        })
        .toArray();
    },
    countDataFutureMarkets: async (self, params, context) => {
      return await context
        .collection("GlobalPriceFutureMarketReuters")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .count();
    },
    getLastUpdateFutureMarketReutersPricePushedToWBC: async (
      self,
      params,
      context,
    ) => {
      const result = await context
        .collection("GlobalPriceFutureMarketReutersPushedLogs")
        .findOne({
          "futureMarketLogs.date": params.date,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });

      if (result) {
        return dayjs(result._createdAt).format("YYYY-MM-DD HH:MM:ss");
      }
      return "No Logs";
    },
    getLastUpdateFutureMarketReutersPrice: async (self, params, context) => {
      const result = await context
        .collection("GlobalPriceFutureMarketReuters")
        .findOne({
          date: params.date,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });

      if (result) {
        return dayjs(result._updatedAt).format("YYYY-MM-DD HH:MM:ss");
      }
      return "No Logs";
    },
    allFutureMarketsTokenized: async (self, params, context) => {
      await context.collection("GlobalPriceFutureMarketReuters").createIndex({
        date: 1,
      });

      const startDate = dayjs(params.date)
        .startOf("month")
        .format("YYYY-MM-DD");

      const endDate = dayjs(params.date).endOf("month").format("YYYY-MM-DD");

      let queryResult = await context
        .collection("GlobalPriceFutureMarketReuters")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        })
        .toArray();

      const source = await context
        .collection("Sources")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();

      const indexedSources = source.reduce((all, source) => {
        if (!all[source._id]) {
          all[source._id] = {};
        }
        all[source._id] = source;
        return all;
      }, {});

      queryResult = queryResult.map(q => {
        return {
          ...q,
          Source: indexedSources[q.sourceId]
            ? indexedSources[q.sourceId]
            : null,
        };
      });

      const infoStatus = await context
        .collection("InfoStatuses")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();

      const indexedStatus = infoStatus.reduce((all, status) => {
        if (!all[status._id]) {
          all[status._id] = {};
        }
        all[status._id] = status;
        return all;
      }, {});

      queryResult = queryResult.map(q => {
        return {
          ...q,
          InfoStatus: indexedStatus[q.infoStatusId]
            ? indexedStatus[q.infoStatusId]
            : null,
        };
      });

      const payload = {
        queryResult,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },

    futureMarketByDateTokenized: async (self, params, context) => {
      let queryResult = await context
        .collection("GlobalPriceFutureMarketReuters")
        .findOne({
          ...NOT_DELETED_DOCUMENT_QUERY,
          date: params.date,
        });

      const source = await context.collection("Sources").findOne({
        _id: queryResult?.sourceId || "",
        ...NOT_DELETED_DOCUMENT_QUERY,
      });

      queryResult = {
        ...queryResult,
        Source: source ? source : null,
      };

      const infoStatus = await context.collection("InfoStatuses").findOne({
        _id: queryResult?.infoStatusId || "",
        ...NOT_DELETED_DOCUMENT_QUERY,
      });

      queryResult = {
        ...queryResult,
        InfoStatus: infoStatus ? infoStatus : null,
      };

      const payload = {
        queryResult,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
  },
  Mutation: {
    createFutureMarket: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const newData = {
        _id: uuidv4(),
        ...params,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalPriceFutureMarketReuters",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context
        .collection("GlobalPriceFutureMarketReuters")
        .insertOne(newData);

      // const { _id, iccoPoundsterling, iccoEx, londonEx, nyEx, sgEx, ...d } =
      //   newData;
      // const reuterPrices = {
      //   _id: uuidv4(),
      //   ...d,
      //   iccoPound: iccoPoundsterling,
      //   iccoEX: iccoEx,
      //   sgEX: sgEx,
      //   londonEX: londonEx,
      //   nyEX: nyEx,
      //   futureMarketId: _id,
      //   _createdAt: new Date().toISOString(),
      //   _updatedAt: new Date().toISOString(),
      // };

      // await context.collection("GlobalReutersPrices").insertOne(reuterPrices);
      return "success";
    },
    updateFutureMarket: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const { _id, iccoPoundsterling, iccoEx, londonEx, nyEx, sgEx, ...d } =
        params;

      const found = await context
        .collection("GlobalPriceFutureMarketReuters")
        .findOne({
          _id: params._id,
        });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalPriceFutureMarketReuters",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          ...params,
          _updatedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "UPDATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("GlobalPriceFutureMarketReuters").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            ...params,
            _updatedAt: new Date().toISOString(),
          },
        },
      );

      // await context.collection("GlobalReutersPrices").updateOne(
      //   {
      //     futureMarketId: params._id,
      //   },
      //   {
      //     $set: {
      //       ...d,
      //       iccoPound: iccoPoundsterling,
      //       iccoEX: iccoEx,
      //       sgEX: sgEx,
      //       nyEX: nyEx,
      //       londonEX: londonEx,
      //       _updatedAt: new Date().toISOString(),
      //     },
      //   },
      // );
      return "success";
    },
    deleteFutureMarket: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context
        .collection("GlobalPriceFutureMarketReuters")
        .findOne({
          _id: params._id,
        });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalPriceFutureMarketReuters",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          _deletedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "DELETE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("GlobalPriceFutureMarketReuters").updateOne(
        {
          _id: found._id,
        },
        {
          $set: {
            _deletedAt: new Date().toISOString(),
          },
        },
      );
      // // await context.collection("GlobalReutersPrices").updateOne(
      //   {
      //     date: params._id,
      //   },
      //   {
      //     $set: {
      //       _deletedAt: new Date().toISOString(),
      //     },
      //   },
      // );

      // await context.collection("GlobalPriceFutureMarketReuters").updateOne(
      //   {
      //     _id: params._id,
      //   },
      //   {
      //     $set: {
      //       _deletedAt: new Date().toISOString(),
      //     },
      //   },
      // );
      // await context.collection("GlobalReutersPrices").updateOne(
      //   {
      //     futureMarketId: params._id,
      //   },
      //   {
      //     $set: {
      //       _deletedAt: new Date().toISOString(),
      //     },
      //   },
      // );
      return "success";
    },
    checkDuplicateFutureMarket: async (self, params, context) => {
      const startDate = dayjs(`${params.year}-01-01`).format("YYYY-MM-DD");
      const endDate = dayjs(`${params.year}-12-31`).format("YYYY-MM-DD");

      await context.collection("GlobalPriceFutureMarketReuters").createIndex({
        date: 1,
      });
      const allData = await context
        .collection("GlobalPriceFutureMarketReuters")
        .find({
          date: {
            $gte: startDate,
            $lte: endDate,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({ date: 1 })
        .toArray();

      let results = [];
      for (const data of allData) {
        const found = allData.filter(d => d.date === data.date);
        if (found.length > 1) {
          results.push(data);
        }
      }
      results = results.map(res => {
        return {
          ...res,
          label: res.label ? res.label : res.future ? res.future : "No Named",
        };
      });
      return results;
    },
    resendFutureMarket: async (self, params, context) => {
      const mssqlPool = await sql.connect(sqlConfig);
      const transaction = new sql.Transaction(mssqlPool);

      await context.collection("GlobalPriceFutureMarketReuters").createIndex({
        date: 1,
      });

      const selectedDate = params.date;

      let prevDate = dayjs(selectedDate)
        .subtract(1, "day")
        .format("YYYY-MM-DD");

      if (dayjs(selectedDate).get("day") === 1) {
        prevDate = dayjs(selectedDate).subtract(3, "day").format("YYYY-MM-DD");
      }

      let foundFutureMarketPrice = await context
        .collection("GlobalPriceFutureMarketReuters")
        .findOne({
          date: selectedDate,
          _deletedAt: {
            $exists: false,
          },
        });

      if (!foundFutureMarketPrice) {
        throw new Error(`No data in ${selectedDate}`);
      }

      if (!foundFutureMarketPrice.nyLow) {
        foundFutureMarketPrice.nyLow = 0;
      }
      if (!foundFutureMarketPrice.nyHigh) {
        foundFutureMarketPrice.nyHigh = 0;
      }
      if (!foundFutureMarketPrice.nyAvg) {
        foundFutureMarketPrice.nyAvg = 0;
      }

      const existed = await mssqlPool
        .request()
        .query(
          `SELECT * FROM dbo.i_tmpweb WHERE MDATE='${selectedDate}' ORDER BY recid DESC`,
        );

      if (existed.recordset.length > 0) {
        throw new Error("Already Existed!. Not Pushed");
      }

      const foundPreviousFutureMarketPrice = await context
        .collection("GlobalPriceFutureMarketReuters")
        .findOne({
          date: prevDate,
          _deletedAt: {
            $exists: false,
          },
        });

      const currentData = await mssqlPool
        .request()
        .query("SELECT * FROM dbo.i_tmpweb ORDER BY recid DESC");
      let list = currentData;

      if (list.recordset) {
        if (foundFutureMarketPrice) {
          await context
            .collection("GlobalPriceFutureMarketReutersPushedLogs")
            .insertOne({
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

          let recid = list.recordset[0].recid + 1;
          console.log("send NY");
          console.log({ foundFutureMarketPrice });
          console.log(`INSERT INTO dbo.i_tmpweb (
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
            '${selectedDate}', 
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
          )`);
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
                '${selectedDate}', 
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
          console.log("Saving dbo.i_tmpweb NY ");
          await sleep(10000);

          recid += 1;

          console.log("send London");
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
                '${selectedDate}', 
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
          console.log("Saving dbo.i_tmpweb LONDON ");
          await sleep(10000);
        }
      }

      //Close Connection
      await sql.close();
      return "success";
    },
    createFutureMarketTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);

      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const { iat, InfoStatus, Source, ...decryptedParams } = jwt.verify(
        params.tokenized,
        TOKENIZE,
      );

      const newData = {
        _id: uuidv4(),
        ...decryptedParams,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      const foundExisted = await context
        .collection("GlobalPriceFutureMarketReuters")
        .findOne({
          date: newData.date,
          _deletedAt: {
            $exists: false,
          },
        });

      if (!foundExisted) {
        const payload = {
          _id: uuidv4(),
          affectedCollectionName: "GlobalPriceFutureMarketReuters",
          affectedDocumentId: newData._id,
          dataBeforeChanges: newData,
          dataAfterChanges: newData,
          modifiedBy: context.activeSession.User,
          timeStamp: new Date().toISOString(),
          action: "CREATE",
        };
        await context.collection("ActivityLogs").insertOne(payload);

        await context
          .collection("GlobalPriceFutureMarketReuters")
          .insertOne(newData);
      }

      return "Success";
    },
    updateFutureMarketTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const { iat, Source, InfoStatus, ...decryptedParams } = jwt.verify(
        params.tokenized,
        TOKENIZE,
      );

      const { _id, iccoPoundsterling, iccoEx, londonEx, nyEx, sgEx, ...d } =
        decryptedParams;

      const found = await context
        .collection("GlobalPriceFutureMarketReuters")
        .findOne({
          _id: decryptedParams._id,
        });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalPriceFutureMarketReuters",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          ...decryptedParams,
          _updatedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "UPDATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("GlobalPriceFutureMarketReuters").updateOne(
        {
          _id: decryptedParams._id,
        },
        {
          $set: {
            ...decryptedParams,
            _updatedAt: new Date().toISOString(),
          },
        },
      );

      return "Success";
    },
    deleteFutureMarketTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const { iat, ...decryptedParams } = jwt.verify(
        params.tokenized,
        TOKENIZE,
      );

      const found = await context
        .collection("GlobalPriceFutureMarketReuters")
        .findOne({
          _id: decryptedParams._id,
        });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalPriceFutureMarketReuters",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          _deletedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "DELETE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("GlobalPriceFutureMarketReuters").updateOne(
        {
          _id: found._id,
        },
        {
          $set: {
            _deletedAt: new Date().toISOString(),
          },
        },
      );

      return "Success";
    },
  },
  FutureMarket: {
    Source: async (self, parasm, context) => {
      return await context.collection("Sources").findOne({
        _id: self.sourceId,
      });
    },
    InfoStatus: async (self, parasm, context) => {
      return await context.collection("InfoStatuses").findOne({
        _id: self.infoStatusId,
      });
    },
  },
};
exports.resolvers = resolvers;

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
