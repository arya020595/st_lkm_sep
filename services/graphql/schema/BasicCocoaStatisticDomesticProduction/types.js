const BasicCocoaStatisticDomesticProduction = `
  type BasicCocoaStatisticDomesticProduction {
    _id: String!
    year: Int!
    month: Int!
    monthName: String!

    LocalRegion: LocalRegion
    LocalState: LocalState
    InfoStatus: InfoStatus

    estateNo: Float
    estateArea: Float
    smallhNo: Float
    smallhArea: Float
    tmpOldTotal: Float

    estateProduction: Float
    estateYield: Float
    malaysianEstateYield: Float
    smallholdingProduction: Float
    smallholdingYield: Float
    smallholdingMalaysia: Float

    regionName: String
    stateName: String
    infoStatusName: String
    

    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [BasicCocoaStatisticDomesticProduction];
exports.rootTypes = `
  type Query {
    allBasicCocoaStatisticDomesticProductions(year: String, years: [String!]): [BasicCocoaStatisticDomesticProduction]    
    countBasicCocoaStatisticDomesticProductions: Float
    allBasicCocoaStatisticDomesticProductionsTokenized(year: String, years: [String!]): String!
  }
  type Mutation {
    createBasicCocoaStatisticDomesticProduction(
      year: Int!
      month: Int!
      monthName: String!

      regionId: String!
      stateId: String!
      infoStatusId: String!

      estateNo: Float
      estateArea: Float
      smallhNo: Float
      smallhArea: Float
      tmpOldTotal: Float

      estateProduction: Float
      estateYield: Float
      malaysianEstateYield: Float
      smallholdingProduction: Float
      smallholdingYield: Float
      smallholdingMalaysia: Float
    ): String!

    updateBasicCocoaStatisticDomesticProduction(
      _id: String!
      year: Int
      month: Int
      monthName: String
      regionId: String
      stateId: String
      infoStatusId: String

      estateNo: Float
      estateArea: Float
      smallhNo: Float
      smallhArea: Float
      tmpOldTotal: Float

      estateProduction: Float
      estateYield: Float
      malaysianEstateYield: Float
      smallholdingProduction: Float
      smallholdingYield: Float
      smallholdingMalaysia: Float
    ): String!


    deleteBasicCocoaStatisticDomesticProduction(_id: String!): String!

    createBasicCocoaStatisticDomesticProductionTokenized(tokenizedInput: String!): String!
    updateBasicCocoaStatisticDomesticProductionTokenized(tokenizedInput: String!): String!
    deleteBasicCocoaStatisticDomesticProductionTokenized(tokenizedInput: String!): String!
  }
`;
