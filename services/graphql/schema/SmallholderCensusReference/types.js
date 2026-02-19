const SmallholderCensusRefDaerah = `
  type SmallholderCensusRefDaerah {
    _id: String!,
    daerah: String
    LDescription: String
    SDescription: String
    code: String
    negeri: String
    _createdAt: String!
    _updatedAt: String!
  }
`;

const SmallholderCensusRefMukim = `
  type SmallholderCensusRefMukim {
    _id: String!,
    mukim: String
    daerah: String
    negeri: String
    code: String
    LDescription: String
    SDescription: String
    _createdAt: String!
    _updatedAt: String!
  }
`;
const SmallholderCensusRefKampung = `
  type SmallholderCensusRefKampung {
    _id: String!,
    kampung: String
    mukim: String
    daerah: String
    negeri: String
    code: String
    LDescription: String
    SDescription: String
    _createdAt: String!
    _updatedAt: String!
  }
`;

const SmallholderCensusRefParlimen = `
  type SmallholderCensusRefParlimen {
    _id: String!,
    code: String
    region: String
    LDescription: String
    SDescription: String
    _createdAt: String!
    _updatedAt: String!
  }
`;

const SmallholderCensusRefParlimenDun = `
  type SmallholderCensusRefParlimenDun {
    _id: String!,
    parlimen: String
    region: String
    description: String
    dun: String
    negeri: String
    _createdAt: String!
    _updatedAt: String!
  }
`;

const SmallholderCensusRefBangsa = `
  type SmallholderCensusRefBangsa {
    _id: String!,
    code: String
    description: String
    region: String
    subCode: String
    _createdAt: String!
    _updatedAt: String!
  }
`;
const SmallholderCensusRefNegeri = `
  type SmallholderCensusRefNegeri {
    _id: String!,
    code: String
    LDescription: String
    SDescription: String
    _createdAt: String!
    _updatedAt: String!
  }
`;

const SmallholderCensusRefBanci = `
  type SmallholderCensusRefBanci {
    _id: String!,
    banciUpd: String
    consolGrp: String
    description: String
    startDate: String
    endDate: String
    region: String
    year: Int
    officer: String
    _createdAt: String!
    _updatedAt: String!
  }
`;

const SmallholderRefQuestionnareSection = `
  type SmallholderRefQuestionnareSection {
    _id: String!,
    section: String!
    _createdAt: String!
    _updatedAt: String! 
  }
`;

const SmallholderRefQuestionnareSubSection = `
  type SmallholderRefQuestionnareSubSection {
    _id: String!,
    subSection: String!
    _createdAt: String!
    _updatedAt: String! 
  }
`;
const SmallholderRefQuestionnareQuestionCode = `
  type SmallholderRefQuestionnareQuestionCode {
    _id: String!,
    code: String!
    _createdAt: String!
    _updatedAt: String! 
  }
`;

exports.customTypes = [
  SmallholderCensusRefDaerah,
  SmallholderCensusRefMukim,
  SmallholderCensusRefKampung,
  SmallholderCensusRefParlimen,
  SmallholderCensusRefParlimenDun,
  SmallholderCensusRefBangsa,
  SmallholderCensusRefNegeri,
  SmallholderCensusRefBanci,
  SmallholderRefQuestionnareSection,
  SmallholderRefQuestionnareSubSection,
  SmallholderRefQuestionnareQuestionCode,
];
exports.rootTypes = `
  scalar JSON
  type Query {
    allSmallholderCensusRefDaerah(negeri: [String]): [SmallholderCensusRefDaerah]
    allSmallholderCensusRefMukim(negeri: [String]): [SmallholderCensusRefMukim]
    allSmallholderCensusRefKampung(negeri: [String]): [SmallholderCensusRefKampung]
    allSmallholderCensusRefParlimen(negeri: [String]): [SmallholderCensusRefParlimen]
    allSmallholderCensusRefParlimenDun(negeri: [String]): [SmallholderCensusRefParlimenDun]
    allSmallholderCensusRefBangsa: [SmallholderCensusRefBangsa]
    allSmallholderCensusRefNegeri: [SmallholderCensusRefNegeri]
    allSmallholderCensusRefBanci: [SmallholderCensusRefBanci]

    allSmallholderRefQuestionnareQuestionCode: [SmallholderRefQuestionnareQuestionCode]
    allSmallholderRefQuestionnareSubSection:[SmallholderRefQuestionnareSubSection]
    allSmallholderRefQuestionnareSection: [SmallholderRefQuestionnareSection]
  }

  type Mutation {
    createSmallholderCensusRefBanci(input: JSON): String!
    updateSmallholderCensusRefBanci(_id: String, input: JSON): String!
    deleteSmallholderCensusRefBanci(_id: String): String!

    createSmallholderCensusRefDaerah(input: JSON): String!
    updateSmallholderCensusRefDaerah(_id: String, input: JSON): String!
    deleteSmallholderCensusRefDaerah(_id: String): String!

    createSmallholderCensusRefMukim(input: JSON): String!
    updateSmallholderCensusRefMukim(_id: String, input: JSON): String!
    deleteSmallholderCensusRefMukim(_id: String): String!

    createSmallholderRefKampung(input: JSON): String!
    updateSmallholderRefKampung(_id: String, input: JSON): String!
    deleteSmallholderRefKampung(_id: String): String!

    createSmallholderRefParlimen(input: JSON): String!
    updateSmallholderRefParlimen(_id: String, input: JSON): String!
    deleteSmallholderRefParlimen(_id: String): String!

    createSmallholderRefParlimenDun(input: JSON): String!
    updateSmallholderRefParlimenDun(_id: String, input: JSON): String!
    deleteSmallholderRefParlimenDun(_id: String): String!

    createSmallholderRefBangsa(input: JSON): String!
    updateSmallholderRefBangsa(_id: String, input: JSON): String!
    deleteSmallholderRefBangsa(_id: String): String!

    createSmallholderRefNegeri(input: JSON): String!
    updateSmallholderRefNegeri(_id: String, input: JSON): String!
    deleteSmallholderRefNegeri(_id: String): String!


    createSmallholderRefQuestionnareSection(input: JSON): String!
    updateSmallholderRefQuestionnareSection(_id: String, input: JSON): String!
    deleteSmallholderRefQuestionnareSection(_id: String): String!


    createSmallholderRefQuestionnareSubSection(input: JSON): String!
    updateSmallholderRefQuestionnareSubSection(_id: String, input: JSON): String!
    deleteSmallholderRefQuestionnareSubSection(_id: String): String!

    createSmallholderRefQuestionnareQuestionCode(input: JSON): String!
    updateSmallholderRefQuestionnareQuestionCode(_id: String, input: JSON): String!
    deleteSmallholderRefQuestionnareQuestionCode(_id: String): String!
  }
`;
