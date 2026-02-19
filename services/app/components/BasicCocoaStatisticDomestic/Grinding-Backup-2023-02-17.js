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

import dayjs from "dayjs";

const QUERY = gql`
  query listQueries($year: String!, $years: [String!]) {
    allBasicCocoaStatisticDomesticGrindings(year: $year, years: $years) {
      _id
      year
      month
      monthName
      LocalRegion {
        _id
        description
      }
      FOB {
        cocoaButter
        cocoaLiquorMass
        cocoaPowder
        cocoaCake
      }
      Production {
        cocoaButter
        cocoaLiquorMass
        cocoaPowder
        cocoaCake
      }

      localPurchase
      importedPurchase

      grindingsTotal
      grindingsCapacity
      capacity
    }

    allLocalRegion {
      _id
      description
    }
    countBasicCocoaStatisticDomesticGrindings
  }
`;

const CREATE_BCS_DOMESTIC_GRINDINGS = gql`
  mutation createBasicCocoaStatisticDomesticGrinding(
    $year: Int!
    $month: Int!
    $monthName: String
    $regionId: String!
    $localPurchase: Float
    $importedPurchase: Float
    $grindingsTotal: Float
    $grindingsCapacity: Float
    $production: DomesticGrindingPriceObjInput
    $fob: DomesticGrindingFOBObjInput
  ) {
    createBasicCocoaStatisticDomesticGrinding(
      year: $year
      month: $month
      monthName: $monthName
      regionId: $regionId
      localPurchase: $localPurchase
      importedPurchase: $importedPurchase
      grindingsTotal: $grindingsTotal
      grindingsCapacity: $grindingsCapacity

      fob: $fob
      production: $production
    )
  }
`;

