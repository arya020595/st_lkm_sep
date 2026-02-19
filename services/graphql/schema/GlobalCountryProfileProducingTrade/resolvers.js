const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const { result } = require("lodash");
const TOKENIZE = process.env.TOKENIZE;
const jwt = require("jsonwebtoken");

const resolvers = {
  Query: {
    allGlobalCountryProfileProducingTradeByCountryId: async (
      self,
      params,
      context,
    ) => {
      if (!params.countryId) {
        return [];
      }
      return await context
        .collection("GlobalCountryProfileProducingTrades")
        .find({
          countryId: params.countryId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();
    },
    allGlobalCountryProfileProducingTradeByCountryIdTokenized: async (self, params, context) => {
      const { iat, ...decryptedParams } = jwt.verify(params.tokenizedParams, TOKENIZE);
      if (!decryptedParams.countryId) {
        return "";
      }
      let results = await context
        .collection("GlobalCountryProfileProducingTrades")
        .find({
          countryId: decryptedParams.countryId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();

      const globalSITCProduct = await context.collection("GlobalSITCProducts").find({
        ...NOT_DELETED_DOCUMENT_QUERY
      }).toArray();

      const indexedGlobalSITCProduct = globalSITCProduct.reduce((all, product) => {
        if (!all[product._id]) {
          all[product._id] = {};
        }
        all[product._id] = product
        return all;
      }, {});

      results = results.map((q) => {
        return {
          ...q,
          GlobalSITCProduct: indexedGlobalSITCProduct[q.globalSITCProductId] ? indexedGlobalSITCProduct[q.globalSITCProductId] : null
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
    createGlobalCountryProfileProducingTrade: async (self, params, context) => {
      // console.log(params);
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const foundSaved = await context
        .collection("GlobalCountryProfileProducings")
        .findOne({
          countryId: params.countryId,
        });

      if (!foundSaved) {
        throw new Error("Save Profile First!");
      }
      const newData = {
        _id: uuidv4(),
        ...params,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalCountryProfileProducingTrades",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);
      await context
        .collection("GlobalCountryProfileProducingTrades")
        .insertOne(newData);
      return "success";
    },
    updateGlobalCountryProfileProducingTrade: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context
        .collection("GlobalCountryProfileProducingTrades")
        .findOne({
          _id: params._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalCountryProfileProducingTrades",
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

      await context.collection("GlobalCountryProfileProducingTrades").updateOne(
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
    deleteGlobalCountryProfileProducingTrade: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context
        .collection("GlobalCountryProfileProducingTrades")
        .findOne({
          _id: params._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalCountryProfileProducingTrades",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          _updatedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "DELETE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("GlobalCountryProfileProducingTrades").updateOne(
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
    createGlobalCountryProfileProducingTradeTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const { iat, ...decryptedParams } = jwt.verify(params.tokenized, TOKENIZE);

      const foundSaved = await context
        .collection("GlobalCountryProfileProducings")
        .findOne({
          countryId: decryptedParams.countryId,
        });

      if (!foundSaved) {
        throw new Error("Save Profile First!");
      }
      const newData = {
        _id: uuidv4(),
        ...decryptedParams,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalCountryProfileProducingTrades",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);
      await context
        .collection("GlobalCountryProfileProducingTrades")
        .insertOne(newData);
      return "success";
    },
    updateGlobalCountryProfileProducingTradeTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const { iat, ...decryptedParams } = jwt.verify(params.tokenized, TOKENIZE);

      const found = await context
        .collection("GlobalCountryProfileProducingTrades")
        .findOne({
          _id: decryptedParams._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalCountryProfileProducingTrades",
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

      await context.collection("GlobalCountryProfileProducingTrades").updateOne(
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
    deleteGlobalCountryProfileProducingTradeTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const { iat, ...decryptedParams } = jwt.verify(params.tokenized, TOKENIZE);

      const found = await context
        .collection("GlobalCountryProfileProducingTrades")
        .findOne({
          _id: decryptedParams._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalCountryProfileProducingTrades",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          _updatedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "DELETE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("GlobalCountryProfileProducingTrades").updateOne(
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
  GlobalCountryProfileProducingTrade: {
    GlobalSITCProduct: async (self, params, context) => {
      return await context.collection("GlobalSITCProducts").findOne({
        _id: self.globalSITCProductId,
      });
    },
  },
};
exports.resolvers = resolvers;
