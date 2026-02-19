const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const resolvers = {
  Query: {
    allEstateCensusSeller: async (self, params, context) => {
      await context.collection("EstateCensusSellers").createIndex({
        estateInformationId: 1,
        censusYear: 1,
      });

      return await context
        .collection("EstateCensusSellers")
        .find({
          ...params,
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();
    },
    estateCensusSellerLatestRecordId: async (self, params, context) => {
      const latest = await context
        .collection("EstateCensusSellers")
        .find({})
        .count();

      return "" + latest + 1;
    },
  },
  Mutation: {
    createEstateCensusSeller: async (self, params, context) => {
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
        .collection("EstateCensusSellers")
        .findOne({
          estateId: newData.estateId,
          censusYear: newData.censusYear,
        });

      if (foundExisted) {
        throw new Error("Dupliacte Estate ID & Census Year");
      }
      newData["estateInformationId"] = foundEstateInformation._id;

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "EstateCensusSellers",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };

      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("EstateCensusSellers").insertOne(newData);
      return "ok";
    },
    updateEstateCensusSeller: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context.collection("EstateCensusSellers").findOne({
        _id: params._id,
      });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "EstateCensusSellers",
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

      await context.collection("EstateCensusSellers").updateOne(
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
    deleteEstateCensusSeller: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context.collection("EstateCensusSellers").findOne({
        _id: params._id,
      });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "EstateCensusSellers",
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
      await context.collection("EstateCensusSellers").updateOne(
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
  EstateCensusSeller: {
    estateId: self => {
      let PREFIX = "00000";
      const estateId = self.estateId.length;
      const res = PREFIX.slice(0, estateId * -1) + self.estateId;
      return res;
    },
  },
};
exports.resolvers = resolvers;
