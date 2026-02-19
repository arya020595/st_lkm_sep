import React, { useState, useEffect, useMemo, useRef } from "react";
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

const GET_HAK_MILIK_PERTUBUHAN = gql`
  query allEstateCensusHakMilikPertubuhan($estateInformationId: String!) {
    allEstateCensusHakMilikPertubuhan(
      estateInformationId: $estateInformationId
    ) {
      _id
      estateId
      code
      value
      censusYear
      EstateCensusHakMilikPertubuhanAndSeksyenInformation {
        _id
        description
      }
    }
  }
`;

const CHECK_CODE = gql`
  mutation estateCensusHakMilikAndSeksyenInfoByCode($code: String!) {
    estateCensusHakMilikAndSeksyenInfoByCode(code: $code) {
      _id
      code
      description
      lstate
    }
  }
`;
const CREATE_HAK_MILIK_PERTUBUHAN = gql`
  mutation createEstateCensusHakMilikPertubuhan(
    $estateId: String
    $code: String
    $value: Float
    $censusYear: Int
  ) {
    createEstateCensusHakMilikPertubuhan(
      estateId: $estateId
      code: $code
      value: $value
      censusYear: $censusYear
    ) {
      message
      value
      cvalid1
      cvalid2
      cvalid3
      formulaValue
      cvalid
    }
  }
`;

const UPDATE_HAK_MILIK_PERTUBUHAN = gql`
  mutation updateEstateCensusHakMilikPertubuhan(
    $_id: String!
    $estateId: String
    $code: String
    $value: Float
    $censusYear: Int
  ) {
    updateEstateCensusHakMilikPertubuhan(
      _id: $_id
      estateId: $estateId
      code: $code
      value: $value
      censusYear: $censusYear
    ) {
      message
      value
      cvalid1
      cvalid2
      cvalid3
      formulaValue
      cvalid
    }
  }
`;
const DELETE_HAK_MILIK_PERTUBUHAN = gql`
  mutation deleteEstateCensusHakMilikPertubuhan($_id: String!) {
    deleteEstateCensusHakMilikPertubuhan(_id: $_id)
  }
`;

