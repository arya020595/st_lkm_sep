const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const dayjs = require("dayjs");
const { assertValidSession } = require("../../authentication");
const { result } = require("lodash");
const TOKENIZE = process.env.TOKENIZE;
const jwt = require("jsonwebtoken");

const resolvers = {
  Query: {
    allInternationalSignificancePrices: async (self, params, context) => {
      return await context
        .collection("InternationalSignificancePrices")
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
    allInternationalSignificancePricesTokenized: async (self, params, context) => {
      let results = await context
        .collection("InternationalSignificancePrices")
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
        ...NOT_DELETED_DOCUMENT_QUERY
      }).toArray()

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
    createInternationalSignificancePrice: async (self, params, context) => {
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
        .collection("InternationalSignificancePrices")
        .findOne({
          month: newData.month,
          year: newData.year,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });

      if (foundExisted) {
        throw new Error("Duplicate Month And Year");
      }

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "InternationalSignificancePrices",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context
        .collection("InternationalSignificancePrices")
        .insertOne(newData);
      return "success";
    },
    updateInternationalSignificancePrice: async (self, params, context) => {
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
        .collection("InternationalSignificancePrices")
        .findOne({
          _id: params._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "InternationalSignificancePrices",
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
      await context.collection("InternationalSignificancePrices").updateOne(
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
    deleteInternationalSignificancePrice: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context
        .collection("InternationalSignificancePrices")
        .findOne({
          _id: params._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "InternationalSignificancePrices",
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

      await context.collection("InternationalSignificancePrices").updateOne(
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
    createInternationalSignificancePriceTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const { iat, Source, ...decryptedParams } = jwt.verify(params.tokenized, TOKENIZE);
      console.log(decryptedParams)
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
        .collection("InternationalSignificancePrices")
        .findOne({
          month: newData.month,
          year: newData.year,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });

      if (foundExisted) {
        throw new Error("Duplicate Month And Year");
      }

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "InternationalSignificancePrices",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context
        .collection("InternationalSignificancePrices")
        .insertOne(newData);
      return "success";
    },
    updateInternationalSignificancePriceTokenized: async (self, params, context) => {
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
        .collection("InternationalSignificancePrices")
        .findOne({
          _id: decryptedParams._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "InternationalSignificancePrices",
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
      await context.collection("InternationalSignificancePrices").updateOne(
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
    deleteInternationalSignificancePriceTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const { iat, Source, ...decryptedParams } = jwt.verify(params.tokenized, TOKENIZE);

      const found = await context
        .collection("InternationalSignificancePrices")
        .findOne({
          _id: decryptedParams._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "InternationalSignificancePrices",
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

      await context.collection("InternationalSignificancePrices").updateOne(
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
};
exports.resolvers = resolvers;
