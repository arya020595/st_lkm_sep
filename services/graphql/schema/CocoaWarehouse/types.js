const CocoaWarehouse = `
  type CocoaWarehouse {
    _id: String!
    name: String
    address: String
    LocalState: LocalState
    Country: Country
    telephone: String
    email: String
    website: String

    branch: String
    
    _createdAt: String!
    _updatedAt: String!   
  }
`;
exports.customTypes = [CocoaWarehouse];
exports.rootTypes = `
  type Query {
    allCocoaWarehouses: [CocoaWarehouse]
  }

  type Mutation {
    createCocoaWarehouse(
      name: String
      address: String
      localStateId: String
      countryId: String
      telephone: String
      email: String
      website: String
  
      branch: String
      
    ): String!

    updateCocoaWarehouse(
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

    deleteCocoaWarehouse(_id: String!): String!
  }
`;
