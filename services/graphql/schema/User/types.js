const User = `
  scalar JSON

  type User {
    _id: String!
    employeeId: String
    email: String
    phone: String
    roleId: String!

    Role: UserRole
    LocalRegion: [LocalRegion]

    status: String!
    
    name: String
    address: String
    pictureUrl: String
    
    tags: [String!]
    lastLoginAt: String
    deptCode: String

    _createdAt: String!
    _updatedAt: String!
  }

  type UserRole {
    _id: String!
    name: String!
    privileges: [String!]!
    countUsers: Int!
    _createdAt: String!
    _updatedAt: String!
  }

  type UserSession {
    _id: String!
    User: User!
    token: String!
    expiresIn: String
    _createdAt: String!
    _updatedAt: String!
  }
`;

exports.customTypes = [User];
exports.rootTypes = `
  type Query {
    allUsers: [User!]!
    allUserRoles: [UserRole!]!
    currentUser: User
  }

  type Mutation {
    registerUser (
      employeeId: String!
      password: String
      roleId: String
      email: String
      phone: String
      status: String!
      deptCode: String

      regionIds: [String]
    ): User!
    deleteUser (_id: String!): String
    deactivateUser (_id: String!): String
    activateUser (_id: String!): String
    updateUser (
      _id: String!
      employeeId: String
      email: String
      phone: String
      name: String
      address: String
      pictureUrl: String
      deptCode: String
      regionIds: [String]
      roleId: String
    ): String
    updateRoleForUser (
      _id: String!
      roleId: String!
    ): String
    updateUserPassword (
      _id: String!
      #oldPassword: String!
      newPassword: String!
    ): String
    resetUserPassword (
      _id: String!
      newPassword: String!
    ): String

    updateTagsForUser (
      _id: String!
      tags: [String!]!
    ): String

    createUserRole (
      name: String!
      privileges: [String!]!  
    ): UserRole!
    updateUserRole (
      _id: String!
      name: String!
      privileges: [String!]!
    ): String
    deleteUserRole (_id: String!): String

    logIn (
      employeeId: String!
      password: String!
      wontExpired: Boolean
    ): UserSession!
    logOut: String

    logInByEmployeeId (
      employeeId: String!
      wontExpired: Boolean
    ): UserSession!

    exportCollectionDataAsExcel(exportConfig: JSON!): String!

    checkEmployeeIdAndPassword(employeeId: String!, password: String!): String!

    checkEmployeeIdAndPasswordTokenized(tokenizedInput: String!): String!
  }
`;
