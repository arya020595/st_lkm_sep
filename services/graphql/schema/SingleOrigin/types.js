const SingleOrigin = `
  type SingleOrigin {
    _id: String!
    year: Int
    companyName: String

    Trader: Trader
    quarter: String
    LocalRegion: LocalRegion
    tonne: Float
    rmTonne: Float
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [SingleOrigin];
exports.rootTypes = `
  type Query {
    allSingleOrigins(year: String, years: [String!]): [SingleOrigin]
    countSingleOrigins: Float
    allSingleOriginsTokenized(year: String, years: [String!]): String!
  }

  type Mutation {
    createSingleOrigin(
      traderId: String
      year: Int
      companyName: String
      quarter: String
      regionId: String
      tonne: Float
      rmTonne: Float
    ): String

    updateSingleOrigin(
      _id: String!
      traderId: String
      year: Int
      companyName: String
      quarter: String
      regionId: String
      tonne: Float
      rmTonne: Float
    ): String
    
    deleteSingleOrigin(_id: String): String

    createSingleOriginTokenized(tokenized: String!): String
    updateSingleOriginTokenized(tokenized: String!): String
    deleteSingleOriginTokenized(tokenized: String!): String
  }
`;
