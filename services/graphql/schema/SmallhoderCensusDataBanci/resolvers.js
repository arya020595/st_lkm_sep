const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const GraphQLJSON = require("graphql-type-json");

const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    allSmallholderCensusDataBanci: async (self, params, context) => {
      assertValidSession(context.activeSession);
      let collectionName = "";
      if (params.banciId === "15") {
        collectionName = "V1SbhDataBanci15new";
      } else if (params.banciId === "16") {
        collectionName = "V1SwkDataBanci16New";
      } else if (params.banciId === "17") {
        collectionName = "V1SmjDataBanci17";
      }

      const result = await context
        .collection(collectionName)
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();
      console.log("result", result.length);
      return result;
    },
  },
  Mutation: {
    createSmallholderCensusDataBanci: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const newData = {
        _id: uuidv4(),
        ...params.inputJSON,
        createByEmployeeId: context.activeSession.User.employeeId,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      if (newData.banciId === "15") {
        const payload = {
          _id: uuidv4(),
          affectedCollectionName: "V1SbhDataBanci15new",
          affectedDocumentId: newData._id,
          dataBeforeChanges: newData,
          dataAfterChanges: newData,
          modifiedBy: context.activeSession.User,
          timeStamp: new Date().toISOString(),
          action: "CREATE",
        };
        await context.collection("ActivityLogs").insertOne(payload);

        await context.collection("V1SbhDataBanci15new").insertOne(newData);
      } else if (newData.banciId === "16") {
        const payload = {
          _id: uuidv4(),
          affectedCollectionName: "V1SwkDataBanci16New",
          affectedDocumentId: newData._id,
          dataBeforeChanges: newData,
          dataAfterChanges: newData,
          modifiedBy: context.activeSession.User,
          timeStamp: new Date().toISOString(),
          action: "CREATE",
        };
        await context.collection("ActivityLogs").insertOne(payload);

        await context.collection("V1SwkDataBanci16New").insertOne(newData);
      } else if (newData.banciId === "17") {
        const payload = {
          _id: uuidv4(),
          affectedCollectionName: "V1SmjDataBanci17",
          affectedDocumentId: newData._id,
          dataBeforeChanges: newData,
          dataAfterChanges: newData,
          modifiedBy: context.activeSession.User,
          timeStamp: new Date().toISOString(),
          action: "CREATE",
        };

        await context.collection("ActivityLogs").insertOne(payload);
        await context.collection("V1SmjDataBanci17").insertOne(newData);
      }

      return "success";
    },
    updateSmallholderCensusDataBanci: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      if (params.inputJSON.banciId === "15") {
        const found = await context.collection("V1SbhDataBanci15new").findOne({
          _id: params._id,
        });
        const payload = {
          _id: uuidv4(),
          affectedCollectionName: "V1SbhDataBanci15new",
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

        await context.collection("V1SbhDataBanci15new").updateOne(
          {
            _id: params.inputJSON._id,
          },
          {
            $set: {
              ...params.inputJSON,
              _updatedAt: new Date().toISOString(),
            },
          },
        );
      } else if (params.inputJSON.banciId === "16") {
        const found = await context.collection("V1SwkDataBanci16New").findOne({
          _id: params._id,
        });
        const payload = {
          _id: uuidv4(),
          affectedCollectionName: "V1SwkDataBanci16New",
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

        await context.collection("V1SwkDataBanci16New").updateOne(
          {
            _id: params.inputJSON._id,
          },
          {
            $set: {
              ...params.inputJSON,
              _updatedAt: new Date().toISOString(),
            },
          },
        );
      } else if (params.inputJSON.banciId === "17") {
        const found = await context.collection("V1SmjDataBanci17").findOne({
          _id: params._id,
        });
        const payload = {
          _id: uuidv4(),
          affectedCollectionName: "V1SmjDataBanci17",
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

        await context.collection("V1SmjDataBanci17").updateOne(
          {
            _id: params.inputJSON._id,
          },
          {
            $set: {
              ...params.inputJSON,
              _updatedAt: new Date().toISOString(),
            },
          },
        );
      }
      return "success";
    },
    deleteSmallholderCensusDataBanci: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      if (params.banciId === "15") {
        const found = await context.collection("V1SbhDataBanci15new").findOne({
          _id: params._id,
        });
        const payload = {
          _id: uuidv4(),
          affectedCollectionName: "V1SbhDataBanci15new",
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

        await context.collection("V1SbhDataBanci15new").updateOne(
          {
            _id: params._id,
          },
          {
            $set: {
              _deletedAt: new Date().toISOString(),
            },
          },
        );
      } else if (params.banciId === "16") {
        const found = await context.collection("V1SwkDataBanci16New").findOne({
          _id: params._id,
        });
        const payload = {
          _id: uuidv4(),
          affectedCollectionName: "V1SwkDataBanci16New",
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

        await context.collection("V1SwkDataBanci16New").updateOne(
          {
            _id: params._id,
          },
          {
            $set: {
              _deletedAt: new Date().toISOString(),
            },
          },
        );
      } else if (params.banciId === "17") {
        const found = await context.collection("V1SmjDataBanci17").findOne({
          _id: params._id,
        });
        const payload = {
          _id: uuidv4(),
          affectedCollectionName: "V1SmjDataBanci17",
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

        await context.collection("V1SmjDataBanci17").updateOne(
          {
            _id: params._id,
          },
          {
            $set: {
              _deletedAt: new Date().toISOString(),
            },
          },
        );
      }
      return "success";
    },
  },
};
exports.resolvers = resolvers;
