const EstateInformation = `
  type EstateInformation {
    _id: String!
    estateId: String
    recordType: String
    stateCode: String
    districtCode: String
    estateType: String
    estateName: String
    estateAddress1: String
    estateAddress2: String
    estateAddress3: String
    estateCity: String
    estateState: String
    estateZip: String
    estateInfo: String
    estateTelephone1: String
    estateTelephone2: String
    estateTelephone3: String
    estateFax1: String
    estateFax2: String
    estateFax3: String
    headQuarterAgent: String
    headQuarterAddress1: String
    headQuarterAddress2: String
    headQuarterAddress3: String
    headQuarterCity: String
    headQuarterState: String
    headQuarterZip: String
    headQuarterTelephone1: String
    headQuarterTelephone2: String
    headQuarterTelephone3: String
    headQuarterFax1: String
    headQuarterFax2: String
    headQuarterFax3: String
    postName: String
    postAddress: String
    postAddress1: String
    postAddress2: String
    postCity: String
    postState: String
    postsZip: String
    postTelephone1: String
    postTelephone2: String
    postTelephone3: String
    postFax1: String
    postFax2: String
    postFax3: String
    postSir: String
    postCont: String
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [EstateInformation];
exports.rootTypes = `
  type Query {
    allEstateInformation(
      recordType: String
      stateCode: String
      districtCode: String
      estateId: String
      estateType: String

      pageNumber: Int
    ): [EstateInformation]

    getOneEstateInformation(
      recordType: String
      stateCode: String
      districtCode: String
      estateId: String
      estateType: String
    ): EstateInformation
    countEstateInformation: Int
  }

  type Mutation {
    createEstateInformation(
      estateId: String
      recordType: String
      stateCode: String
      districtCode: String
      estateType: String
      estateName: String
      estateAddress1: String
      estateAddress2: String
      estateAddress3: String
      estateCity: String
      estateState: String
      estateZip: String
      estateInfo: String
      estateTelephone1: String
      estateTelephone2: String
      estateTelephone3: String
      estateFax1: String
      estateFax2: String
      estateFax3: String
      headQuarterAgent: String
      headQuarterAddress1: String
      headQuarterAddress2: String
      headQuarterAddress3: String
      headQuarterCity: String
      headQuarterState: String
      headQuarterZip: String
      headQuarterTelephone1: String
      headQuarterTelephone2: String
      headQuarterTelephone3: String
      headQuarterFax1: String
      headQuarterFax2: String
      headQuarterFax3: String
      postName: String
      postAddress: String
      postAddress1: String
      postAddress2: String
      postCity: String
      postState: String
      postsZip: String
      postTelephone1: String
      postTelephone2: String
      postTelephone3: String
      postFax1: String
      postFax2: String
      postFax3: String
      postSir: String
      postCont: String
    ): String!

    updateEstateInformation(
      _id: String!
      estateId: String
      recordType: String
      stateCode: String
      districtCode: String
      estateType: String
      estateName: String
      estateAddress1: String
      estateAddress2: String
      estateAddress3: String
      estateCity: String
      estateState: String
      estateZip: String
      estateInfo: String
      estateTelephone1: String
      estateTelephone2: String
      estateTelephone3: String
      estateFax1: String
      estateFax2: String
      estateFax3: String
      headQuarterAgent: String
      headQuarterAddress1: String
      headQuarterAddress2: String
      headQuarterAddress3: String
      headQuarterCity: String
      headQuarterState: String
      headQuarterZip: String
      headQuarterTelephone1: String
      headQuarterTelephone2: String
      headQuarterTelephone3: String
      headQuarterFax1: String
      headQuarterFax2: String
      headQuarterFax3: String
      postName: String
      postAddress: String
      postAddress1: String
      postAddress2: String
      postCity: String
      postState: String
      postsZip: String
      postTelephone1: String
      postTelephone2: String
      postTelephone3: String
      postFax1: String
      postFax2: String
      postFax3: String
      postSir: String
      postCont: String
    ): String!

    deleteEstateInformation(_id: String!): String!

  }
`;
