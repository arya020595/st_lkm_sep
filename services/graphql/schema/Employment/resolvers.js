const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const dayjs = require("dayjs");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const TOKENIZE = process.env.TOKENIZE;

const resolvers = {
  Query: {
    allEmployments: async (self, params, context) => {
      await context.collection("Employments").createIndex({
        year: -1,
      });

      return await context
        .collection("Employments")
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
        })
        .toArray();
    },
    countEmployments: async (self, params, context) => {
      return await context
        .collection("Employments")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .count();
    },
    allEmploymentsTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);

      await context.collection("Employments").createIndex({
        year: -1,
      });

      let results = await context
        .collection("Employments")
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
        })
        .toArray();

      const category = await context
        .collection("Categories")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();

      const indexedCategory = category.reduce((all, obj) => {
        if (!all[obj._id]) {
          all[obj._id] = {};
        }
        all[obj._id] = obj;
        return all;
      }, {});

      const division = await context
        .collection("Divisions")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();

      const indexedDivision = division.reduce((all, obj) => {
        if (!all[obj._id]) {
          all[obj._id] = {};
        }
        all[obj._id] = obj;
        return all;
      }, {});

      const positionType = await context
        .collection("PositionTypes")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();

      const indexedPoisitionType = positionType.reduce((all, obj) => {
        if (!all[obj._id]) {
          all[obj._id] = {};
        }
        all[obj._id] = obj;
        return all;
      }, {});

      const localRegion = await context
        .collection("Regions")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();

      const indexedLocalRegion = localRegion.reduce((all, obj) => {
        if (!all[obj._id]) {
          all[obj._id] = {};
        }
        all[obj._id] = obj;
        return all;
      }, {});

      results = results.map(res => {
        return {
          ...res,
          Category: indexedCategory[res.categoryId],
          Division: indexedDivision[res.divisionId],
          PositionType: indexedPoisitionType[res.positionTypeId],
          LocalRegion: indexedLocalRegion[res.localRegionId],
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
    createEmployment: async (self, params, context) => {
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

      if (newData.localRegionId) {
        const region = await context.collection("Regions").findOne({
          _id: newData.localRegionId,
        });
        newData.regionName = region.description;
      }
      if (newData.categoryId) {
        const category = await context.collection("Categories").findOne({
          _id: newData.categoryId,
        });
        newData.categoryName = category.description;
      }
      if (newData.divisionId) {
        const division = await context.collection("Divisions").findOne({
          _id: newData.divisionId,
        });
        newData.divisionName = division.description;
      }

      const foundExisted = await context.collection("Employments").findOne({
        year: newData.year,
        categoryId: newData.categoryId,
        divisionId: newData.divisionId,
        ...NOT_DELETED_DOCUMENT_QUERY,
      });

      if (foundExisted) {
        throw new Error("Duplicate Year, Category, and Division");
      }

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "Employments",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };

      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("Employments").insertOne(newData);
      return "success";
    },
    updateEmployment: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      let updateObject = {};
      if (params.localRegionId) {
        const region = await context.collection("Regions").findOne({
          _id: params.localRegionId,
        });
        updateObject.regionName = region.description;
      }
      if (params.categoryId) {
        const category = await context.collection("Categories").findOne({
          _id: params.categoryId,
        });
        updateObject.categoryName = category.description;
      }
      if (params.divisionId) {
        const division = await context.collection("Divisions").findOne({
          _id: params.divisionId,
        });
        updateObject.divisionName = division.description;
      }

      const found = await context.collection("Employments").findOne({
        _id: params._id,
      });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "Employments",
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

      await context.collection("Employments").updateOne(
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
    deleteEmployment: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context.collection("Employments").findOne({
        _id: params._id,
      });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "Employments",
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

      await context.collection("Employments").updateOne(
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
    createEmploymentTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const tokenized = jwt.verify(params.tokenizedInput, TOKENIZE);

      const { iat, ...payloadTokenized } = tokenized;

      let newData = {
        _id: uuidv4(),
        ...payloadTokenized,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      if (newData.localRegionId) {
        const region = await context.collection("Regions").findOne({
          _id: newData.localRegionId,
        });
        newData.regionName = region.description;
      }
      if (newData.categoryId) {
        const category = await context.collection("Categories").findOne({
          _id: newData.categoryId,
        });
        newData.categoryName = category.description;
      }
      if (newData.divisionId) {
        const division = await context.collection("Divisions").findOne({
          _id: newData.divisionId,
        });
        newData.divisionName = division.description;
      }

      const foundExisted = await context.collection("Employments").findOne({
        year: newData.year,
        categoryId: newData.categoryId,
        divisionId: newData.divisionId,
        ...NOT_DELETED_DOCUMENT_QUERY,
      });

      if (foundExisted) {
        throw new Error("Duplicate Year, Category, and Division");
      }

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "Employments",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };

      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("Employments").insertOne(newData);
      return "success";
    },
    updateEmploymentTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const tokenized = jwt.verify(params.tokenizedInput, TOKENIZE);

      const { iat, ...payloadTokenized } = tokenized;

      let updateObject = {};
      if (payloadTokenized.localRegionId) {
        const region = await context.collection("Regions").findOne({
          _id: payloadTokenized.localRegionId,
        });
        updateObject.regionName = region.description;
      }
      if (payloadTokenized.categoryId) {
        const category = await context.collection("Categories").findOne({
          _id: payloadTokenized.categoryId,
        });
        updateObject.categoryName = category.description;
      }
      if (payloadTokenized.divisionId) {
        const division = await context.collection("Divisions").findOne({
          _id: payloadTokenized.divisionId,
        });
        updateObject.divisionName = division.description;
      }

      const found = await context.collection("Employments").findOne({
        _id: payloadTokenized._id,
      });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "Employments",
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

      await context.collection("Employments").updateOne(
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
    deleteEmploymentTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const tokenized = jwt.verify(params.tokenizedInput, TOKENIZE);

      const { iat, ...payloadTokenized } = tokenized;

      const found = await context.collection("Employments").findOne({
        _id: payloadTokenized._id,
      });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "Employments",
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

      await context.collection("Employments").updateOne(
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
  Employment: {
    Category: async (self, params, context) => {
      return await context.collection("Categories").findOne({
        _id: self.categoryId,
      });
    },
    Division: async (self, params, context) => {
      console.log(self);
      return await context.collection("Divisions").findOne({
        _id: self.divisionId,
      });
    },
    PositionType: async (self, params, context) => {
      return await context.collection("PositionTypes").findOne({
        _id: self.positionTypeId,
      });
    },
    LocalRegion: async (self, params, context) => {
      return await context.collection("Regions").findOne({
        _id: self.localRegionId,
      });
    },
  },
};
exports.resolvers = resolvers;
