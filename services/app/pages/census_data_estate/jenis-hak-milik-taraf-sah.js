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
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import Table from "../../components/Table";
import { FormModal } from "../../components/Modal";

import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();
const { MODE } = publicRuntimeConfig;

const REFCOM_STATUS_QUERY = gql`
  query allRefComStatuses {
    allRefComStatuses {
      _id
      comStatus
    }
  }
`;
const GET_ESTATE_INFO_QUERY = gql`
  query allEstateInformation(
    $recordType: String
    $stateCode: String
    $districtCode: String
    $estateId: String
    $estateType: String
  ) {
    allEstateInformation(
      recordType: $recordType
      stateCode: $stateCode
      districtCode: $districtCode
      estateId: $estateId
      estateType: $estateType
    ) {
      _id
      estateId
      estateName
      estateState

      recordType
      stateCode
      districtCode
      estateType
    }

    allEstateCensusYearListByEstate(estateId: $estateId) {
      _id
      estateId
      year
    }
  }
`;

const GET_TARAF_SAH = gql`
  query allTarafSah($estateInformationId: String) {
    allTarafSah(estateInformationId: $estateInformationId) {
      _id
      estateId
      legalStatus
      state
      owner
      censusYear
    }
  }
`;

const CREATE_TARAF_SAH = gql`
  mutation createTarafSah(
    $estateId: String
    $legalStatus: String
    $state: String
    $owner: String
    $censusYear: Int
    $refComStatusId: String
  ) {
    createTarafSah(
      estateId: $estateId
      legalStatus: $legalStatus
      state: $state
      owner: $owner
      censusYear: $censusYear
      refComStatusId: $refComStatusId
    )
  }
`;

const UPDATE_TARAF_SAH = gql`
  mutation updateTarafSah(
    $_id: String!
    $estateId: String
    $legalStatus: String
    $state: String
    $owner: String
    $censusYear: Int
    $refComStatusId: String
  ) {
    updateTarafSah(
      _id: $_id
      estateId: $estateId
      legalStatus: $legalStatus
      state: $state
      owner: $owner
      censusYear: $censusYear
      refComStatusId: $refComStatusId
    )
  }
`;
const DELETE_TARAF_SAH = gql`
  mutation deleteTarafSah($_id: String!) {
    deleteTarafSah(_id: $_id)
  }
`;

