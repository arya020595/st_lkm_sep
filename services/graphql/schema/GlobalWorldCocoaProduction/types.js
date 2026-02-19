const GlobalWorldCocoaProduction = `
  type GlobalWorldCocoaProduction {
    _id: String!
    year: String
    grossCorp: Float
    grindings: Float
    surplus: Float
    deficit: Float
    totalEndOfSeasonStocks: Float
    iccoBufferStocks: Float
    freeStocks: Float
    totalStocks: Float
    usdAnnualAve: Float
    sdrAnnualAve: Float
    _createdAt: String!
    _updatedAt: String!
  }
`
exports.customTypes = [GlobalWorldCocoaProduction]
exports.rootTypes = `
  type Query {
    allGlobalWorldCocoaProductions(year: String, years: [String!]): [GlobalWorldCocoaProduction]
    countGlobalWorldCocoaProductions: Float
    allGlobalWorldCocoaProductionsTokenized(year: String, years: [String!]): String!
  }

  type Mutation {
    createGlobalWorldCocoaProduction(
      year: String
      grossCorp: Float
      grindings: Float
      surplus: Float
      deficit: Float
      totalEndOfSeasonStocks: Float
      iccoBufferStocks: Float
      freeStocks: Float
      totalStocks: Float
      usdAnnualAve: Float
      sdrAnnualAve: Float
    ): String!

    updateGlobalWorldCocoaProduction(
      _id: String!
      year: String
      grossCorp: Float
      grindings: Float
      surplus: Float
      deficit: Float
      totalEndOfSeasonStocks: Float
      iccoBufferStocks: Float
      freeStocks: Float
      totalStocks: Float
      usdAnnualAve: Float
      sdrAnnualAve: Float
    ): String!

    deleteGlobalWorldCocoaProduction(_id: String!): String!

    createGlobalWorldCocoaProductionTokenized(tokenized: String!): String!
    updateGlobalWorldCocoaProductionTokenized(tokenized: String!): String!
    deleteGlobalWorldCocoaProductionTokenized(tokenized: String!): String!
  }
`