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
import dayjs from "dayjs";
import { MultiYearsFilterWithExport } from "../../components/MultiYearsFilterWithExport";

const QUERY = gql`
  query listQueries($year: String, $years: [String!]) {
    allBasicCocoaStatisticCultivatedAreas(year: $year, years: $years) {
      _id
      year

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
      estateNo
      estateArea
      estateMaturedArea
      smallhNo
      smallhArea
      maturedArea

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
    countBasicCocoaStatisticCultivatedAreas
  }
`;

const CREATE_BCS_CULTIVATED_AREA = gql`
  mutation createBasicCocoaStatisticCultivatedArea(
    $year: Int!
    $regionId: String!
    $stateId: String!
    $infoStatusId: String!
    $estateNo: Float
    $estateArea: Float
    $estateMaturedArea: Float
    $smallhNo: Float
    $smallhArea: Float
    $maturedArea: Float
  ) {
    createBasicCocoaStatisticCultivatedArea(
      year: $year
      regionId: $regionId
      stateId: $stateId
      infoStatusId: $infoStatusId
      estateNo: $estateNo
      estateArea: $estateArea
      estateMaturedArea: $estateMaturedArea
      smallhNo: $smallhNo
      smallhArea: $smallhArea
      maturedArea: $maturedArea
    )
  }
`;

