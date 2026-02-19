const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const dayjs = require("dayjs");
const {
  generateDailySummaryReportForDomesticCocoaPrices,
  generateDailyAverageReportForDomesticCocoaPrices,
  generateDailyCocoaPriceReportForDomesticCocoaPrices,
  generateDailyBuyerReportForDomesticCocoaPrices,
  generateMonthlyBuyerReportForDomesticCocoaPrices,
} = require("./reports-daily");
const {
  generateWeeklySummaryReportForDomesticCocoaPrices,
  generateWeeklyAverageReportForDomesticCocoaPrices,
  generateWeeklyCocoaPriceReportForDomesticCocoaPrices,
} = require("./reports-weekly");
const {
  generateMonthlySummaryReportForDomesticCocoaPrices,
  generateMonthlyAverageReportForDomesticCocoaPrices,
  generateMonthlyCocoaPriceReportForDomesticCocoaPrices,
} = require("./reports-monthly");
const {
  generateQuarterlySummaryReportForDomesticCocoaPrices,
  generateQuarterlyAverageReportForDomesticCocoaPrices,
  generateQuarterlyCocoaPriceReportForDomesticCocoaPrices,
} = require("./reports-quarterly");
const {
  generateYearlySummaryReportForDomesticCocoaPrices,
  generateYearlyAverageReportForDomesticCocoaPrices,
  generateYearlyCocoaPriceReportForDomesticCocoaPrices,
  generateYearlyAverageCentreReportForDomesticCocoaPrices,
  generateYearlyAverageCentreReportForDomesticCocoaPricesWithGrade,
  getReportProgress,
} = require("./reports-yearly");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const TOKENIZE = process.env.TOKENIZE;

