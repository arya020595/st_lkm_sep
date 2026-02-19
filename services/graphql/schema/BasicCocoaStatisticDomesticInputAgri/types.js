const BasicCocoaStatisticDomesticInputAgri = `
  type BasicCocoaStatisticDomesticInputAgri {
    _id: String!
    year: Int!
    quarter: String
    LocalRegion: LocalRegion
    LocalState: LocalState
    AgriInputType: AgriInputType
    brand: String!
    prices: Float

    regionName: String
    agriInputTypeName: String
    stateName: String
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [BasicCocoaStatisticDomesticInputAgri];
exports.rootTypes = `
  type Query {
    allBasicCocoaStatisticDomesticInputAgries(year: String, years: [String!]): [BasicCocoaStatisticDomesticInputAgri]
    countBasicCocoaStatisticDomesticInputAgries: Float
  }

  type Mutation {
    createBasicCocoaStatisticDomesticInputAgri(
      year: Int!
      quarter: String!
      regionId: String!
      stateId: String!
      agriInputTypeId: String!
      brand: String!
      prices: Float
    ): String!

    updateBasicCocoaStatisticDomesticInputAgri(
      _id: String!
      year: Int
      quarter: String
      regionId: String
      stateId: String
      agriInputTypeId: String
      brand: String
      prices: Float
    ): String!


    deleteBasicCocoaStatisticDomesticInputAgri(_id: String!): String!
  }
`;
