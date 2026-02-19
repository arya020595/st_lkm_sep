const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const mime = require("mime");
const fs = require("fs");
const path = require("path");
const { assertValidSession } = require("../../authentication");
const TOKENIZE = process.env.TOKENIZE;
const jwt = require("jsonwebtoken");

const resolvers = {
  Query: {
    allGlobalCountryProfileProducings: async (self, params, context) => {
      return await context
        .collection("GlobalCountryProfileProducings")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          _createdAt: -1,
        })
        .toArray();
    },
    countGlobalCountryProfileProducings: async (self, params, context) => {
      return await context
        .collection("GlobalCountryProfileProducings")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .count();
    },
    countryProducingFile: async (self, params, context) => {
      let result = await context
        .collection("CountryProfileProducingFiles")
        .find({
          countryId: params.countryId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();

      result = result.map(res => {
        if (res.fileUrl) {
          return {
            ...res,
            fileUrl: res.fileUrl.replace("/lkm", ""),
          };
        }
        return res;
      });

      return result;
    },
    allGlobalCountryProfileProducingsTokenized: async (self, params, context) => {
      let results = await context
        .collection("GlobalCountryProfileProducings")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          _createdAt: -1,
        })
        .toArray();

      const countryRegion = await context.collection("CountryRegions").find({
        ...NOT_DELETED_DOCUMENT_QUERY
      }).toArray();

      const indexedCountryRegion = countryRegion.reduce((all, country) => {
        if (!all[country._id]) {
          all[country._id] = {};
        }
        all[country._id] = country
        return all;
      }, {});

      results = results.map((q) => {
        return {
          ...q,
          CountryRegion: indexedCountryRegion[q.countryRegionId] ? indexedCountryRegion[q.countryRegionId] : null
        }
      })

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

      const countryProfileProducingFile = await context
        .collection("CountryProfileProducingFiles")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY
        })
        .toArray();

      const indexedCountryProfileProduction = countryProfileProducingFile.reduce((all, country) => {
        if (!all[country._id]) {
          all[country._id] = [];
        }
        all[country._id].push(country)
        return all;
      }, {});

      results = results.map((q) => {
        return {
          ...q,
          CountryProfileProducingFile: indexedCountry[q.countryId] ? indexedCountry[q.countryId] : null
        }
      })

      const payload = {
        results,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
    countryProducingFileTokenized: async (self, params, context) => {

      const { iat, ...decryptedParams } = jwt.verify(params.tokenizedParams, TOKENIZE);

      let results = await context
        .collection("CountryProfileProducingFiles")
        .find({
          countryId: decryptedParams.countryId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();

      results = results.map(res => {
        if (res.fileUrl) {
          return {
            ...res,
            fileUrl: res.fileUrl.replace("/lkm", ""),
          };
        }
        return res;
      });

      const payload = {
        results,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    }
  },
  Mutation: {
    createGlobalCountryProfileProducing: async (self, params, context) => {
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

      const foundExisted = await context
        .collection("GlobalCountryProfileProducings")
        .findOne({
          countryId: newData.countryId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });

      if (foundExisted) {
        throw new Error("Duplicate Country");
      }

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalCountryProfileProducings",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context
        .collection("GlobalCountryProfileProducings")
        .insertOne(newData);
      return "success";
    },
    updateGlobalCountryProfileProducing: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context
        .collection("GlobalCountryProfileProducings")
        .findOne({
          _id: params._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalCountryProfileProducings",
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
      await context.collection("GlobalCountryProfileProducings").updateOne(
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
    deleteGlobalCountryProfileProducing: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context
        .collection("GlobalCountryProfileProducings")
        .findOne({
          _id: params._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalCountryProfileProducings",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          _deletedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "UPDATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("GlobalCountryProfileProducings").updateOne(
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

    createCountryProfileProducingFile: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const saveFileDir = process.cwd() + "/public/country_producing";

      if (!fs.existsSync(saveFileDir)) {
        fs.mkdirSync(saveFileDir);
      }

      let ContentType = base64MimeType(params.fileUrl);

      if (ContentType === "application/wps-office.docx") {
        ContentType =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      }
      const mimeType = mime.getExtension(ContentType);
      const fileId = uuidv4();
      const filename =
        `${params.description}_${fileId}.` + mime.getExtension(ContentType);
      const buf = Buffer.from(params.fileUrl.split("base64,")[1], "base64");
      const type = params.fileUrl.split(";")[0].split("/")[1];

      const PREFIX = "SEPv2";

      if (!fs.existsSync(process.cwd() + "/static/cache/")) {
        fs.mkdirSync(process.cwd() + "/static/cache/");
      }
      if (!fs.existsSync(process.cwd() + `/static/cache/${PREFIX}`)) {
        fs.mkdirSync(process.cwd() + `/static/cache/${PREFIX}`);
      }

      const fileUrl =
        `/lkm/cache/${PREFIX}/${filename}?t=` + new Date().toISOString();
      const folderPath = path.join(
        process.cwd(),
        `../app/public/cache/${PREFIX}`,
      );
      fs.mkdirSync(folderPath, {
        recursive: true,
      });
      const filePath = path.join(
        process.cwd(),
        `../app/public/cache/${PREFIX}/${filename}`,
      );
      fs.writeFileSync(filePath, buf);

      const newData = {
        _id: uuidv4(),
        ...params,
        fileUrl: fileUrl,
        mimeType,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "CountryProfileProducingFiles",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context
        .collection("CountryProfileProducingFiles")
        .insertOne(newData);
      return "success";
    },
    updateCountryProfileProducingFile: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const saveFileDir = process.cwd() + "/public/country_producing";

      if (!fs.existsSync(saveFileDir)) {
        fs.mkdirSync(saveFileDir);
      }

      let ContentType = base64MimeType(params.fileUrl);

      if (ContentType === "application/wps-office.docx") {
        ContentType =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      }
      const mimeType = mime.getExtension(ContentType);

      const fileId = uuidv4();
      const filename =
        `${params.description}_${fileId}.` + mime.getExtension(ContentType);
      const buf = Buffer.from(params.fileUrl.split("base64,")[1], "base64");
      const type = params.fileUrl.split(";")[0].split("/")[1];

      const PREFIX = "SEPv2";

      if (!fs.existsSync(process.cwd() + "/static/cache/")) {
        fs.mkdirSync(process.cwd() + "/static/cache/");
      }
      if (!fs.existsSync(process.cwd() + `/static/cache/${PREFIX}`)) {
        fs.mkdirSync(process.cwd() + `/static/cache/${PREFIX}`);
      }

      const fileUrl =
        `/lkm/cache/${PREFIX}/${filename}?t=` + new Date().toISOString();
      const folderPath = path.join(
        process.cwd(),
        `../app/public/cache/${PREFIX}`,
      );
      fs.mkdirSync(folderPath, {
        recursive: true,
      });
      const filePath = path.join(
        process.cwd(),
        `../app/public/cache/${PREFIX}/${filename}`,
      );
      fs.writeFileSync(filePath, buf);

      const found = await context
        .collection("CountryProfileProducingFiles")
        .findOne({
          _id: params._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "CountryProfileProducingFiles",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          ...params,
          fileUrl,
          mimeType,
          _updatedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "UPDATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("CountryProfileProducingFiles").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            ...params,
            fileUrl,
            mimeType,
            _updatedAt: new Date().toISOString(),
          },
        },
      );
      return "success";
    },
    deleteCountryProfileProducingFile: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context
        .collection("CountryProfileProducingFiles")
        .findOne({
          _id: params._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "CountryProfileProducingFiles",
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

      await context.collection("CountryProfileProducingFiles").updateOne(
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

    createGlobalCountryProfileProducingTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const { iat, ...decryptedParams } = jwt.verify(params.tokenized, TOKENIZE);

      const newData = {
        _id: uuidv4(),
        ...decryptedParams,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      const foundExisted = await context
        .collection("GlobalCountryProfileProducings")
        .findOne({
          countryId: newData.countryId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });

      if (foundExisted) {
        throw new Error("Duplicate Country");
      }

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalCountryProfileProducings",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context
        .collection("GlobalCountryProfileProducings")
        .insertOne(newData);
      return "success";
    },
    updateGlobalCountryProfileProducingTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const { iat, ...decryptedParams } = jwt.verify(params.tokenized, TOKENIZE);

      const found = await context
        .collection("GlobalCountryProfileProducings")
        .findOne({
          _id: decryptedParams._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalCountryProfileProducings",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          ...decryptedParams,
          _updatedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "UPDATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);
      await context.collection("GlobalCountryProfileProducings").updateOne(
        {
          _id: decryptedParams._id,
        },
        {
          $set: {
            ...decryptedParams,
            _updatedAt: new Date().toISOString(),
          },
        },
      );
      return "success";
    },
    deleteGlobalCountryProfileProducingTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const { iat, ...decryptedParams } = jwt.verify(params.tokenized, TOKENIZE);

      const found = await context
        .collection("GlobalCountryProfileProducings")
        .findOne({
          _id: decryptedParams._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalCountryProfileProducings",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          _deletedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "UPDATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("GlobalCountryProfileProducings").updateOne(
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
    createCountryProfileProducingFileTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const { iat, ...decryptedParams } = jwt.verify(params.tokenized, TOKENIZE);

      const saveFileDir = process.cwd() + "/public/country_producing";

      if (!fs.existsSync(saveFileDir)) {
        fs.mkdirSync(saveFileDir);
      }

      let ContentType = base64MimeType(decryptedParams.fileUrl);

      if (ContentType === "application/wps-office.docx") {
        ContentType =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      }
      const mimeType = mime.getExtension(ContentType);
      const fileId = uuidv4();
      const filename =
        `${decryptedParams.description}_${fileId}.` + mime.getExtension(ContentType);
      const buf = Buffer.from(decryptedParams.fileUrl.split("base64,")[1], "base64");
      const type = decryptedParams.fileUrl.split(";")[0].split("/")[1];

      const PREFIX = "SEPv2";

      if (!fs.existsSync(process.cwd() + "/static/cache/")) {
        fs.mkdirSync(process.cwd() + "/static/cache/");
      }
      if (!fs.existsSync(process.cwd() + `/static/cache/${PREFIX}`)) {
        fs.mkdirSync(process.cwd() + `/static/cache/${PREFIX}`);
      }

      const fileUrl =
        `/lkm/cache/${PREFIX}/${filename}?t=` + new Date().toISOString();
      const folderPath = path.join(
        process.cwd(),
        `../app/public/cache/${PREFIX}`,
      );
      fs.mkdirSync(folderPath, {
        recursive: true,
      });
      const filePath = path.join(
        process.cwd(),
        `../app/public/cache/${PREFIX}/${filename}`,
      );
      fs.writeFileSync(filePath, buf);

      const newData = {
        _id: uuidv4(),
        ...decryptedParams,
        fileUrl: fileUrl,
        mimeType,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "CountryProfileProducingFiles",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context
        .collection("CountryProfileProducingFiles")
        .insertOne(newData);
      return "success";
    },
    updateCountryProfileProducingFileTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const { iat, ...decryptedParams } = jwt.verify(params.tokenized, TOKENIZE);

      const saveFileDir = process.cwd() + "/public/country_producing";

      if (!fs.existsSync(saveFileDir)) {
        fs.mkdirSync(saveFileDir);
      }

      let ContentType = base64MimeType(decryptedParams.fileUrl);

      if (ContentType === "application/wps-office.docx") {
        ContentType =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      }
      const mimeType = mime.getExtension(ContentType);

      const fileId = uuidv4();
      const filename =
        `${decryptedParams.description}_${fileId}.` + mime.getExtension(ContentType);
      const buf = Buffer.from(decryptedParams.fileUrl.split("base64,")[1], "base64");
      const type = decryptedParams.fileUrl.split(";")[0].split("/")[1];

      const PREFIX = "SEPv2";

      if (!fs.existsSync(process.cwd() + "/static/cache/")) {
        fs.mkdirSync(process.cwd() + "/static/cache/");
      }
      if (!fs.existsSync(process.cwd() + `/static/cache/${PREFIX}`)) {
        fs.mkdirSync(process.cwd() + `/static/cache/${PREFIX}`);
      }

      const fileUrl =
        `/lkm/cache/${PREFIX}/${filename}?t=` + new Date().toISOString();
      const folderPath = path.join(
        process.cwd(),
        `../app/public/cache/${PREFIX}`,
      );
      fs.mkdirSync(folderPath, {
        recursive: true,
      });
      const filePath = path.join(
        process.cwd(),
        `../app/public/cache/${PREFIX}/${filename}`,
      );
      fs.writeFileSync(filePath, buf);

      const found = await context
        .collection("CountryProfileProducingFiles")
        .findOne({
          _id: decryptedParams._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "CountryProfileProducingFiles",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          ...decryptedParams,
          fileUrl,
          mimeType,
          _updatedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "UPDATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("CountryProfileProducingFiles").updateOne(
        {
          _id: decryptedParams._id,
        },
        {
          $set: {
            ...decryptedParams,
            fileUrl,
            mimeType,
            _updatedAt: new Date().toISOString(),
          },
        },
      );
      return "success";
    },
    deleteCountryProfileProducingFileTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const { iat, ...decryptedParams } = jwt.verify(params.tokenized, TOKENIZE);

      const found = await context
        .collection("CountryProfileProducingFiles")
        .findOne({
          _id: decryptedParams._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "CountryProfileProducingFiles",
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

      await context.collection("CountryProfileProducingFiles").updateOne(
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
  GlobalCountryProfileProducing: {
    CountryRegion: async (self, params, context) => {
      return await context.collection("CountryRegions").findOne({
        _id: self.countryRegionId,
      });
    },
    Country: async (self, params, context) => {
      return await context.collection("Countries").findOne({
        _id: self.countryId,
      });
    },
    CountryProfileProducingFile: async (self, params, context) => {
      return await context
        .collection("CountryProfileProducingFiles")
        .find({
          _id: self.countryId,
        })
        .toArray();
    },
  },
};
exports.resolvers = resolvers;

const base64MimeType = encoded => {
  var result = null;

  if (typeof encoded !== "string") {
    return result;
  }

  var mime = encoded.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
  if (mime && mime.length) {
    result = mime[1];
  }

  return result;
};
