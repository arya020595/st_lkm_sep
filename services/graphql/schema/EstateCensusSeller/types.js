const EstateCensusSeller = `
  type EstateCensusSeller {
    _id: String!
    estateId: String
    name: String
    address: String
    zipCode: String
    telephone: String
    date: String
    status: String
    statement: String
    censusYear: Int
    recordId: String
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [EstateCensusSeller];
exports.rootTypes = `
  type Query{
    allEstateCensusSeller(estateInformationId: String): [EstateCensusSeller]
    estateCensusSellerLatestRecordId: String
  }

  type Mutation {
    createEstateCensusSeller(
      estateId: String
      name: String
      address: String
      zipCode: String
      telephone: String
      date: String
      status: String
      statement: String
      censusYear: Int
      recordId: String
      estateInformationId: String
    ): String!

    updateEstateCensusSeller(
      _id: String!
      estateId: String
      name: String
      address: String
      zipCode: String
      telephone: String
      date: String
      status: String
      statement: String
      censusYear: Int
      recordId: String
      estateInformationId: String
    ): String!

    deleteEstateCensusSeller(_id: String!): String!
  }
`;
