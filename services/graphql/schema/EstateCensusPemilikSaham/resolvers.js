const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const resolvers = {
  Query: {
    allEstateCensusPemilikSaham: async (self, params, context) => {
      await context.collection("EstateCensusPemilikSaham").createIndex({
        estateInformationId: 1,
        censusYear: 1,
      });

      return await context
        .collection("EstateCensusPemilikSaham")
        .find({
          ...params,
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          censusYear: -1,
        })
        .toArray();
    },
  },
  Mutation: {
    createEstateCensusPemilikSaham: async (self, params, context) => {
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

      if (newData.estateId) {
        newData.estateId = "" + parseInt(newData.estateId);
      }
      const foundEstateInformation = await context
        .collection("EstateInformations")
        .findOne({
          estateId: newData.estateId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });
      if (!foundEstateInformation) {
        throw new Error("Estate Information Not Found");
      }

      if (newData.share === 0) {
        throw new Error("Share should not 0");
      }

      // const foundExisted = await context
      //   .collection("EstateCensusPemilikSaham")
      //   .findOne({
      //     estateId: newData.estateId,
      //     censusYear: newData.censusYear,
      //   });

      // if (foundExisted) {
      //   throw new Error("Dupliacte Estate ID & Census Year");
      // }
      newData["estateInformationId"] = foundEstateInformation._id;

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "EstateCensusPemilikSaham",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };

      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("EstateCensusPemilikSaham").insertOne(newData);
      return "ok";
    },
    updateEstateCensusPemilikSaham: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context
        .collection("EstateCensusPemilikSaham")
        .findOne({
          _id: params._id,
        });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "EstateCensusPemilikSaham",
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

      await context.collection("EstateCensusPemilikSaham").updateOne(
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
    deleteEstateCensusPemilikSaham: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context
        .collection("EstateCensusPemilikSaham")
        .findOne({
          _id: params._id,
        });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "EstateCensusPemilikSaham",
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

      await context.collection("EstateCensusPemilikSaham").updateOne(
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
  EstateCensusPemilikSaham: {
    estateId: self => {
      let PREFIX = "00000";
      const estateId = self.estateId.length;
      const res = PREFIX.slice(0, estateId * -1) + self.estateId;
      return res;
    },
  },
};
exports.resolvers = resolvers;
