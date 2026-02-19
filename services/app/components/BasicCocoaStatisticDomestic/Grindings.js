import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { withApollo } from "../../libs/apollo";
import {
  showLoadingSpinner,
  hideLoadingSpinner,
  useNotification,
} from "../../components/App";
import { handleError } from "../../libs/errors";
import redirect from "../../libs/redirect";
import gql from "graphql-tag";
import {
  useMutation,
  useQuery,
  useApolloClient,
  ApolloProvider,
} from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";
import AdminArea from "../../components/AdminArea";
import Table from "../../components/Table";
import { FormModal } from "../../components/Modal";
import NumberFormat from "react-number-format";
import { SingleSelect } from "../../components/form/SingleSelect";
import { MultiYearsFilterWithExport } from "../../components/MultiYearsFilterWithExport";

import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

import dayjs from "dayjs";

const QUERY = gql`
  query listQueries($year: String!, $years: [String!]) {
    allBasicCocoaStatisticDomesticGrindingsTokenized(year: $year, years: $years)
    countBasicCocoaStatisticDomesticGrindings
  }
`;

const CREATE_BCS_DOMESTIC_GRINDINGS = gql`
  mutation createBasicCocoaStatisticDomesticGrindingTokenized(
    $tokenizedInput: String!
  ) {
    createBasicCocoaStatisticDomesticGrindingTokenized(
      tokenizedInput: $tokenizedInput
    )
  }
`;

