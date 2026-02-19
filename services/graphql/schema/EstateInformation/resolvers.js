const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const resolvers = {
  Query: {
    allEstateInformation: async (self, params, context) => {
      const nPerPage = 1;
      let {
        recordType,
        stateCode,
        districtCode,
        estateId,
        estateType,
        pageNumber,
      } = params;

      let filter = {};

      if (stateCode) {
        stateCode = "" + parseInt(stateCode);
        filter = {
          ...filter,
          stateCode,
          // ["stateCode"]: {
          //   $regex: stateCode,
          //   $options: "i",
          // },
        };
      }
      if (recordType) {
        recordType = "" + parseInt(recordType);
        filter = {
          ...filter,
          recordType,
          // ["recordType"]: {
          //   $regex: recordType,
          //   $options: "i",
          // },
        };
      }
      if (districtCode) {
        districtCode = "" + parseInt(districtCode);
        filter = {
          ...filter,
          districtCode,
          // ["districtCode"]: {
          //   $regex: districtCode,
          //   $options: "i",
          // },
        };
      }
      if (estateId) {
        estateId = "" + parseInt(estateId);
        filter = {
          ...filter,
          estateId,
          // ["estateId"]: {
          //   $regex: estateId,
          //   $options: "i",
          // },
        };
      }
      if (estateType) {
        filter = {
          ...filter,
          estateType,
          // ["estateType"]: {
          //   $regex: estateType,
          //   $options: "i",
          // },
        };
      }
      return await context
        .collection("EstateInformations")
        .find({
          ...filter,
          // recordType,
          // stateCode,
          // districtCode,
          // estateId,
          // estateType,
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          _createdAt: -1,
        })
        // .skip(pageNumber > 0 ? (pageNumber - 1) * nPerPage : 0)
        // .limit(nPerPage)
        .toArray();
    },
    getOneEstateInformation: async (self, params, context) => {
      const { recordType, stateCode, districtCode, estateId, estateType } =
        params;

      let filter = {};

      if (stateCode) {
        filter = {
          ...filter,
          ["stateCode"]: {
            $regex: stateCode,
            $options: "i",
          },
        };
      }
      if (recordType) {
        filter = {
          ...filter,
          ["recordType"]: {
            $regex: recordType,
            $options: "i",
          },
        };
      }
      if (districtCode) {
        filter = {
          ...filter,
          ["districtCode"]: {
            $regex: districtCode,
            $options: "i",
          },
        };
      }
      if (estateId) {
        filter = {
          ...filter,
          ["estateId"]: {
            $regex: estateId,
            $options: "i",
          },
        };
      }
      if (estateType) {
        filter = {
          ...filter,
          ["estateType"]: {
            $regex: estateType,
            $options: "i",
          },
        };
      }
      return await context.collection("EstateInformations").findOne({
        ...filter,
        ...NOT_DELETED_DOCUMENT_QUERY,
      });
    },
    countEstateInformation: async (self, params, context) => {
      return await context
        .collection("EstateInformations")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .count();
    },
  },
  Mutation: {
    createEstateInformation: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const founExisting = await context
        .collection("EstateInformations")
        .findOne({
          estateId: params.estateId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });

      if (founExisting) {
        throw new Error(
          `There is existing Estate Information with Estate ID ${params.estateId}`,
        );
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
      if (newData.districtCode) {
        newData.districtCode = "" + parseInt(newData.districtCode);
      }
      if (newData.recordType) {
        newData.recordType = "" + parseInt(newData.recordType);
      }
      if (newData.stateCode) {
        newData.stateCode = "" + parseInt(newData.stateCode);
      }

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "EstateInformations",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("EstateInformations").insertOne(newData);
      return "success";
    },

    updateEstateInformation: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context.collection("EstateInformations").findOne({
        _id: params._id,
      });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "EstateInformations",
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

      let updatedObject = params;

      if (updatedObject.estateId) {
        updatedObject.estateId = "" + parseInt(updatedObject.estateId);
      }
      if (updatedObject.districtCode) {
        updatedObject.districtCode = "" + parseInt(updatedObject.districtCode);
      }
      if (updatedObject.recordType) {
        updatedObject.recordType = "" + parseInt(updatedObject.recordType);
      }
      if (updatedObject.stateCode) {
        updatedObject.stateCode = "" + parseInt(updatedObject.stateCode);
      }

      await context.collection("EstateInformations").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            ...updatedObject,
            _updatedAt: new Date().toISOString(),
          },
        },
      );
      return "success";
    },
    deleteEstateInformation: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context.collection("EstateInformations").findOne({
        _id: params._id,
      });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "EstateInformations",
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

      await context.collection("EstateInformations").updateOne(
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
  EstateInformation: {
    estateId: self => {
      let PREFIX = "00000";
      if (self.estateId) {
        const estateId = self.estateId.length;
        const res = PREFIX.slice(0, estateId * -1) + self.estateId;
        return res;
      }
      return "";
    },

    stateCode: self => {
      let PREFIX = "00";
      if (self.stateCode) {
        const stateCode = self.stateCode.length;
        const res = PREFIX.slice(0, stateCode * -1) + self.stateCode;
        return res;
      }
      return "";
    },
    recordType: self => {
      let PREFIX = "00";
      if (self.recordType) {
        const recordType = self.recordType.length;
        const res = PREFIX.slice(0, recordType * -1) + self.recordType;
        return res;
      }
      return "";
    },
    districtCode: self => {
      let PREFIX = "00";
      if (self.districtCode) {
        const districtCode = self.districtCode.length;
        const res = PREFIX.slice(0, districtCode * -1) + self.districtCode;
        return res;
      }
      return "";
    },
  },
};
exports.resolvers = resolvers;
