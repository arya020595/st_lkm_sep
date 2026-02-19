const EstateCensusReport = `
  type EstateCensusReport {
    _id: String!
    _createdAt: String!
    _updatedAt: String!
  }
`;

const EstateCensusStateCode = `
  type EstateCensusStateCode {
    _id: String!
    stateCode: String!
    country: String!
    stateName: String!
    _createdAt: String!
    _updatedAt: String!
  }
`;

const EstateCensusStateDistrict = `
  type EstateCensusStateDistrict {
    _id: String!
    districtCode: String!
    districtName: String!
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [
  EstateCensusReport,
  EstateCensusStateCode,
  EstateCensusStateDistrict,
];
exports.rootTypes = `
  type Query {
    allEstateCensusReports: [EstateCensusReport]
    allEstateCensusStateDistricts: [EstateCensusStateDistrict]
    allEstateCensusStateCodes: [EstateCensusStateCode]
  }
  type Mutation {
    generateEstateCensusReportLuasKawasanKoko(
      year: Int!  
    ): String!
    generateEstateCensusReportTarafSahJenisHakMilik (
      year: Int!  
    ): String!
    generateEstateCensusReportProfileUmur (
      year: Int!  
    ): String!
    generateEstateCensusReportKeluasanPengeluaranHasil (
      year: Int!  
    ): String!
    generateEstateCensusReportPertambahanKeluasan01 (
      year: Int!  
    ): String!
    generateEstateCensusReportPertambahanKeluasan02 (
      year: Int!  
    ): String!
    generateEstateCensusReportPertambahanKeluasan03 (
      year: Int!  
    ): String!
    generateListOfEstateWithTotalHectarage (
      year: Int!  
    ): String!

    generateEstateCensusReport(
      code: String!
      title: String!
      year: Int!
    ): String!
    generateMalaysianReport(
      code: String!
      title: String!
      year: Int!
    ): String!
    generateSemenanjungReport(
      code: String!
      title: String!
      year: Int!
    ): String!
    generateSabahReport(
      code: String!
      title: String!
      year: Int!
    ): String!
    generateSarawakReport(
      code: String!
      title: String!
      year: Int!
    ): String!
  }
`;
