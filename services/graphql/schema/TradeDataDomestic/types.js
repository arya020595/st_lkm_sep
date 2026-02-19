const TradeDataDomestic = `
  type TradeDataDomestic {
    _id: String!
    type: String!
    year: Int!
    month: Int!
    monthName: String
    Country: Country
    LocalSITCProduct : LocalSITCProduct
    InfoStatus: InfoStatus

    attachmentFileUrl: String
    tradeDataImportLogFileId: String

    quantity: Float
    value: Float

    countryName: String
    localSITCCode: String
    localSITCProduct: String
    infoStatusName: String
    
    _createdAt: String!
    _updatedAt: String!
  }
`;

const ImportDomesticTradeDataFromExcelResult = `
    type ImportDomesticTradeDataFromExcelResult {
        countMissingData: Int
        countFixedData: Int
        #rawJsonRowData: String!
    }
`;

exports.customTypes = [
  TradeDataDomestic,
  ImportDomesticTradeDataFromExcelResult,
];
exports.rootTypes = `
  scalar JSON
  type Query {
    allTradeDataDomestics(year: String!, years: [String!]): [TradeDataDomestic]
    countAllTradeDataDomestic: Int
  }

  type Mutation {
    createTradeDataDomestic(
      type: String!
      year: Int!
      month: Int!
      monthName: String
      countryId: String
      localSITCProductId: String
      infoStatusId: String
      attachmentFileUrl: String
      
      quantity: Float
      value: Float
    ): String!

    updateTradeDataDomestic(
      _id: String!
      type: String
      year: Int
      month: Int
      monthName: String
      countryId: String
      localSITCProductId: String
      infoStatusId: String
      attachmentFileUrl: String
      quantity: Float
      value: Float
    ): String!

    deleteTradeDataDomestic(_id: String!): String!

    importTradeDataDomestic(
      excelBase64: String!, 
      year: Int!, 
      type: String!, 
      month: Int!, 
      monthName: String!

      fileName: String!
    ): ImportDomesticTradeDataFromExcelResult

    previewImportTradeDataDomestic(
      excelBase64: String!, 
        year: Int!, 
        type: String!, 
        month: Int!, 
        monthName: String!
        fileName: String!
    ): JSON

    exportTradeDataDomestic(type: [String], monthName: [String], year: [Int]): String!

    generateDomesticTradeExportImportReport(
      type: String
      fromYear: Int
      toYear: Int
      fromMonth: String
      toMonth: String
      title: String
      description2: String
      description3: String
    ): String!
    generateDomesticTradeExportDestinationSourceReport(
      type: String
      product: String
      year: Int
      fromMonth: String
      toMonth: String
      title: String
      size: Int
      description2: String
      description3: String
    ): String!
    generateDomesticTradeContributionOfExportByRegionReport(
      product: String
      year1: Int
      year2: Int
      description: String
    ): String!
    generateDomesticTradeCocoaBeansExportReport(
      country: String
      year: Int
    ): String!
    generateDomesticTradeExportImportSelectedCountryReport(
      type: String
      region: String
      country: String
      year: Int
      fromMonth: String
      toMonth: String
      description: String
    ): String!
  }
`;
