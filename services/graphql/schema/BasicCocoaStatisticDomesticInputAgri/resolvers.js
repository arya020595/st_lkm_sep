const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const dayjs = require("dayjs");
const { assertValidSession } = require("../../authentication");

const resolvers = {
  Query: {
    allBasicCocoaStatisticDomesticInputAgries: async (
      self,
      params,
      context,
    ) => {
      await context
        .collection("BasicCocoaStatisticDomesticInputAgries")
        .createIndex({
          year: -1,
        });

      // const year = parseInt(params.year || dayjs().format("YYYY"));
      return await context
        .collection("BasicCocoaStatisticDomesticInputAgries")
        .find({
          // year,
          year: params.years
            ? {
                $in: params.years.map(year => parseInt(year)),
              }
            : parseInt(params.year || dayjs().format("YYYY")),
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          year: -1,
        })
        .toArray();
    },
    countBasicCocoaStatisticDomesticInputAgries: async (
      self,
      params,
      context,
    ) => {
      return await context
        .collection("BasicCocoaStatisticDomesticInputAgries")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .count();
    },
  },
  Mutation: {
    createBasicCocoaStatisticDomesticInputAgri: async (
      self,
      params,
      context,
    ) => {
      assertValidSession(context.activeSession);
      let newData = {
        _id: uuidv4(),
        ...params,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };
      if (newData.regionId) {
        const region = await context.collection("Regions").findOne({
          _id: newData.regionId,
        });
        newData.regionName = region.description;
      }
      if (newData.stateId) {
        const state = await context.collection("States").findOne({
          _id: newData.stateId,
        });
        newData.stateName = state.description;
      }
      if (newData.agriInputTypeId) {
        const agriInputType = await context
          .collection("AgriInputTypes")
          .findOne({
            _id: newData.agriInputTypeId,
          });
        newData.agriInputTypeName = agriInputType.description;
      }

      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "BasicCocoaStatisticDomesticInputAgries",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };

      await context.collection("ActivityLogs").insertOne(payload);

      await context
        .collection("BasicCocoaStatisticDomesticInputAgries")
        .insertOne(newData);
      return "success";
    },
    updateBasicCocoaStatisticDomesticInputAgri: async (
      self,
      params,
      context,
    ) => {
      assertValidSession(context.activeSession);

      let updateObject = {};
      if (params.regionId) {
        const region = await context.collection("Regions").findOne({
          _id: params.regionId,
        });
        updateObject.regionName = region.description;
      }
      if (params.stateId) {
        const state = await context.collection("States").findOne({
          _id: params.stateId,
        });
        updateObject.stateName = state.description;
      }
      if (params.agriInputTypeId) {
        const agriInputType = await context
          .collection("AgriInputTypes")
          .findOne({
            _id: params.agriInputTypeId,
          });
        updateObject.agriInputTypeName = agriInputType.description;
      }

      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context
        .collection("BasicCocoaStatisticDomesticInputAgries")
        .findOne({
          _id: params._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "BasicCocoaStatisticDomesticInputAgries",
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

      await context
        .collection("BasicCocoaStatisticDomesticInputAgries")
        .updateOne(
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
    deleteBasicCocoaStatisticDomesticInputAgri: async (
      self,
      params,
      context,
    ) => {
      assertValidSession(context.activeSession);

      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context
        .collection("BasicCocoaStatisticDomesticInputAgries")
        .findOne({
          _id: params._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "BasicCocoaStatisticDomesticInputAgries",
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
      await context
        .collection("BasicCocoaStatisticDomesticInputAgries")
        .updateOne(
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
  BasicCocoaStatisticDomesticInputAgri: {
    LocalRegion: async (self, params, context) => {
      return await context.collection("Regions").findOne({
        _id: self.regionId,
      });
    },
    LocalState: async (self, params, context) => {
      return await context.collection("States").findOne({
        _id: self.stateId,
      });
    },
    AgriInputType: async (self, params, context) => {
      return await context.collection("AgriInputTypes").findOne({
        _id: self.agriInputTypeId,
      });
    },
  },
};
exports.resolvers = resolvers;
