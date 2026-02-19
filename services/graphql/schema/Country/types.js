const Country = `
  type Country {
    _id: String!
    name: String
    refName: String
    codeA2: String
    codeA3: String
    codeA4: String
    codeA5: String
    codeNol: String
    number: Int
    CountryRegion: CountryRegion

    SubRegions: [SubRegion]
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [Country];
exports.rootTypes = `
  type Query {
    allCountries (countryRegionId: String): [Country]
  }

  type Mutation {
    createCountry(
      name: String!
      refName: String
      codeA2: String
      codeA3: String
      codeA4: String
      codeA5: String
      codeNol: String
      countryRegionId: String
      number: Int

      subRegionIds: [String]
    ): String!
    updateCountry(
      _id: String!, 
      name: String
      refName: String
      codeA2: String
      codeA3: String
      codeA4: String
      codeA5: String
      codeNol: String
      countryRegionId: String
      number: Int
      subRegionIds: [String]
    ): String!
    deleteCountry(_id: String!): String!
  }
`;