const EstateCensusHakMilikPertubuhan = () => {
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const client = useApolloClient();
  const router = useRouter();
  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [filterData, setFilterData] = useState({});
  const [estateInformation, setEstateInformation] = useState({});
  const [hakMilikPertubuhanList, setEstateCensusHakMilikPertubuhanList] =
    useState([]);
  const [nextData, setNextData] = useState(1);
  const [allEstateInformation, setAllEstateInformation] = useState([]);
  const [allYearList, setAllEstateCensusYearListByEstate] = useState([]);

  const [hakMilikAndSeksyenInfo, setHakMilikAndSeksyenInfo] = useState({});
  const [codeCheckStatus, setCodeCheckStatus] = useState({
    visible: false,
    message: {},
  });

  const valueRef = useRef(null);
  const lajurRef = useRef(null);

  const [createEstateCensusHakMilikPertubuhan] = useMutation(
    CREATE_HAK_MILIK_PERTUBUHAN,
  );
  const [updateEstateCensusHakMilikPertubuhan] = useMutation(
    UPDATE_HAK_MILIK_PERTUBUHAN,
  );
  const [deleteEstateCensusHakMilikPertubuhan] = useMutation(
    DELETE_HAK_MILIK_PERTUBUHAN,
  );
  const [estateCensusHakMilikAndSeksyenInfoByCode] = useMutation(CHECK_CODE);

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
                showLoadingSpinner();
                try {
                  const colCode = propsTable.row.original.code.slice(-2);
                  const found = await estateCensusHakMilikAndSeksyenInfoByCode({
                    variables: {
                      code: propsTable.row.original?.code || "",
                    },
                  });
                  setHakMilikAndSeksyenInfo(
                    found.data.estateCensusHakMilikAndSeksyenInfoByCode,
                  );

                  setModalVisible(true);
                  setFormData({
                    ...propsTable.row.original,
                    row: "Q003",
                    column: colCode,
                  });
                } catch (err) {
                  notification.handleError(err);
                }
                hideLoadingSpinner();
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
    // {
    //   Header: "Year",
    //   accessor: "censusYear",
    //   style: {
    //     fontSize: 20,
    //   },
    // },
    // {
    //   Header: "Estate ID",
    //   accessor: "estateId",
    //   style: {
    //     fontSize: 20,
    //   },
    // },
    {
      Header: "Code",
      accessor: "code",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Value",
      accessor: "value",
      style: {
        fontSize: 20,
      },
    },

    {
      Header: "Description",
      accessor:
        "EstateCensusHakMilikPertubuhanAndSeksyenInformation.description",
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
        query: GET_HAK_MILIK_PERTUBUHAN,
        variables: {
          estateInformationId: estateInfoId,
        },
        fetchPolicy: "no-cache",
      });
      setEstateCensusHakMilikPertubuhanList(
        result.data.allEstateCensusHakMilikPertubuhan,
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

  const handleSave = async data => {
    showLoadingSpinner();
    try {
      let { _id, __typename, _createdAt, _updatedAt } = data;

      let result = null;
      if (!_id) {
        const res = await createEstateCensusHakMilikPertubuhan({
          variables: {
            ...data,
            estateId: "" + parseInt(estateInformation.estateId),
          },
        });

        result = res.data.createEstateCensusHakMilikPertubuhan;
      } else {
        const res = await updateEstateCensusHakMilikPertubuhan({
          variables: {
            ...data,
          },
        });

        result = res.data.updateEstateCensusHakMilikPertubuhan;
      }

      if (result && result.message !== "ok") {
        setCodeCheckStatus({
          visible: true,
          message: result,
        });
        throw {
          message: result.message,
        };
      } else {
        await fetching(estateInformation._id);
        notification.addNotification({
          title: "Succeess!",
          message: `Data saved!`,
          level: "success",
        });
        // setModalVisible(false);
        setFormData({
          row: "Q003",
          censusYear: router.query.estateYear
            ? parseInt(router.query.estateYear)
            : "",
        });
        setCodeCheckStatus({
          visible: false,
          message: {},
        });
      }
    } catch (e) {
      notification.handleError(e);
    }
    hideLoadingSpinner();
  };

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Hak Milik Pertubuhan</title>
      </Head>

      <FormModal
        size="lg"
        title={`${!formData._id ? "New" : "Edit"} Hak Milik Pertubuhan`}
        visible={modalVisible}
        onClose={e => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({});
        }}
        onSubmit={e => {
          if (e) e.preventDefault();
          handleSave(formData);
        }}>
        <div className="grid grid-cols-6 gap-4">
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
            <label>Baris</label>
            <input
              className="form-control bg-gray-200"
              value={formData.row || ""}
              disabled
            />
          </div>
          <div className="form-group">
            <label>Lajur</label>
            <input
              ref={lajurRef}
              maxLength={2}
              className="form-control"
              value={formData.column || ""}
              onChange={e => {
                if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  column: e.target.value,
                  code: formData.row + e.target.value,
                });
              }}
              onBlur={async e => {
                if (e) e.preventDefault();
                showLoadingSpinner();
                try {
                  const found = await estateCensusHakMilikAndSeksyenInfoByCode({
                    variables: {
                      code: formData?.code || "",
                    },
                  });
                  setHakMilikAndSeksyenInfo(
                    found.data.estateCensusHakMilikAndSeksyenInfoByCode,
                  );
                } catch (err) {
                  notification.handleError(err);
                }
                hideLoadingSpinner();
              }}
            />
          </div>
          <div className="form-group">
            <label>Value</label>
            <NumberFormat
              ref={valueRef}
              onBlur={async e => {
                if (e.type === "blur") {
                  handleSave(formData);
                  lajurRef.current.focus();
                }
              }}
              className="form-control"
              value={formData.value || 0}
              thousandSeparator={","}
              fixedDecimalScale={true}
              decimalSeparator={"."}
              decimalScale={2}
              onValueChange={e => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  value: e.floatValue,
                });
              }}
            />
          </div>

          <div className="col-span-2">
            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-control bg-gray-200"
                value={hakMilikAndSeksyenInfo.description || ""}
                disabled
              />
            </div>
          </div>
        </div>

        {codeCheckStatus.visible ? (
          <div className="mt-2">
            <hr className="border border-gray-200 my-2" />
            <p className="text-md font-bold">Kesilapan Data</p>

            <div className="form-group">
              <label>Validation Code</label>
              <textarea
                className="form-control bg-gray-200"
                disabled
                value={codeCheckStatus.message.cvalid || ""}
              />
            </div>

            <div className="form-group">
              <label>Validation Formula</label>
              <textarea
                className="form-control bg-gray-200"
                disabled
                value={codeCheckStatus.message.formulaValue || ""}
              />
            </div>

            <div className="form-group">
              <label>Value</label>
              <NumberFormat
                className="form-control bg-gray-200 w-1/5"
                value={codeCheckStatus.message.value || 0}
                thousandSeparator={","}
                fixedDecimalScale={true}
                decimalSeparator={"."}
                decimalScale={2}
                disabled
              />
            </div>
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
            data={hakMilikPertubuhanList.filter(
              b => b.censusYear === parseInt(router.query.estateYear),
            )}
            withoutHeader={true}
            onAdd={
              currentUserDontHavePrivilege(["Hak Milik Pertubuhan:Create"])
                ? null
                : allEstateInformation.length === 0
                  ? null
                  : e => {
                    if (e) e.preventDefault();
                    setModalVisible(true);
                    setFormData({
                      row: "Q003",
                      censusYear: router.query.estateYear
                        ? parseInt(router.query.estateYear)
                        : "",
                    });
                    setHakMilikAndSeksyenInfo({});
                  }
            }
            onRemove={
              currentUserDontHavePrivilege(["Hak Milik Pertubuhan:Delete"])
                ? null
                : async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} data?`,
                    );
                    if (yes) {
                      for (const row of rows) {
                        await deleteEstateCensusHakMilikPertubuhan({
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
              currentUserDontHavePrivilege(["Hak Milik Pertubuhan:Update"])
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
export default withApollo({ ssr: true })(EstateCensusHakMilikPertubuhan);
