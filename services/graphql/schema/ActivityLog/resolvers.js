const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const resolvers = {
  Query: {
    allActivityLogs: async (self, params, context) => {
      return await context
        .collection("allActivityLogs")
        .find({ ...NOT_DELETED_DOCUMENT_QUERY })
        .toArray();
    },
  },
};
exports.resolvers = resolvers;
