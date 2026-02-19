const EntrepreneurProductionAndSales = `
  type EntrepreneurProductionAndSales {
    _id: String!
    Entrepreneur: Entrepreneur
    LocalState: LocalState
    stateId: String
    stateName: String
    entrepreneurId: String
    entrepreneurName: String

    year: Int
    month: Int
    monthName: String

    
    covertureMilk: Float
    covertureWhite: Float
    covertureDark: Float
    covertureTotal: Float
    
    compoundMilk: Float
    compoundWhite: Float
    compoundDark: Float
    compoundTotal: Float


    totalProduction: Float
    totalSales: Float

    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [EntrepreneurProductionAndSales];
exports.rootTypes = `
  type Query {
    allEntrepreneurProductionAndSaleses(yearMonth: String!): [EntrepreneurProductionAndSales]
  }

  type Mutation {
    createEntrepreneurProductionAndSales(
      entrepreneurId: String
      year: Int
      stateId: String

      month: Int
      monthName: String
  
      
      covertureMilk: Float
      covertureWhite: Float
      covertureDark: Float
      covertureTotal: Float
      
      compoundMilk: Float
      compoundWhite: Float
      compoundDark: Float
      compoundTotal: Float
  
  
      totalProduction: Float
      totalSales: Float
  
    
    ): String!
    updateEntrepreneurProductionAndSales(
      _id: String!
      entrepreneurId: String
      year: Int
      stateId: String

      month: Int
      monthName: String
  
      
      covertureMilk: Float
      covertureWhite: Float
      covertureDark: Float
      covertureTotal: Float
      
      compoundMilk: Float
      compoundWhite: Float
      compoundDark: Float
      compoundTotal: Float
  
  
      totalProduction: Float
      totalSales: Float
      
    ): String!
    
    deleteEntrepreneurProductionAndSales(_id: String!): String!

    generateProductionAndSalesRepoprt(
      fromDateIds: [String!]!
      toDateIds: [String!]!
      stateIds: [String!]!
      titleSuffix: String
      description: String
    ): String!

    exportProductionAndSalesExcel(year: Int!, month: Int!): String!
  }
`;
