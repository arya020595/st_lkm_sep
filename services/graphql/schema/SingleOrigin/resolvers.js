const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const dayjs = require("dayjs");
const { assertValidSession } = require("../../authentication");
const TOKENIZE = process.env.TOKENIZE;
const jwt = require("jsonwebtoken");

const resolvers = {
  Query: {
    allSingleOrigins: async (self, params, context) => {
      await context.collection("SingleOrigins").createIndex({
        year: -1,
      });
      return await context
        .collection("SingleOrigins")
        .find({
          year: params.years
            ? {
              $in: params.years.map(year => parseInt(year)),
            }
            : parseInt(params.year || dayjs().format("YYYY")),
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          year: -1,
        })
        .toArray();
    },
    countSingleOrigins: async (self, params, context) => {
      return await context
        .collection("SingleOrigins")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .count();
    },
    allSingleOriginsTokenized: async (self, params, context) => {
      await context.collection("SingleOrigins").createIndex({
        year: -1,
      });
      let results = await context
        .collection("SingleOrigins")
        .find({
          year: params.years
            ? {
              $in: params.years.map(year => parseInt(year)),
            }
            : parseInt(params.year || dayjs().format("YYYY")),
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          year: -1,
        })
        .toArray();

      const localRegion = await context.collection("Regions").find({
        _id: {
          $in: results.map((q) => q.regionId)
        },
        ...NOT_DELETED_DOCUMENT_QUERY
      }).toArray();

      const indexedLocalRegion = localRegion.reduce((all, region) => {
        if (!all[region._id]) {
          all[region._id] = {};
        }
        all[region._id] = region
        return all;
      }, {});

      results = results.map((q) => {
        return {
          ...q,
          LocalRegion: indexedLocalRegion[q.regionId] ? indexedLocalRegion[q.regionId] : null
        }
      })

      const trader = await context.collection("Traders").find({
        ...NOT_DELETED_DOCUMENT_QUERY
      }).toArray();

      const indexedTrader = trader.reduce((all, trader) => {
        if (!all[trader._id]) {
          all[trader._id] = {};
        }
        all[trader._id] = trader
        return all
      })

      results = results.map((q) => {
        return {
          ...q,
          Trader: indexedTrader[q.traderId] ? indexedTrader[q.traderId] : null
        }
      })

      const payload = {
        results
      }

      let token = jwt.sign(payload, TOKENIZE);
      return token

    }
  },
  Mutation: {
    createSingleOrigin: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      await context.collection("SingleOrigins").createIndex({
        year: -1,
      });
      let newData = {
        _id: uuidv4(),
        ...params,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      const foundExisted = await context.collection("SingleOrigins").findOne({
        traderId: newData.traderId,
        year: newData.year,
        quarter: newData.quarter,
      });
      if (foundExisted) {
        throw new Error("Duplicate Company Name, Year, and Quarter");
      }

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "SingleOrigins",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("SingleOrigins").insertOne(newData);
      return "success";
    },
    updateSingleOrigin: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context.collection("SingleOrigins").findOne({
        _id: params._id,
      });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "SingleOrigins",
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

      await context.collection("SingleOrigins").updateOne(
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
    deleteSingleOrigin: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context.collection("SingleOrigins").findOne({
        _id: params._id,
      });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "SingleOrigins",
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
      await context.collection("SingleOrigins").updateOne(
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
    createSingleOriginTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const { iat, LocalRegion, Trader, traders, ...decryptedParams } = jwt.verify(params.tokenized, TOKENIZE);
      console.log(decryptedParams)
      await context.collection("SingleOrigins").createIndex({
        year: -1,
      });
      let newData = {
        _id: uuidv4(),
        ...decryptedParams,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      const foundExisted = await context.collection("SingleOrigins").findOne({
        traderId: newData.traderId,
        year: newData.year,
        quarter: newData.quarter,
      });
      if (foundExisted) {
        throw new Error("Duplicate Company Name, Year, and Quarter");
      }

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "SingleOrigins",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("SingleOrigins").insertOne(newData);
      return "success";
    },
    updateSingleOriginTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const { iat, LocalRegion, Trader, traders, ...decryptedParams } = jwt.verify(params.tokenized, TOKENIZE);

      const found = await context.collection("SingleOrigins").findOne({
        _id: decryptedParams._id,
      });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "SingleOrigins",
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

      await context.collection("SingleOrigins").updateOne(
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
    deleteSingleOriginTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const { iat, ...decryptedParams } = jwt.verify(params.tokenized, TOKENIZE);
      const found = await context.collection("SingleOrigins").findOne({
        _id: decryptedParams._id,
      });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "SingleOrigins",
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
      await context.collection("SingleOrigins").updateOne(
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
  SingleOrigin: {
    LocalRegion: async (self, params, context) => {
      return await context.collection("Regions").findOne({
        _id: self.regionId,
      });
    },
    Trader: async (self, params, context) => {
      return await context.collection("Traders").findOne({
        _id: self.traderId,
      });
    },
  },
};
exports.resolvers = resolvers;
