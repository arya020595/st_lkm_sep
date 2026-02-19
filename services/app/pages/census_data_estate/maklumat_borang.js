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

const ESTATE_STATUS_QUERY = gql`
  query allEstateCensusEstateStatus {
    allEstateCensusEstateStatus {
      _id
      status
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

const GET_MAKLUMAT_BORANG = gql`
  query allMaklumatBorang($estateInformationId: String) {
    allMaklumatBorang(estateInformationId: $estateInformationId) {
      _id
      estateStatus
      receiveDate
      createdDate
      editedDate1
      editedDate2
      operatorName1
      operatorName2
      officerName
      visitDate
      editorName1
      editorName2
      connName
      conPosition
      conDate
      conTelephone1
      conTelephone2
      conFax1
      conFax2
      censusYear
    }
  }
`;

const CREATE_MAKLUMAT_BORANG = gql`
  mutation createMaklumatBorang(
    $estateId: String
    $estateStatus: String
    $receiveDate: String
    $createdDate: String
    $editedDate1: String
    $editedDate2: String
    $operatorName1: String
    $operatorName2: String
    $officerName: String
    $visitDate: String
    $editorName1: String
    $editorName2: String
    $connName: String
    $conPosition: String
    $conDate: String
    $conTelephone1: String
    $conTelephone2: String
    $conFax1: String
    $conFax2: String
    $censusYear: Int
  ) {
    createMaklumatBorang(
      estateId: $estateId

      estateStatus: $estateStatus
      receiveDate: $receiveDate
      createdDate: $createdDate
      editedDate1: $editedDate1
      editedDate2: $editedDate2
      operatorName1: $operatorName1
      operatorName2: $operatorName2
      officerName: $officerName
      visitDate: $visitDate
      editorName1: $editorName1
      editorName2: $editorName2
      connName: $connName
      conPosition: $conPosition
      conDate: $conDate
      conTelephone1: $conTelephone1
      conTelephone2: $conTelephone2
      conFax1: $conFax1
      conFax2: $conFax2
      censusYear: $censusYear
    )
  }
`;

const UPDATE_MAKLUMAT_BORANG = gql`
  mutation updateMaklumatBorang(
    $_id: String!
    $estateId: String
    $estateStatus: String
    $receiveDate: String
    $createdDate: String
    $editedDate1: String
    $editedDate2: String
    $operatorName1: String
    $operatorName2: String
    $officerName: String
    $visitDate: String
    $editorName1: String
    $editorName2: String
    $connName: String
    $conPosition: String
    $conDate: String
    $conTelephone1: String
    $conTelephone2: String
    $conFax1: String
    $conFax2: String
    $censusYear: Int
  ) {
    updateMaklumatBorang(
      _id: $_id
      estateId: $estateId

      estateStatus: $estateStatus
      receiveDate: $receiveDate
      createdDate: $createdDate
      editedDate1: $editedDate1
      editedDate2: $editedDate2
      operatorName1: $operatorName1
      operatorName2: $operatorName2
      officerName: $officerName
      visitDate: $visitDate
      editorName1: $editorName1
      editorName2: $editorName2
      connName: $connName
      conPosition: $conPosition
      conDate: $conDate
      conTelephone1: $conTelephone1
      conTelephone2: $conTelephone2
      conFax1: $conFax1
      conFax2: $conFax2
      censusYear: $censusYear
    )
  }
`;
const DELETE_MAKLUMAT_BORANG = gql`
  mutation deleteMaklumatBorang($_id: String!) {
    deleteMaklumatBorang(_id: $_id)
  }
