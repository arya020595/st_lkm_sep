const SmallholderCensusForm = `
  type SmallholderCensusForm {
    _id: String!
    name: String
    description: String
    specs: JSON
    banciId: String
    _createdAt: String!
    _updatedAt: String!
  }

  type SmallholderCensusFormFilling {
    _id: String!
    formId: String!
    name: String
    description: String
    specs: JSON
    data: JSON
    smallholderId: String
    smallholder: Smallholder
    _createdAt: String!
    _updatedAt: String!
  }

  ################################################################################

  type SmallholderCensusQuestion {
    _id: String!
    _createdAt: String!
    _updatedAt: String!

    sectionId: String
    section: SmallholderRefQuestionnareSection
    subSectionId: String
    subSection: SmallholderRefQuestionnareSubSection
    questionCodeId: String
    questionCode: SmallholderRefQuestionnareQuestionCode

    type: String
    code: String
    question: String
    options: JSON
  }

  type SmallholderCensusQuestionnaire {
    _id: String!
    _createdAt: String!
    _updatedAt: String!

    year: String
    questionIds: [String]
    questions: [SmallholderCensusQuestion]
  }

  type SmallholderCensusQuestionnaireData {
    _id: String!
    _createdAt: String!
    _updatedAt: String!

    year: String
    questionnaireId: String
    questionIds: [String]
    questions: [SmallholderCensusQuestion]

    localRegionId: String
    localRegion: LocalRegion
    smallholderId: String
    smallholder: Smallholder

    data: JSON
  }
`;

exports.customTypes = [SmallholderCensusForm];
exports.rootTypes = `
  type Query {
    allSmallholderCensusQuestions: [SmallholderCensusQuestion!]!
    allSmallholderCensusQuestionnaires: [SmallholderCensusQuestionnaire!]!
    smallholderCensusQuestionnaireByYear (year: String): SmallholderCensusQuestionnaire
    allSmallholderCensusQuestionnaireData (
      year: String
      localRegionId: String
      smallholderId: String
    ): [SmallholderCensusQuestionnaireData!]!
    smallholderCensusQuestionnaireData (_id: String): SmallholderCensusQuestionnaireData

    ################################################################################

    allRefBanci: JSON
    allSmallholderCensusForms (banciId: String): [SmallholderCensusForm]
    smallholderCensusForm(_id: String!): SmallholderCensusForm
    allSmallholderCensusFormFillings (banciId: String, formId: String): [SmallholderCensusFormFilling]
    smallholderCensusFormFilling(_id: String!): SmallholderCensusFormFilling
  }

  type Mutation {
    createSmallholderCensusQuestion(
      sectionId: String
      subSectionId: String
      questionCodeId: String

      type: String
      code: String
      question: String
      options: JSON
    ): String!
    updateSmallholderCensusQuestion (
      _id: String!

      sectionId: String
      subSectionId: String
      questionCodeId: String

      type: String
      code: String
      question: String
      options: JSON
    ): String!
    deleteSmallholderCensusQuestion(_id: String!): String!

    createSmallholderCensusQuestionnaire(
      year: String
      questionIds: [String]
    ): String!
    updateSmallholderCensusQuestionnaire (
      _id: String!
      year: String
      questionIds: [String]
    ): String!
    deleteSmallholderCensusQuestionnaire(_id: String!): String!

    copySmallholderCensusQuestionnaire (
      _id: String!
      targetYear: String
    ): String!

    createSmallholderCensusQuestionnaireData(
      year: String
      # questionnaireId: String
      localRegionId: String
      smallholderId: String
      data: JSON
    ): SmallholderCensusQuestionnaireData!
    updateSmallholderCensusQuestionnaireData (
      _id: String!
      year: String
      questionnaireId: String
      localRegionId: String
      smallholderId: String
      data: JSON
    ): String!
    deleteSmallholderCensusQuestionnaireData(_id: String!): String!

    ################################################################################

    createSmallholderCensusForm(
      name: String!
      description: String!
      banciId: String!
    ): String!
    updateSmallholderCensusForm (
      _id: String!
      name: String
      description: String
      specs: JSON
    ): String!
    deleteSmallholderCensusForm(_id: String!): String!

    copySmallholderCensusForm(
      sourceFormId: String!
      name: String!
      description: String!
      banciId: String!
    ): String!

    generateSmallholderCensusFormPDF (
      _id: String!
    ): String!

    createSmallholderCensusFormFilling(
      formId: String!
      name: String!
      description: String!
      smallholderId: String
    ): SmallholderCensusFormFilling!
    updateSmallholderCensusFormFilling (
      _id: String!
      name: String
      description: String
      specs: JSON
      data: JSON
      smallholderId: String
    ): String!
    deleteSmallholderCensusFormFilling(_id: String!): String!

    generateMalaysianSmallholderReport(
      code: String!
      title: String!
      year: Int!
    ): String!
    generateSemenanjungSmallholderReport(
      code: String!
      title: String!
      year: Int!
    ): String!
    generateSabahSmallholderReport(
      code: String!
      title: String!
      year: Int!
    ): String!
    generateSarawakSmallholderReport(
      code: String!
      title: String!
      year: Int!
    ): String!
  }
`;
