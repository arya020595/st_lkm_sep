const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");

const resolvers = {
  Query: {
    allLocalState: async (self, params, context) => {
      return await context
        .collection("States")
        .find({ ...NOT_DELETED_DOCUMENT_QUERY })
        .sort({
          _createdAt: -1,
        })
        .toArray();
    },
    allLocalStateByRegionId: async (self, params, context) => {
      return await context
        .collection("States")
        .find({ ...params, ...NOT_DELETED_DOCUMENT_QUERY })
        .sort({
          _createdAt: -1,
        })
        .toArray();
    },
  },
  Mutation: {
    createLocalState: async (self, params, context) => {
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

      const foundExisted = await context.collection("States ").findOne({
        code: newData.code,
        regionId: newData.regionId,
        ...NOT_DELETED_DOCUMENT_QUERY,
      });

      if (foundExisted) {
        throw new Error("Duplicate Code and Region");
      }

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "States",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("States").insertOne(newData);
      return "success";
    },
    updateLocalState: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context.collection("States").findOne({
        _id: params._id,
      });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "States",
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

      await context.collection("States").updateOne(
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
    deleteLocalState: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context.collection("States").findOne({
        _id: params._id,
      });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "States",
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

      await context.collection("States").updateOne(
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
  LocalState: {
    LocalRegion: async (self, params, context) => {
      return await context.collection("Regions").findOne({
        _id: self.regionId,
      });
    },
  },
};
exports.resolvers = resolvers;
