const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const TOKENIZE = process.env.TOKENIZE;

const resolvers = {
  Query: {
    allLocalRegion: async (self, params, context) => {
      return await context
        .collection("Regions")
        .find({ ...NOT_DELETED_DOCUMENT_QUERY })
        .sort({
          code: 1,
        })
        .toArray();
    },
    allLocalRegionTokenized: async (self, params, context) => {
      let results = await context
        .collection("Regions")
        .find({ ...NOT_DELETED_DOCUMENT_QUERY })
        .sort({
          code: 1,
        })
        .toArray();

      const states = await context
        .collection("States")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();

      const indexedStates = states.reduce((all, obj) => {
        if (!all[obj.regionId]) {
          all[obj.regionId] = [];
        }
        all[obj.regionId].push(obj);
        return all;
      }, {});

      results = results.map(res => {
        return {
          ...res,
          States: indexedStates[res._id] || [],
        };
      });

      const payload = {
        results,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
  },
  Mutation: {
    createLocalRegion: async (self, params, context) => {
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

      const foundExisted = await context.collection("Regions").findOne({
        code: newData.code,
        ...NOT_DELETED_DOCUMENT_QUERY,
      });

      if (foundExisted) {
        throw new Error("Duplicate Code");
      }

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "Regions",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);
      await context.collection("Regions").insertOne(newData);
      return "success";
    },
    updateLocalRegion: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context.collection("Regions").findOne({
        _id: params._id,
      });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "Regions",
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

      await context.collection("Regions").updateOne(
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
    deleteLocalRegion: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context.collection("Regions").findOne({
        _id: params._id,
      });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "Regions",
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

      await context.collection("Regions").updateOne(
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
  LocalRegion: {
    States: async (self, params, context) => {
      return await context
        .collection("States")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
          regionId: self._id,
        })
        .toArray();
    },
  },
};
exports.resolvers = resolvers;
