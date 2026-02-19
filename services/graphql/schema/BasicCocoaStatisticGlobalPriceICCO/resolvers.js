const dayjs = require("dayjs");
const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");

const resolvers = {
  Query: {
    allBasicCocoaStatisticGlobalPriceICCOs: async (self, params, context) => {
      const year = params.year || dayjs().format("YYYY-MM");

      const startDate = dayjs(year).startOf("month").format("YYYY-MM-DD");
      const endDate = dayjs(year).endOf("month").format("YYYY-MM-DD");

      return await context
        .collection("GlobalICCOPrices")
        .find({
          // date: params.date || dayjs().format("YYYY-MM-DD"),
          date: {
            $lte: endDate,
            $gte: startDate,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          date: -1,
          _createdAt: -1,
        })
        .toArray();
    },
    countBasicCocoaStatisticGlobalPriceICCOs: async (self, params, context) => {
      return await context
        .collection("GlobalICCOPrices")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .count();
    },
  },
  Mutation: {
    createBasicCocoaStatisticGlobalPriceICCO: async (self, params, context) => {
      assertValidSession(context.activeSession);
      const newData = {
        _id: uuidv4(),
        ...params,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
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
    updateBasicCocoaStatisticGlobalPriceICCO: async (self, params, context) => {
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
    deleteBasicCocoaStatisticGlobalPriceICCO: async (self, params, context) => {
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
  },
};
exports.resolvers = resolvers;
