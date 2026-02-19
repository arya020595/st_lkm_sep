const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");

const resolvers = {
  Query: {
    allTradeDataDomesticMissing: async (self, params, context) => {
      return await context
        .collection("MissingDomesticTradeData")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
          fixedDomesticTradeDataId: {
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
    updateMissingDomesticTradeData: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context
        .collection("MissingDomesticTradeData")
        .findOne({
          _id: params._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "MissingDomesticTradeData",
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

      await context.collection("MissingDomesticTradeData").updateOne(
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
    migrateToFixedDomesticTradeData: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context
        .collection("MissingDomesticTradeData")
        .findOne({
          _id: params._id,
        });

      const fixedData = {
        ...found,
        _id: uuidv4(),
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      const foundExisted = await context
        .collection("DomesticTradeDatas")
        .findOne({
          type: fixedData.type,
          year: fixedData.year,
          countryId: fixedData.countryId,
          localSITCProductId: fixedData.localSITCProductId,
          month: fixedData.month,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });

      if (foundExisted) {
        // console.log(foundExisted);
        throw new Error("Duplicate Type, Country, Year, Month, and SITC");
      }

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "DomesticTradeDatas",
        affectedDocumentId: fixedData._id,
        dataBeforeChanges: fixedData,
        dataAfterChanges: fixedData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      //Save to Domestic Trade Data
      await context.collection("DomesticTradeDatas").insertOne(fixedData);

      //Update Missng Table
      const payloadMissing = {
        _id: uuidv4(),
        affectedCollectionName: "MissingDomesticTradeData",
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

      await context.collection("MissingDomesticTradeData").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            fixedDomesticTradeDataId: fixedData._id,
            _updatedAt: new Date().toISOString(),
          },
        },
      );
      return "ok";
    },
  },
  TradeDataDomesticMissing: {
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
    LocalSITCProduct: async (self, params, context) => {
      return await context.collection("LocalSITCProducts").findOne({
        _id: self.localSITCProductId,
      });
    },
    InfoStatus: async (self, params, context) => {
      return await context.collection("InfoStatuses").findOne({
        _id: self.infoStatusId,
      });
    },
  },
};
exports.resolvers = resolvers;
