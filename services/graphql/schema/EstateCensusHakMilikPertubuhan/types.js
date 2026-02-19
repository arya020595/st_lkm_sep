const EstateCensusHakMilikPertubuhan = `
  type EstateCensusHakMilikPertubuhan {
    _id: String!
    estateId: String
    code: String
    value: Float
    censusYear: Int
    EstateCensusHakMilikPertubuhanAndSeksyenInformation: EstateCensusHakMilikPertubuhanAndSeksyenInformation
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [EstateCensusHakMilikPertubuhan];
exports.rootTypes = `
  type CodeStatusPertubuhan {
      message: String!
      cvalid: String
      
      value: Float
      cvalid1: String
      cvalid2: String
      cvalid3: String
      formulaValue: String
      
  }
  type Query {
    allEstateCensusHakMilikPertubuhan(estateInformationId: String!): [EstateCensusHakMilikPertubuhan]
  }

  type Mutation {
    createEstateCensusHakMilikPertubuhan(
      estateId: String
      code: String
      value: Float
      censusYear: Int
    ): CodeStatusPertubuhan!

    updateEstateCensusHakMilikPertubuhan(
      _id: String!
      estateId: String
      code: String
      value: Float
      censusYear: Int
    ): CodeStatusPertubuhan!

    deleteEstateCensusHakMilikPertubuhan(
      _id: String!
    ): String!
  }
`;
