const Trader = `
  type Trader {
    _id: String!
    name: String
    address: String
    LocalState: LocalState
    Country: Country
    telephone: String
    email: String
    website: String

    branch: String
    
    #### FROM E-COCO #####
    correspondenceState: String #State --> URS

    
    _createdAt: String!
    _updatedAt: String!   
  }
`;
exports.customTypes = [Trader];
exports.rootTypes = `
  type Query {
    allTraders: [Trader]
    allTradersTokenized: String!
  }

  type Mutation {
    createTrader(
      name: String
      address: String
      localStateId: String
      countryId: String
      telephone: String
      email: String
      website: String
  
      branch: String
      
    ): String!

    updateTrader(
      _id: String!
      name: String
      address: String
      localStateId: String
      countryId: String
      telephone: String
      email: String
      website: String

      branch: String
    ): String!

    deleteTrader(_id: String!): String!
  }
`;
