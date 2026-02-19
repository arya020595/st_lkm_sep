const SmallholderCensusDataBanci = `
  type SmallholderCensusDataBanci {
    _id: String!
    banciId: String
    shid: String
    name: String
    newKp: String
    oldKp: String
    address1: String
    address2: String
    address3: String
    postalCode: String
    negeri: String
    daerah: String
    mukim: String
    kampung: String
    lokasi: String
    parlimen: String
    tkhDaftar: String
    dun: String
    tempat: String
    userCreate: String
    createdDate: String
    userUpdate: String
    updatedDate: String
    recId: String
    mail1: String
    mail2: String
    mail3: String
    fax: String
    addressR1: String
    addressR2: String
    enId: String
    enDate: String
    suID: String
    validId: String
    validDate: String
    validStat: String
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [SmallholderCensusDataBanci];
exports.rootTypes = `
  scalar JSON
  type Query {
    allSmallholderCensusDataBanci(banciId: String): [SmallholderCensusDataBanci]
  }

  type Mutation {
    createSmallholderCensusDataBanci(inputJSON: JSON ): String
    updateSmallholderCensusDataBanci(inputJSON: JSON ): String
    deleteSmallholderCensusDataBanci(_id: String!, banciId: String! ): String
  }
`;
