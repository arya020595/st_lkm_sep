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

const GET_ESTATE_BUYER = gql`
  query allEstateCensusBuyer($estateInformationId: String) {
    allEstateCensusBuyer(estateInformationId: $estateInformationId) {
      _id
      estateId
      name
      address
      zipCode
      telephone
      date
      status
      statement
      censusYear
      recordId
    }
  }
`;

const GET_RECORD_ID = gql`
  query latestRecordIdQuery {
    estateCensusBuyerLatestRecordId
  }
`;

const CREATE_ESTATE_BUYER = gql`
  mutation createEstateCensusBuyer(
    $estateId: String
    $name: String
    $address: String
    $zipCode: String
    $telephone: String
    $date: String
    $status: String
    $statement: String
    $censusYear: Int
    $recordId: String
    $estateInformationId: String
  ) {
    createEstateCensusBuyer(
      estateId: $estateId
      name: $name
      address: $address
      zipCode: $zipCode
      telephone: $telephone
      date: $date
      status: $status
      statement: $statement
      censusYear: $censusYear
      recordId: $recordId
      estateInformationId: $estateInformationId
    )
  }
`;

const UPDATE_ESTATE_BUYER = gql`
  mutation updateEstateCensusBuyer(
    $_id: String!
    $estateId: String
    $name: String
    $address: String
    $zipCode: String
    $telephone: String
    $date: String
    $status: String
    $statement: String
    $censusYear: Int
    $recordId: String
    $estateInformationId: String
  ) {
    updateEstateCensusBuyer(
      _id: $_id
      estateId: $estateId
      name: $name
      address: $address
      zipCode: $zipCode
      telephone: $telephone
      date: $date
      status: $status
      statement: $statement
      censusYear: $censusYear
      recordId: $recordId
      estateInformationId: $estateInformationId
    )
  }
`;
const DELETE_ESTATE_BUYER = gql`
  mutation deleteEstateCensusBuyer($_id: String!) {
    deleteEstateCensusBuyer(_id: $_id)
  }
`;

const EstateCensusBuyer = () => {
  const client = useApolloClient();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const router = useRouter();
  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [filterData, setFilterData] = useState({});
  const [estateInformation, setEstateInformation] = useState({});
  const [buyerList, setEstateCensusBuyerList] = useState([]);
  const [nextData, setNextData] = useState(1);
  const [allEstateInformation, setAllEstateInformation] = useState([]);

  const [allYearList, setAllEstateCensusYearListByEstate] = useState([]);
  const { data, error, loading, refetch } = useQuery(GET_RECORD_ID);

  const [createEstateCensusBuyer] = useMutation(CREATE_ESTATE_BUYER);
  const [updateEstateCensusBuyer] = useMutation(UPDATE_ESTATE_BUYER);
  const [deleteEstateCensusBuyer] = useMutation(DELETE_ESTATE_BUYER);

  const recordId = data?.estateCensusBuyerLatestRecordId || "";
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
    console.log("Hit..");
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
      Header: "Estate ID",
      accessor: "estateId",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Nama",
      accessor: "name",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "Alamat",
      accessor: "address",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "Poskod",
      accessor: "zipCode",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Tel",
      accessor: "telephone",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "Tarikh",
      accessor: "date",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "Status",
      accessor: "status",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Keterangan",
      accessor: "statement",
      style: {
        fontSize: 20,
        width: 250,
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
        query: GET_ESTATE_BUYER,
        variables: {
          estateInformationId: estateInfoId,
        },
        fetchPolicy: "no-cache",
      });
      setEstateCensusBuyerList(result.data.allEstateCensusBuyer);
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
        <title>Buyer</title>
      </Head>

      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Buyer`}
        visible={modalVisible}
        onClose={e => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            censusYear: router.query.estateYear
              ? parseInt(router.query.estateYear)
              : "",
          });
        }}
        onSubmit={async e => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            let { _id, __typename, _createdAt, _updatedAt } = formData;

            if (!_id) {
              await createEstateCensusBuyer({
                variables: {
                  ...formData,
                  recordId,
                  estateId: "" + parseInt(estateInformation.estateId),
                },
              });
            } else {
              await updateEstateCensusBuyer({
                variables: {
                  ...formData,
                },
              });
            }
            await fetching(estateInformation._id);
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Buyer saved!`,
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
          <label>Nama</label>
          <input
            className="form-control"
            value={formData.name || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                name: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Alamat</label>
          <textarea
            rows={4}
            className="form-control"
            value={formData.address || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                address: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Poskod</label>
          <input
            className="form-control"
            value={formData.zipCode || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                zipCode: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Telephone</label>
          <input
            className="form-control"
            value={formData.telephone || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                telephone: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Tarikh</label>
          <input
            type="date"
            className="form-control"
            value={formData.date || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                date: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Status</label>
          <input
            className="form-control"
            value={formData.status || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                status: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Keterangan</label>
          <input
            className="form-control"
            value={formData.statement || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                statement: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>REC. ID</label>
          <input
            className="form-control"
            value={formData.recordId || recordId}
            disabled
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
            data={buyerList.filter(
              b => b.censusYear === parseInt(router.query.estateYear),
            )}
            withoutHeader={true}
            onAdd={
              currentUserDontHavePrivilege(["Estate Census Buyer:Create"])
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
              currentUserDontHavePrivilege(["Estate Census Buyer:Delete"])
                ? null
                : async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} data?`,
                    );
                    if (yes) {
                      for (const row of rows) {
                        await deleteEstateCensusBuyer({
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
              currentUserDontHavePrivilege(["Estate Census Buyer:Update"])
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
export default withApollo({ ssr: true })(EstateCensusBuyer);
