const FuturePrice = `
  type FuturePrice {
    _id: String!

    date: String
    Source: Source
    

    londonHigh: Float
    londonLow: Float
    londonClosed: Float
    londonEx: Float
    

    nyHigh: Float
    nyLow: Float
    nyClosed: Float
    nyEx: Float
    

    
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [FuturePrice];
exports.rootTypes = `
  type Query {
    futurePriceByDate(date: String!): FuturePrice
    allFuturePrices(date: String!): [FuturePrice]
    countDataFuturePrices: Float
    allFuturePricesTokenized(date: String!): String!
    futurePriceByDateTokenized(date: String!): String!
  }

  type Mutation {
    createFuturePrice(
      date: String
      sourceId: String
      
      londonHigh: Float
      londonLow: Float
      londonClosed: Float
      londonEx: Float

      nyHigh: Float
      nyLow: Float
      nyClosed: Float
      nyEx: Float
     
      
    ): String!

    updateFuturePrice(
      _id: String!
      date: String
      sourceId: String

      londonHigh: Float
      londonLow: Float
      londonClosed: Float
      londonEx: Float
      
      nyHigh: Float
      nyLow: Float
      nyClosed: Float
      nyEx: Float
           
    ): String!

    deleteFuturePrice(_id: String!): String!
    createFuturePriceTokenized(tokenized: String!): String!
    updateFuturePriceTokenized(tokenized: String!): String!
    deleteFuturePriceTokenized(tokenized: String!): String!
  }
`;