const UPDATE_BCS_DOMESTIC_GRINDINGS = gql`
  mutation updateBasicCocoaStatisticDomesticGrinding(
    $_id: String!
    $year: Int
    $month: Int
    $monthName: String
    $regionId: String
    $localPurchase: Float
    $importedPurchase: Float
    $grindingsTotal: Float
    $grindingsCapacity: Float
    $production: DomesticGrindingPriceObjInput
    $fob: DomesticGrindingFOBObjInput
  ) {
    updateBasicCocoaStatisticDomesticGrinding(
      _id: $_id
      year: $year
      month: $month
      monthName: $monthName
      regionId: $regionId
      localPurchase: $localPurchase
      importedPurchase: $importedPurchase
      grindingsTotal: $grindingsTotal
      grindingsCapacity: $grindingsCapacity

      fob: $fob
      production: $production
    )
  }
`;
const DELETE_BCS_DOMESTIC_GRINDINGS = gql`
  mutation deleteBasicCocoaStatisticDomesticGrinding($_id: String!) {
    deleteBasicCocoaStatisticDomesticGrinding(_id: $_id)
  }
`;
const BasicCocoaStatisticCultivatedArea = ({
  currentUserDontHavePrivilege,
}) => {
  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [allCountries, setState] = useState([]);
  const router = useRouter();
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
    {
      Header: "Region",
      accessor: "LocalRegion.description",
      style: {
        fontSize: 20,
        width: 250,
      },
    },

    {
      Header: "Local Purchase",
      accessor: "localPurchase",
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
      accessor: "Production.cocoaButter",
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
      accessor: "Production.cocoaLiquorMass",
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
      accessor: "Production.cocoaPowder",
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
      accessor: "Production.cocoaCake",
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
      accessor: "FOB.cocoaLiquorMass",
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
      accessor: "FOB.cocoaPowder",
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
      accessor: "FOB.cocoaCake",
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

  const { data, loading, error, refetch } = useQuery(QUERY, {
    variables: {
      year,
      years,
    },
  });
  const [createBasicCocoaStatisticDomesticGrinding] = useMutation(
    CREATE_BCS_DOMESTIC_GRINDINGS,
  );
  const [updateBasicCocoaStatisticDomesticGrinding] = useMutation(
    UPDATE_BCS_DOMESTIC_GRINDINGS,
  );
  const [deleteBasicCocoaStatisticDomesticGrinding] = useMutation(
    DELETE_BCS_DOMESTIC_GRINDINGS,
  );
  let allBasicCocoaStatisticDomesticGrindings = [];

  if (data?.allBasicCocoaStatisticDomesticGrindings) {
    allBasicCocoaStatisticDomesticGrindings =
      data.allBasicCocoaStatisticDomesticGrindings;
  }

  let allLocalRegion = [];
  if (data?.allLocalRegion) {
    allLocalRegion = data.allLocalRegion;
  }

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
                  production: propsTable.row.original.Production || {},
                  fob: propsTable.row.original.FOB || {},
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

  // console.log(allCountries);
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
        size="lg"
        onSubmit={async e => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            let { _id, __typename, _createdAt, _updatedAt } = formData;

            let fob = {};
            let production = {};

            if (formData.fob) {
              fob = formData.fob;
              delete fob.__typename;
            }

            if (formData.production) {
              production = formData.production;
              delete production.__typename;
            }

            if (!_id) {
              await createBasicCocoaStatisticDomesticGrinding({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateBasicCocoaStatisticDomesticGrinding({
                variables: {
                  ...formData,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Production saved!`,
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

        <div className="form-group">
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
        </div>

        <hr className="border border-gray-200 my-2" />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-md font-bold">Purchase (Tonne)</p>
            <div className="form-group">
              <label>Local</label>
              <NumberFormat
                className="form-control"
                value={formData.localPurchase || 0}
                thousandSeparator={","}
                decimalSeparator={"."}
                decimalScale={2}
                onValueChange={e => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    localPurchase: e.floatValue,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Imported</label>
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
          </div>
          <div>
            <p className="text-md font-bold">Grindings (Tonne)</p>
            <div className="form-group">
              <label>Total</label>
              <NumberFormat
                className="form-control"
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
            <div className="form-group">
              <label>Capacity</label>
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
          </div>
        </div>
        <hr className="border border-gray-200 my-2" />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-md font-bold">Production (Tonne)</p>
            <div className="form-group">
              <label>Cocoa Butter</label>
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
            </div>
            <div className="form-group">
              <label>Cocoa Liquor Mass</label>
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
            </div>
            <div className="form-group">
              <label>Cocoa Powder</label>
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
            </div>
            <div className="form-group">
              <label>Cocoa Cake</label>
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
          </div>
          <div>
            <p className="text-md font-bold">Average Price (RM/Tonne)</p>
            <div className="form-group">
              <label>Cocoa Butter</label>
              <NumberFormat
                className="form-control"
                value={formData.fob?.cocoaButter || 0}
                thousandSeparator={","}
                decimalSeparator={"."}
                decimalScale={2}
                fixedDecimalScale={true}
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
            </div>
            <div className="form-group">
              <label>Cocoa Liquor Mass</label>
              <NumberFormat
                className="form-control"
                value={formData.fob?.cocoaLiquorMass || 0}
                thousandSeparator={","}
                decimalSeparator={"."}
                decimalScale={2}
                fixedDecimalScale={true}
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
            </div>
            <div className="form-group">
              <label>Cocoa Powder</label>
              <NumberFormat
                className="form-control"
                value={formData.fob?.cocoaPowder || 0}
                thousandSeparator={","}
                decimalSeparator={"."}
                decimalScale={2}
                fixedDecimalScale={true}
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
            </div>
            <div className="form-group">
              <label>Cocoa Cake</label>
              <NumberFormat
                className="form-control"
                value={formData.fob?.cocoaCake || 0}
                thousandSeparator={","}
                decimalSeparator={"."}
                decimalScale={2}
                fixedDecimalScale={true}
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
          </div>
        </div>
      </FormModal>

      <Table
        customHeaderUtilities={
          <div>
            <MultiYearsFilterWithExport
              label="Year Filter"
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
                setFormData({});
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
                      await deleteBasicCocoaStatisticDomesticGrinding({
                        variables: {
                          _id: row._id,
                        },
                      });
                    }
                    notification.addNotification({
                      title: "Success!",
                      message: `${rows.length} data deleted`,
                      level: "success",
                    });
                    await refetch();
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
          {data?.countBasicCocoaStatisticDomesticGrindings || 0}
        </p>
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(BasicCocoaStatisticCultivatedArea);
