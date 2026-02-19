const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const resolvers = {
  Query: {
    allTradeDataGlobalMissing: async (self, params, context) => {
      return await context
        .collection("MissingGlobalTradeData")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
          fixedGlobalTradeDataId: {
            $exists: false,
          },
        })
        .sort({
          _createdAt: -1,
        })
        .toArray();
    },
  },
  Mutation: {
    updateMissingGlobalTradeData: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context.collection("MissingGlobalTradeData").findOne({
        _id: params._id,
      });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "MissingGlobalTradeData",
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

      await context.collection("MissingGlobalTradeData").updateOne(
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
      return "ok";
    },
    migrateToFixedGlobalTradeData: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context.collection("MissingGlobalTradeData").findOne({
        _id: params._id,
      });

      const fixedData = {
        ...found,
        _id: uuidv4(),
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      const foundExisted = await context
        .collection("GlobalTradeDatas")
        .findOne({
          type: fixedData.type,
          year: fixedData.year,
          countryId: fixedData.countryId,
          globalSITCProductId: fixedData.globalSITCProductId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });

      if (foundExisted) {
        throw new Error("Duplicate Type, Year, Country, Global SITC Product");
      }

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalTradeDatas",
        affectedDocumentId: fixedData._id,
        dataBeforeChanges: fixedData,
        dataAfterChanges: fixedData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      //Save to Global Trade Data
      await context.collection("GlobalTradeDatas").insertOne(fixedData);

      //Update Missng Table
      const payloadMissing = {
        _id: uuidv4(),
        affectedCollectionName: "MissingGlobalTradeData",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          fixedDomesticTradeDataId: fixedData._id,
          _updatedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "UPDATE",
      };
      await context.collection("ActivityLogs").insertOne(payloadMissing);

      await context.collection("MissingGlobalTradeData").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            fixedGlobalTradeDataId: fixedData._id,
            _updatedAt: new Date().toISOString(),
          },
        },
      );
      return "ok";
    },
  },
  TradeDataGlobalMissing: {
    attachmentFileUrl: self => {
      if (self.attachmentFileUrl) {
        const fileUrl = self.attachmentFileUrl.split("/public");
        return fileUrl[1];
      }
      return "";
    },
    Country: async (self, params, context) => {
      return await context.collection("Countries").findOne({
        _id: self.countryId,
      });
    },
    GlobalSITCProduct: async (self, params, context) => {
      return await context.collection("GlobalSITCProducts").findOne({
        _id: self.globalSITCProductId,
      });
    },
  },
};
exports.resolvers = resolvers;
