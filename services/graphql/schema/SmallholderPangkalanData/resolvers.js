const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const parseJson = require("json-parse-even-better-errors");
const { assertValidSession } = require("../../authentication");
const resolvers = {
  Query: {
    sabahSmallholderPangkalanData: async (self, params, context) => {
      // console.log({ results, query });
      let query = {};
      if (params.filters) {
        try {
          let filters = parseJson(params.filters);
          // console.log({ filters });
          for (const filter of filters) {
            query[filter.id] = {
              $regex: filter.value,
              $options: "si",
            };
          }
        } catch (err) {
          console.warn(err);
        }
      }

      let results = await context
        .collection("V1SHMaster")
        .find({
          ...query,
          negeri: {
            $in: ["12"],
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          _createdAt: -1,
        })
        .skip(params.pageIndex || 0)
        .limit(params.pageSize || 10)
        .toArray();
      // console.log({ results, query });
      return results;
    },
    semenanjungSmallholderPangkalanData: async (self, params, context) => {
      // console.log({ results, query });
      let query = {};
      if (params.filters) {
        try {
          let filters = parseJson(params.filters);
          // console.log({ filters });
          for (const filter of filters) {
            query[filter.id] = {
              $regex: filter.value,
              $options: "si",
            };
          }
        } catch (err) {
          console.warn(err);
        }
      }

      let results = await context
        .collection("V1SHMaster")
        .find({
          ...query,
          negeri: {
            $in: [
              "1",
              "2",
              "3",
              "4",
              "5",
              "6",
              "7",
              "8",
              "9",
              "10",
              "11",
              "14",
            ],
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          _createdAt: -1,
        })
        .skip(params.pageIndex || 0)
        .limit(params.pageSize || 10)
        .toArray();
      // console.log({ results, query });
      return results;
    },
    sarawakSmallholderPangkalanData: async (self, params, context) => {
      // console.log({ results, query });
      let query = {};
      if (params.filters) {
        try {
          let filters = parseJson(params.filters);
          // console.log({ filters });
          for (const filter of filters) {
            query[filter.id] = {
              $regex: filter.value,
              $options: "si",
            };
          }
        } catch (err) {
          console.warn(err);
        }
      }

      let results = await context
        .collection("V1SHMaster")
        .find({
          ...query,
          negeri: { $in: ["13"] },
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          _createdAt: -1,
        })
        .skip(params.pageIndex || 0)
        .limit(params.pageSize || 10)
        .toArray();
      // console.log({ results, query });
      return results;
    },
    countSabahSmallholderPangkalanData: async (self, params, context) => {
      return await context
        .collection("V1SHMaster")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
          negeri: "12",
        })
        // .sort({
        //   _createdAt: -1,
        // })
        // .limit(100)
        // .toArray();
        .count();
    },
    countSemenanjungSmallholderPangkalanData: async (self, params, context) => {
      return await context
        .collection("V1SHMaster")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
          negeri: {
            $in: [
              "1",
              "2",
              "3",
              "4",
              "5",
              "6",
              "7",
              "8",
              "9",
              "10",
              "11",
              "14",
            ],
          },
        })
        // .sort({
        //   _createdAt: -1,
        // })
        // .limit(100)
        // .toArray();
        .count();
    },
    countSarawakSmallholderPangkalanData: async (self, params, context) => {
      return await context
        .collection("V1SHMaster")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
          negeri: "13",
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
    createSmallholderPangkalanData: async (self, params, context) => {
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
        affectedCollectionName: "V1SHMaster",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("V1SHMaster").insertOne(newData);
      return "success";
    },
    updateSmallholderPangkalanData: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context.collection("V1SHMaster").findOne({
        _id: params._id,
      });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "V1SHMaster",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          ...params.input,
          _updatedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "UPDATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);
      await context.collection("V1SHMaster").updateOne(
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
    deleteSmallholderPangkalanData: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context.collection("V1SHMaster").findOne({
        _id: params._id,
      });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "V1SHMaster",
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

      await context.collection("V1SHMaster").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            ...params,
            _deletedAt: new Date().toISOString(),
          },
        },
      );
      return "success";
    },
  },
};
exports.resolvers = resolvers;
