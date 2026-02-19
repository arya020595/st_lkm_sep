const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const TOKENIZE = process.env.TOKENIZE;
const jwt = require("jsonwebtoken");
const resolvers = {
  Query: {
    allCountryRegion: async (self, params, context) => {
      assertValidSession(context.activeSession);
      return await context
        .collection("CountryRegions")
        .find({ ...NOT_DELETED_DOCUMENT_QUERY })
        .sort({
          code: 1,
        })
        .toArray();
    },
    countCountryRegion: async (self, params, context) => {
      assertValidSession(context.activeSession);
      return await context
        .collection("CountryRegions")
        .find({ ...NOT_DELETED_DOCUMENT_QUERY })
        .count();
    },
    allCountryRegionTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      let results = await context
        .collection("CountryRegions")
        .find({ ...NOT_DELETED_DOCUMENT_QUERY })
        .sort({
          code: 1,
        })
        .toArray();

      const Countries = await context
        .collection("Countries")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();

      const indexedCountries = Countries.reduce((all, country) => {
        if (!all[country.countryRegionId]) {
          all[country.countryRegionId] = [];
        }
        all[country.countryRegionId].push(country)
        return all;
      }, {});

      results = results.map((q) => {
        return {
          ...q,
          Countries: indexedCountries[q._id] ? indexedCountries[q._id] : null
        }
      })

      const SubRegions = await context
        .collection("SubRegions")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();

      const indexedSubRegion = SubRegions.reduce((all, sub) => {
        if (!all[sub.countryRegionId]) {
          all[sub.countryRegionId] = [];
        }
        all[sub.countryRegionId].push(sub)
        return all;
      }, {});

      results = results.map((q) => {
        return {
          ...q,
          SubRegions: indexedSubRegion[q._id] ? indexedSubRegion[q._id] : null
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
    createCountryRegion: async (self, params, context) => {
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
        affectedCollectionName: "CountryRegions",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };

      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("CountryRegions").insertOne(newData);
      return "success";
    },
    updateCountryRegion: async (self, params, context) => {
      assertValidSession(context.activeSession);

      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context.collection("CountryRegions").findOne({
        _id: params._id,
      });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "CountryRegions",
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

      await context.collection("CountryRegions").updateOne(
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
    deleteCountryRegion: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context.collection("CountryRegions").findOne({
        _id: params._id,
      });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "CountryRegions",
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

      await context.collection("CountryRegions").updateOne(
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
  CountryRegion: {
    Countries: async (self, params, context) => {
      return await context
        .collection("Countries")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
          countryRegionId: self._id,
        })
        .toArray();
    },
    SubRegions: async (self, params, context) => {
      return await context
        .collection("SubRegions")
        .find({
          countryRegionId: self._id,
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();
    },
  },
};
exports.resolvers = resolvers;
