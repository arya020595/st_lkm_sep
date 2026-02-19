const CountryProfileProducingFile = `
  type CountryProfileProducingFile {
    _id: String!
    countryId: String
    type: String
    description: String
    fileUrl: String
  }
`;
const GlobalCountryProfileProducing = `
  type GlobalCountryProfileProducing {
    _id: String!
    CountryRegion: CountryRegion
    Country: Country
    
    cultivatedArea: String
    production: String
    grindings: String
    chocolateManufacturing: String
    consumption: String

    CocoaTradeProducing: [GlobalCountryProfileProducingTrade]
    CountryProfileProducingFile: [CountryProfileProducingFile]

    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [
  GlobalCountryProfileProducing,
  CountryProfileProducingFile,
];
exports.rootTypes = `
  
  type Query {
    allGlobalCountryProfileProducings: [GlobalCountryProfileProducing]
    countGlobalCountryProfileProducings: Float
    
    countryProducingFile(countryId: String!): [CountryProfileProducingFile]

    allGlobalCountryProfileProducingsTokenized: String!
    countryProducingFileTokenized(tokenizedParams: String!): String!
  }

  type Mutation {
    createGlobalCountryProfileProducing(
        countryId: String
        countryRegionId: String
        cultivatedArea: String
        production: String
        grindings: String
        chocolateManufacturing: String
        consumption: String
        
    ): String!

    updateGlobalCountryProfileProducing(
      _id: String
      countryId: String
      countryRegionId: String
      cultivatedArea: String
      production: String
      grindings: String
      chocolateManufacturing: String
      consumption: String
  
      
    ): String!

    deleteGlobalCountryProfileProducing(_id: String): String!

    createCountryProfileProducingFile(
      countryId: String
      type: String
      description: String
      fileUrl: String
    ): String

    updateCountryProfileProducingFile(
      _id: String
      countryId: String
      type: String
      description: String
      fileUrl: String
    ): String

    deleteCountryProfileProducingFile(_id: String!): String!

    createGlobalCountryProfileProducingTokenized(tokenized: String!): String!
    updateGlobalCountryProfileProducingTokenized(tokenized: String!): String!
    deleteGlobalCountryProfileProducingTokenized(tokenized: String!): String!

    createCountryProfileProducingFileTokenized(tokenized: String!): String!
    updateCountryProfileProducingFileTokenized(tokenized: String!): String!
    deleteCountryProfileProducingFileTokenized(tokenized: String!): String!    

  }
`;