const UPDATE_BCS_CULTIVATED_AREA = gql`
  mutation updateBasicCocoaStatisticCultivatedArea(
    $_id: String!
    $year: Int!
    $regionId: String!
    $stateId: String!
    $infoStatusId: String!
    $estateNo: Float
    $estateArea: Float
    $estateMaturedArea: Float
    $smallhNo: Float
    $smallhArea: Float
    $maturedArea: Float
  ) {
    updateBasicCocoaStatisticCultivatedArea(
      _id: $_id
      year: $year
      regionId: $regionId
      stateId: $stateId
      infoStatusId: $infoStatusId
      estateNo: $estateNo
      estateArea: $estateArea
      estateMaturedArea: $estateMaturedArea
      smallhNo: $smallhNo
      smallhArea: $smallhArea
      maturedArea: $maturedArea
    )
  }
`;
const DELETE_BCS_CULTIVATED_AREA = gql`
  mutation deleteBasicCocoaStatisticCultivatedArea($_id: String!) {
    deleteBasicCocoaStatisticCultivatedArea(_id: $_id)
  }
`;
const BasicCocoaStatisticCultivatedArea = ({
  currentUserDontHavePrivilege,
}) => {
  const notification = useNotification();
  const [formData, setFormData] = useState({});
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
      disableSortBy: true,
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
      Header: "Estate No",
      accessor: "estateNo",
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
      Header: "Estate Area",
      accessor: "estateArea",
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
      Header: "Estate Matured Area",
      accessor: "estateMaturedArea",
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
      Header: "Smallholder No",
      accessor: "smallhNo",
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
      Header: "Smallholder Area",
      accessor: "smallhArea",
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
      Header: "Matured Area",
      accessor: "maturedArea",
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

  // const year = String(router.query.year || dayjs().format("YYYY"));
  const YEARS = useMemo(() => {
    const toYear = parseInt(dayjs().get("year"));
    const fromYear = 1980;
    // console.log([...new Array(toYear - fromYear)])
    return [...new Array(toYear - fromYear)].map((_, index) => {
      // console.log(index, toYear, toYear - index)
      return String(toYear - index);
    });
  }, []);

  const [year, setYear] = useState(YEARS[0]);
  const [years, setYears] = useState([year]);

  const { data, loading, error, refetch } = useQuery(QUERY, {
    variables: {
      // regionId: formData.regionId || "",
      year,
      years,
    },
  });

  const [createBasicCocoaStatisticCultivatedArea] = useMutation(
    CREATE_BCS_CULTIVATED_AREA,
  );
  const [updateBasicCocoaStatisticCultivatedArea] = useMutation(
    UPDATE_BCS_CULTIVATED_AREA,
  );
  const [deleteBasicCocoaStatisticCultivatedArea] = useMutation(
    DELETE_BCS_CULTIVATED_AREA,
  );
  let allBasicCocoaStatisticCultivatedAreas = [];

  if (data?.allBasicCocoaStatisticCultivatedAreas) {
    allBasicCocoaStatisticCultivatedAreas =
      data.allBasicCocoaStatisticCultivatedAreas;
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
              onClick={e => {
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

                // console.log(propsTable.row.original);
                setModalVisible(true);
                setFormData({
                  ...propsTable.row.original,
                  regionId: propsTable.row.original.LocalRegion?._id || "",
                  stateId: propsTable.row.original.LocalState?._id || "",
                  infoStatusId: propsTable.row.original.InfoStatus?._id || "",
                });
                setState(allStates);
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

  // console.log(allStates);
  return (
    <div>
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Cultivated Area`}
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
            if (!formData.infoStatusId) {
              throw new Error("Info Status not selected");
            }
            if (!_id) {
              await createBasicCocoaStatisticCultivatedArea({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateBasicCocoaStatisticCultivatedArea({
                variables: {
                  ...formData,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Cultivated Area saved!`,
              level: "success",
            });
            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}>
        <div className="form-group">
          <label>Year*</label>
          <input
            placeholder="Year (YYYY)"
            className="form-control"
            value={formData.year || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                year: parseInt(e.target.value),
              });
            }}
            required
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
              setState(region.States);
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
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                stateId: e.target.value,
              });
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
          <label>Info Status</label>

          <select
            className="form-control"
            value={formData.infoStatusId || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                infoStatusId: e.target.value,
              });
            }}>
            <option value="" disabled>
              Select Info Status
            </option>
            {allInfoStatuses.map(infoStatus => (
              <option value={infoStatus._id}>{infoStatus.description}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Estate No</label>
          <NumberFormat
            className="form-control"
            value={formData.estateNo || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                estateNo: e.floatValue,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Estate Area</label>
          <NumberFormat
            className="form-control"
            value={formData.estateArea || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                estateArea: e.floatValue,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Estate Matured Area</label>
          <NumberFormat
            className="form-control"
            value={formData.estateMaturedArea || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                estateMaturedArea: e.floatValue,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Smallholder No</label>
          <NumberFormat
            className="form-control"
            value={formData.smallhNo || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                smallhNo: e.floatValue,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Smallholder Area</label>
          <NumberFormat
            className="form-control"
            value={formData.smallhArea || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                smallhArea: e.floatValue,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Smallholder Matured Area</label>
          <NumberFormat
            className="form-control"
            value={formData.maturedArea || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                maturedArea: e.floatValue,
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
              type="Cultivated Area"
              defaultValue={dayjs().format("YYYY")}
              options={YEARS}
              onSelect={(year, years) => {
                setYear(year);
                setYears(years);
              }}
              exportConfig={{
                title: "BCS Domestic - Cultivated Area",
                collectionName: "BasicCocoaStatisticDomesticCultivatedAreas",
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
        data={allBasicCocoaStatisticCultivatedAreas}
        withoutHeader={true}
        onAdd={
          currentUserDontHavePrivilege(["BCS Domestic Cultivated Area:Create"])
            ? null
            : e => {
                if (e) e.preventDefault();
                setModalVisible(true);
                setFormData({});
              }
        }
        onRemove={
          currentUserDontHavePrivilege(["BCS Domestic Cultivated Area:Delete"])
            ? null
            : async ({ rows }) => {
                showLoadingSpinner();
                try {
                  let yes = confirm(
                    `Are you sure to delete ${rows.length} data?`,
                  );
                  if (yes) {
                    for (const row of rows) {
                      await deleteBasicCocoaStatisticCultivatedArea({
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
          currentUserDontHavePrivilege(["BCS Domestic Cultivated Area:Update"])
            ? null
            : customUtilities
        }
        customUtilitiesPosition="left"
      />

      <div className="flex mt-4">
        <p className="text-md">Total Data: </p>
        <p className="text-md font-bold mx-4">
          {data?.countBasicCocoaStatisticCultivatedAreas || 0}
        </p>
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(BasicCocoaStatisticCultivatedArea);
