const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const resolvers = {
  Query: {
    allEstateCensusEstateStatus: async (self, params, context) => {
      return await context
        .collection("EstateStatuses")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();
    },
  },
};
exports.resolvers = resolvers;
