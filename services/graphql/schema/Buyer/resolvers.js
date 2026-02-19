const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const TOKENIZE = process.env.TOKENIZE;

const resolvers = {
  Query: {
    allBuyers: async (self, params, context) => {
      return await context
        .collection("Buyers")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();
    },
    allBuyersByCentreId: async (self, params, context) => {
      if (!params.centreId) return [];
      return await context
        .collection("Buyers")
        .find({
          centreId: params.centreId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();
    },
    allBuyersByCentreIdTokenized: async (self, params, context) => {
      let tokenized = {};
      if (params.tokenizedParams) {
        tokenized = jwt.verify(params.tokenizedParams, TOKENIZE);
      }
      const { iat, ...payloadParams } = tokenized;

      let results = await context
        .collection("Buyers")
        .find({
          ...payloadParams,
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();

      const payload = {
        results,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
  },
  Mutation: {
    createBuyer: async (self, params, context) => {
      assertValidSession(context.activeSession);

      const newData = {
        _id: uuidv4(),
        ...params,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      const foundExisted = await context.collection("Buyers").findOne({
        code: newData.code,
        ...NOT_DELETED_DOCUMENT_QUERY,
      });

      if (foundExisted) {
        throw new Error("Duplicate Code");
      }

      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "Buyers",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };

      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("Buyers").insertOne(newData);
      return "success";
    },
    updateBuyer: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context.collection("Buyers").findOne({
        _id: params._id,
      });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "Buyers",
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

      await context.collection("Buyers").updateOne(
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
  },

  Buyer: {
    Centre: async (self, params, context) => {
      return await context.collection("Centres").findOne({
        _id: self.centreId,
      });
    },
  },
};
exports.resolvers = resolvers;
