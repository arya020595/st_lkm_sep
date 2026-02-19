const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const dayjs = require("dayjs");
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const mime = require("mime");
const shelljs = require("shelljs");
const { assertValidSession } = require("../../authentication");

const resolvers = {
  Query: {
    allUnstructuredDocumentInternationalCocoaStandards: async (
      self,
      params,
      context,
    ) => {
      return await context
        .collection("UnstructuredDocumentInternationalCocoaStandards")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          _createdAt: -1,
        })
        .toArray();
    },
  },
  Mutation: {
    createUnstructuredDocumentInternationalCocoaStandards: async (
      self,
      params,
      context,
    ) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const saveFileDir = process.cwd() + "/public/unstructured_document";

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
        `${params.fileName}_${fileId}.` + mime.getExtension(ContentType);
      const buf = Buffer.from(params.fileUrl.split("base64,")[1], "base64");
      const type = params.fileUrl.split(";")[0].split("/")[1];
      fs.writeFileSync(saveFileDir + "/" + filename, buf);

      const newData = {
        _id: uuidv4(),
        ...params,
        fileUrl: saveFileDir + "/" + filename,
        mimeType,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      const payload = {
        _id: uuidv4(),
        affectedCollectionName:
          "UnstructuredDocumentInternationalCocoaStandards",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context
        .collection("UnstructuredDocumentInternationalCocoaStandards")
        .insertOne(newData);

      return "success";
    },
    updateUnstructuredDocumentInternationalCocoaStandards: async (
      self,
      params,
      context,
    ) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const saveFileDir = process.cwd() + "/public/unstructured_document";

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
        `${params.fileName}_${fileId}.` + mime.getExtension(ContentType);
      const buf = Buffer.from(params.fileUrl.split("base64,")[1], "base64");
      const type = params.fileUrl.split(";")[0].split("/")[1];
      fs.writeFileSync(saveFileDir + "/" + filename, buf);

      const found = await context
        .collection("UnstructuredDocumentIncentives")
        .findOne({
          _id: params._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "UnstructuredDocumentIncentives",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          ...params,
          fileUrl: saveFileDir + "/" + filename,
          mimeType,
          _updatedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "UPDATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context
        .collection("UnstructuredDocumentInternationalCocoaStandards")
        .updateOne(
          {
            _id: params._id,
          },
          {
            $set: {
              ...params,
              fileUrl: saveFileDir + "/" + filename,
              mimeType,
              _updatedAt: new Date().toISOString(),
            },
          },
        );
      return "success";
    },
    deleteUnstructuredDocumentInternationalCocoaStandards: async (
      self,
      params,
      context,
    ) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context
        .collection("UnstructuredDocumentInternationalCocoaStandards")
        .findOne({
          _id: params._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName:
          "UnstructuredDocumentInternationalCocoaStandards",
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
        .collection("UnstructuredDocumentInternationalCocoaStandards")
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
  UnstructuredDocumentIncentive: {
    fileUrl: self => {
      if (self.fileUrl) {
        const fileUrl = self.fileUrl.split("/public");
        return fileUrl[1];
      }
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
