const EstateCensusHakMilikPertubuhanAndSeksyenInformation = `
  type EstateCensusHakMilikPertubuhanAndSeksyenInformation {
    _id: String!
    code: String
    description: String

    ncheck: String
    cvalid1: String
    cvalid2: String
    cvalid3: String

    value: Float
    lstate: Boolean   
    
    getValueFromLastYear: Boolean

    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [EstateCensusHakMilikPertubuhanAndSeksyenInformation];
exports.rootTypes = `
  type Query {
    allEstateCensusHakMilikPertubuhanAndSeksyenInformation: [EstateCensusHakMilikPertubuhanAndSeksyenInformation]
    paginatedEstateCensusHakMilikPertubuhanAndSeksyenInformation(
      pageIndex: Int,
      pageSize: Int, 
      filters: String,
    ): [EstateCensusHakMilikPertubuhanAndSeksyenInformation]

    countValidationCode: Int!
  }
  type Mutation {
    estateCensusHakMilikAndSeksyenInfoByCode(code: String!, estateId: String, year: Int, value: Float): EstateCensusHakMilikPertubuhanAndSeksyenInformation
    createEstateCensusHakMilikPertubuhanAndSeksyenCode(
      code: String
      description: String
      ncheck: String
      cvalid1: String
      cvalid2: String
      cvalid3: String
      getValueFromLastYear: Float
    ): String!

    updateEstateCensusHakMilikPertubuhanAndSeksyenCode(
      _id: String!
      code: String
      description: String
      ncheck: String
      cvalid1: String
      cvalid2: String
      cvalid3: String
      getValueFromLastYear: Float
    ): String!

    deleteEstateCensusHakMilikPertubuhanAndSeksyenCode(
      _id: String!
    ): String!
  }
`;
