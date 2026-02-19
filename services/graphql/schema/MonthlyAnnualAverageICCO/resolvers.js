const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const dayjs = require("dayjs");
const { assertValidSession } = require("../../authentication");
const TOKENIZE = process.env.TOKENIZE;
const jwt = require("jsonwebtoken");

const resolvers = {
  Query: {
    allMonthlyAnnualAverageICCO: async (self, params, context) => {
      return await context
        .collection("MonthlyAnnualAverageICCOPrices")
        .find({
          year: params.years
            ? {
              $in: params.years.map(year => parseInt(year)),
            }
            : parseInt(params.year || dayjs().format("YYYY")),
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          month: 1,
        })
        .toArray();
    },
    allMonthlyAnnualAverageICCOTokenized: async (Self, params, context) => {
      let results = await context
        .collection("MonthlyAnnualAverageICCOPrices")
        .find({
          year: params.years
            ? {
              $in: params.years.map(year => parseInt(year)),
            }
            : parseInt(params.year || dayjs().format("YYYY")),
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          month: 1,
        })
        .toArray();

      const source = await context.collection("Sources").find({
        ...NOT_DELETED_DOCUMENT_QUERY,
      }).toArray();

      const indexedSources = source.reduce((all, source) => {
        if (!all[source._id]) {
          all[source._id] = {};
        }
        all[source._id] = source
        return all;
      }, {});

      results = results.map((q) => {
        return {
          ...q,
          Source: indexedSources[q.sourceId] ? indexedSources[q.sourceId] : null
        }
      })

      const payload = {
        results,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    }
  },
  Mutation: {
    createMonthlyAverageAnnualICCOPrice: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      let newData = {
        _id: uuidv4(),
        ...params,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      if (newData.sourceId) {
        const source = await context.collection("Sources").findOne({
          _id: newData.sourceId,
        });
        newData.sourceName = source.description;
      }

      const foundExisted = await context
        .collection("MonthlyAnnualAverageICCOPrices")
        .findOne({
          month: newData.month,
          year: newData.year,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });

      if (foundExisted) {
        throw new Error("Duplicate Year and Month");
      }

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "MonthlyAnnualAverageICCOPrices",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context
        .collection("MonthlyAnnualAverageICCOPrices")
        .insertOne(newData);
      return "success";
    },
    updateMonthlyAverageAnnualICCOPrice: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      let updateObject = {};
      if (params.sourceId) {
        const source = await context.collection("Sources").findOne({
          _id: params.sourceId,
        });
        updateObject.sourceName = source.description;
      }

      const found = await context
        .collection("MonthlyAnnualAverageICCOPrices")
        .findOne({
          _id: params._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "MonthlyAnnualAverageICCOPrices",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          ...params,
          ...updateObject,
          _updatedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "UPDATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("MonthlyAnnualAverageICCOPrices").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            ...params,
            ...updateObject,
            _updatedAt: new Date().toISOString(),
          },
        },
      );
      return "success";
    },
    deleteMonthlyAverageAnnualICCOPrice: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context
        .collection("MonthlyAnnualAverageICCOPrices")
        .findOne({
          _id: params._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "MonthlyAnnualAverageICCOPrices",
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

      await context.collection("MonthlyAnnualAverageICCOPrices").updateOne(
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
    createMonthlyAverageAnnualICCOPriceTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const { iat, Source, ...decryptedParams } = jwt.verify(params.tokenized, TOKENIZE);

      let newData = {
        _id: uuidv4(),
        ...decryptedParams,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      if (newData.sourceId) {
        const source = await context.collection("Sources").findOne({
          _id: newData.sourceId,
        });
        newData.sourceName = source.description;
      }

      const foundExisted = await context
        .collection("MonthlyAnnualAverageICCOPrices")
        .findOne({
          month: newData.month,
          year: newData.year,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });

      if (foundExisted) {
        throw new Error("Duplicate Year and Month");
      }

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "MonthlyAnnualAverageICCOPrices",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context
        .collection("MonthlyAnnualAverageICCOPrices")
        .insertOne(newData);
      return "success";
    },
    updateMonthlyAverageAnnualICCOPriceTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const { iat, Source, ...decryptedParams } = jwt.verify(params.tokenized, TOKENIZE);

      let updateObject = {};
      if (decryptedParams.sourceId) {
        const source = await context.collection("Sources").findOne({
          _id: decryptedParams.sourceId,
        });
        updateObject.sourceName = source.description;
      }

      const found = await context
        .collection("MonthlyAnnualAverageICCOPrices")
        .findOne({
          _id: decryptedParams._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "MonthlyAnnualAverageICCOPrices",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          ...decryptedParams,
          ...updateObject,
          _updatedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "UPDATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("MonthlyAnnualAverageICCOPrices").updateOne(
        {
          _id: decryptedParams._id,
        },
        {
          $set: {
            ...decryptedParams,
            ...updateObject,
            _updatedAt: new Date().toISOString(),
          },
        },
      );
      return "success";
    },
    deleteMonthlyAverageAnnualICCOPriceTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const { iat, ...decryptedParams } = jwt.verify(params.tokenized, TOKENIZE);

      const found = await context
        .collection("MonthlyAnnualAverageICCOPrices")
        .findOne({
          _id: decryptedParams._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "MonthlyAnnualAverageICCOPrices",
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

      await context.collection("MonthlyAnnualAverageICCOPrices").updateOne(
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
    }
  },
  MonthlyAnnualAverageICCO: {
    Source: async (self, params, context) => {
      return await context.collection("Sources").findOne({
        _id: self.sourceId,
      });
    },
  },
};
exports.resolvers = resolvers;