`;

const MaklumatBorang = () => {
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
  const [maklumatBorangList, setMaklumatBorangList] = useState([]);
  const [nextData, setNextData] = useState(1);
  const [allEstateInformation, setAllEstateInformation] = useState([]);

  const [allYearList, setAllEstateCensusYearListByEstate] = useState([]);

  const [createMaklumatBorang] = useMutation(CREATE_MAKLUMAT_BORANG);
  const [updateMaklumatBorang] = useMutation(UPDATE_MAKLUMAT_BORANG);
  const [deleteMaklumatBorang] = useMutation(DELETE_MAKLUMAT_BORANG);

  const { data, loading, error, refetch } = useQuery(ESTATE_STATUS_QUERY);
  let allEstateCensusEstateStatus = [];
  if (data?.allEstateCensusEstateStatus) {
    allEstateCensusEstateStatus = data.allEstateCensusEstateStatus;
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
    fetchData(router)
  }, [router.query]);

  const columns = useMemo(() => [
    {
      Header: "Tahun Banci",
      accessor: "censusYear",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Status Estate",
      accessor: "estateStatus",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Q Terima",
      accessor: "receiveDate",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Q Edit 1",
      accessor: "editedDate1",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Q Edit 2",
      accessor: "editedDate2",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Operator 1",
      accessor: "operatorName1",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Operator 2",
      accessor: "operatorName2",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Pembanci",
      accessor: "officerName",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Tarikh Lawatan",
      accessor: "visitDate",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Penyunting 1",
      accessor: "editorName1",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Penyunting 2",
      accessor: "editorName2",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Nama Akuan",
      accessor: "connName",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Jawatan Akuan",
      accessor: "conPosition",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Tarikh Akuan",
      accessor: "conDate",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Tel Akuan 1",
      accessor: "conTelephone1",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Tel Akuan 2",
      accessor: "conTelephone2",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Fax Akuan 1",
      accessor: "conFax1",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Fax Akuan 2",
      accessor: "conFax2",
      style: {
        fontSize: 20,
      },
    },
  ]);

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

      // console.log({ reformatResult });

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
        query: GET_MAKLUMAT_BORANG,
        variables: {
          estateInformationId: estateInfoId,
        },
        fetchPolicy: "no-cache",
      });
      setMaklumatBorangList(result.data.allMaklumatBorang);
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
        <title>Maklumat Borang</title>
      </Head>

      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Maklumat Borang`}
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
            if (!_id) {
              await createMaklumatBorang({
                variables: {
                  ...formData,
                  estateId: "" + parseInt(estateInformation.estateId),
                },
              });
            } else {
              await updateMaklumatBorang({
                variables: {
                  ...formData,
                },
              });
            }
            await fetching(estateInformation._id);
            notification.addNotification({
              title: "Succeess!",
              message: `Maklumat Borang saved!`,
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
          <label>Status Estate</label>
          <select
            className="form-control"
            value={formData.estateStatus || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                estateStatus: e.target.value,
              });
            }}>
            <option value="" disabled>
              Select Status Estate
            </option>
            {allEstateCensusEstateStatus.map(stat => (
              <option value={stat.status}>{stat.status}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Q Terima</label>
          <input
            className="form-control"
            type="date"
            value={formData.receiveDate || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                receiveDate: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Q Edit 1</label>
          <input
            type="date"
            className="form-control"
            value={formData.editedDate1 || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                editedDate1: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Q Edit 2</label>
          <input
            className="form-control"
            type="date"
            value={formData.editedDate2 || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                editedDate2: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Operator 1</label>
          <input
            className="form-control"
            value={formData.operatorName1 || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                operatorName1: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Operator 2</label>
          <input
            className="form-control"
            value={formData.operatorName2 || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                operatorName2: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Pembanci</label>
          <input
            className="form-control"
            value={formData.officerName || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                officerName: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Tarikh Lawatan</label>
          <input
            className="form-control"
            type="date"
            value={formData.visitDate || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                visitDate: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Penyunting 1</label>
          <input
            className="form-control"
            value={formData.editorName1 || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                editorName1: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Penyunting 2</label>
          <input
            className="form-control"
            value={formData.editorName2 || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                editorName2: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Nama Akuan</label>
          <input
            className="form-control"
            value={formData.connName || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                connName: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Jawatan Akuan</label>
          <input
            className="form-control"
            value={formData.conPosition || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                conPosition: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Tarikh Akuan</label>
          <input
            className="form-control"
            type="date"
            value={formData.conDate || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                conDate: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Tel Akuan 1</label>
          <input
            className="form-control"
            value={formData.conTelephone1 || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                conTelephone1: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Tel Akuan 2</label>
          <input
            className="form-control"
            value={formData.conTelephone2 || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                conTelephone2: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Fax Akuan 1</label>
          <input
            className="form-control"
            value={formData.conFax1 || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                conFax1: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Fax Akuan 2</label>
          <input
            className="form-control"
            value={formData.conFax2 || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                conFax2: e.target.value,
              });
            }}
          />
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
            data={maklumatBorangList.filter(
              b => b.censusYear === parseInt(router.query.estateYear),
            )}
            withoutHeader={true}
            onAdd={
              currentUserDontHavePrivilege(["Maklumat Borang:Create"])
                ? null
                : allEstateInformation.length === 0
                  ? null
                  : e => {
                    if (e) e.preventDefault();
                    setModalVisible(true);
                    setFormData({
                      censusYear: parseInt(router.query.estateYear),
                    });
                  }
            }
            onRemove={
              currentUserDontHavePrivilege(["Maklumat Borang:Delete"])
                ? null
                : async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} data?`,
                    );
                    if (yes) {
                      for (const row of rows) {
                        await deleteMaklumatBorang({
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
              currentUserDontHavePrivilege(["Maklumat Borang:Delete"])
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
export default withApollo({ ssr: true })(MaklumatBorang);
