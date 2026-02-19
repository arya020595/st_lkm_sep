const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");

const resolvers = {
  Query: {
    allManufactures: async (self, params, context) => {
      return await context
        .collection("Manufacturers")
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
    createManufacture: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      let newData = {
        _id: uuidv4(),
        ...params,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      const foundExisted = await context.collection("Manufacturers").findOne({
        name: newData.name,
        stateId: newData.stateId,
        centreId: newData.centreId,
        ...NOT_DELETED_DOCUMENT_QUERY,
      });

      if (foundExisted) {
        throw new Error("Duplicate Name, State and Centre");
      }

      if (newData.stateId) {
        const state = await context.collection("States").findOne({
          _id: newData.stateId,
        });
        newData.stateName = state.description;
      }

      if (newData.countryId) {
        const country = await context.collection("Countries").findOne({
          _id: newData.countryId,
        });
        newData.countryName = country.name;
      }

      if (newData.centreId) {
        const centre = await context.collection("Centres").findOne({
          _id: newData.centreId,
        });
        newData.centreName = centre.description;
      }

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "Manufacturers",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("Manufacturers").insertOne(newData);
      return "success";
    },
    updateManufacture: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      let updateObject = {};
      if (params.stateId) {
        const state = await context.collection("States").findOne({
          _id: params.stateId,
        });
        updateObject.stateName = state.description;
      }

      if (params.countryId) {
        const country = await context.collection("Countries").findOne({
          _id: params.countryId,
        });
        updateObject.countryName = country.name;
      }

      if (params.centreId) {
        const centre = await context.collection("Centres").findOne({
          _id: params.centreId,
        });
        updateObject.centreName = centre.description;
      }

      const found = await context.collection("Manufacturers").findOne({
        _id: params._id,
      });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "Manufacturers",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          ...params,
          ...updateObject,
          _updatedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "UPDATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("Manufacturers").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            ...params,
            ...updateObject,
            _updatedAt: new Date().toISOString(),
          },
        },
      );
      return "success";
    },
    deleteManufacture: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context.collection("Manufacturers").findOne({
        _id: params._id,
      });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "Manufacturers",
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

      await context.collection("Manufacturers").updateOne(
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
  Manufacture: {
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
    Centre: async (self, params, context) => {
      return await context.collection("Centres").findOne({
        _id: self.centreId,
      });
    },
  },
};
exports.resolvers = resolvers;
