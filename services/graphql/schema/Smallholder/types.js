const Smallholder = `
  type Smallholder {
    _id: String!
    userGuid: String
    name: String
    nric: String 
    oric: String 
    citizenship: String 
    ethnic: String 
    gender: String 
    religion: String 
    maritalStatus: String 
    dateOfBirth: String 
    educationStatus: String 
    occupation: String 
    totalDependants: Int
    maleFamilyWorker: Int
    femaleFamilyWorker: Int 
    farmWorkedBy: String 
    residenceAddress: String 
    telephoneNo: String 
    districtGuid: String 
    isActive: Int
    isFamilyRelated: Int 
    stateName: String 
    dunName: String 
    perlimentName: String 
    mukimName: String 
    is_native: Int 
    postCode: String 
    city: String 
    status: String 
    statusDescription: String 
    kampungKelompok: String 
    award: String
    typeOfSmallholder: String

    LocalState: LocalState
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [Smallholder];
exports.rootTypes = `
  type Query {
    smallholderById (_id: String): Smallholder
    allSmallholders (pageIndex: Int, pageSize: Int, filters: String, typeOfSmallholder: String): [Smallholder]
    countSmallholders (filters: String): Int!
  }

  type Mutation {
    createSmallholder(
      userGuid: String
      name: String
      nric: String 
      oric: String 
      citizenship: String 
      ethnic: String 
      gender: String 
      religion: String 
      maritalStatus: String 
      dateOfBirth: String 
      educationStatus: String 
      occupation: String 
      totalDependants: Int
      maleFamilyWorker: Int
      femaleFamilyWorker: Int 
      farmWorkedBy: String 
      residenceAddress: String 
      telephoneNo: String 
      districtGuid: String 
      isActive: Int
      isFamilyRelated: Int 
      stateName: String 
      dunName: String 
      perlimentName: String 
      mukimName: String 
      is_native: Int 
      postCode: String 
      city: String 
      status: String 
      statusDescription: String 
      kampungKelompok: String 
      award: String

      stateId: String
      typeOfSmallholder: String

    ): String!

    updateSmallholder(
      _id: String!
      userGuid: String
      name: String
      nric: String 
      oric: String 
      citizenship: String 
      ethnic: String 
      gender: String 
      religion: String 
      maritalStatus: String 
      dateOfBirth: String 
      educationStatus: String 
      occupation: String 
      totalDependants: Int
      maleFamilyWorker: Int
      femaleFamilyWorker: Int 
      farmWorkedBy: String 
      residenceAddress: String 
      telephoneNo: String 
      districtGuid: String 
      isActive: Int
      isFamilyRelated: Int 
      stateName: String 
      dunName: String 
      perlimentName: String 
      mukimName: String 
      is_native: Int 
      postCode: String 
      city: String 
      status: String 
      statusDescription: String 
      kampungKelompok: String 
      award: String

      stateId: String
      typeOfSmallholder: String
    ): String!

    deleteSmallholder(_id: String!): String!
  }
`;
