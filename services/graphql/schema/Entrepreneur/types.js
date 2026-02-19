const Entrepreneur = `
  type Entrepreneur {
    _id: String!
    year: Int
    
    Category: Category
    name: String
    companyName: String
    companyRegistrationNumber: String
    contactAddress: String
    premiseAddress: String
    idCard: String
    email: String
    telephone: String
    gender: String
    race: String
    establishmentYear: Int
    level: Int
    state: String

    stateId: String
    registeredDate: String
    status: String
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [Entrepreneur];
exports.rootTypes = `
  type Query {
    allEntrepreneurs: [Entrepreneur]
  }

  type Mutation {
    createEntrepreneur(
      categoryId: String
      name: String
      companyName: String
      companyRegistrationNumber: String
      contactAddress: String
      premiseAddress: String
      idCard: String
      email: String
      telephone: String
      gender: String
      race: String
      level: Int
      establishmentYear: Int
      state: String

      registeredDate: String
      status: String
      stateId: String
    ): String!

    updateEntrepreneur(
      _id: String!
      categoryId: String
      name: String
      companyName: String
      companyRegistrationNumber: String
      contactAddress: String
      premiseAddress: String
      idCard: String
      email: String
      telephone: String
      gender: String
      race: String
      level: Int
      establishmentYear: Int
      state: String
      
      registeredDate: String
      status: String
      stateId: String
    ): String!

    deleteEntrepreneur(_id: String!): String!
  }
`;
