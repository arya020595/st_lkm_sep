const dayjs = require("dayjs");
const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const TOKENIZE = process.env.TOKENIZE;

const resolvers = {
  Query: {
    allBasicCocoaStatisticCultivatedAreas: async (self, params, context) => {
      await context
        .collection("BasicCocoaStatisticDomesticCultivatedAreas")
        .createIndex({
          year: -1,
        });

      return await context
        .collection("BasicCocoaStatisticDomesticCultivatedAreas")
        .find({
          year: params.years
            ? {
                $in: params.years.map(year => parseInt(year)),
              }
            : parseInt(params.year || dayjs().format("YYYY")),
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          year: -1,
          _createdAt: -1,
        })
        .toArray();
    },
    allBasicCocoaStatisticCultivatedAreasTokenized: async (
      self,
      params,
      context,
    ) => {
      await context
        .collection("BasicCocoaStatisticDomesticCultivatedAreas")
        .createIndex({
          year: -1,
        });

      let results = await context
        .collection("BasicCocoaStatisticDomesticCultivatedAreas")
        .find({
          year: params.years
            ? {
                $in: params.years.map(year => parseInt(year)),
              }
            : parseInt(params.year || dayjs().format("YYYY")),
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          year: -1,
          _createdAt: -1,
        })
        .toArray();

      const regions = await context
        .collection("Regions")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();
      const indexedRegion = regions.reduce((all, obj) => {
        if (!obj._id) {
          all[obj._id] = {};
        }
        all[obj._id] = obj;
        return all;
      }, {});

      const states = await context
        .collection("States")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();
      const indexedState = states.reduce((all, obj) => {
        if (!obj._id) {
          all[obj._id] = {};
        }
        all[obj._id] = obj;
        return all;
      }, {});

      const infoStatus = await context
        .collection("InfoStatuses")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();
      const indexedInfoStatus = infoStatus.reduce((all, obj) => {
        if (!obj._id) {
          all[obj._id] = {};
        }
        all[obj._id] = obj;
        return all;
      }, {});

      results = results.map(res => {
        return {
          ...res,
          LocalRegion: indexedRegion[res.regionId]
            ? indexedRegion[res.regionId]
            : null,
          LocalState: indexedState[res.stateId]
            ? indexedState[res.stateId]
            : null,
          InfoStatus: indexedInfoStatus[res.infoStatusId]
            ? indexedInfoStatus[res.infoStatusId]
            : null,
        };
      });

      const payload = {
        results,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
    countBasicCocoaStatisticCultivatedAreas: async (self, params, context) => {
      return await context
        .collection("BasicCocoaStatisticDomesticCultivatedAreas")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .count();
    },
    getBCSMaturedEstateArea: async (self, params, context) => {
      const { year, regionId, stateId } = params;
      const found = await context
        .collection("BasicCocoaStatisticDomesticCultivatedAreas")
        .find({
          year: parseInt(year || dayjs().format("YYYY")),
          regionId,
          stateId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          _createdAt: -1,
        })
        .toArray();

      if (found.length > 0) {
        if (found[0].estateMaturedArea) {
          return found[0].estateMaturedArea;
        }
      }
      return 0;
    },
    getBCSMaturedSmallholderArea: async (self, params, context) => {
      const { year, regionId, stateId } = params;
      const found = await context
        .collection("BasicCocoaStatisticDomesticCultivatedAreas")
        .find({
          year: parseInt(year || dayjs().format("YYYY")),
          regionId,
          stateId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          _createdAt: -1,
        })
        .toArray();

      if (found.length > 0) {
        if (found[0].maturedArea) {
          return found[0].maturedArea;
        }
      }
      return 0;
    },
  },
  Mutation: {
    createBasicCocoaStatisticCultivatedArea: async (self, params, context) => {
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
      if (newData.infoStatusId) {
        const infoStatus = await context.collection("InfoStatuses").findOne({
          _id: newData.infoStatusId,
        });
        newData.infoStatusName = infoStatus.description;
      }

      const foundExisted = await context
        .collection("BasicCocoaStatisticDomesticCultivatedAreas")
        .findOne({
          year: newData.year,
          regionId: newData.regionId,
          stateId: newData.stateId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });

      if (foundExisted) {
        throw new Error(`Duplicate Year, Region, and State`);
      }

      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "BasicCocoaStatisticDomesticCultivatedAreas",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };

      await context.collection("ActivityLogs").insertOne(payload);

      await context
        .collection("BasicCocoaStatisticDomesticCultivatedAreas")
        .insertOne(newData);
      return "success";
    },
    updateBasicCocoaStatisticCultivatedArea: async (self, params, context) => {
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
      if (params.infoStatusId) {
        const infoStatus = await context.collection("InfoStatuses").findOne({
          _id: params.infoStatusId,
        });
        updateObject.infoStatusName = infoStatus.description;
      }

      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context
        .collection("BasicCocoaStatisticDomesticCultivatedAreas")
        .findOne({
          _id: params._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "BasicCocoaStatisticDomesticCultivatedAreas",
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
        .collection("BasicCocoaStatisticDomesticCultivatedAreas")
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
    deleteBasicCocoaStatisticCultivatedArea: async (self, params, context) => {
      assertValidSession(context.activeSession);

      const found = await context
        .collection("BasicCocoaStatisticDomesticCultivatedAreas")
        .findOne({
          _id: params._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "BasicCocoaStatisticDomesticCultivatedAreas",
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
        .collection("BasicCocoaStatisticDomesticCultivatedAreas")
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

    createBasicCocoaStatisticCultivatedAreaTokenized: async (
      self,
      params,
      context,
    ) => {
      assertValidSession(context.activeSession);
      const tokenized = jwt.verify(params.tokenizedInput, TOKENIZE);

      const { iat, ...payloadTokenized } = tokenized;

      let newData = {
        _id: uuidv4(),
        ...payloadTokenized,
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
      if (newData.infoStatusId) {
        const infoStatus = await context.collection("InfoStatuses").findOne({
          _id: newData.infoStatusId,
        });
        newData.infoStatusName = infoStatus.description;
      }

      const foundExisted = await context
        .collection("BasicCocoaStatisticDomesticCultivatedAreas")
        .findOne({
          year: newData.year,
          regionId: newData.regionId,
          stateId: newData.stateId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });

      if (foundExisted) {
        throw new Error(`Duplicate Year, Region, and State`);
      }

      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "BasicCocoaStatisticDomesticCultivatedAreas",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };

      await context.collection("ActivityLogs").insertOne(payload);

      await context
        .collection("BasicCocoaStatisticDomesticCultivatedAreas")
        .insertOne(newData);
      return "success";
    },
    updateBasicCocoaStatisticCultivatedAreaTokenized: async (
      self,
      params,
      context,
    ) => {
      assertValidSession(context.activeSession);
      const tokenized = jwt.verify(params.tokenizedInput, TOKENIZE);

      const { iat, ...payloadTokenized } = tokenized;

      let updateObject = {};
      if (payloadTokenized.regionId) {
        const region = await context.collection("Regions").findOne({
          _id: payloadTokenized.regionId,
        });
        updateObject.regionName = region.description;
      }
      if (payloadTokenized.stateId) {
        const state = await context.collection("States").findOne({
          _id: payloadTokenized.stateId,
        });
        updateObject.stateName = state.description;
      }
      if (payloadTokenized.infoStatusId) {
        const infoStatus = await context.collection("InfoStatuses").findOne({
          _id: payloadTokenized.infoStatusId,
        });
        updateObject.infoStatusName = infoStatus.description;
      }

      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context
        .collection("BasicCocoaStatisticDomesticCultivatedAreas")
        .findOne({
          _id: payloadTokenized._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "BasicCocoaStatisticDomesticCultivatedAreas",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          ...payloadTokenized,
          ...updateObject,
          _updatedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "UPDATE",
      };

      await context.collection("ActivityLogs").insertOne(payload);

      await context
        .collection("BasicCocoaStatisticDomesticCultivatedAreas")
        .updateOne(
          {
            _id: payloadTokenized._id,
          },
          {
            $set: {
              ...payloadTokenized,
              ...updateObject,
              _updatedAt: new Date().toISOString(),
            },
          },
        );
      return "success";
    },
    deleteBasicCocoaStatisticCultivatedAreaTokenized: async (
      self,
      params,
      context,
    ) => {
      assertValidSession(context.activeSession);
      const tokenized = jwt.verify(params.tokenizedInput, TOKENIZE);

      const { iat, ...payloadTokenized } = tokenized;

      const found = await context
        .collection("BasicCocoaStatisticDomesticCultivatedAreas")
        .findOne({
          _id: payloadTokenized._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "BasicCocoaStatisticDomesticCultivatedAreas",
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
        .collection("BasicCocoaStatisticDomesticCultivatedAreas")
        .updateOne(
          {
            _id: payloadTokenized._id,
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
  BasicCocoaStatisticCultivatedArea: {
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
    InfoStatus: async (self, params, context) => {
      return await context.collection("InfoStatuses").findOne({
        _id: self.infoStatusId,
      });
    },
  },
};
exports.resolvers = resolvers;
