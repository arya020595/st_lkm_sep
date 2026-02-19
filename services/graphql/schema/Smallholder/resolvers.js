const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const parseJson = require("json-parse-even-better-errors");
const { assertValidSession } = require("../../authentication");

const resolvers = {
  Query: {
    smallholderById: async (self, params, context) => {
      let results = await context.collection("Smallholders").findOne({
        _id: params._id,
        ...NOT_DELETED_DOCUMENT_QUERY,
      });
      // console.log({ results, query });
      return results;
    },
    allSmallholders: async (self, params, context) => {
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
        .collection("Smallholders")
        .find({
          ...query,
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
    countSmallholders: async (self, params, context) => {
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

      return await context
        .collection("Smallholders")
        .find({
          ...query,
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
    createSmallholder: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const newData = {
        _id: uuidv4(),
        ...params,
        typeOfSmallholder: "UNREGISTERED",
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "Smallholders",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("Smallholders").insertOne(newData);
      return "success";
    },
    updateSmallholder: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context.collection("Smallholders").findOne({
        _id: params._id,
      });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "Smallholders",
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

      await context.collection("Smallholders").updateOne(
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
    deleteSmallholder: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context.collection("Smallholders").findOne({
        _id: params._id,
      });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "Smallholders",
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

      await context.collection("Smallholders").updateOne(
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
  Smallholder: {
    typeOfSmallholder: self => {
      if (self.typeOfSmallholder) {
        var newString = self.typeOfSmallholder
          .toLowerCase()
          .replace(/(^\s*\w|[\.\!\?]\s*\w)/g, function (c) {
            return c.toUpperCase();
          });
        return newString;
      }
    },
    educationStatus: self => {
      if (typeof self.educationStatus === "object") {
        return "-";
      }
    },
    telephoneNo: self => {
      if (typeof self.telephoneNo === "object") {
        return "-";
      }
    },
    maritalStatus: self => {
      if (typeof self.maritalStatus === "object") {
        return "-";
      }
    },
    LocalState: async (self, params, context) => {
      return await context.collection("States").findOne({
        _id: self.stateId,
      });
    },
    totalDependants: self => {
      if (self.totalDependants) {
        if (isNaN(self.totalDependants)) {
          return -1;
        }
        return self.totalDependants;
      }
      return 0;
    },
    maleFamilyWorker: self => {
      if (self.maleFamilyWorker) {
        if (isNaN(self.maleFamilyWorker)) {
          return -1;
        }
        return self.maleFamilyWorker;
      }
      return 0;
    },
    femaleFamilyWorker: self => {
      if (self.femaleFamilyWorker) {
        if (isNaN(self.femaleFamilyWorker)) {
          return -1;
        }
        return self.femaleFamilyWorker;
      }
      return 0;
    },
    isActive: self => {
      if (self.isActive) {
        if (isNaN(self.isActive)) {
          return -99;
        }
        return self.isActive;
      }
      return 0;
    },
  },
};
exports.resolvers = resolvers;
