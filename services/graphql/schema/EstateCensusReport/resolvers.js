const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const resolvers = {
  Query: {
    allEstateCensuses: async (self, params, context) => {
      return await context
        .collection("EstateCensuseses")
        .find({ ...NOT_DELETED_DOCUMENT_QUERY })
        .toArray();
    },
  },
  Mutation: {
    createEstateCensus: async (self, params, context) => {
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
        affectedCollectionName: "EstateCensuseses",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };

      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("EstateCensuseses").insertOne(newData);
      return "success";
    },
    updateEstateCensus: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context.collection("EstateCensuseses").findOne({
        _id: params._id,
      });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "EstateCensuseses",
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

      await context.collection("EstateCensuseses").updateOne(
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
    deleteEstateCensus: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context.collection("EstateCensuseses").findOne({
        _id: params._id,
      });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "EstateCensuseses",
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

      await context.collection("EstateCensuseses").updateOne(
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
  EstateCensus: {
    LocalRegion: async (self, params, context) => {
      return await context.collection("Regions").findOne({
        _id: self.regionId,
      });
    },
    Country: async (self, params, context) => {
      return await context.collection("Countries").findOne({
        _id: self.countryId,
      });
    },
    PositionType: async (self, params, context) => {
      return await context.collection("PositionTypes").findOne({
        _id: self.positionTypeId,
      });
    },
  },
};
exports.resolvers = resolvers;