const resolvers = {
  Query: {
    domesticPricePerMonth: async (self, params, context) => {
      const startDate = dayjs(params.date)
        .startOf("month")
        .format("YYYY-MM-DD");
      const endDate = dayjs(params.date).endOf("month").format("YYYY-MM-DD");

      await context.collection("DomesticCocoaPrices").createIndex({
        date: 1,
      });

      return await context
        .collection("DomesticCocoaPrices")
        .find({
          date: {
            $lte: endDate,
            $gte: startDate,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          date: 1,
        })
        .toArray();
    },
    domesticPricePerMonthTokenized: async (self, params, context) => {
      const startDate = dayjs(params.date)
        .startOf("month")
        .format("YYYY-MM-DD");
      const endDate = dayjs(params.date).endOf("month").format("YYYY-MM-DD");

      await context.collection("DomesticCocoaPrices").createIndex({
        date: 1,
      });

      let results = await context
        .collection("DomesticCocoaPrices")
        .find({
          date: {
            $lte: endDate,
            $gte: startDate,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          date: 1,
        })
        .toArray();

      const centers = await context
        .collection("Centres")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();
      const indexedCenter = centers.reduce((all, c) => {
        if (!all[c._id]) {
          all[c._id] = {};
        }
        all[c._id] = c;
        return all;
      }, {});

      const buyers = await context
        .collection("Buyers")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();

      const indexedBuyers = buyers.reduce((all, b) => {
        if (!all[b._id]) {
          all[b._id] = {};
        }
        all[b._id] = b;
        return all;
      }, {});

      results = results.map(res => {
        return {
          ...res,
          Centre: indexedCenter[res.centreId],
          Buyer: indexedBuyers[res.buyerId],
        };
      });

      const payload = {
        results,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
    getDomesticPriceByCentre: async (self, params, context) => {
      return await context
        .collection("DomesticCocoaPrices")
        .find({
          ...params,
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          date: 1,
        })
        .toArray();
    },

    getDomesticPriceByCentreTokenized: async (self, params, context) => {
      let tokenized = {};
      if (params.tokenizedParams) {
        tokenized = jwt.verify(params.tokenizedParams, TOKENIZE);
      }
      const { iat, ...payloadParams } = tokenized;

      let results = await context
        .collection("DomesticCocoaPrices")
        .find({
          ...payloadParams,
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          date: 1,
        })
        .toArray();

      const centers = await context
        .collection("Centres")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();
      const indexedCenter = centers.reduce((all, c) => {
        if (!all[c._id]) {
          all[c._id] = {};
        }
        all[c._id] = c;
        return all;
      }, {});

      const buyers = await context
        .collection("Buyers")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();

      const indexedBuyers = buyers.reduce((all, b) => {
        if (!all[b._id]) {
          all[b._id] = {};
        }
        all[b._id] = b;
        return all;
      }, {});
      results = results.map(res => {
        return {
          ...res,
          Centre: indexedCenter[res.centreId],
          Buyer: indexedBuyers[res.buyerId],
        };
      });

      const payload = {
        results,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
    getDomesticPriceTotalByDate: async (self, params, context) => {
      await context.collection("DomesticCocoaPrices").createIndex({
        date: 1,
      });
      const result = await context
        .collection("DomesticCocoaPrices")
        .find({
          ...params,
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          date: 1,
        })
        .toArray();

      let total = 0;
      for (const res of result) {
        total += res.smc1;
        total += res.smc2;
        total += res.smc3;
        total += res.wetPrice;
      }
      return total;
    },
    getLastUpdateDomesticPrice: async (self, params, context) => {
      await context.collection("DomesticCocoaPrices").createIndex({
        date: 1,
      });
      const result = await context
        .collection("DomesticCocoaPrices")
        .find({
          ...params,
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          _updatedAt: -1,
        })
        .toArray();

      if (result.length > 0) {
        return dayjs(result[0]._updatedAt).format("YYYY-MM-DD HH:MM:ss");
      }
      return "No Data";
    },

    getLastUpdateDomesticPricePushedToWBC: async (self, params, context) => {
      await context.collection("DailyDomesticCocoaPriceLogs").createIndex({
        date: 1,
      });

      const result = await context
        .collection("DailyDomesticCocoaPriceLogs")
        .find({
          ...params,
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          _updatedAt: -1,
        })
        .toArray();

      if (result.length > 0) {
        return dayjs(result[0]._updatedAt).format("YYYY-MM-DD HH:MM:ss");
      }
      return "No Data";
    },
    getReportProgress,
  },
  Mutation: {
    createDomesticCocoaPrice: async (self, params, context) => {
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
        affectedCollectionName: "DomesticCocoaPrices",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };

      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("DomesticCocoaPrices").insertOne(newData);
      return "success";
    },
    updateDomesticCocoaPrice: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context.collection("DomesticCocoaPrices").findOne({
        _id: params._id,
      });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "DomesticCocoaPrices",
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

      await context.collection("DomesticCocoaPrices").updateOne(
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
      return "success";
    },
    deleteDomesticCocoaPrice: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context.collection("DomesticCocoaPrices").findOne({
        _id: params._id,
      });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "DomesticCocoaPrices",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          ...params,
          _deletedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "DELETE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("DomesticCocoaPrices").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            _deletedAt: new Date().toISOString(),
          },
        },
      );
      return "success";
    },
    createDomesticCocoaPriceTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const tokenized = jwt.verify(params.tokenizedInput, TOKENIZE);

      const { iat, ...tokenizedInput } = tokenized;

      const newData = {
        _id: uuidv4(),
        ...tokenizedInput,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "DomesticCocoaPrices",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };

      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("DomesticCocoaPrices").insertOne(newData);
      return "success";
    },
    updateDomesticCocoaPriceTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const tokenized = jwt.verify(params.tokenizedInput, TOKENIZE);

      const { iat, ...tokenizedPayload } = tokenized;

      const found = await context.collection("DomesticCocoaPrices").findOne({
        _id: tokenizedPayload._id,
      });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "DomesticCocoaPrices",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          ...tokenizedPayload,
          _updatedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "UPDATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("DomesticCocoaPrices").updateOne(
        {
          _id: tokenizedPayload._id,
        },
        {
          $set: {
            ...tokenizedPayload,
            _updatedAt: new Date().toISOString(),
          },
        },
      );

      return "success"
    },
    deleteDomesticCocoaPriceTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const tokenized = jwt.verify(params.tokenizedInput, TOKENIZE);

      const { iat, ...tokenizedPayload } = tokenized;

      const found = await context.collection("DomesticCocoaPrices").findOne({
        _id: tokenizedPayload._id,
      });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "DomesticCocoaPrices",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          ...tokenizedPayload,
          _deletedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "DELETE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("DomesticCocoaPrices").updateOne(
        {
          _id: tokenizedPayload._id,
        },
        {
          $set: {
            _deletedAt: new Date().toISOString(),
          },
        },
      );
      return "success";
    },

    generateDailySummaryReportForDomesticCocoaPrices,
    generateDailyAverageReportForDomesticCocoaPrices,
    generateDailyCocoaPriceReportForDomesticCocoaPrices,
    generateDailyBuyerReportForDomesticCocoaPrices,
    generateMonthlyBuyerReportForDomesticCocoaPrices,

    generateWeeklySummaryReportForDomesticCocoaPrices,
    generateWeeklyAverageReportForDomesticCocoaPrices,
    generateWeeklyCocoaPriceReportForDomesticCocoaPrices,

    generateMonthlySummaryReportForDomesticCocoaPrices,
    generateMonthlyAverageReportForDomesticCocoaPrices,
    generateMonthlyCocoaPriceReportForDomesticCocoaPrices,

    generateQuarterlySummaryReportForDomesticCocoaPrices,
    generateQuarterlyAverageReportForDomesticCocoaPrices,
    generateQuarterlyCocoaPriceReportForDomesticCocoaPrices,

    generateYearlySummaryReportForDomesticCocoaPrices,
    generateYearlyAverageReportForDomesticCocoaPrices,
    generateYearlyCocoaPriceReportForDomesticCocoaPrices,
    generateYearlyAverageCentreReportForDomesticCocoaPrices,
    generateYearlyAverageCentreReportForDomesticCocoaPricesWithGrade
  },

  DomesticCocoaPrice: {
    Centre: async (self, params, context) => {
      return await context.collection("Centres").findOne({
        _id: self.centreId,
      });
    },
    Buyer: async (self, params, context) => {
      return await context.collection("Buyers").findOne({
        _id: self.buyerId,
      });
    },
  },
};
exports.resolvers = resolvers;
