const TradeDataGlobalMissing = `
  type TradeDataGlobalMissing {
    _id: String!

    type: String!
    year: String!
    Country: Country
    GlobalSITCProduct: GlobalSITCProduct
    quantity: Float

    attachmentFileUrl: String
    tradeDataImportLogFileId: String 
    missingMessages: [String]

    fileName: String
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [TradeDataGlobalMissing];
exports.rootTypes = `
  type Query {
    allTradeDataGlobalMissing: [TradeDataGlobalMissing]
  }

  type Mutation {
    updateMissingGlobalTradeData(
      _id: String!
      type: String
      year: String
      countryId: String
      globalSITCProductId: String
      quantity: Float
      attachmentFileUrl: String
    ): String!

    migrateToFixedGlobalTradeData(_id: String!): String!
  }
`;
