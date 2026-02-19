const EstateCensusSeksyen = `
  type EstateCensusSeksyen {
    _id: String!
    estateId: String
    code: String
    value: Float
    censusYear: Int
    EstateCensusHakMilikPertubuhanAndSeksyenInformation: EstateCensusHakMilikPertubuhanAndSeksyenInformation

    statement: String
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [EstateCensusSeksyen];
exports.rootTypes = `
  type CodeStatusSeksyen {
    message: String!
    value: Float
    cvalid1: String
    cvalid2: String
    cvalid3: String
    formulaValue: String
    cvalid: String
  }
  type Query {
    allEstateCensusSeksyen(estateInformationId: String!, censusYear: Int): [EstateCensusSeksyen]
  }

  type Mutation {
    createEstateCensusSeksyen(
      estateId: String
      code: String
      value: Float
      censusYear: Int
      statement: String
    ): CodeStatusSeksyen

    updateEstateCensusSeksyen(
      _id: String!
      estateId: String
      code: String
      value: Float
      censusYear: Int
      statement: String
    ): CodeStatusSeksyen

    deleteEstateCensusSeksyen(
      _id: String!
    ): String!
  }
`;
