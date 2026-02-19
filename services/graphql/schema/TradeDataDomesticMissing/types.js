const TradeDataDomesticMissing = `
  type TradeDataDomesticMissing {
    _id: String!
    type: String
    year: Int
    month: Int
    monthName: String
    Country: Country
    LocalSITCProduct : LocalSITCProduct
    InfoStatus: InfoStatus

    attachmentFileUrl: String
    tradeDataImportLogFileId: String 
    missingMessages: [String]

    fileName: String
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [TradeDataDomesticMissing];
exports.rootTypes = `
  type Query {
    allTradeDataDomesticMissing: [TradeDataDomesticMissing]
  }

  type Mutation {
    updateMissingDomesticTradeData(
      _id: String!
      type: String!
      year: Int!
      month: Int!
      monthName: String
      countryId: String
      localSITCProductId: String
      infoStatusId: String
      attachmentFileUrl: String
    ): String!

    migrateToFixedDomesticTradeData(_id: String!): String!
  }
`;
