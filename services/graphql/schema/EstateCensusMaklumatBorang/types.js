const EstateCensusMaklumatBorang = `
  type EstateCensusMaklumatBorang {
    _id: String!
    estateStatus: String
    receiveDate: String
    createdDate: String
    editedDate1: String
    editedDate2: String
    operatorName1: String
    operatorName2: String
    officerName: String
    visitDate: String
    editorName1: String
    editorName2: String
    connName: String
    conPosition: String
    conDate: String
    conTelephone1: String
    conTelephone2: String
    conFax1: String
    conFax2: String
    censusYear: Int
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [EstateCensusMaklumatBorang];
exports.rootTypes = `
  type Query{
    allMaklumatBorang(estateInformationId: String): [EstateCensusMaklumatBorang]
  }

  type Mutation {
    createMaklumatBorang(
      estateId: String
      
      estateStatus: String
      receiveDate: String
      createdDate: String
      editedDate1: String
      editedDate2: String
      operatorName1: String
      operatorName2: String
      officerName: String
      visitDate: String
      editorName1: String
      editorName2: String
      connName: String
      conPosition: String
      conDate: String
      conTelephone1: String
      conTelephone2: String
      conFax1: String
      conFax2: String
      censusYear: Int
    ): String!

    updateMaklumatBorang(
      _id: String!
      estateId: String
      estateStatus: String
      receiveDate: String
      createdDate: String
      editedDate1: String
      editedDate2: String
      operatorName1: String
      operatorName2: String
      officerName: String
      visitDate: String
      editorName1: String
      editorName2: String
      connName: String
      conPosition: String
      conDate: String
      conTelephone1: String
      conTelephone2: String
      conFax1: String
      conFax2: String
      censusYear: Int
    ): String!

    deleteMaklumatBorang(_id: String!): String!
  }
`;
