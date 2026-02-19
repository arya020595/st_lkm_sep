const SubRegion = `
  type SubRegion {
    _id: String!
    code: String
    description: String
    CountryRegion: CountryRegion
    _createdAt: String!
    _updatedAt: String!
  }
`;

exports.customTypes = [SubRegion];
exports.rootTypes = `
  type Query {
    allSubRegion: [SubRegion]
    countSubRegion: Int
  }
  type Mutation {
    createSubRegion(
      countryRegionId: String!
      code: String!
      description: String!
    ): String!
    updateSubRegion(
      _id: String!, 
      countryRegionId: String
      code: String
      description: String
    ): String!
    deleteSubRegion(_id: String!): String!
  }
`;
