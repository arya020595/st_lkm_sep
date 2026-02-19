const BasicCocoaStatisticGlobalPriceReuters = `
  type BasicCocoaStatisticGlobalPriceReuters {
    _id: String!
    date: String

    londonHigh: Float
    londonLow: Float
    londonAvg: Float
    londonEX: Float
    londonPrice: Float

    nyHigh: Float
    nyLow: Float
    nyAvg: Float
    nyEX: Float
    nyPrice: Float

    sgHigh: Float
    sgLow: Float
    sgAvg: Float
    sgEX: Float
    sgPrice: Float

    iccoPound: Float
    iccoUSD: Float
    iccoEX: Float
    iccoPrice: Float

    different: Float
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [BasicCocoaStatisticGlobalPriceReuters];
exports.rootTypes = `
  type Query {
    allBasicCocoaStatisticGlobalPriceReuters(year: String): [BasicCocoaStatisticGlobalPriceReuters]
    countBasicCocoaStatisticGlobalPriceReuters: Float
  }

  type Mutation {
    createBasicCocoaStatisticGlobalPriceReuters(
      date: String

      londonHigh: Float
      londonLow: Float
      londonAvg: Float
      londonEX: Float
      londonPrice: Float
  
      nyHigh: Float
      nyLow: Float
      nyAvg: Float
      nyEX: Float
      nyPrice: Float
  
      sgHigh: Float
      sgLow: Float
      sgAvg: Float
      sgEX: Float
      sgPrice: Float
  
      iccoPound: Float
      iccoUSD: Float
      iccoEX: Float
      iccoPrice: Float
  
      different: Float 
    ): String

    updateBasicCocoaStatisticGlobalPriceReuters(
      _id: String!
      date: String

      londonHigh: Float
      londonLow: Float
      londonAvg: Float
      londonEX: Float
      londonPrice: Float
  
      nyHigh: Float
      nyLow: Float
      nyAvg: Float
      nyEX: Float
      nyPrice: Float
  
      sgHigh: Float
      sgLow: Float
      sgAvg: Float
      sgEX: Float
      sgPrice: Float
  
      iccoPound: Float
      iccoUSD: Float
      iccoEX: Float
      iccoPrice: Float
  
      different: Float 
    ): String

    deleteBasicCocoaStatisticGlobalPriceReuters(_id: String!): String!
  }
`;
