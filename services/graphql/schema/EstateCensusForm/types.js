const EstateCensusForm = `
  type EstateCensusForm {
    _id: String!
    name: String
    description: String
    specs: JSON
    _createdAt: String!
    _updatedAt: String!
  }

  type EstateCensusFormFilling {
    _id: String!
    formId: String!
    name: String
    description: String
    specs: JSON
    data: JSON
    _createdAt: String!
    _updatedAt: String!
  }
`;

exports.customTypes = [EstateCensusForm];
exports.rootTypes = `
  type Query {
    allEstateCensusForms: [EstateCensusForm]
    estateCensusForm(_id: String!): EstateCensusForm
    allEstateCensusFormFillings (formId: String): [EstateCensusFormFilling]
    estateCensusFormFilling(_id: String!): EstateCensusFormFilling
  }

  type Mutation {
    createEstateCensusForm(
      name: String!
      description: String!
    ): String!
    updateEstateCensusForm (
      _id: String!
      name: String
      description: String
      specs: JSON
    ): String!
    deleteEstateCensusForm(_id: String!): String!

    copyEstateCensusForm(
      sourceFormId: String!
      name: String!
      description: String!
    ): String!

    generateEstateCensusFormPDF (
      _id: String!
    ): String!

    createEstateCensusFormFilling(
      formId: String!
      name: String!
      description: String!
    ): EstateCensusFormFilling!
    updateEstateCensusFormFilling (
      _id: String!
      name: String
      description: String
      specs: JSON
      data: JSON
    ): String!
    deleteEstateCensusFormFilling(_id: String!): String!


  }
`;
