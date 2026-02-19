const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const dayjs = require("dayjs");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const TOKENIZE = process.env.TOKENIZE;

const resolvers = {
  Query: {
    getDomesticPriceByCentreTemporary: async (self, params, context) => {
      return await context
        .collection("DomesticCocoaPricesTemporary")
        .find({
          ...params,
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          date: 1,
        })
        .toArray();
    },
    getDomesticPriceByCentreTemporaryTokenized: async (
      self,
      params,
      context,
    ) => {
      let tokenized = {};
      if (params.tokenizedParamsQuery) {
        tokenized = jwt.verify(params.tokenizedParamsQuery, TOKENIZE);
      }
      const { iat, ...payloadParams } = tokenized;

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

      let results = await context
        .collection("DomesticCocoaPricesTemporary")
        .find({
          ...payloadParams,
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          date: 1,
        })
        .toArray();

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
    checkTemporaryPrice: async (self, params, context) => {
      const foundTemporaries = await context
        .collection("DomesticCocoaPricesTemporary")
        .find({
          transferToFixedPriceAt: {
            $exists: false,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();

      if (foundTemporaries.length > 0) {
        for (const temporary of foundTemporaries) {
          const newData = {
            ...temporary,
            _id: uuidv4(),
            transferFromTemporaryId: temporary._id,
          };
          //Transfer to Fixed DomesticCocoaPrices
          await context.collection("DomesticCocoaPrices").insertOne(newData);

          //Update
          await context.collection("DomesticCocoaPricesTemporary").updateOne(
            {
              _id: temporary._id,
            },
            {
              $set: {
                transferToFixedPriceAt: new Date().toISOString(),
                fixedPriceId: newData._id,
              },
            },
          );
        }
      }
      return "success";
    },
  },
  Mutation: {
    createDomesticCocoaPriceTemporary: async (self, params, context) => {
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

      const foundExisted = await context
        .collection("DomesticCocoaPricesTemporary")
        .findOne({
          buyerId: newData.buyerId,
          date: newData.date,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });

      if (foundExisted) {
        throw new Error("Duplicate Buyer..!");
      }

      const newPrice = {
        _id: uuidv4(),
        ...params,
        domesticPriceTemporaryId: newData._id,
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

      await context.collection("DomesticCocoaPrices").insertOne(newPrice);

      const payloadTemp = {
        _id: uuidv4(),
        affectedCollectionName: "DomesticCocoaPricesTemporary",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };

      await context.collection("ActivityLogs").insertOne(payloadTemp);

      await context
        .collection("DomesticCocoaPricesTemporary")
        .insertOne(newData);
      return "success";
    },
    updateDomesticCocoaPriceTemporary: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const foundTemporary = await context
        .collection("DomesticCocoaPricesTemporary")
        .findOne({
          _id: params._id,
        });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "DomesticCocoaPricesTemporary",
        affectedDocumentId: foundTemporary._id,
        dataBeforeChanges: foundTemporary,
        dataAfterChanges: {
          ...foundTemporary,
          ...params,
          _updatedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "UPDATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("DomesticCocoaPricesTemporary").updateOne(
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

      const foundPrice = await context
        .collection("DomesticCocoaPrices")
        .findOne({
          centreId: foundTemporary.centreId,
          buyerId: foundTemporary.buyerId,
          date: foundTemporary.date,
        });

      let { _id, ...p } = params;

      const payloadTemp = {
        _id: uuidv4(),
        affectedCollectionName: "DomesticCocoaPrices",
        affectedDocumentId: foundPrice._id,
        dataBeforeChanges: foundPrice,
        dataAfterChanges: {
          ...foundPrice,
          ...p,
          _updatedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "UPDATE",
      };
      await context.collection("ActivityLogs").insertOne(payloadTemp);

      await context.collection("DomesticCocoaPrices").updateOne(
        {
          _id: foundPrice._id,
        },
        {
          $set: {
            ...p,
            _updatedAt: new Date().toISOString(),
          },
        },
      );
      return "success";
    },
    deleteDomesticCocoaPriceTemporary: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const foundTemporary = await context
        .collection("DomesticCocoaPricesTemporary")
        .findOne({
          _id: params._id,
        });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "DomesticCocoaPricesTemporary",
        affectedDocumentId: foundTemporary._id,
        dataBeforeChanges: foundTemporary,
        dataAfterChanges: {
          ...foundTemporary,
          _deletedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "DELETE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("DomesticCocoaPricesTemporary").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            ...params,
            _deletedAt: new Date().toISOString(),
          },
        },
      );

      const foundPrice = await context
        .collection("DomesticCocoaPrices")
        .findOne({
          centreId: foundTemporary.centreId,
          buyerId: foundTemporary.buyerId,
          date: foundTemporary.date,
        });

      const payloadPrice = {
        _id: uuidv4(),
        affectedCollectionName: "DomesticCocoaPrices",
        affectedDocumentId: foundPrice._id,
        dataBeforeChanges: foundPrice,
        dataAfterChanges: {
          ...foundPrice,
          _deletedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "DELETE",
      };
      await context.collection("ActivityLogs").insertOne(payloadPrice);

      await context.collection("DomesticCocoaPrices").updateOne(
        {
          _id: foundPrice._id,
        },
        {
          $set: {
            _deletedAt: new Date().toISOString(),
          },
        },
      );

      return "success";
    },
    createDomesticCocoaPriceTemporaryTokenized: async (
      self,
      params,
      context,
    ) => {
      const tokenized = jwt.verify(params.tokenizedInput, TOKENIZE);

      const { iat, ...payload } = tokenized;

      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const newData = {
        _id: uuidv4(),
        ...payload,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      const foundExisted = await context
        .collection("DomesticCocoaPricesTemporary")
        .findOne({
          buyerId: newData.buyerId,
          date: newData.date,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });

      if (foundExisted) {
        throw new Error("Duplicate Buyer..!");
      }

      const newPrice = {
        _id: uuidv4(),
        ...payload,
        domesticPriceTemporaryId: newData._id,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("DomesticCocoaPrices").insertOne(newPrice);

      const payloadTemp = {
        _id: uuidv4(),
        affectedCollectionName: "DomesticCocoaPricesTemporary",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };

      await context.collection("ActivityLogs").insertOne(payloadTemp);

      await context
        .collection("DomesticCocoaPricesTemporary")
        .insertOne(newData);

      return "success";
    },
    updateDomesticCocoaPriceTemporaryTokenized: async (
      self,
      params,
      context,
    ) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const tokenized = jwt.verify(params.tokenizedInput, TOKENIZE);

      const { iat, ...tokenizedPayload } = tokenized;

      const foundTemporary = await context
        .collection("DomesticCocoaPricesTemporary")
        .findOne({
          _id: tokenizedPayload._id,
        });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "DomesticCocoaPricesTemporary",
        affectedDocumentId: foundTemporary._id,
        dataBeforeChanges: foundTemporary,
        dataAfterChanges: {
          ...foundTemporary,
          ...tokenizedPayload,
          _updatedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "UPDATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("DomesticCocoaPricesTemporary").updateOne(
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

      const foundPrice = await context
        .collection("DomesticCocoaPrices")
        .findOne({
          centreId: foundTemporary.centreId,
          buyerId: foundTemporary.buyerId,
          date: foundTemporary.date,
        });

      let { _id, ...p } = tokenizedPayload;

      const payloadTemp = {
        _id: uuidv4(),
        affectedCollectionName: "DomesticCocoaPrices",
        affectedDocumentId: foundPrice._id,
        dataBeforeChanges: foundPrice,
        dataAfterChanges: {
          ...foundPrice,
          ...p,
          _updatedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "UPDATE",
      };
      await context.collection("ActivityLogs").insertOne(payloadTemp);

      await context.collection("DomesticCocoaPrices").updateOne(
        {
          _id: foundPrice._id,
        },
        {
          $set: {
            ...p,
            _updatedAt: new Date().toISOString(),
          },
        },
      );

      return "success";
    },
    deleteDomesticCocoaPriceTemporaryTokenized: async (
      self,
      params,
      context,
    ) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const tokenized = jwt.verify(params.tokenizedInput, TOKENIZE);

      const { iat, ...tokenizedPayload } = tokenized;

      const foundTemporary = await context
        .collection("DomesticCocoaPricesTemporary")
        .findOne({
          _id: tokenizedPayload._id,
        });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "DomesticCocoaPricesTemporary",
        affectedDocumentId: foundTemporary._id,
        dataBeforeChanges: foundTemporary,
        dataAfterChanges: {
          ...foundTemporary,
          _deletedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "DELETE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("DomesticCocoaPricesTemporary").updateOne(
        {
          _id: tokenizedPayload._id,
        },
        {
          $set: {
            ...tokenizedPayload,
            _deletedAt: new Date().toISOString(),
          },
        },
      );

      const foundPrice = await context
        .collection("DomesticCocoaPrices")
        .findOne({
          centreId: foundTemporary.centreId,
          buyerId: foundTemporary.buyerId,
          date: foundTemporary.date,
        });

      const payloadPrice = {
        _id: uuidv4(),
        affectedCollectionName: "DomesticCocoaPrices",
        affectedDocumentId: foundPrice._id,
        dataBeforeChanges: foundPrice,
        dataAfterChanges: {
          ...foundPrice,
          _deletedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "DELETE",
      };
      await context.collection("ActivityLogs").insertOne(payloadPrice);

      await context.collection("DomesticCocoaPrices").updateOne(
        {
          _id: foundPrice._id,
        },
        {
          $set: {
            _deletedAt: new Date().toISOString(),
          },
        },
      );

      return "success";
    },
  },
  DomesticCocoaPriceTemporary: {
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
