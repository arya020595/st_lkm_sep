const Manufacture = `
  type Manufacture {
    _id: String!
    year: Int

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
    
    status: String

    stateName: String
    countryName: String
    centreName: String

    _createdAt: String!
    _updatedAt: String!   
  }
`;
exports.customTypes = [Manufacture];
exports.rootTypes = `
  type Query {
    allManufactures: [Manufacture]
  }

  type Mutation {
    createManufacture(
      year: Int

      name: String
      address: String
      stateId: String
      countryId: String
      centreId: String
      telephone: String
      email: String
      website: String
  
      branch: String
      factory: String
  
      productSpesification: String
      productManufactured: String

      status: String
    ): String!

    updateManufacture(
      _id: String!
      year: Int

      name: String
      address: String
      stateId: String
      countryId: String
      centreId: String
      telephone: String
      email: String
      website: String
  
      branch: String
      factory: String
  
      productSpesification: String
      productManufactured: String
      status: String
    ): String!

    deleteManufacture(_id: String!): String!
  }
`;