const TarafSah = () => {
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const client = useApolloClient();
  const router = useRouter();
  const notification = useNotification();
  const [formData, setFormData] = useState({
    censusYear: router.query.estateYear
      ? parseInt(router.query.estateYear)
      : "",
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [filterData, setFilterData] = useState({});
  const [estateInformation, setEstateInformation] = useState({});
  const [tarafSahList, setTarafSahList] = useState([]);
  const [nextData, setNextData] = useState(1);
  const [allEstateInformation, setAllEstateInformation] = useState([]);

  const [allYearList, setAllEstateCensusYearListByEstate] = useState([]);

  const [createTarafSah] = useMutation(CREATE_TARAF_SAH);
  const [updateTarafSah] = useMutation(UPDATE_TARAF_SAH);
  const [deleteTarafSah] = useMutation(DELETE_TARAF_SAH);

  const { data, loading, error, refetch } = useQuery(REFCOM_STATUS_QUERY);
  let allRefComStatuses = [];
  if (data?.allRefComStatuses) {
    allRefComStatuses = data.allRefComStatuses;
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
                setModalVisible(true);
                setFormData({
                  ...propsTable.row.original,
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

  const columns = useMemo(() => [
    {
      Header: "Census Year",
      accessor: "censusYear",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Estate ID",
      accessor: "estateId",
      style: {
        fontSize: 20,
      },
    },

    {
      Header: "Taraf Sah",
      accessor: "legalStatus",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Kenyataan",
      accessor: "state",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Jenis Hak Milik",
      accessor: "owner",
      style: {
        fontSize: 20,
      },
    },
  ]);

  const fetchData = async (router) => {
    if (router.query && router.query.estateId) {
      if (Object.keys(filterData).length === 0) {
        await applyFilter({
          filterData: {
            estateId: router.query.estateId,
          },
        });
      } else {
        await applyFilter({
          filterData,
        });
      }
    }
  }

  useEffect(() => {
    console.log("Hit..");
    fetchData(router)
  }, [router.query]);

  const applyFilter = async ({ filterData }) => {
    showLoadingSpinner();
    try {
      const result = await client.query({
        query: GET_ESTATE_INFO_QUERY,
        variables: {
          ...filterData,
        },
        fetchPolicy: "no-cache",
      });

      if (
        !result.data.allEstateInformation ||
        result.data.allEstateInformation.length === 0
      ) {
        throw {
          message: "Data not found in query",
        };
      }

      const firstData = result.data.allEstateInformation[0];
      const reformatResult = reformat(firstData);

      setAllEstateInformation(result.data.allEstateInformation);
      setEstateInformation({
        ...firstData,
      });

      setFilterData({
        estateId: reformatResult.prefId,
        recordType: reformatResult.prefRecType,
        districtCode: reformatResult.prefDistCode,
        stateCode: reformatResult.prefStateCode,
        estateType: reformatResult.prefEstType,
      });

      setAllEstateCensusYearListByEstate(
        result.data.allEstateCensusYearListByEstate,
      );

      await fetching(firstData._id);
    } catch (err) {
      notification.handleError(err);
    }
    hideLoadingSpinner();
  };

  const reformat = data => {
    let prefId = "00000",
      prefRecType = "",
      prefDistCode = "",
      prefStateCode = "",
      prefEstType = "";
    if (data.estateId) {
      prefId = prefId.slice(0, data.estateId.length * -1) + data.estateId;
    }
    if (data.recordType) {
      prefRecType = "00";
      prefRecType =
        prefRecType.slice(0, data.recordType.length * -1) + data.recordType;
    }
    if (data.districtCode) {
      prefDistCode = "00";
      prefDistCode =
        prefDistCode.slice(0, data.districtCode.length * -1) +
        data.districtCode;
    }
    if (data.stateCode) {
      prefStateCode = "00";
      prefStateCode =
        prefStateCode.slice(0, data.stateCode.length * -1) + data.stateCode;
    }

    if (data.estateType) {
      prefEstType = "00";
      prefEstType =
        prefEstType.slice(0, data.estateType.length * -1) + data.estateType;
    }
    return {
      prefId,
      prefRecType,
      prefDistCode,
      prefStateCode,
      prefEstType,
    };
  };

  const fetching = async estateInfoId => {
    showLoadingSpinner();
    try {
      const result = await client.query({
        query: GET_TARAF_SAH,
        variables: {
          estateInformationId: estateInfoId,
        },
        fetchPolicy: "no-cache",
      });
      setTarafSahList(result.data.allTarafSah);
    } catch (err) {
      notification.handleError(err);
    }
    hideLoadingSpinner();
  };

  const handleNextData = async e => {
    if (e) e.preventDefault();
    showLoadingSpinner();
    const n = nextData + 1;
    setNextData(n);
    const data = allEstateInformation[n - 1];
    setEstateInformation({ ...data });
    await fetching(data._id);

    hideLoadingSpinner();
  };

  const handlePrevious = async e => {
    if (e) e.preventDefault();
    showLoadingSpinner();
    const n = nextData - 1;
    setNextData(n);
    const data = allEstateInformation[n - 1];
    setEstateInformation({ ...data });
    await fetching(data._id);

    hideLoadingSpinner();
  };
  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Taraf Sah/Jenis Hak Milik</title>
      </Head>

      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Taraf Sah/Jenis Hak Milik`}
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

            // console.log({ formData });
            if (!_id) {
              await createTarafSah({
                variables: {
                  ...formData,
                  estateId: "" + parseInt(estateInformation.estateId),
                },
              });
            } else {
              await updateTarafSah({
                variables: {
                  ...formData,
                },
              });
            }
            await fetching(estateInformation._id);
            notification.addNotification({
              title: "Succeess!",
              message: `Taraf Sah saved!`,
              level: "success",
            });
            setModalVisible(false);
            setFormData({});
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}>
        <div className="form-group">
          <label>Tahun Banci *</label>
          <select
            className="form-control"
            value={formData.censusYear || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                censusYear: parseInt(e.target.value),
              });
            }}
            disabled
            required>
            <option value={""} disabled>
              Select Year
            </option>
            {allYearList.map(list => (
              <option value={list.year}>{list.year}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Taraf Sah</label>
          <select
            className="form-control"
            value={formData.legalStatus || ""}
            onChange={e => {
              if (e) e.preventDefault();
              const refComStatus = allRefComStatuses.find(
                ref => ref.comStatus === e.target.value,
              );
              setFormData({
                ...formData,
                legalStatus: e.target.value,
                refComStatusId: refComStatus?._id || "",
              });
            }}>
            <option value="" disabled>
              Select Status
            </option>
            {allRefComStatuses.map(stat => (
              <option value={stat.comStatus}>{stat.comStatus}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Kenyataan</label>
          <input
            className="form-control"
            value={formData.state || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                state: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Jenis Hak Milik</label>
          <select
            className="form-control"
            value={formData.owner || ""}
            onChange={e => {
              if (e) e.preventDefault();

              setFormData({
                ...formData,
                owner: e.target.value,
              });
            }}>
            <option value="" disabled>
              Select Jenis Hak Milik
            </option>
            <option value={"Persendirian (Bukan Kerajaan)"}>
              Persendirian (Bukan Kerajaan)
            </option>
            <option value={"Kerajaan atau Separuh Kerajaan"}>
              Kerajaan atau Separuh Kerajaan
            </option>
            <option value={"Milik Bersama (Kerajaan dan Persendirian)"}>
              Milik Bersama (Kerajaan dan Persendirian)
            </option>
          </select>
        </div>
      </FormModal>

      <div className="mt-28 mx-10">
        <div className="border border-gray-200 shadow-md px-4 py-4 rounded-md shadow-md">
          <div className="grid grid-cols-6 gap-2">
            <div className="form-group">
              <label>ID Estate</label>
              <input
                className="form-control"
                value={filterData.estateId}
                onChange={e => {
                  if (e) e.preventDefault();
                  setFilterData({
                    ...filterData,
                    estateId: e.target.value,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Jenis Rekod</label>
              <input
                className="form-control"
                value={filterData.recordType}
                onChange={e => {
                  if (e) e.preventDefault();
                  setFilterData({
                    ...filterData,
                    recordType: e.target.value,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Negeri</label>
              <input
                className="form-control"
                value={filterData.stateCode}
                onChange={e => {
                  if (e) e.preventDefault();
                  setFilterData({
                    ...filterData,
                    stateCode: e.target.value,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Daerah</label>
              <input
                className="form-control"
                value={filterData.districtCode}
                onChange={e => {
                  if (e) e.preventDefault();
                  setFilterData({
                    ...filterData,
                    districtCode: e.target.value,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Jenis Estate</label>
              <input
                className="form-control"
                value={filterData.estateType}
                onChange={e => {
                  if (e) e.preventDefault();
                  setFilterData({
                    ...filterData,
                    estateType: e.target.value,
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Tahun Banci</label>
              <input
                className="form-control bg-gray-200"
                value={router.query.estateYear}
                disabled
              />
            </div>
          </div>

          <button
            className="bg-mantis-500 px-4 py-2 rounded-md shadow-md text-white font-bold text-md mt-2"
            onClick={e => {
              if (e) e.preventDefault();
              router.replace({
                pathname: router.pathname,
                query: {
                  ...router.query,
                  ...filterData,
                },
              });
            }}>
            <p>
              <i className="fa fa-save" /> Submit
            </p>
          </button>

          <div className="form-group">
            <label>Nama</label>
            <input
              className="form-control bg-gray-400"
              value={estateInformation.estateName || ""}
              disabled
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="form-group">
              <label>Estate</label>
              <input
                className="form-control bg-gray-400"
                value={estateInformation.estateState || ""}
                disabled
              />
            </div>
          </div>

          <div className="flex justify-center mt-4">
            <p
              className={`text-3xl font-bold ${nextData === 1 ? "text-gray-400" : "text-black"
                } cursor-pointer mx-2`}
              onClick={nextData === 1 ? null : handlePrevious}>
              <i className="fa fa-caret-left" />
            </p>

            {allEstateInformation.length > 0 ? (
              <p className="text-2xl mx-2">
                {nextData} of {allEstateInformation.length} Page
              </p>
            ) : null}

            <p
              className={`text-3xl font-bold ${nextData === allEstateInformation.length ||
                allEstateInformation.length === 0
                ? "text-gray-400"
                : "text-black"
                } cursor-pointer mx-2`}
              onClick={
                nextData === allEstateInformation.length ||
                  allEstateInformation.length === 0
                  ? null
                  : handleNextData
              }>
              <i className="fa fa-caret-right" />
            </p>
          </div>
        </div>

        <div className="mt-4">
          <Table
            loading={false}
            columns={columns}
            data={tarafSahList.filter(
              b => b.censusYear === parseInt(router.query.estateYear),
            )}
            withoutHeader={true}
            onAdd={
              currentUserDontHavePrivilege([
                "Taraf Sah / Jenis Hak Milik:Create",
              ])
                ? null
                : allEstateInformation.length === 0
                  ? null
                  : e => {
                    if (e) e.preventDefault();
                    setModalVisible(true);
                    setFormData({
                      censusYear: router.query.estateYear
                        ? parseInt(router.query.estateYear)
                        : "",
                    });
                  }
            }
            onRemove={
              currentUserDontHavePrivilege([
                "Taraf Sah / Jenis Hak Milik:Delete",
              ])
                ? null
                : async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} data?`,
                    );
                    if (yes) {
                      for (const row of rows) {
                        await deleteTarafSah({
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
                      await fetching(estateInformation._id);
                    }
                  } catch (err) {
                    handleError(err);
                  }
                  hideLoadingSpinner();
                }
            }
            customUtilities={
              currentUserDontHavePrivilege([
                "Taraf Sah / Jenis Hak Milik:Update",
              ])
                ? null
                : customUtilities
            }
            customUtilitiesPosition="left"
          />
        </div>
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(TarafSah);
