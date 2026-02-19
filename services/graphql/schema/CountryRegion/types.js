const CountryRegion = `
  type CountryRegion {
    _id: String!
    code: String
    description: String
    Countries: [Country]

    SubRegions: [SubRegion]
    _createdAt: String!
    _updatedAt: String!
  }
`;

exports.customTypes = [CountryRegion];
exports.rootTypes = `
  type Query {
    allCountryRegion: [CountryRegion]
    countCountryRegion: Int
    allCountryRegionTokenized: String! 
  }
  type Mutation {
    createCountryRegion(
      code: String!
      description: String!
    ): String!
    updateCountryRegion(
      _id: String!, 
      code: String
      description: String
    ): String!
    deleteCountryRegion(_id: String!): String!
  }
`;
