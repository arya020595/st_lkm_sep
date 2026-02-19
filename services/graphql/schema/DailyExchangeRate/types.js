const DailyExchangeRate = `
  type DailyExchangeRate {
    _id: String!
    date: String!
    sdr: Float
    usd: Float
    euro: Float
    yen: Float
    _createdAt: String!
    _updatedAt: String!
  }
`
exports.customTypes = [DailyExchangeRate]
exports.rootTypes = `
  type Query {
    allDailyExchangeRates: [DailyExchangeRate]
  }

  type Mutation {
    createDailyExchangeRate(
      date: String!
      sdr: Float
      usd: Float
      euro: Float
      yen: Float
    ): String!

    updateDailyExchangeRate(
      _id: String!
      date: String
      sdr: Float
      usd: Float
      euro: Float
      yen: Float
    ): String!

    deleteDailyExchangeRate(_id: String!): String!
  }
`