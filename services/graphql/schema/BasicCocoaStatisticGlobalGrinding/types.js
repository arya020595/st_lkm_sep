const BasicCocoaStatisticGlobalGrinding = `
  type BasicCocoaStatisticGlobalGrinding {
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
exports.customTypes = [BasicCocoaStatisticGlobalGrinding];
exports.rootTypes = `
  type Query {
    allBasicCocoaStatisticGlobalGrindings(year: String!, years: [String!]): [BasicCocoaStatisticGlobalGrinding]
    countBasicCocoaStatisticGlobalGrindings: Float
    allBasicCocoaStatisticGlobalGrindingsTokenized(year: String!, years: [String!]): String!
  }

  type Mutation {
    createBasicCocoaStatisticGlobalGrinding(
      year: String
      countryRegionId: String
      countryId: String
      productionValue: Float
    ): String!

    updateBasicCocoaStatisticGlobalGrinding(
      _id: String
      year: String
      countryRegionId: String
      countryId: String
      productionValue: Float
    ): String!

    deleteBasicCocoaStatisticGlobalGrinding(_id: String): String!

    createBasicCocoaStatisticGlobalGrindingTokenized(tokenized: String!): String!
    updateBasicCocoaStatisticGlobalGrindingTokenized(tokenized: String!): String!
    deleteBasicCocoaStatisticGlobalGrindingTokenized(tokenized: String!): String!
  }
`;
