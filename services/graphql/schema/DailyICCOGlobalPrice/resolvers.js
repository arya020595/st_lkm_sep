const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const dayjs = require("dayjs");
const TOKENIZE = process.env.TOKENIZE;
const jwt = require("jsonwebtoken");
const {
  generateDailyReportForGlobalICCOPrices,
  generateMonthlyReportForGlobalICCOPrices,
  generateYearlyReportForGlobalICCOPrices,

  generateCocoaBeanPriceOfInternationalSignificanceReport,
  generateCocoaBeanMonthlyAverageAndHighLowReport,
  generateCocoaBeanMonthlyandAnnualAverageReport,
  generateICCODailyPriceOfCocoaBeansReport,

  generateDailyInternationalCocoaPriceReport,
  generateMonthlyInternationalCocoaPriceReport,
  generateYearlyInternationalCocoaPriceReport,
} = require("./reports-icco-global");
const { assertValidSession } = require("../../authentication");

const resolvers = {
  Query: {
    allDailyGlobalICCOPrices: async (self, params, context) => {
      await context.collection("GlobalICCOPrices").createIndex({
        date: 1,
      });
      const startDate = dayjs(params.date)
        .startOf("month")
        .format("YYYY-MM-DD");

      const endDate = dayjs(params.date).endOf("month").format("YYYY-MM-DD");
      return await context
        .collection("GlobalICCOPrices")
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
    dailyGlobalICCOPricesByDate: async (self, params, context) => {
      await context.collection("GlobalICCOPrices").createIndex({
        date: 1,
      });
      return await context
        .collection("GlobalICCOPrices")
        .find({
          date: params.date,
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          _createdAt: -1,
        })
        .toArray();
    },
    countDailyGlobalICCOPrices: async (self, params, context) => {
      return await context
        .collection("GlobalICCOPrices")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .count();
    },
    allDailyGlobalICCOPricesTokenized: async (self, params, context) => {
      await context.collection("GlobalICCOPrices").createIndex({
        date: 1,
      });
      const startDate = dayjs(params.date)
        .startOf("month")
        .format("YYYY-MM-DD");

      const endDate = dayjs(params.date).endOf("month").format("YYYY-MM-DD");
      const results = await context
        .collection("GlobalICCOPrices")
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


      const payload = {
        results,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
    dailyGlobalICCOPricesByDateTokenized: async (self, params, context) => {
      await context.collection("GlobalICCOPrices").createIndex({
        date: 1,
      });
      const results = await context
        .collection("GlobalICCOPrices")
        .find({
          date: params.date,
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          _createdAt: -1,
        })
        .toArray();

      const payload = {
        results,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    }
  },
  Mutation: {
    createDailyGlobalICCOPrice: async (self, params, context) => {
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
        affectedCollectionName: "GlobalICCOPrices",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };

      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("GlobalICCOPrices").insertOne(newData);
      return "success";
    },
    updateDailyGlobalICCOPrice: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context.collection("GlobalICCOPrices").findOne({
        _id: params._id,
      });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalICCOPrices",
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

      await context.collection("GlobalICCOPrices").updateOne(
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
    deleteDailyGlobalICCOPrice: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context.collection("GlobalICCOPrices").findOne({
        _id: params._id,
      });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalICCOPrices",
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

      await context.collection("GlobalICCOPrices").updateOne(
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

    createDailyGlobalICCOPriceTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const { iat, ...decryptedParams } = jwt.verify(params.tokenized, TOKENIZE);

      const newData = {
        _id: uuidv4(),
        ...decryptedParams,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalICCOPrices",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };

      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("GlobalICCOPrices").insertOne(newData);
      return "success";
    },
    updateDailyGlobalICCOPriceTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const { iat, ...decryptedParams } = jwt.verify(params.tokenized, TOKENIZE);

      const found = await context.collection("GlobalICCOPrices").findOne({
        _id: decryptedParams._id,
      });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalICCOPrices",
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

      await context.collection("GlobalICCOPrices").updateOne(
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
      return "success";
    },
    deleteDailyGlobalICCOPriceTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const { iat, ...decryptedParams } = jwt.verify(params.tokenized, TOKENIZE);

      const found = await context.collection("GlobalICCOPrices").findOne({
        _id: decryptedParams._id,
      });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalICCOPrices",
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

      await context.collection("GlobalICCOPrices").updateOne(
        {
          _id: decryptedParams._id,
        },
        {
          $set: {
            _deletedAt: new Date().toISOString(),
          },
        },
      );
      return "success";
    },
    generateDailyReportForGlobalICCOPrices,
    generateMonthlyReportForGlobalICCOPrices,
    generateYearlyReportForGlobalICCOPrices,

    generateCocoaBeanPriceOfInternationalSignificanceReport,
    generateCocoaBeanMonthlyAverageAndHighLowReport,
    generateCocoaBeanMonthlyandAnnualAverageReport,
    generateICCODailyPriceOfCocoaBeansReport,

    generateDailyInternationalCocoaPriceReport,
    generateMonthlyInternationalCocoaPriceReport,
    generateYearlyInternationalCocoaPriceReport,
  },
};
exports.resolvers = resolvers;
