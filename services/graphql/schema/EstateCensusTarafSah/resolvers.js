const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const resolvers = {
  Query: {
    allTarafSah: async (self, params, context) => {
      await context.collection("EstateCensusTarafSah").createIndex({
        estateId: 1,
        censusYear: 1,
      });

      return await context
        .collection("EstateCensusTarafSah")
        .find({
          ...params,
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();
    },
  },
  Mutation: {
    createTarafSah: async (self, params, context) => {
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

      const foundEstateInformation = await context
        .collection("EstateInformations")
        .findOne({
          estateId: newData.estateId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });
      if (!foundEstateInformation) {
        throw new Error("Estate Information Not Found");
      }

      const foundExisted = await context
        .collection("EstateCensusTarafSah")
        .findOne({
          estateId: newData.estateId,
          censusYear: newData.censusYear,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });

      if (foundExisted) {
        throw new Error("Dupliacte Estate ID & Census Year");
      }
      newData["estateInformationId"] = foundEstateInformation._id;
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "EstateCensusTarafSah",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };

      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("EstateCensusTarafSah").insertOne(newData);
      return "ok";
    },
    updateTarafSah: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context.collection("EstateCensusTarafSah").findOne({
        _id: params._id,
      });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "EstateCensusTarafSah",
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

      await context.collection("EstateCensusTarafSah").updateOne(
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
      return "ok";
    },
    deleteTarafSah: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context.collection("EstateCensusTarafSah").findOne({
        _id: params._id,
      });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "EstateCensusTarafSah",
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
      await context.collection("EstateCensusTarafSah").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            _deletedAt: new Date().toISOString(),
          },
        },
      );
      return "ok";
    },
  },
  EstateCensusTarafSah: {
    estateId: self => {
      let PREFIX = "00000";
      const estateId = self.estateId.length;
      const res = PREFIX.slice(0, estateId * -1) + self.estateId;
      return res;
    },
  },
};
exports.resolvers = resolvers;
