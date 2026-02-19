const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const resolvers = {
  Query: {
    allActivities: async (self, params, context) => {
      return await context
        .collection("Activities")
        .find({ ...NOT_DELETED_DOCUMENT_QUERY })
        .sort({
          code: 1,
        })
        .toArray();
    },
  },
  Mutation: {
    createActivity: async (self, params, context) => {
      const newData = {
        _id: uuidv4(),
        ...params,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };
      await context.collection("Activities").insertOne(newData);
      return "success";
    },
    updateActivity: async (self, params, context) => {
      await context.collection("Activities").updateOne(
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
    deleteActivity: async (self, params, context) => {
      await context.collection("Activities").updateOne(
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