const UPDATE_BCS_DOMESTIC_GRINDINGS = gql`
  mutation updateBasicCocoaStatisticDomesticGrindingTokenized(
    $tokenizedInput: String!
  ) {
    updateBasicCocoaStatisticDomesticGrindingTokenized(
      tokenizedInput: $tokenizedInput
    )
  }
`;
const DELETE_BCS_DOMESTIC_GRINDINGS = gql`
  mutation deleteBasicCocoaStatisticDomesticGrindingTokenized(
    $tokenizedInput: String!
  ) {
    deleteBasicCocoaStatisticDomesticGrindingTokenized(
      tokenizedInput: $tokenizedInput
    )
  }
`;
const BasicCocoaStatisticCultivatedArea = ({
  currentUserDontHavePrivilege,
}) => {
  const client = useApolloClient();
  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();
  let [savedCount, setSavedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [allBasicCocoaStatisticDomesticGrindings, setBCSGrinding] = useState(
    [],
  );
  const [countBasicCocoaStatisticDomesticGrindings, setCountData] = useState(0);

  const YEARS = useMemo(() => {
    const toYear = parseInt(dayjs().get("year"));
    const fromYear = 1980;
    // console.log([...new Array(toYear - fromYear)])
    return [...new Array(toYear - fromYear)].map((_, index) => {
      // console.log(index, toYear, toYear - index)
      return String(toYear - index);
    });
  }, []);

  // const year = String(router.query.year || dayjs().format("YYYY"));

  const [year, setYear] = useState(YEARS[0]);
  const [years, setYears] = useState([year]);

  const [createBasicCocoaStatisticDomesticGrindingTokenized] = useMutation(
    CREATE_BCS_DOMESTIC_GRINDINGS,
  );
  const [updateBasicCocoaStatisticDomesticGrindingTokenized] = useMutation(
    UPDATE_BCS_DOMESTIC_GRINDINGS,
  );
  const [deleteBasicCocoaStatisticDomesticGrindingTokenized] = useMutation(
    DELETE_BCS_DOMESTIC_GRINDINGS,
  );

  const fetchData = async (year, years) => {
    const result = await client.query({
      query: QUERY,
      variables: {
        year,
        years,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedData =
      result.data?.allBasicCocoaStatisticDomesticGrindingsTokenized || "";
    if (encryptedData) {
      const decrypted = jwt.verify(encryptedData, TOKENIZE);
      setBCSGrinding(decrypted.results);
    }

    setCountData(result.data.countBasicCocoaStatisticDomesticGrindings);
  }

  useEffect(() => {
    showLoadingSpinner();
    try {
      setLoading(true);
      fetchData(year, years)

      setLoading(false);
    } catch (err) {
      notification.handleError(err);
    }
    hideLoadingSpinner();
  }, [year, years, savedCount]);

  const columns = useMemo(() => [
    {
      Header: "Year",
      accessor: "year",
      style: {
        fontSize: 20,
        width: 80,
      },
      disableFilters: true,
    },
    {
      Header: "Month",
      accessor: "monthName",
      style: {
        fontSize: 20,
      },
    },
    // {
    //   Header: "Region",
    //   accessor: "LocalRegion.description",
    //   style: {
    //     fontSize: 20,
    //     width: 250,
    //   },
    // },

    // {
    //   Header: "Local Purchase",
    //   accessor: "localPurchase",
    //   style: {
    //     fontSize: 20,
    //   },
    //   Cell: props => (
    //     <span>
    //       {Number(props.value)
    //         .toLocaleString("en-GB")
    //         .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
    //     </span>
    //   ),
    // },
    {
      Header: "Imported Purchase",
      accessor: "importedPurchase",
      style: {
        fontSize: 20,
      },
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },

    {
      Header: "Grindings Total",
      accessor: "grindingsTotal",
      style: {
        fontSize: 20,
      },
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },
    {
      Header: "Grindings Capacity",
      accessor: "grindingsCapacity",
      style: {
        fontSize: 20,
      },
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },
    {
      Header: "Prod. Cocoa Butter",
      accessor: "production.cocoaButter",
      style: {
        fontSize: 20,
      },
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },
    {
      Header: "Prod. Cocoa Liq Mass",
      accessor: "production.cocoaLiquorMass",
      style: {
        fontSize: 20,
      },
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },
    {
      Header: "Prod. Cocoa Powder",
      accessor: "production.cocoaPowder",
      style: {
        fontSize: 20,
      },
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },
    {
      Header: "Prod. Cocoa Cake",
      accessor: "production.cocoaCake",
      style: {
        fontSize: 20,
      },
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },

    {
      Header: "FOB. Cocoa Liq Mass",
      accessor: "fob.cocoaLiquorMass",
      style: {
        fontSize: 20,
      },
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },
    {
      Header: "FOB. Cocoa Powder",
      accessor: "fob.cocoaPowder",
      style: {
        fontSize: 20,
      },
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },
    {
      Header: "FOB. Cocoa Cake",
      accessor: "fob.cocoaCake",
      style: {
        fontSize: 20,
      },
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },
  ]);

  const customUtilities = useMemo(() => [
    {
      label: "Edit",
      icon: <i className="fa fa-pencil" />,
      width: 400,
      render: propsTable => {
        return (
          <div className="flex">
            <button
              onClick={e => {
                if (e) e.preventDefault();
                const year = propsTable.row.original.year;
                let month = propsTable.row.original.month;

                if (month < 10) {
                  month = "0" + month;
                }
                const yearMonth = `${year}-${month}`;

                setModalVisible(true);
                setFormData({
                  ...propsTable.row.original,
                  regionId: propsTable.row.original.LocalRegion?._id || "",
                  production: propsTable.row.original.production || {},
                  fob: propsTable.row.original.fob || {},
                  monthlyLocalSales:
                    propsTable.row.original.MonthlyLocalSales || {},
                  monthlyExport: propsTable.row.original.MonthlyExport || {},

                  yearMonth,
                });
              }}
              className="mb-1 bg-yellow-500 hover:bg-orange-600 mx-1 py-2 px-2 text-white focus:outline-none rounded-md shadow-lg">
              <p className="text-white font-bold text-md font-bold">
                <i className="fa fa-pencil-alt " /> Edit
              </p>
            </button>
          </div>
        );
      },
    },
  ]);

  return (
    <div>
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Grinding`}
        visible={modalVisible}
        onClose={e => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({});
        }}
        onSubmit={async e => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            let { _id, __typename, _createdAt, _updatedAt } = formData;

            let fob = {};
            let production = {};

            let monthlyLocalSales = {};
            let monthlyExport = {};
            if (formData.fob) {
              fob = formData.fob;
              delete fob.__typename;
            }

            if (formData.production) {
              production = formData.production;
              delete production.__typename;
            }

            if (formData.monthlyLocalSales) {
              monthlyLocalSales = formData.monthlyLocalSales;
              delete monthlyLocalSales.__typename;
            }

            if (formData.monthlyExport) {
              monthlyExport = formData.monthlyExport;
              delete monthlyExport.__typename;
            }

            if (!_id) {
              const tokenizedInput = jwt.sign(
                {
                  ...formData,
                },
                TOKENIZE,
              );
              await createBasicCocoaStatisticDomesticGrindingTokenized({
                variables: {
                  tokenizedInput,
                },
              });
            } else {
              const tokenizedInput = jwt.sign(
                {
                  ...formData,
                  fob,
                  production,
                  monthlyLocalSales,
                  monthlyExport,
                },
                TOKENIZE,
              );
              await updateBasicCocoaStatisticDomesticGrindingTokenized({
                variables: {
                  tokenizedInput,
                },
              });
            }
            setSavedCount((savedCount += 1));
            notification.addNotification({
              title: "Succeess!",
              message: `production saved!`,
              level: "success",
            });
            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}>
        <div className="form-group">
          <label>Year{" & "}Month</label>
          <input
            type="month"
            className="form-control"
            value={formData.yearMonth || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                yearMonth: e.target.value,
                year: parseInt(dayjs(e.target.value).format("YYYY")),
                month: parseInt(dayjs(e.target.value).format("MM")),
                monthName: dayjs(e.target.value).format("MMMM"),
              });
            }}
          />
        </div>

        {/* <div className="form-group">
          <label>Region*</label>

          <select
            className="form-control"
            value={formData.regionId || ""}
            onChange={e => {
              if (e) e.preventDefault();
              const region = allLocalRegion.find(
                reg => reg._id === e.target.value,
              );

              setFormData({
                ...formData,
                regionId: e.target.value,
                stateId: "",
              });
              setState(region.Countries);
            }}>
            <option value="" disabled>
              Select Region
            </option>
            {allLocalRegion.map(region => (
              <option value={region._id}>{region.description}</option>
            ))}
          </select>
        </div> */}

        <hr className="border border-gray-200 my-2" />
        <p className="text-md font-bold">Purchase (Tonne)</p>
        <p className="text-md">Local Purchase</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center">
            <p>Sabah</p>
          </div>
          <NumberFormat
            className="form-control"
            value={formData.localPurchaseSabah || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                localPurchaseSabah: e.floatValue,
              });
            }}
          />
          <div className="flex items-center">
            <p>Sarawak</p>
          </div>
          <NumberFormat
            className="form-control"
            value={formData.localPurchaseSarawak || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                localPurchaseSarawak: e.floatValue,
              });
            }}
          />
          <div className="flex items-center">
            <p>Peninsula Malaysia</p>
          </div>
          <NumberFormat
            className="form-control"
            value={formData.localPurchasePeninsula || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                localPurchasePeninsula: e.floatValue,
              });
            }}
          />
          <div className="flex items-center">
            <p>Imported Purchase</p>
          </div>
          <NumberFormat
            className="form-control"
            value={formData.importedPurchase || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                importedPurchase: e.floatValue,
              });
            }}
          />
        </div>
        <hr className="border border-gray-200 my-2" />
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center">
            <p className="text-md font-bold">
              Current Grinding Capacity (MT/YR)
            </p>
          </div>
          <NumberFormat
            className="form-control"
            value={formData.grindingsCapacity || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                grindingsCapacity: e.floatValue,
              });
            }}
          />
        </div>

        <hr className="border border-gray-200 my-2" />
        <p className="text-md font-bold">Total Grinding (MT)</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center">
            <p>Local Beans</p>
          </div>
          <NumberFormat
            className="form-control"
            value={formData.totalGrindingLocalBean || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();

              let grindingsTotal = 0;
              if (
                !formData.totalGrindingImportedBean ||
                isNaN(formData.totalGrindingImportedBean) ||
                formData.totalGrindingImportedBean === 0
              ) {
                grindingsTotal = e.floatValue;
              } else if (!e.floatValue || e.floatValue === 0) {
                grindingsTotal = formData.totalGrindingImportedBean;
              } else {
                grindingsTotal =
                  formData.totalGrindingImportedBean + e.floatValue;
              }

              setFormData({
                ...formData,
                totalGrindingLocalBean: e.floatValue,
                grindingsTotal,
              });
            }}
          />
          <div className="flex items-center">
            <p>Imported Bean</p>
          </div>
          <NumberFormat
            className="form-control"
            value={formData.totalGrindingImportedBean || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              let grindingsTotal = 0;
              if (
                !formData.totalGrindingLocalBean ||
                isNaN(formData.totalGrindingLocalBean) ||
                formData.totalGrindingLocalBean === 0
              ) {
                grindingsTotal = e.floatValue;
              } else if (!e.floatValue || e.floatValue === 0) {
                grindingsTotal = formData.totalGrindingLocalBean;
              } else {
                grindingsTotal = formData.totalGrindingLocalBean + e.floatValue;
              }
              setFormData({
                ...formData,
                totalGrindingImportedBean: e.floatValue,
                grindingsTotal,
              });
            }}
          />
          <div className="flex items-center">
            <p>Total Grinding (Local + Imported )</p>
          </div>
          <NumberFormat
            className="form-control bg-gray-200"
            disabled
            value={formData.grindingsTotal || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                grindingsTotal: e.floatValue,
              });
            }}
          />
        </div>

        <hr className="border border-gray-200 my-2" />
        <p className="text-md font-bold">Stock Cocoa Beans</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center">
            <p>Local Beans</p>
          </div>
          <NumberFormat
            className="form-control"
            value={formData.stockLocalBean || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();

              // let stockTotal = 0;
              // if (formData.stockImportedBean) {
              //   stockTotal = formData.stockImportedBean + e.floatValue;
              // }
              // if (!e.floatValue) {
              //   stockTotal = formData.stockImportedBean;
              // }

              let stockTotal = 0;
              if (
                !formData.stockImportedBean ||
                isNaN(formData.stockImportedBean) ||
                formData.stockImportedBean === 0
              ) {
                stockTotal = e.floatValue;
              } else if (!e.floatValue || e.floatValue === 0) {
                stockTotal = formData.stockImportedBean;
              } else {
                stockTotal = formData.stockImportedBean + e.floatValue;
              }

              setFormData({
                ...formData,
                stockLocalBean: e.floatValue,
                stockTotal,
              });
            }}
          />
          <div className="flex items-center">
            <p>Imported Bean</p>
          </div>
          <NumberFormat
            className="form-control"
            value={formData.stockImportedBean || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              // let stockTotal = 0;
              // if (formData.stockLocalBean) {
              //   stockTotal = formData.stockLocalBean + e.floatValue;
              // }
              // if (!e.floatValue) {
              //   stockTotal = formData.stockLocalBean;
              // }

              let stockTotal = 0;
              if (
                !formData.stockLocalBean ||
                isNaN(formData.stockLocalBean) ||
                formData.stockLocalBean === 0
              ) {
                stockTotal = e.floatValue;
              } else if (!e.floatValue || e.floatValue === 0) {
                stockTotal = formData.stockLocalBean;
              } else {
                stockTotal = formData.stockLocalBean + e.floatValue;
              }

              setFormData({
                ...formData,
                stockImportedBean: e.floatValue,
                stockTotal,
              });
            }}
          />
          <div className="flex items-center">
            <p>Total Stock (Local + Imported)</p>
          </div>
          <NumberFormat
            className="form-control bg-gray-200"
            disabled
            value={formData.stockTotal || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                stockTotal: e.floatValue,
              });
            }}
          />
        </div>

        <hr className="border border-gray-200 my-2" />
        <p className="text-md font-bold">production (Tonne)</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center">
            <p>Cocoa Butter</p>
          </div>
          <NumberFormat
            className="form-control"
            value={formData.production?.cocoaButter || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                production: {
                  ...formData.production,
                  cocoaButter: e.floatValue,
                },
              });
            }}
          />
          <div className="flex items-center">
            <p>Cocoa Liquor/Mass</p>
          </div>
          <NumberFormat
            className="form-control"
            value={formData.production?.cocoaLiquorMass || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                production: {
                  ...formData.production,
                  cocoaLiquorMass: e.floatValue,
                },
              });
            }}
          />
          <div className="flex items-center">
            <p>Cocoa Powder</p>
          </div>
          <NumberFormat
            className="form-control"
            value={formData.production?.cocoaPowder || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                production: {
                  ...formData.production,
                  cocoaPowder: e.floatValue,
                },
              });
            }}
          />
          <div className="flex items-center">
            <p>Cocoa Cake</p>
          </div>
          <NumberFormat
            className="form-control"
            value={formData.production?.cocoaCake || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                production: {
                  ...formData.production,
                  cocoaCake: e.floatValue,
                },
              });
            }}
          />
        </div>

        <hr className="border border-gray-200 my-2" />
        <p className="text-md font-bold">Monthly Local Sales</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center">
            <p>Cocoa Butter</p>
          </div>
          <NumberFormat
            className="form-control"
            value={formData.monthlyLocalSales?.cocoaButter || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                monthlyLocalSales: {
                  ...formData.monthlyLocalSales,
                  cocoaButter: e.floatValue,
                },
              });
            }}
          />
          <div className="flex items-center">
            <p>Cocoa Liquor/Mass</p>
          </div>
          <NumberFormat
            className="form-control"
            value={formData.monthlyLocalSales?.cocoaLiquorMass || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                monthlyLocalSales: {
                  ...formData.monthlyLocalSales,
                  cocoaLiquorMass: e.floatValue,
                },
              });
            }}
          />
          <div className="flex items-center">
            <p>Cocoa Powder</p>
          </div>
          <NumberFormat
            className="form-control"
            value={formData.monthlyLocalSales?.cocoaPowder || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                monthlyLocalSales: {
                  ...formData.monthlyLocalSales,
                  cocoaPowder: e.floatValue,
                },
              });
            }}
          />
          <div className="flex items-center">
            <p>Cocoa Cake</p>
          </div>
          <NumberFormat
            className="form-control"
            value={formData.monthlyLocalSales?.cocoaCake || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                monthlyLocalSales: {
                  ...formData.monthlyLocalSales,
                  cocoaCake: e.floatValue,
                },
              });
            }}
          />
        </div>

        <hr className="border border-gray-200 my-2" />
        <p className="text-md font-bold">Monthly Export</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center">
            <p>Cocoa Butter</p>
          </div>
          <NumberFormat
            className="form-control"
            value={formData.monthlyExport?.cocoaButter || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                monthlyExport: {
                  ...formData.monthlyExport,
                  cocoaButter: e.floatValue,
                },
              });
            }}
          />
          <div className="flex items-center">
            <p>Cocoa Liquor/Mass</p>
          </div>
          <NumberFormat
            className="form-control"
            value={formData.monthlyExport?.cocoaLiquorMass || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                monthlyExport: {
                  ...formData.monthlyExport,
                  cocoaLiquorMass: e.floatValue,
                },
              });
            }}
          />
          <div className="flex items-center">
            <p>Cocoa Powder</p>
          </div>
          <NumberFormat
            className="form-control"
            value={formData.monthlyExport?.cocoaPowder || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                monthlyExport: {
                  ...formData.monthlyExport,
                  cocoaPowder: e.floatValue,
                },
              });
            }}
          />
          <div className="flex items-center">
            <p>Cocoa Cake</p>
          </div>
          <NumberFormat
            className="form-control"
            value={formData.monthlyExport?.cocoaCake || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                monthlyExport: {
                  ...formData.monthlyExport,
                  cocoaCake: e.floatValue,
                },
              });
            }}
          />
        </div>

        <hr className="border border-gray-200 my-2" />
        <p className="text-md font-bold">Average Price FOB</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center">
            <p>Cocoa Butter</p>
          </div>
          <NumberFormat
            className="form-control"
            value={formData.fob?.cocoaButter || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                fob: {
                  ...formData.fob,
                  cocoaButter: e.floatValue,
                },
              });
            }}
          />
          <div className="flex items-center">
            <p>Cocoa Liquor/Mass</p>
          </div>
          <NumberFormat
            className="form-control"
            value={formData.fob?.cocoaLiquorMass || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                fob: {
                  ...formData.fob,
                  cocoaLiquorMass: e.floatValue,
                },
              });
            }}
          />
          <div className="flex items-center">
            <p>Cocoa Powder</p>
          </div>
          <NumberFormat
            className="form-control"
            value={formData.fob?.cocoaPowder || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                fob: {
                  ...formData.fob,
                  cocoaPowder: e.floatValue,
                },
              });
            }}
          />
          <div className="flex items-center">
            <p>Cocoa Cake</p>
          </div>
          <NumberFormat
            className="form-control"
            value={formData.fob?.cocoaCake || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                fob: {
                  ...formData.fob,
                  cocoaCake: e.floatValue,
                },
              });
            }}
          />
        </div>

        <hr className="border border-gray-200 my-2" />
        <p className="text-md font-bold">Average Ratio (%)</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center">
            <p>Cocoa Butter Ratio</p>
          </div>
          <NumberFormat
            className="form-control"
            value={formData.averageRatioCocoaButter || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                averageRatioCocoaButter: e.floatValue,
              });
            }}
          />
          <div className="flex items-center">
            <p>Cocoa Powder Ratio</p>
          </div>
          <NumberFormat
            className="form-control"
            value={formData.averageRatioCocoaPowder || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                averageRatioCocoaPowder: e.floatValue,
              });
            }}
          />
        </div>
      </FormModal>

      <Table
        customHeaderUtilities={
          <div>
            <MultiYearsFilterWithExport
              label="Year Filter"
              type="Grinding"
              defaultValue={dayjs().format("YYYY")}
              options={YEARS}
              onSelect={(year, years) => {
                setYear(year);
                setYears(years);
              }}
              exportConfig={{
                title: "BCS Domestic - Grindings",
                collectionName: "BasicCocoaStatisticDomesticGrindings",
                filters: {
                  year: [...years].map(year => parseInt(year)),
                },
                columns,
              }}
            />
            {/* <SingleSelect
              hideFeedbackByDefault
              label="Year Filter"
              required
              options={YEARS}
              value={year}
              onChange={e => {
                if (e) e.preventDefault();
                router.push({
                  pathname: router.pathname,
                  query: {
                    ...router.query,
                    year: e.target.value,
                  },
                });
              }}
            /> */}
          </div>
        }
        loading={false}
        columns={columns}
        data={allBasicCocoaStatisticDomesticGrindings}
        withoutHeader={true}
        onAdd={
          currentUserDontHavePrivilege(["BCS Domestic Grindings:Delete"])
            ? null
            : e => {
              if (e) e.preventDefault();
              setModalVisible(true);
              setFormData({
                totalGrindingImportedBean: 0,
                totalGrindingLocalBean: 0,
                stockImportedBean: 0,
                stockLocalBean: 0,
              });
            }
        }
        onRemove={
          currentUserDontHavePrivilege(["BCS Domestic Grindings:Delete"])
            ? null
            : async ({ rows }) => {
              showLoadingSpinner();
              try {
                let yes = confirm(
                  `Are you sure to delete ${rows.length} data?`,
                );
                if (yes) {
                  for (const row of rows) {
                    const tokenizedInput = jwt.sign(
                      {
                        _id: row._id,
                      },
                      TOKENIZE,
                    );
                    await deleteBasicCocoaStatisticDomesticGrindingTokenized({
                      variables: {
                        tokenizedInput,
                      },
                    });
                  }
                  notification.addNotification({
                    title: "Success!",
                    message: `${rows.length} data deleted`,
                    level: "success",
                  });
                  setSavedCount((savedCount += 1));
                }
              } catch (err) {
                handleError(err);
              }
              hideLoadingSpinner();
            }
        }
        customUtilities={
          currentUserDontHavePrivilege(["BCS Domestic Grindings:Update"])
            ? null
            : customUtilities
        }
        customUtilitiesPosition="left"
      />
      <div className="flex mt-4">
        <p className="text-md">Total Data: </p>
        <p className="text-md font-bold mx-4">
          {countBasicCocoaStatisticDomesticGrindings || 0}
        </p>
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(BasicCocoaStatisticCultivatedArea);
