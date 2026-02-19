const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");

const resolvers = {
  Query: {
    allWorkerType: async (self, params, context) => {
      return await context
        .collection("RefWorkerType")
        .find({ ...NOT_DELETED_DOCUMENT_QUERY })
        .sort({
          code: 1,
        })
        .toArray();
    },
  },
  Mutation: {
    createWorkerType: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const newData = {
        _id: uuidv4(),
        ...params.input,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "RefWorkerType",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);
      await context.collection("RefWorkerType").insertOne(newData);
      return "success";
    },
    updateWorkerType: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context.collection("RefWorkerType").findOne({
        _id: params._id,
      });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "RefWorkerType",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          ...params,
          fileUrl: saveFileDir + "/" + filename,
          mimeType,
          _updatedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "UPDATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("RefWorkerType").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            ...params.input,
            _updatedAt: new Date().toISOString(),
          },
        },
      );
      return "success";
    },
    deleteWorkerType: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context.collection("RefWorkerType").findOne({
        _id: params._id,
      });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "RefWorkerType",
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

      await context.collection("RefWorkerType").updateOne(
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
