const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const resolvers = {
  Query: {
    allTradeDataImportLogs: async (self, params, context) => {
      return await context
        .collection("TradeDataImportLogFile")
        .find({
          type: params.type,
        })
        .sort({
          _createdAt: -1,
        })
        .toArray();
    },
  },
  TradeDataImportLog: {
    urlFile: self => {
      if (self.fileUrl) {
        const fileUrl = self.urlFile.split("/public");
        if (fileUrl.length !== 0) {
          return fileUrl[1];
        }
        return "";
      } else if (self.urlFile) {
        const fileUrl = self.urlFile.split("/public");
        if (fileUrl.length !== 0) {
          if (!fileUrl[1]) {
            const tmpUrl = self.urlFile.split("\\public");
            return tmpUrl[1];
          }
          return fileUrl[1];
        }
        return "";
      } else {
        return "";
      }
    },
  },
};
exports.resolvers = resolvers;
