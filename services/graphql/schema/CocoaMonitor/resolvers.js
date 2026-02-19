const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const parseJson = require("json-parse-even-better-errors");
const dayjs = require("dayjs");
const resolvers = {
  Query: {
    allCocoaMonitor: async (self, params, context) => {
      let results = await context
        .collection("CocoaMonitors")
        .find({
          censusYear: params.years
            ? {
                $in: params.years.map(year => parseInt(year)),
              }
            : parseInt(params.year || dayjs().format("YYYY")),
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          censusYear: -1,
        })
        .toArray();

      return results;
    },
    countCocoaMonitor: async (self, params, context) => {
      return await context
        .collection("CocoaMonitors")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        // .sort({
        //   _createdAt: -1,
        // })
        // .limit(100)
        // .toArray();
        .count();
    },
  },
  Mutation: {
    createCocoaMonitor: async (self, params, context) => {
      assertValidSession(context.activeSession);

      const newData = {
        _id: uuidv4(),
        ...params,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      const foundExisted = await context.collection("CocoaMonitors").findOne({
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
        affectedCollectionName: "CocoaMonitors",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };

      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("CocoaMonitors").insertOne(newData);
      return "success";
    },
    updateCocoaMonitor: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context.collection("CocoaMonitors").findOne({
        _id: params._id,
      });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "CocoaMonitors",
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

      await context.collection("CocoaMonitors").updateOne(
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
    deleteCocoaMonitor: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context.collection("CocoaMonitors").findOne({
        _id: params._id,
      });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "CocoaMonitors",
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

      await context.collection("CocoaMonitors").updateOne(
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
