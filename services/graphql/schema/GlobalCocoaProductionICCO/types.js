const GlobalCocoaProductionICCO = `
  type GlobalCocoaProductionICCO {
    _id: String!
    year: String
    CountryRegion: CountryRegion
    Country: Country
    productionValue: Float

    countryRegionName: String
    countryName: String
    
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [GlobalCocoaProductionICCO];
exports.rootTypes = `
  type Query {
    allGlobalCocoaProductionICCOs(year: String!, years: [String!]): [GlobalCocoaProductionICCO]
    countGlobalCocoaProductionICCOs: Float
    allGlobalCocoaProductionICCOsTokenized(year: String!, years: [String!]): String!
  }

  type Mutation {
    createGlobalCocoaProductionICCO(
      year: String
      countryRegionId: String
      countryId: String
      productionValue: Float
    ): String!

    updateGlobalCocoaProductionICCO(
      _id: String
      year: String
      countryRegionId: String
      countryId: String
      productionValue: Float
    ): String!

    deleteGlobalCocoaProductionICCO(_id: String): String!

    createGlobalCocoaProductionICCOTokenized(tokenized: String!): String!
    updateGlobalCocoaProductionICCOTokenized(tokenized: String!): String!
    deleteGlobalCocoaProductionICCOTokenized(tokenized: String!): String!
  }
`;
