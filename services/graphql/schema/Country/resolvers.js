const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");

const resolvers = {
  Query: {
    allCountries: async (self, params, context) => {
      let query = {};
      if (params.countryRegionId) {
        query.countryRegionId = params.countryRegionId;
      }
      return await context
        .collection("Countries")
        .find({ ...query, ...NOT_DELETED_DOCUMENT_QUERY })
        .sort({
          name: 1,
        })
        .toArray();
    },
  },
  Mutation: {
    createCountry: async (self, params, context) => {
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

      const foundExisted = await context.collection("Countries").findOne({
        name: newData.name,
        countryRegionId: newData.countryRegionId,
        ...NOT_DELETED_DOCUMENT_QUERY,
      });

      if (foundExisted) {
        throw new Error("Duplicate Name and Country Region");
      }

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "Countries",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };

      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("Countries").insertOne(newData);
      return "success";
    },
    updateCountry: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context.collection("Countries").findOne({
        _id: params._id,
      });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "Countries",
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

      await context.collection("Countries").updateOne(
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
    deleteCountry: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context.collection("Countries").findOne({
        _id: params._id,
      });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "Countries",
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
      await context.collection("Countries").updateOne(
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
  Country: {
    CountryRegion: async (self, params, context) => {
      return await context.collection("CountryRegions").findOne({
        _id: self.countryRegionId,
      });
    },
    SubRegions: async (self, params, context) => {
      if (self.subRegionIds && self.subRegionIds.length > 0) {
        return await context
          .collection("SubRegions")
          .find({
            _id: {
              $in: self.subRegionIds,
            },
          })
          .toArray();
      }
      return [];
    },
  },
};
exports.resolvers = resolvers;
