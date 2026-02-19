const CountryProfileConsumingFile = `
  type CountryProfileConsumingFile {
    _id: String!
    countryId: String
    type: String
    description: String
    fileUrl: String
  }
`;

const GlobalCountryProfileConsuming = `
  type GlobalCountryProfileConsuming {
    _id: String!
    CountryRegion: CountryRegion
    Country: Country
    
    cultivatedArea: String
    production: String
    grindings: String
    chocolateManufacturing: String
    consumption: String

    CocoaTradeConsuming: [GlobalCountryProfileConsumingTrade]
    CountryProfileConsumingFile: [CountryProfileConsumingFile]
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [
  GlobalCountryProfileConsuming,
  CountryProfileConsumingFile,
];
exports.rootTypes = `
  
  type Query {
    allGlobalCountryProfileConsumings: [GlobalCountryProfileConsuming]
    countGlobalCountryProfileConsumings: Float

    countryConsumingFile(countryId: String!): [CountryProfileConsumingFile]

    allGlobalCountryProfileConsumingsTokenized: String!
    countryConsumingFileTokenized(tokenizedParams: String!): String!
    
  }

  type Mutation {
    createGlobalCountryProfileConsuming(
        countryId: String
        countryRegionId: String
        cultivatedArea: String
        production: String
        grindings: String
        chocolateManufacturing: String
        consumption: String
        
    ): String!

    updateGlobalCountryProfileConsuming(
      _id: String
      countryId: String
      countryRegionId: String
      cultivatedArea: String
      production: String
      grindings: String
      chocolateManufacturing: String
      consumption: String
  
      
    ): String!

    deleteGlobalCountryProfileConsuming(_id: String): String!

    createCountryProfileConsumingFile(
      countryId: String
      type: String
      description: String
      fileUrl: String
    ): String

    updateCountryProfileConsumingFile(
      _id: String
      countryId: String
      type: String
      description: String
      fileUrl: String
    ): String

    deleteCountryProfileConsumingFile(_id: String!): String!

    createGlobalCountryProfileConsumingTokenized(tokenized: String!): String!
    updateGlobalCountryProfileConsumingTokenized(tokenized: String!): String!
    deleteGlobalCountryProfileConsumingTokenized(tokenized: String!): String!

    createCountryProfileConsumingFileTokenized(tokenized: String!): String!
    updateCountryProfileConsumingFileTokenized(tokenized: String!): String!
    deleteCountryProfileConsumingFileTokenized(tokenized: String!): String!
  }
`;
