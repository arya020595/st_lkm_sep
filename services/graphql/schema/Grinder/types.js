const Grinder = `
  type Grinder {
    _id: String!
    name: String
    address: String
    LocalState: LocalState
    Country: Country
    Centre: Centre
    telephone: String
    email: String
    website: String

    branch: String
    factory: String

    productSpesification: String
    productManufactured: String
    market: String

    #### FROM E-COCO #####
    correspondenceState: String #State --> URS

    
    _createdAt: String!
    _updatedAt: String!   
  }
`;
exports.customTypes = [Grinder];
exports.rootTypes = `
  type Query {
    allGrinders: [Grinder]
  }

  type Mutation {
    createGrinder(
      name: String
      address: String
      localStateId: String
      countryId: String
      centreId: String
      telephone: String
      email: String
      website: String
  
      branch: String
      factory: String
  
      productSpesification: String
      productManufactured: String
    ): String!

    updateGrinder(
      _id: String!
      name: String
      address: String
      localStateId: String
      countryId: String
      centreId: String
      telephone: String
      email: String
      website: String
  
      branch: String
      factory: String
  
      productSpesification: String
      productManufactured: String
    ): String!

    deleteGrinder(_id: String!): String!
  }
`;
