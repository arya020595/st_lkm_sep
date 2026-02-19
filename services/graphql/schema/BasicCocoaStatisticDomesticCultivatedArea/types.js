const BasicCocoaStatisticCultivatedArea = `
  type BasicCocoaStatisticCultivatedArea {
    _id: String!
    year: Int!
    LocalRegion: LocalRegion
    LocalState: LocalState
    InfoStatus: InfoStatus
    estateNo: Float
    estateArea: Float
    estateMaturedArea: Float
    smallhNo: Float
    smallhArea: Float
    maturedArea: Float

    regionName: String
    stateName: String
    infoStatusName: String
    
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [BasicCocoaStatisticCultivatedArea];
exports.rootTypes = `
  type Query {
    allBasicCocoaStatisticCultivatedAreas (year: String, years: [String!]): [BasicCocoaStatisticCultivatedArea]
    allBasicCocoaStatisticCultivatedAreasTokenized(year: String, years: [String!]): String!

    countBasicCocoaStatisticCultivatedAreas: Int
    getBCSMaturedEstateArea(
      year: String!
      regionId: String!
      stateId: String!
    ): Float

    getBCSMaturedSmallholderArea(
      year: String!
      regionId: String!
      stateId: String!
    ): Float
  }

  type Mutation {
    createBasicCocoaStatisticCultivatedArea(
      year: Int!
      regionId: String!
      stateId: String!
      infoStatusId: String!
      estateNo: Float
      estateArea: Float
      estateMaturedArea: Float
      smallhNo: Float
      smallhArea: Float
      maturedArea: Float
    ): String!

    updateBasicCocoaStatisticCultivatedArea(
      _id: String!
      year: Int!
      regionId: String!
      stateId: String!
      infoStatusId: String!
      estateNo: Float
      estateArea: Float
      estateMaturedArea: Float
      smallhNo: Float
      smallhArea: Float
      maturedArea: Float
    ): String!

    deleteBasicCocoaStatisticCultivatedArea(_id: String!): String!

    createBasicCocoaStatisticCultivatedAreaTokenized(tokenizedInput: String!): String!
    updateBasicCocoaStatisticCultivatedAreaTokenized(tokenizedInput: String!): String!
    deleteBasicCocoaStatisticCultivatedAreaTokenized(tokenizedInput: String!): String!
  }
`;
