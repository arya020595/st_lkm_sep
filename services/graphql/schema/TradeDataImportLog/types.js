const TradeDataImportLog = `
  type TradeDataImportLog {
    _id: String!
    type: String!
    urlFile: String!

    fileName: String
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [TradeDataImportLog];
exports.rootTypes = `
  type Query {
    allTradeDataImportLogs(type: String!): [TradeDataImportLog]
  }
`;
