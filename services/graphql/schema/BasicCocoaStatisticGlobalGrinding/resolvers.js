const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const TOKENIZE = process.env.TOKENIZE;
const jwt = require("jsonwebtoken");
const resolvers = {
  Query: {
    allBasicCocoaStatisticGlobalGrindings: async (self, params, context) => {
      await context
        .collection("BasicCocoaStatisticGlobalGrindings")
        .createIndex({
          year: -1,
        });

      return await context
        .collection("BasicCocoaStatisticGlobalGrindings")
        .find({
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
    countBasicCocoaStatisticGlobalGrindings: async (self, params, context) => {
      return await context
        .collection("BasicCocoaStatisticGlobalGrindings")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .count();
    },
    allBasicCocoaStatisticGlobalGrindingsTokenized: async (
      self,
      params,
      context,
    ) => {
      await context
        .collection("BasicCocoaStatisticGlobalGrindings")
        .createIndex({
          year: -1,
        });

      let results = await context
        .collection("BasicCocoaStatisticGlobalGrindings")
        .find({
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

      const country = await context
        .collection("Countries")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();

      const indexedCountry = country.reduce((all, country) => {
        if (!all[country._id]) {
          all[country._id] = {};
        }
        all[country._id] = country;
        return all;
      }, {});

      results = results.map(q => {
        return {
          ...q,
          Country: indexedCountry[q.countryId]
            ? indexedCountry[q.countryId]
            : null,
        };
      });

      const countryRegion = await context
        .collection("CountryRegions")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();

      const indexedCountryRegion = countryRegion.reduce((all, reg) => {
        if (!all[reg._id]) {
          all[reg._id] = {};
        }
        all[reg._id] = reg;
        return all;
      }, {});

      results = results.map(q => {
        let productionValue = 0;
        if (q.productionValue) {
          productionValue = q.productionValue;
        }

        if (!productionValue) {
          if (q.grindingValue) {
            productionValue = q.grindingValue;
          }
        }
        return {
          ...q,
          productionValue,
          CountryRegion: indexedCountryRegion[q.countryRegionId]
            ? indexedCountryRegion[q.countryRegionId]
            : null,
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
    createBasicCocoaStatisticGlobalGrinding: async (self, params, context) => {
      assertValidSession(context.activeSession);
      let newData = {
        _id: uuidv4(),
        ...params,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      const foundExisted = await context
        .collection("BasicCocoaStatisticGlobalGrindings")
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

      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "BasicCocoaStatisticGlobalGrindings",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };

      await context.collection("ActivityLogs").insertOne(payload);

      await context
        .collection("BasicCocoaStatisticGlobalGrindings")
        .insertOne(newData);
      return "success";
    },
    updateBasicCocoaStatisticGlobalGrinding: async (self, params, context) => {
      assertValidSession(context.activeSession);

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
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context
        .collection("BasicCocoaStatisticGlobalGrindings")
        .findOne({
          _id: params._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "BasicCocoaStatisticGlobalGrindings",
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

      await context.collection("BasicCocoaStatisticGlobalGrindings").updateOne(
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
    deleteBasicCocoaStatisticGlobalGrinding: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context
        .collection("BasicCocoaStatisticGlobalGrindings")
        .findOne({
          _id: params._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "BasicCocoaStatisticGlobalGrindings",
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
      await context.collection("BasicCocoaStatisticGlobalGrindings").updateOne(
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
    createBasicCocoaStatisticGlobalGrindingTokenized: async (
      self,
      params,
      context,
    ) => {
      assertValidSession(context.activeSession);

      const { iat, Country, CountryRegion, ...decryptedParams } = jwt.verify(
        params.tokenized,
        TOKENIZE,
      );

      let newData = {
        _id: uuidv4(),
        ...decryptedParams,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      const foundExisted = await context
        .collection("BasicCocoaStatisticGlobalGrindings")
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

      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "BasicCocoaStatisticGlobalGrindings",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };

      await context.collection("ActivityLogs").insertOne(payload);

      await context
        .collection("BasicCocoaStatisticGlobalGrindings")
        .insertOne(newData);
      return "success";
    },
    updateBasicCocoaStatisticGlobalGrindingTokenized: async (
      self,
      params,
      context,
    ) => {
      assertValidSession(context.activeSession);

      const { iat, Country, CountryRegion, ...decryptedParams } = jwt.verify(
        params.tokenized,
        TOKENIZE,
      );

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
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context
        .collection("BasicCocoaStatisticGlobalGrindings")
        .findOne({
          _id: decryptedParams._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "BasicCocoaStatisticGlobalGrindings",
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

      await context.collection("BasicCocoaStatisticGlobalGrindings").updateOne(
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
    deleteBasicCocoaStatisticGlobalGrindingTokenized: async (
      self,
      params,
      context,
    ) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const { iat, ...decryptedParams } = jwt.verify(
        params.tokenized,
        TOKENIZE,
      );

      const found = await context
        .collection("BasicCocoaStatisticGlobalGrindings")
        .findOne({
          _id: decryptedParams._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "BasicCocoaStatisticGlobalGrindings",
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
      await context.collection("BasicCocoaStatisticGlobalGrindings").updateOne(
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
    },
  },
  BasicCocoaStatisticGlobalGrinding: {
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
