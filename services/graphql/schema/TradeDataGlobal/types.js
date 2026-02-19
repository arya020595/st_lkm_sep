const TradeDataGlobal = `
  type TradeDataGlobal {
    _id: String!
    type: String!
    year: String!
    Country: Country
    GlobalSITCProduct: GlobalSITCProduct
    quantity: Float

    attachmentFileUrl: String
    tradeDataImportLogFileId: String

    countryName: String
    globalSITCCode: String
    countryRegionName: String
    
    _createdAt: String!
    _updatedAt: String!
  }
`;

const ImportGlobalTradeDataFromExcelResult = `
    type ImportGlobalTradeDataFromExcelResult {
        countMissingData: Int
        countFixedData: Int
        #rawJsonRowData: String!
    }
`;

exports.customTypes = [TradeDataGlobal, ImportGlobalTradeDataFromExcelResult];
exports.rootTypes = `
  type Query {
    allTradeDataGlobals(year: String, years: [String!]): [TradeDataGlobal]
    countAllTradeDataGlobal: Int
  }

  type Mutation {
    createTradeDataGlobal(
      type: String!
      year: String!
      countryId: String!
      globalSITCProductId: String!
      quantity: Float!
      attachmentFileUrl: String
    ): String!

    updateTradeDataGlobal(
      _id: String!
      type: String
      year: String
      countryId: String
      globalSITCProductId: String
      quantity: Float
      attachmentFileUrl: String
    ): String!

    deleteTradeDataGlobal(_id: String!): String!
    importTradeDataGlobal(excelBase64: String!, year: String!, type: String!, fileName: String!): ImportGlobalTradeDataFromExcelResult
    exportTradeDataGlobal(type: [String], year: [String]): String!

    generateGlobalTradeDataCocoaProductByCountryReport(
      type: String
      product: String
      fromYear: String
      toYear: String
    ): String!
    generateGlobalTradeDataCocoaProductByRegionReport(
      type: String
      product: String
      fromYear: String
      toYear: String
      description: String
    ): String!
    generateGlobalTradeDataCocoaProductByRegionPercentageReport(
      type: String
      product: String
      fromYear: String
      toYear: String
      description: String
    ): String!
  }
`;
