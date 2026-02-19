const SmallholderPangkalanData = `
  type SmallholderPangkalanData {    
    _id: String!,
    name: String,
    newKP: String,
    oldKP: String,
    address1: String,
    address2: String,
    address3: String,
    postalCode: String,
    phone: String,
    negeri: String,
    daerah: String,
    mukim: String,
    kampung: String,
    noLot: String,
    noGeran: String,
    gardenAddress: String,
    parlimen: String,
    dun: String,
    gender: String,
    nationality: String,
    bornYear: Int,
    age: Int,
    plantStatus: String,
    tunggal: Int,
    selingan: Int,
    jumlah: Int,
    hibrid: Int,
    klon: Int,
    luasDilulus: String,
    applStatus: String
    _createdAt: String
    _updatedAt: String
  }
`;

exports.customTypes = [SmallholderPangkalanData];
exports.rootTypes = `
  type Query {
    sabahSmallholderPangkalanData(
      pageIndex: Int, pageSize: Int, filters: String
    ): [SmallholderPangkalanData]
    semenanjungSmallholderPangkalanData(
      pageIndex: Int, pageSize: Int, filters: String
    ): [SmallholderPangkalanData]
    sarawakSmallholderPangkalanData(
      pageIndex: Int, pageSize: Int, filters: String
    ): [SmallholderPangkalanData]

    countSabahSmallholderPangkalanData: Int
    countSemenanjungSmallholderPangkalanData: Int
    countSarawakSmallholderPangkalanData: Int
  }

  type Mutation {
    createSmallholderPangkalanData(
      name: String,
      newKP: String,
      oldKP: String,
      address1: String,
      address2: String,
      address3: String,
      postalCode: String,
      phone: String,
      negeri: String,
      daerah: String,
      mukim: String,
      kampung: String,
      noLot: String,
      noGeran: String,
      gardenAddress: String,
      parlimen: String,
      dun: String,
      gender: String,
      nationality: String,
      bornYear: Int,
      age: Int,
      plantStatus: String,
      tunggal: Int,
      selingan: Int,
      jumlah: Int,
      hibrid: Int,
      klon: Int,
      luasDilulus: String,
      applStatus: String
    ): String

    updateSmallholderPangkalanData(
      _id: String
      name: String,
      newKP: String,
      oldKP: String,
      address1: String,
      address2: String,
      address3: String,
      postalCode: String,
      phone: String,
      negeri: String,
      daerah: String,
      mukim: String,
      kampung: String,
      noLot: String,
      noGeran: String,
      gardenAddress: String,
      parlimen: String,
      dun: String,
      gender: String,
      nationality: String,
      bornYear: Int,
      age: Int,
      plantStatus: String,
      tunggal: Int,
      selingan: Int,
      jumlah: Int,
      hibrid: Int,
      klon: Int,
      luasDilulus: String,
      applStatus: String
    ): String

    deleteSmallholderPangkalanData(
      _id: String
    ): String


  }
`;
