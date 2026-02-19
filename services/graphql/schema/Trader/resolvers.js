const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const TOKENIZE = process.env.TOKENIZE;
const jwt = require("jsonwebtoken");
const resolvers = {
  Query: {
    allTraders: async (self, params, context) => {
      return await context
        .collection("Traders")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          name: 1,
        })
        .toArray();
    },
    allTradersTokenized: async (Self, params, context) => {
      let results = await context
        .collection("Traders")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          name: 1,
        })
        .toArray();

      const localState = await context.collection("States").find({
        _id: {
          $in: results.map((q) => q.stateId)
        },
        ...NOT_DELETED_DOCUMENT_QUERY
      }).toArray();

      const indexedState = localState.reduce((all, State) => {
        if (!all[State._id]) {
          all[State._id] = {};
        }
        all[State._id] = State
        return all;
      }, {});

      results = results.map((q) => {
        return {
          ...q,
          LocalState: indexedState[q.stateId] ? indexedState[q.stateId] : null
        }
      })

      const country = await context.collection("Countries").find({
        _id: {
          $in: results.map((q) => q.countryId)
        },
        ...NOT_DELETED_DOCUMENT_QUERY
      }).toArray();

      const indexedCountry = country.reduce((all, country) => {
        if (!all[country._id]) {
          all[country._id] = {};
        }
        all[country._id] = country
        return all;
      }, {});

      results = results.map((q) => {
        return {
          ...q,
          Country: indexedCountry[q.countryId] ? indexedCountry[q.countryId] : null
        }
      })

      const payload = {
        results,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    }
  },
  Mutation: {
    createTrader: async (self, params, context) => {
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
        affectedCollectionName: "Traders",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("Traders").insertOne(newData);
      return "success";
    },
    updateTrader: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context.collection("Traders").findOne({
        _id: params._id,
      });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "Traders",
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

      await context.collection("Traders").updateOne(
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
    deleteTrader: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context.collection("Traders").findOne({
        _id: params._id,
      });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "Traders",
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

      await context.collection("Traders").updateOne(
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
  Trader: {
    LocalState: async (self, params, context) => {
      return await context.collection("States").findOne({
        _id: self.stateId,
      });
    },
    Country: async (self, params, context) => {
      return await context.collection("Countries").findOne({
        _id: self.countryId,
      });
    },
  },
};
exports.resolvers = resolvers;
