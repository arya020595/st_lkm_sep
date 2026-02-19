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
import NumberFormat from "react-number-format";
import getConfig from "next/config";
import { v4 as uuidV4 } from "uuid";

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
const GET_PEMILIK_SAHAM = gql`
  query allEstateCensusPemilikSaham($estateInformationId: String) {
    allEstateCensusPemilikSaham(estateInformationId: $estateInformationId) {
      _id
      estateId
      name
      censusYear
      share
    }
  }
`;

const CREATE_PEMILIK_SAHAM = gql`
  mutation createEstateCensusPemilikSaham(
    $estateId: String
    $name: String
    $share: Float
    $censusYear: Int
  ) {
    createEstateCensusPemilikSaham(
      estateId: $estateId
      name: $name
      share: $share
      censusYear: $censusYear
    )
  }
`;

const UPDATE_PEMILIK_SAHAM = gql`
  mutation updateEstateCensusPemilikSaham(
    $_id: String!
    $estateId: String
    $name: String
    $share: Float
    $censusYear: Int
  ) {
    updateEstateCensusPemilikSaham(
      _id: $_id
      estateId: $estateId
      name: $name
      share: $share
      censusYear: $censusYear
    )
  }
`;
const DELETE_PEMILIK_SAHAM = gql`
  mutation deleteEstateCensusPemilikSaham($_id: String!) {
    deleteEstateCensusPemilikSaham(_id: $_id)
  }
`;

