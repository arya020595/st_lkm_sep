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
    allBasicCocoaStatisticDomesticProductions(year: $year, years: $years) {
      _id
      year
      month
      monthName
      LocalRegion {
        _id
        description
      }
      LocalState {
        _id
        description
      }
      InfoStatus {
        _id
        description
      }

      estateProduction
      estateYield
      malaysianEstateYield
      smallholdingProduction
      smallholdingYield
      smallholdingMalaysia

      regionName
      stateName
      infoStatusName
    }

    allInfoStatuses {
      _id
      description
    }
    allLocalRegion {
      _id
      description
      States {
        _id
        description
      }
    }
    countBasicCocoaStatisticDomesticProductions
  }
`;

const CREATE_BCS_DOMESTIC_PRODUCTION = gql`
  mutation createBasicCocoaStatisticDomesticProduction(
    $year: Int!
    $month: Int!
    $monthName: String!
    $regionId: String!
    $stateId: String!
    $infoStatusId: String!
    $estateProduction: Float
    $estateYield: Float
    $malaysianEstateYield: Float
    $smallholdingProduction: Float
    $smallholdingYield: Float
    $smallholdingMalaysia: Float
  ) {
    createBasicCocoaStatisticDomesticProduction(
      year: $year
      month: $month
      monthName: $monthName
      regionId: $regionId
      stateId: $stateId
      infoStatusId: $infoStatusId

      estateProduction: $estateProduction
      estateYield: $estateYield

      malaysianEstateYield: $malaysianEstateYield
      smallholdingProduction: $smallholdingProduction
      smallholdingYield: $smallholdingYield
      smallholdingMalaysia: $smallholdingMalaysia
    )
  }
`;

const UPDATE_BCS_DOMESTIC_PRODUCTION = gql`
  mutation updateBasicCocoaStatisticDomesticProduction(
    $_id: String!
    $year: Int!
    $month: Int!
    $monthName: String!
    $regionId: String!
    $stateId: String!
    $infoStatusId: String!
    $estateProduction: Float
    $estateYield: Float
    $malaysianEstateYield: Float
    $smallholdingProduction: Float
    $smallholdingYield: Float
    $smallholdingMalaysia: Float
  ) {
    updateBasicCocoaStatisticDomesticProduction(
      _id: $_id
      year: $year
      month: $month
      monthName: $monthName
      regionId: $regionId
      stateId: $stateId
      infoStatusId: $infoStatusId

      estateProduction: $estateProduction
      estateYield: $estateYield

      malaysianEstateYield: $malaysianEstateYield
      smallholdingProduction: $smallholdingProduction
      smallholdingYield: $smallholdingYield
      smallholdingMalaysia: $smallholdingMalaysia
    )
  }
`;
const DELETE_BCS_DOMESTIC_PRODUCTION = gql`
  mutation deleteBasicCocoaStatisticDomesticProduction($_id: String!) {
    deleteBasicCocoaStatisticDomesticProduction(_id: $_id)
  }
`;

const GET_MATURED_ESTATE_AREA = gql`
  query getBCSMaturedEstateArea(
    $year: String!
    $regionId: String!
    $stateId: String!
  ) {
    getBCSMaturedEstateArea(year: $year, regionId: $regionId, stateId: $stateId)
  }
`;

const GET_MATURED_SMALLHOLDER_AREA = gql`
  query getBCSMaturedSmallholderArea(
    $year: String!
    $regionId: String!
    $stateId: String!
  ) {
    getBCSMaturedSmallholderArea(
      year: $year
      regionId: $regionId
      stateId: $stateId
    )
  }
