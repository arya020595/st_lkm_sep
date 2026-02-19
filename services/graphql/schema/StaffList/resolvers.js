const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const resolvers = {
  Query: {
    allStaffList: async (self, params, context) => {
      return await context
        .collection("StaffLists")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          name: 1,
        })
        .toArray();
    },
  },
  Mutation: {
    searchStaffWithOrOperator: async (self, params, context) => {
      let filter = params.criteria.reduce((all, c) => {
        // console.log("C => ", c.key);
        if (!c.keyword) {
          // all = [];
        } else {
          all[c.key] = {
            $regex: c.keyword,
            $options: "i",
          };
        }

        return all;
      }, {});

      console.log(filter);

      const results = await context
        .collection("StaffLists")
        .find({
          ...filter,
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .limit(params.limit ? params.limit : 0)
        .toArray();
      return results;
    },
  },
};
exports.resolvers = resolvers;