const allEstateCensusPemilikSaham = () => {
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const client = useApolloClient();
  const router = useRouter();
  const notification = useNotification();
  const [formData, setFormData] = useState({
    status: "",
    lists: [],
    censusYear: router.query.estateYear
      ? parseInt(router.query.estateYear)
      : "",
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [filterData, setFilterData] = useState({});
  const [estateInformation, setEstateInformation] = useState({});
  const [listPemilikSaham, setAllEstateCensusPemilikSahamList] = useState([]);
  const [nextData, setNextData] = useState(1);
  const [allEstateInformation, setAllEstateInformation] = useState([]);

  const [allYearList, setAllEstateCensusYearListByEstate] = useState([]);

  const [createEstateCensusPemilikSaham] = useMutation(CREATE_PEMILIK_SAHAM);
  const [updateEstateCensusPemilikSaham] = useMutation(UPDATE_PEMILIK_SAHAM);
  const [deleteEstateCensusPemilikSaham] = useMutation(DELETE_PEMILIK_SAHAM);

  const listByYear = listPemilikSaham.filter(
    b => b.censusYear === parseInt(router.query.estateYear),
  );
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
                  status: "edit",
                  ...propsTable.row.original,
                  lists: listByYear,
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
      Header: "Tahun Banci",
      accessor: "censusYear",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "ID Estate",
      accessor: "estateId",
      style: {
        fontSize: 20,
      },
    },

    {
      Header: "Nama Pemilik",
      accessor: "name",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "% Saham",
      accessor: "share",
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
    // console.log({ estateInfoId });
    try {
      const result = await client.query({
        query: GET_PEMILIK_SAHAM,
        variables: {
          estateInformationId: estateInfoId,
        },
        fetchPolicy: "no-cache",
      });

      // console.log(result.data);
      setAllEstateCensusPemilikSahamList(
        result.data.allEstateCensusPemilikSaham,
      );
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

  const recalculate = (listData, status, editObject) => {
    if (status === "new") {
      console.log({ listData });
      let totalShare = listData
        .map(data => data.share)
        .reduce((acc, curr) => acc + curr);

      const previousShare = listByYear
        .map(y => y.share)
        .reduce((acc, curr) => acc + curr, 0);

      totalShare = totalShare + previousShare;

      if (totalShare > 100) {
        throw {
          message: `Exceeding Share ${totalShare}. Total Share max 100`,
        };
      }
    } else {
      const excludedLists = listData.filter(
        data => data._id !== editObject._id,
      );
      const totalShare =
        editObject.share +
        excludedLists.map(d => d.share).reduce((acc, curr) => acc + curr, 0);

      if (totalShare > 100) {
        throw {
          message: `Exceeding Share ${totalShare}. Total Share max 100`,
        };
      }
    }
  };
  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Pemilik Saham</title>
      </Head>

      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Pemilik Saham`}
        visible={modalVisible}
        onClose={e => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            status: "",
            lists: [],
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

            if (formData.status === "new") {
              //recalculate first

              recalculate(formData.lists, "new", null);
              for (let data of formData.lists) {
                delete data._id;
                await createEstateCensusPemilikSaham({
                  variables: {
                    ...data,
                    censusYear: formData.censusYear,
                    estateId: "" + parseInt(estateInformation.estateId),
                  },
                });
              }
            } else {
              recalculate(formData.lists, "edit", formData);
              if (formData.lists) {
                delete formData.lists;
              }
              await updateEstateCensusPemilikSaham({
                variables: {
                  ...formData,
                  estateId: "" + parseInt(estateInformation.estateId),
                },
              });
            }
            await fetching(estateInformation._id);
            notification.addNotification({
              title: "Succeess!",
              message: `Pemilik Saham saved!`,
              level: "success",
            });
            setModalVisible(false);
            setFormData({
              status: "",
              lists: [],
              censusYear: router.query.estateYear
                ? parseInt(router.query.estateYear)
                : "",
            });
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

        {formData.status === "edit" ? (
          <div>
            <div className="form-group">
              <label>Nama Pemilik</label>
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
              <label>Share</label>
              <NumberFormat
                className="form-control"
                value={formData.share || 0}
                thousandSeparator={","}
                fixedDecimalScale={true}
                decimalSeparator={"."}
                decimalScale={2}
                onValueChange={e => {
                  // if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    share: e.floatValue,
                  });
                }}
              />
            </div>
          </div>
        ) : (
          formData.lists.map(data => (
            <div className="grid grid-cols-5 gap-2">
              <div className="col-span-2">
                <div className="form-group">
                  <label>Nama Pemilik</label>
                  <input
                    className="form-control"
                    value={data.name || ""}
                    onChange={e => {
                      if (e) e.preventDefault();
                      setFormData({
                        ...formData,
                        lists: formData.lists.map(d =>
                          data._id !== d._id
                            ? d
                            : {
                              ...data,
                              name: e.target.value,
                            },
                        ),
                      });
                    }}
                  />
                </div>
              </div>

              <div className="col-span-2">
                <div className="form-group">
                  <label>Share</label>
                  <NumberFormat
                    className="form-control"
                    value={data.share || 0}
                    thousandSeparator={","}
                    fixedDecimalScale={true}
                    decimalSeparator={"."}
                    decimalScale={2}
                    onValueChange={e => {
                      // if (e) e.preventDefault();
                      setFormData({
                        ...formData,
                        lists: formData.lists.map(d =>
                          data._id !== d._id
                            ? d
                            : {
                              ...data,
                              share: e.floatValue,
                            },
                        ),
                      });
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end items-end py-2">
                <button
                  className="bg-red-500 px-4 py-2 rounded-md shadow-md text-white font-bold"
                  onClick={e => {
                    if (e) e.preventDefault();
                    setFormData({
                      ...formData,
                      lists: formData.lists.filter(
                        list => list._id !== data._id,
                      ),
                    });
                  }}>
                  <p className="text-md">
                    <i className="fa fa-times" />
                  </p>
                </button>
              </div>
            </div>
          ))
        )}

        {formData.status === "new" ? (
          <div className="flex justify-center mt-4">
            <button
              className="bg-mantis-500 px-4 py-2 mx-2 rounded-md shadow-md text-white font-bold text-md"
              onClick={e => {
                if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  lists: [
                    ...formData.lists,
                    {
                      _id: uuidV4(),
                      name: "",
                      share: 0,
                    },
                  ],
                });
              }}>
              <p>
                <i className="fa fa-plus-circle" /> Add New
              </p>
            </button>
          </div>
        ) : null}
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
            data={listPemilikSaham.filter(
              b => b.censusYear === parseInt(router.query.estateYear),
            )}
            withoutHeader={true}
            onAdd={
              currentUserDontHavePrivilege(["Pemilik Saham:Create"])
                ? null
                : allEstateInformation.length === 0
                  ? null
                  : e => {
                    if (e) e.preventDefault();
                    setModalVisible(true);
                    setFormData({
                      status: "new",
                      lists: [],
                      censusYear: router.query.estateYear
                        ? parseInt(router.query.estateYear)
                        : "",
                    });
                  }
            }
            onRemove={
              currentUserDontHavePrivilege(["Pemilik Saham:Delete"])
                ? null
                : async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} data?`,
                    );
                    if (yes) {
                      for (const row of rows) {
                        await deleteEstateCensusPemilikSaham({
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
              currentUserDontHavePrivilege(["Pemilik Saham:Update"])
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
export default withApollo({ ssr: true })(allEstateCensusPemilikSaham);
