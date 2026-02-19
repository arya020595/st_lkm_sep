const StaffList = `
  type StaffList {
    _id: String!
    name: String!
    staffId: String!
    department: String
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [StaffList];
exports.rootTypes = `
  input StaffCriteria {
    key: String!
    keyword: String!
    check: Boolean!
    sorted: Int
    label: String!
    dataReference: String
  }
  type Query {
    allStaffList: [StaffList]
  }
  type Mutation {
    searchStaffWithOrOperator(criteria: [StaffCriteria!]!, limit: Int): [StaffList]
  }
`;