`;
const BasicCocoaStatisticDomesticProduction = ({
  currentUserDontHavePrivilege,
}) => {
  const notification = useNotification();
  const client = useApolloClient();
  const [formData, setFormData] = useState({
    estateProduction: 0,
    estateYield: 0,
    smallholdingProduction: 0,
    smallholdingYield: 0,
  });
  const [maturedEstateArea, setMaturedEstateArea] = useState(0);
  const [maturedSmallholderArea, setMaturedSmallholderArea] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [allStates, setState] = useState([]);
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
        width: 100,
      },
    },
    {
      Header: "Region",
      accessor: "regionName",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "State",
      accessor: "stateName",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Status Information",
      accessor: "infoStatusName",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Estate Tonne",
      accessor: "estateProduction",
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Estate Yield ",
      accessor: "estateYield",
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Smallholding Tonne",
      accessor: "smallholdingProduction",
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Smallholding Yield",
      accessor: "smallholdingYield",
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "National Yield",
      accessor: "malaysianEstateYield",
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
      style: {
        fontSize: 20,
      },
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
  // console.log({ years });

  const { data, loading, error, refetch } = useQuery(QUERY, {
    variables: {
      // regionId: formData.regionId || "",
      year,
      years,
    },
  });
  const [createBasicCocoaStatisticDomesticProduction] = useMutation(
    CREATE_BCS_DOMESTIC_PRODUCTION,
  );
  const [updateBasicCocoaStatisticDomesticProduction] = useMutation(
    UPDATE_BCS_DOMESTIC_PRODUCTION,
  );
  const [deleteBasicCocoaStatisticDomesticProduction] = useMutation(
    DELETE_BCS_DOMESTIC_PRODUCTION,
  );
  let allBasicCocoaStatisticDomesticProductions = [];

  if (data?.allBasicCocoaStatisticDomesticProductions) {
    allBasicCocoaStatisticDomesticProductions =
      data.allBasicCocoaStatisticDomesticProductions;
  }
  let allInfoStatuses = [];
  if (data?.allInfoStatuses) {
    allInfoStatuses = data.allInfoStatuses;
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
              onClick={async e => {
                if (e) e.preventDefault();
                let allStates = [];
                if (propsTable.row.original.LocalRegion) {
                  const found = allLocalRegion.find(
                    reg => reg._id === propsTable.row.original.LocalRegion._id,
                  );

                  if (found && found.States.length > 0) {
                    allStates = found.States;
                  }
                }

                const year = propsTable.row.original.year;
                let month = propsTable.row.original.month;

                if (month < 10) {
                  month = "0" + month;
                }
                const yearMonth = `${year}-${month}`;

                // console.log(propsTable.row.original);
                setModalVisible(true);
                setFormData({
                  ...propsTable.row.original,
                  regionId: propsTable.row.original.LocalRegion?._id || "",
                  stateId: propsTable.row.original.LocalState?._id || "",
                  infoStatusId: propsTable.row.original.InfoStatus?._id || "",
                  yearMonth,
                });
                setState(allStates);

                //Estate
                const resEst = await client.query({
                  query: GET_MATURED_ESTATE_AREA,
                  variables: {
                    year: String(propsTable.row.original.year),
                    regionId: propsTable.row.original.LocalRegion?._id || "",
                    stateId: propsTable.row.original.LocalState?._id || "",
                  },
                  fetchPolicy: "no-cache",
                });

                setMaturedEstateArea(resEst.data.getBCSMaturedEstateArea);

                //Smallholder
                const resSmh = await client.query({
                  query: GET_MATURED_SMALLHOLDER_AREA,
                  variables: {
                    year: String(propsTable.row.original.year),
                    regionId: propsTable.row.original.LocalRegion?._id || "",
                    stateId: propsTable.row.original.LocalState?._id || "",
                  },
                  fetchPolicy: "no-cache",
                });

                setMaturedSmallholderArea(
                  resSmh.data.getBCSMaturedSmallholderArea,
                );
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
        title={`${!formData._id ? "New" : "Edit"} BCS Production`}
        visible={modalVisible}
        onClose={e => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            estateProduction: 0,
            estateYield: 0,
            smallholdingProduction: 0,
            smallholdingYield: 0,
          });
          setMaturedEstateArea(0);
          setMaturedSmallholderArea(0);
        }}
        onSubmit={async e => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            let { _id, __typename, _createdAt, _updatedAt } = formData;
            if (!_id) {
              await createBasicCocoaStatisticDomesticProduction({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateBasicCocoaStatisticDomesticProduction({
                variables: {
                  ...formData,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `BCS Production saved!`,
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
            onChange={async e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                yearMonth: e.target.value,
                year: parseInt(dayjs(e.target.value).format("YYYY")),
                month: parseInt(dayjs(e.target.value).format("MM")),
                monthName: dayjs(e.target.value).format("MMMM"),
              });

              //Estate
              const resEst = await client.query({
                query: GET_MATURED_ESTATE_AREA,
                variables: {
                  year: dayjs(e.target.value).format("YYYY"),
                  regionId: "",
                  stateId: "",
                },
                fetchPolicy: "no-cache",
              });

              setMaturedEstateArea(resEst.data.getBCSMaturedEstateArea);

              //Smallholder
              const resSmh = await client.query({
                query: GET_MATURED_SMALLHOLDER_AREA,
                variables: {
                  year: dayjs(e.target.value).format("YYYY"),
                  regionId: "",
                  stateId: "",
                },
                fetchPolicy: "no-cache",
              });

              setMaturedSmallholderArea(
                resSmh.data.getBCSMaturedSmallholderArea,
              );
            }}
          />
        </div>

        {/* <div className="grid grid-cols-2 gap-2">
          <div className="form-group">
            <label>Year</label>
            <input
              disabled
              className="form-control "
              value={formData.year || ""}
            />
          </div>
          <div className="form-group">
            <label>Month</label>
            <input
              disabled
              className="form-control"
              value={formData.monthName || ""}
            />
          </div>
        </div> */}

        <div className="form-group">
          <label>Region*</label>

          <select
            className="form-control"
            value={formData.regionId || ""}
            onChange={async e => {
              if (e) e.preventDefault();
              const region = allLocalRegion.find(
                reg => reg._id === e.target.value,
              );

              setFormData({
                ...formData,
                regionId: e.target.value,
                stateId: "",
              });
              setState(region.States);

              //Estate
              const resEst = await client.query({
                query: GET_MATURED_ESTATE_AREA,
                variables: {
                  year: String(formData.year),
                  regionId: e.target.value,
                  stateId: "",
                },
                fetchPolicy: "no-cache",
              });

              setMaturedEstateArea(resEst.data.getBCSMaturedEstateArea);

              //Smallholder
              const resSmh = await client.query({
                query: GET_MATURED_SMALLHOLDER_AREA,
                variables: {
                  year: String(formData.year),
                  regionId: e.target.value,
                  stateId: "",
                },
                fetchPolicy: "no-cache",
              });

              setMaturedSmallholderArea(
                resSmh.data.getBCSMaturedSmallholderArea,
              );
            }}>
            <option value="" disabled>
              Select Region
            </option>
            {allLocalRegion.map(region => (
              <option value={region._id}>{region.description}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>State*</label>

          <select
            className="form-control"
            value={formData.stateId || ""}
            onChange={async e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                stateId: e.target.value,
              });

              //Estate
              const resEst = await client.query({
                query: GET_MATURED_ESTATE_AREA,
                variables: {
                  year: String(formData.year),
                  regionId: formData.regionId,
                  stateId: e.target.value,
                },
                fetchPolicy: "no-cache",
              });

              setMaturedEstateArea(resEst.data.getBCSMaturedEstateArea);

              //Smallholder
              const resSmh = await client.query({
                query: GET_MATURED_SMALLHOLDER_AREA,
                variables: {
                  year: String(formData.year),
                  regionId: formData.regionId,
                  stateId: e.target.value,
                },
                fetchPolicy: "no-cache",
              });

              setMaturedSmallholderArea(
                resSmh.data.getBCSMaturedSmallholderArea,
              );
            }}>
            <option value="" disabled>
              Select State
            </option>
            {allStates.map(state => (
              <option value={state._id}>{state.description}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Info Status*</label>
          <select
            className="form-control"
            value={formData.infoStatusId || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                infoStatusId: e.target.value,
              });
            }}
            required>
            <option value="" disabled>
              Select Info Status
            </option>
            {allInfoStatuses.map(infoStatus => (
              <option value={infoStatus._id}>{infoStatus.description}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Estate Production (Tonne)</label>
          <NumberFormat
            className="form-control"
            value={formData.estateProduction || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              const estateYield = e.floatValue / maturedEstateArea;
              const finalYield =
                (e.floatValue + formData.smallholdingProduction) /
                (maturedEstateArea + maturedSmallholderArea);
              setFormData({
                ...formData,
                estateProduction: e.floatValue,
                estateYield: parseFloat(estateYield),
                malaysianEstateYield: finalYield,
              });
            }}
          />
        </div>
        {/* <div className="form-group">
          <label>Matured Estate Area</label>
          <NumberFormat
            className="form-control"
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            value={maturedEstateArea}
          />
        </div>
        <div className="form-group">
          <label>
            <p>Estate Yield</p>
            <p className="font-bold">
              (Estate Production / Matured Estate Area)
            </p>
          </label>

          <NumberFormat
            className="form-control"
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            value={formData.estateYield}
          />
        </div> */}
        <div className="form-group">
          <label>Smallholding Production (Tonne)</label>
          <NumberFormat
            className="form-control"
            value={formData.smallholdingProduction || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              const smallholdingYield = e.floatValue / maturedSmallholderArea;
              const finalYield =
                (e.floatValue + formData.estateProduction) /
                (maturedEstateArea + maturedSmallholderArea);

              setFormData({
                ...formData,
                smallholdingProduction: e.floatValue,
                smallholdingYield: parseFloat(smallholdingYield),
                malaysianEstateYield: finalYield,
              });
            }}
          />
        </div>
        {/* <div className="form-group">
          <label>Matured Smallholder Area</label>
          <NumberFormat
            className="form-control"
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            value={maturedSmallholderArea}
          />
        </div>
        <div className="form-group">
          <label>
            <p>Smallholding Yield</p>
            <p className="font-bold">
              (Smallholder Production / Matured Smallholder Area)
            </p>
          </label>

          <NumberFormat
            className="form-control"
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            value={formData.smallholdingYield}
          />
        </div> */}
        {/* <div className="form-group">
          <label>National Yield</label>
          <NumberFormat
            className="form-control"
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            value={formData.malaysianEstateYield}
          />
        </div> */}
      </FormModal>

      <Table
        customHeaderUtilities={
          <div>
            <MultiYearsFilterWithExport
              label="Year Filter"
              type="Production"
              defaultValue={dayjs().format("YYYY")}
              options={YEARS}
              onSelect={(year, years) => {
                setYear(year);
                setYears(years);
                // console.log("onSelect", { years });
              }}
              exportConfig={{
                title: "BCS Domestic - Production",
                collectionName: "BasicCocoaStatisticDomesticProductions",
                filters: {
                  year: years?.map?.(year => parseInt(year)) || [],
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
        data={allBasicCocoaStatisticDomesticProductions}
        withoutHeader={true}
        onAdd={
          currentUserDontHavePrivilege(["BCS Domestic Production:Create"])
            ? null
            : e => {
                if (e) e.preventDefault();
                setModalVisible(true);
                setFormData({
                  estateProduction: 0,
                  estateYield: 0,
                  smallholdingProduction: 0,
                  smallholdingYield: 0,
                });
              }
        }
        onRemove={
          currentUserDontHavePrivilege(["BCS Domestic Production:Delete"])
            ? null
            : async ({ rows }) => {
                showLoadingSpinner();
                try {
                  let yes = confirm(
                    `Are you sure to delete ${rows.length} data?`,
                  );
                  if (yes) {
                    for (const row of rows) {
                      await deleteBasicCocoaStatisticDomesticProduction({
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
          currentUserDontHavePrivilege(["BCS Domestic Production:Update"])
            ? null
            : customUtilities
        }
        customUtilitiesPosition="left"
      />

      <div className="flex mt-4">
        <p className="text-md">Total Data: </p>
        <p className="text-md font-bold mx-4">
          {data?.countBasicCocoaStatisticDomesticProductions || 0}
        </p>
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(BasicCocoaStatisticDomesticProduction);
