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
import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY_ONCE = gql`
  query listQueries {
    allInfoStatusesTokenized
    allLocalRegionTokenized
  }
`;
const BCS_CULTIVATED_AREA_QUERY = gql`
  query listQueries($year: String, $years: [String!]) {
    allBasicCocoaStatisticCultivatedAreasTokenized(year: $year, years: $years)
    countBasicCocoaStatisticCultivatedAreas
  }
`;

const CREATE_BCS_CULTIVATED_AREA = gql`
  mutation createBasicCocoaStatisticCultivatedAreaTokenized(
    $tokenizedInput: String!
  ) {
    createBasicCocoaStatisticCultivatedAreaTokenized(
      tokenizedInput: $tokenizedInput
    )
  }
`;

const UPDATE_BCS_CULTIVATED_AREA = gql`
  mutation updateBasicCocoaStatisticCultivatedAreaTokenized(
    $tokenizedInput: String!
  ) {
    updateBasicCocoaStatisticCultivatedAreaTokenized(
      tokenizedInput: $tokenizedInput
    )
  }
`;
const DELETE_BCS_CULTIVATED_AREA = gql`
  mutation deleteBasicCocoaStatisticCultivatedAreaTokenized(
    $tokenizedInput: String!
  ) {
    deleteBasicCocoaStatisticCultivatedAreaTokenized(
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
  const [allStates, setState] = useState([]);
  const router = useRouter();

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
  let [savedCount, setSavedCount] = useState(0);
  const [allBasicCocoaStatisticCultivatedAreas, setBCSCultivatedArea] =
    useState([]);

  const [countBasicCocoaStatisticCultivatedAreas, setCountData] = useState(0);
  const [allInfoStatuses, setInfoStatus] = useState([]);
  const [allLocalRegion, setLocalRegion] = useState([]);
  const [loading, setLoading] = useState(false);

  // const { data, error, refetch } = useQuery(QUERY, {
  //   variables: {
  //     // regionId: formData.regionId || "",
  //   },
  // });

  const [createBasicCocoaStatisticCultivatedAreaTokenized] = useMutation(
    CREATE_BCS_CULTIVATED_AREA,
  );
  const [updateBasicCocoaStatisticCultivatedAreaTokenized] = useMutation(
    UPDATE_BCS_CULTIVATED_AREA,
  );
  const [deleteBasicCocoaStatisticCultivatedAreaTokenized] = useMutation(
    DELETE_BCS_CULTIVATED_AREA,
  );

  const fetchData = async () => {
    const result = await client.query({
      query: QUERY_ONCE,
      variables: {},
      fetchPolicy: "no-cache",
    });

    const encryptedInfoStatus = result.data?.allInfoStatusesTokenized || "";
    if (encryptedInfoStatus) {
      const decrypted = jwt.verify(encryptedInfoStatus, TOKENIZE);
      setInfoStatus(decrypted.results);
    }

    const encryptedRegion = result.data?.allLocalRegionTokenized || "";
    if (encryptedRegion) {
      const decrypted = jwt.verify(encryptedRegion, TOKENIZE);
      setLocalRegion(decrypted.results);
    }
  }

  const fetchDataCultivatedArea = async (year, years) => {
    const result = await client.query({
      query: BCS_CULTIVATED_AREA_QUERY,
      variables: {
        year,
        years,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedData =
      result.data?.allBasicCocoaStatisticCultivatedAreasTokenized || "";
    if (encryptedData) {
      const decrypted = jwt.verify(encryptedData, TOKENIZE);
      setBCSCultivatedArea(decrypted.results);
    }

    setCountData(result.data.countBasicCocoaStatisticCultivatedAreas);

  }
  useEffect(() => {
    try {
      fetchData()
    } catch (err) {
      notification.handleError(err);
    }
  }, []);
  useEffect(() => {
    showLoadingSpinner();
    try {
      setLoading(true);
      fetchDataCultivatedArea(year, years)
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
              const tokenizedInput = jwt.sign(
                {
                  ...formData,
                },
                TOKENIZE,
              );
              await createBasicCocoaStatisticCultivatedAreaTokenized({
                variables: {
                  tokenizedInput,
                },
              });
            } else {
              const tokenizedInput = jwt.sign(
                {
                  ...formData,
                },
                TOKENIZE,
              );

              await updateBasicCocoaStatisticCultivatedAreaTokenized({
                variables: {
                  tokenizedInput,
                },
              });
            }
            setSavedCount((savedCount += 1));
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
                    const tokenizedInput = jwt.sign(
                      {
                        _id: row._id,
                      },
                      TOKENIZE,
                    );

                    await deleteBasicCocoaStatisticCultivatedAreaTokenized({
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
          currentUserDontHavePrivilege(["BCS Domestic Cultivated Area:Update"])
            ? null
            : customUtilities
        }
        customUtilitiesPosition="left"
      />

      <div className="flex mt-4">
        <p className="text-md">Total Data: </p>
        <p className="text-md font-bold mx-4">
          {countBasicCocoaStatisticCultivatedAreas || 0}
        </p>
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(BasicCocoaStatisticCultivatedArea);
