const UnregisteredSmallholder = `
  type UnregisteredSmallholder {
    _id: String!
    name: String
    address: String
    dateOfBirth: String
    idCard: String
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [UnregisteredSmallholder];
exports.rootTypes = `
  type Query {
    allUnregisteredSmallholders: [UnregisteredSmallholder]
  }

  type Mutation {
    createUnregisteredSmallholder(
      name: String
      address: String
      dateOfBirth: String
      idCard: String
    ): String!

    updateUnregisteredSmallholder(
      _id: String!
      name: String
      address: String
      dateOfBirth: String
      idCard: String
    ): String!

    deleteUnregisteredSmallholder(_id: String!): String!
  }
`;
