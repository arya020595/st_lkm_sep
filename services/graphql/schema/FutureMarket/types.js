const FutureMarket = `
  type FutureMarket {
    _id: String!

    date: String
    Source: Source
    InfoStatus: InfoStatus
    label: String

    londonHigh: Float
    londonLow: Float
    londonAvg: Float
    londonEx: Float
    londonPrice: Float

    nyHigh: Float
    nyLow: Float
    nyAvg: Float
    nyEx: Float
    nyPrice: Float

    sgHigh: Float
    sgLow: Float
    sgAvg: Float
    sgEx: Float
    sgPrice: Float

    iccoPoundsterling: Float
    iccoUSD: Float
    iccoEx: Float
    iccoPrice: Float

    different: Float
    
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [FutureMarket];
exports.rootTypes = `
  type Query {
    futureMarketByDate(date: String!): FutureMarket
    allFutureMarkets(date: String!): [FutureMarket]

    countDataFutureMarkets: Float

    getFutureMarketReutersPriceTotalByDate(date: String!): Int!
    getLastUpdateFutureMarketReutersPrice(date: String!): String!
    getLastUpdateFutureMarketReutersPricePushedToWBC(date: String!): String!

    allFutureMarketsTokenized(date: String!): String!
    futureMarketByDateTokenized(date: String!): String!
  }

  type Mutation {
    createFutureMarket(
      date: String
      sourceId: String
      infoStatusId: String
      label: String

      londonHigh: Float
      londonLow: Float
      londonAvg: Float
      londonEx: Float
      londonPrice: Float

      nyHigh: Float
      nyLow: Float
      nyAvg: Float
      nyEx: Float
      nyPrice: Float

      sgHigh: Float
      sgLow: Float
      sgAvg: Float
      sgEx: Float
      sgPrice: Float

      iccoPoundsterling: Float
      iccoUSD: Float
      iccoEx: Float
      iccoPrice: Float

      different: Float
      
    ): String!

    updateFutureMarket(
      _id: String!
      date: String
      sourceId: String
      infoStatusId: String
      label: String

      londonHigh: Float
      londonLow: Float
      londonAvg: Float
      londonEx: Float
      londonPrice: Float

      nyHigh: Float
      nyLow: Float
      nyAvg: Float
      nyEx: Float
      nyPrice: Float

      sgHigh: Float
      sgLow: Float
      sgAvg: Float
      sgEx: Float
      sgPrice: Float

      iccoPoundsterling: Float
      iccoUSD: Float
      iccoEx: Float
      iccoPrice: Float

      different: Float
    ): String!

    deleteFutureMarket(_id: String!): String!

    checkDuplicateFutureMarket(year: Int): [FutureMarket]
    resendFutureMarket(date: String!): String!

    createFutureMarketTokenized(tokenized: String!): String!
    updateFutureMarketTokenized(tokenized: String!): String!
    deleteFutureMarketTokenized(tokenized: String!): String!
  }
`;
