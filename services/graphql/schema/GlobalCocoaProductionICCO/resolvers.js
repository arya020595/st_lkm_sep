const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const dayjs = require("dayjs");
const { assertValidSession } = require("../../authentication");
const TOKENIZE = process.env.TOKENIZE;
const jwt = require("jsonwebtoken");
const resolvers = {
  Query: {
    allGlobalCocoaProductionICCOs: async (self, params, context) => {
      await context.collection("GlobalCocoaProductionICCOs").createIndex({
        year: -1,
      });

      return await context
        .collection("GlobalCocoaProductionICCOs")
        .find({
          // year: params.year,
          year: params.years
            ? {
              $in: params.years,
            }
            : params.year,
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          year: -1,
        })
        .toArray();
    },
    countGlobalCocoaProductionICCOs: async (self, params, context) => {
      return await context
        .collection("GlobalCocoaProductionICCOs")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .count();
    },
    allGlobalCocoaProductionICCOsTokenized: async (self, params, context) => {
      await context.collection("GlobalCocoaProductionICCOs").createIndex({
        year: -1,
      });

      let results = await context
        .collection("GlobalCocoaProductionICCOs")
        .find({
          // year: params.year,
          year: params.years
            ? {
              $in: params.years,
            }
            : params.year,
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          year: -1,
        })
        .toArray();

      const country = await context.collection("Countries").find({
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

      const countryRegion = await context.collection("CountryRegions").find({
        ...NOT_DELETED_DOCUMENT_QUERY
      }).toArray();

      const indexedCountryRegion = countryRegion.reduce((all, reg) => {
        if (!all[reg._id]) {
          all[reg._id] = {};
        }
        all[reg._id] = reg
        return all;
      }, {});

      results = results.map((q) => {
        return {
          ...q,
          CountryRegion: indexedCountryRegion[q.countryRegionId] ? indexedCountryRegion[q.countryRegionId] : null
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
    createGlobalCocoaProductionICCO: async (self, params, context) => {
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
      const foundExisted = await context
        .collection("GlobalCocoaProductionICCOs")
        .findOne({
          year: newData.year,
          countryId: newData.countryId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });

      if (foundExisted) {
        throw new Error("Duplicate Year and Country");
      }

      if (newData.countryRegionId) {
        const region = await context.collection("CountryRegions").findOne({
          _id: newData.countryRegionId,
        });
        newData.countryRegionName = region.description;
      }
      if (newData.countryId) {
        const country = await context.collection("Countries").findOne({
          _id: newData.countryId,
        });
        newData.countryName = country.name;
      }

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalCocoaProductionICCOs",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("GlobalCocoaProductionICCOs").insertOne(newData);
      return "success";
    },
    updateGlobalCocoaProductionICCO: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      let updateObject = {};
      if (params.countryRegionId) {
        const region = await context.collection("CountryRegions").findOne({
          _id: params.countryRegionId,
        });
        updateObject.countryRegionName = region.description;
      }
      if (params.countryId) {
        const country = await context.collection("Countries").findOne({
          _id: params.countryId,
        });
        updateObject.countryName = country.name;
      }

      const found = await context
        .collection("GlobalCocoaProductionICCOs")
        .findOne({
          _id: params._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalCocoaProductionICCOs",
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

      await context.collection("GlobalCocoaProductionICCOs").updateOne(
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
    deleteGlobalCocoaProductionICCO: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context
        .collection("GlobalCocoaProductionICCOs")
        .findOne({
          _id: params._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalCocoaProductionICCOs",
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

      await context.collection("GlobalCocoaProductionICCOs").updateOne(
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
    createGlobalCocoaProductionICCOTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const { iat, Country, CountryRegion, ...decryptedParams } = jwt.verify(params.tokenized, TOKENIZE);

      let newData = {
        _id: uuidv4(),
        ...decryptedParams,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };
      const foundExisted = await context
        .collection("GlobalCocoaProductionICCOs")
        .findOne({
          year: newData.year,
          countryId: newData.countryId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });

      if (foundExisted) {
        throw new Error("Duplicate Year and Country");
      }

      if (newData.countryRegionId) {
        const region = await context.collection("CountryRegions").findOne({
          _id: newData.countryRegionId,
        });
        newData.countryRegionName = region.description;
      }
      if (newData.countryId) {
        const country = await context.collection("Countries").findOne({
          _id: newData.countryId,
        });
        newData.countryName = country.name;
      }

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalCocoaProductionICCOs",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("GlobalCocoaProductionICCOs").insertOne(newData);
      return "success";
    },
    updateGlobalCocoaProductionICCOTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const { iat, Country, CountryRegion, ...decryptedParams } = jwt.verify(params.tokenized, TOKENIZE);

      let updateObject = {};
      if (decryptedParams.countryRegionId) {
        const region = await context.collection("CountryRegions").findOne({
          _id: decryptedParams.countryRegionId,
        });
        updateObject.countryRegionName = region.description;
      }
      if (decryptedParams.countryId) {
        const country = await context.collection("Countries").findOne({
          _id: decryptedParams.countryId,
        });
        updateObject.countryName = country.name;
      }

      const found = await context
        .collection("GlobalCocoaProductionICCOs")
        .findOne({
          _id: decryptedParams._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalCocoaProductionICCOs",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          ...decryptedParams,
          ...updateObject,
          _updatedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "UPDATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("GlobalCocoaProductionICCOs").updateOne(
        {
          _id: decryptedParams._id,
        },
        {
          $set: {
            ...decryptedParams,
            ...updateObject,
            _updatedAt: new Date().toISOString(),
          },
        },
      );
      return "success";
    },
    deleteGlobalCocoaProductionICCOTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const { iat, ...decryptedParams } = jwt.verify(params.tokenized, TOKENIZE);

      const found = await context
        .collection("GlobalCocoaProductionICCOs")
        .findOne({
          _id: decryptedParams._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalCocoaProductionICCOs",
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

      await context.collection("GlobalCocoaProductionICCOs").updateOne(
        {
          _id: decryptedParams._id,
        },
        {
          $set: {
            _deletedAt: new Date().toISOString(),
          },
        },
      );
      return "success";
    }
  },
  GlobalCocoaProductionICCO: {
    Country: async (self, params, context) => {
      return await context.collection("Countries").findOne({
        _id: self.countryId,
      });
    },
    CountryRegion: async (self, params, context) => {
      return await context.collection("CountryRegions").findOne({
        _id: self.countryRegionId,
      });
    },
  },
};
exports.resolvers = resolvers;
