const BasicCocoaStatisticDomesticGrinding = `
  type DomesticGrindingPriceObj {
    cocoaButter: Float
    cocoaLiquorMass: Float
    cocoaPowder: Float
    cocoaCake: Float
  }

  type DomesticGrindingFOBObj {
    cocoaButter: Float
    cocoaLiquorMass: Float
    cocoaPowder: Float
    cocoaCake: Float
  }

  type DomesticMonthlyLocalSalesFOBObj {
    cocoaButter: Float
    cocoaLiquorMass: Float
    cocoaPowder: Float
    cocoaCake: Float
  }

  type DomesticMonthlyExportFOBObj {
    cocoaButter: Float
    cocoaLiquorMass: Float
    cocoaPowder: Float
    cocoaCake: Float
  }

  

  type BasicCocoaStatisticDomesticGrinding {
    _id: String!
    year: Int!
    month: Int!
    monthName: String
    LocalRegion: LocalRegion

    localPurchase: Float
    importedPurchase: Float

    grindingsTotal: Float
    grindingsCapacity: Float

    production: DomesticGrindingPriceObj
    fob: DomesticGrindingFOBObj

    capacity: Float

    #### REVISION ######
    localPurchaseSabah: Float
    localPurchaseSarawak: Float
    localPurchasePeninsula: Float

    totalGrindingLocalBean: Float
    totalGrindingImportedBean: Float
    
    stockLocalBean: Float
    stockImportedBean: Float
    stockTotal: Float
    

    MonthlyLocalSales: DomesticMonthlyLocalSalesFOBObj
    MonthlyExport: DomesticMonthlyExportFOBObj

    averageRatioCocoaButter: Float
    averageRatioCocoaPowder: Float



    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [BasicCocoaStatisticDomesticGrinding];

exports.rootTypes = `
  input DomesticGrindingPriceObjInput {
    cocoaButter: Float
    cocoaLiquorMass: Float
    cocoaPowder: Float
    cocoaCake: Float
  }

  input DomesticGrindingFOBObjInput {
    cocoaButter: Float
    cocoaLiquorMass: Float
    cocoaPowder: Float
    cocoaCake: Float
  }
  

  input DomesticMonthlyLocalSalesFOBObjInput {
    cocoaButter: Float
    cocoaLiquorMass: Float
    cocoaPowder: Float
    cocoaCake: Float
  }

  input DomesticMonthlyExportFOBObjInput {
    cocoaButter: Float
    cocoaLiquorMass: Float
    cocoaPowder: Float
    cocoaCake: Float
  }

  type Query {
    allBasicCocoaStatisticDomesticGrindings(year: String, years: [String!]): [BasicCocoaStatisticDomesticGrinding]
    countBasicCocoaStatisticDomesticGrindings: Float

    allBasicCocoaStatisticDomesticGrindingsTokenized(year: String, years: [String!]): String!
  }

  type Mutation {
    createBasicCocoaStatisticDomesticGrinding(
      year: Int!
      month: Int!
      monthName: String
      regionId: String
  
      localPurchase: Float
      importedPurchase: Float
  
      grindingsTotal: Float
      grindingsCapacity: Float
  
      production: DomesticGrindingPriceObjInput
      fob: DomesticGrindingFOBObjInput
      capacity: Float

      #### REVISION ######
      localPurchaseSabah: Float
      localPurchaseSarawak: Float
      localPurchasePeninsula: Float
      importedPurchaseBean: Float

      totalGrindingLocalBean: Float
      totalGrindingImportedBean: Float

      stockLocalBean: Float
      stockImportedBean: Float
      stockTotal: Float

      monthlyLocalSales: DomesticMonthlyLocalSalesFOBObjInput
      monthlyExport: DomesticMonthlyExportFOBObjInput

      averageRatioCocoaButter: Float
      averageRatioCocoaPowder: Float

    ): String!

    updateBasicCocoaStatisticDomesticGrinding(
      _id: String!
      year: Int
      month: Int
      monthName: String
      regionId: String
  
      localPurchase: Float
      importedPurchase: Float
  
      grindingsTotal: Float
      grindingsCapacity: Float
  
      production: DomesticGrindingPriceObjInput
      fob: DomesticGrindingFOBObjInput
      capacity: Float

      #### REVISION ######
      localPurchaseSabah: Float
      localPurchaseSarawak: Float
      localPurchasePeninsula: Float
      importedPurchaseBean: Float

      totalGrindingLocalBean: Float
      totalGrindingImportedBean: Float

      stockLocalBean: Float
      stockImportedBean: Float
      stockTotal: Float

      monthlyLocalSales: DomesticMonthlyLocalSalesFOBObjInput
      monthlyExport: DomesticMonthlyExportFOBObjInput

      averageRatioCocoaButter: Float
      averageRatioCocoaPowder: Float
    ): String!

    deleteBasicCocoaStatisticDomesticGrinding(_id: String!): String!


    createBasicCocoaStatisticDomesticGrindingTokenized(tokenizedInput: String!): String!
    updateBasicCocoaStatisticDomesticGrindingTokenized(tokenizedInput: String!): String!
    deleteBasicCocoaStatisticDomesticGrindingTokenized(tokenizedInput: String!): String!
    
  }
`;
