const EstateCensusBuyer = `
  type EstateCensusBuyer {
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
exports.customTypes = [EstateCensusBuyer];
exports.rootTypes = `
  type Query{
    allEstateCensusBuyer(estateInformationId: String): [EstateCensusBuyer]
    estateCensusBuyerLatestRecordId: String
  }

  type Mutation {
    createEstateCensusBuyer(
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

    updateEstateCensusBuyer(
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

    deleteEstateCensusBuyer(_id: String!): String!
  }
`;
