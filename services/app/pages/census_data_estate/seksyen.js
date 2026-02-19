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

const GET_SEKSYEN = gql`
  query allEstateCensusSeksyen(
    $estateInformationId: String!
    $censusYear: Int
  ) {
    allEstateCensusSeksyen(
      estateInformationId: $estateInformationId
      censusYear: $censusYear
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
      statement
    }
  }
`;

const CHECK_CODE = gql`
  mutation estateCensusHakMilikAndSeksyenInfoByCode(
    $code: String!
    $estateId: String
    $year: Int
    $value: Float
  ) {
    estateCensusHakMilikAndSeksyenInfoByCode(
      code: $code
      estateId: $estateId
      year: $year
      value: $value
    ) {
      _id
      code
      description
      value
      lstate
    }
  }
`;
const CREATE_SEKSYEN = gql`
  mutation createEstateCensusSeksyen(
    $estateId: String
    $code: String
    $value: Float
    $censusYear: Int
    $statement: String
  ) {
    createEstateCensusSeksyen(
      estateId: $estateId
      code: $code
      value: $value
      censusYear: $censusYear
      statement: $statement
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

const UPDATE_SEKSYEN = gql`
  mutation updateEstateCensusSeksyen(
    $_id: String!
    $estateId: String
    $code: String
    $value: Float
    $censusYear: Int
    $statement: String
  ) {
    updateEstateCensusSeksyen(
      _id: $_id
      estateId: $estateId
      code: $code
      value: $value
      censusYear: $censusYear
      statement: $statement
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
const DELETE_SEKSYEN = gql`
  mutation deleteEstateCensusSeksyen($_id: String!) {
    deleteEstateCensusSeksyen(_id: $_id)
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
  const [allYearList, setAllEstateCensusYearListByEstate] = useState([]);

  const [maklumatBorangList, setEstateCensusHakMilikPertubuhanList] = useState(
    [],
  );

  const [codeCheckStatus, setCodeCheckStatus] = useState({
    visible: false,
    message: {},
  });
  const [nextData, setNextData] = useState(1);
  const [allEstateInformation, setAllEstateInformation] = useState([]);
  const [createEstateCensusSeksyen] = useMutation(CREATE_SEKSYEN);
  const [updateEstateCensusSeksyen] = useMutation(UPDATE_SEKSYEN);
  const [deleteEstateCensusSeksyen] = useMutation(DELETE_SEKSYEN);
  const [estateCensusHakMilikAndSeksyenInfoByCode] = useMutation(CHECK_CODE);

  const [estateCensusCode, setEstateCensusCode] = useState(null);

  const valueRef = useRef(null);
  const lajurRef = useRef(null);

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
                  const found = await estateCensusHakMilikAndSeksyenInfoByCode({
                    variables: {
                      code: propsTable.row.original?.code || "",
                    },
                  });

                  const alphabet = propsTable.row.original.code.slice(0, 1);
                  const column = propsTable.row.original.code.slice(1, 4);
                  const row = propsTable.row.original.code.slice(4, 7);

                  const code = alphabet + column + row;
                  setEstateCensusCode(
                    found.data.estateCensusHakMilikAndSeksyenInfoByCode,
                  );

                  setModalVisible(true);
                  setFormData({
                    ...propsTable.row.original,
                    code,
                    alphabet,
                    column,
                    row,
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
      Header: "Year",
      accessor: "censusYear",
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
    {
      Header: "Statement",
      accessor: "statement",
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
        query: GET_SEKSYEN,
        variables: {
          estateInformationId: estateInfoId,
          censusYear: parseInt(router.query.estateYear),
        },
        fetchPolicy: "no-cache",
      });
      setEstateCensusHakMilikPertubuhanList(result.data.allEstateCensusSeksyen);
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

  const fetchCode = async e => {
    if (e) e.preventDefault();
    showLoadingSpinner();
    try {
      const alphabet = formData?.alphabet || "";
      const column = formData?.column || "";
      const row = formData?.row || "";

      const code = alphabet + column + row;

      console.log({ code });

      if (code) {
        const result = await estateCensusHakMilikAndSeksyenInfoByCode({
          variables: {
            code,
            estateId: estateInformation._id,
            year: parseInt(router.query.estateYear),
            value: formData?.value || 0,
          },
        });

        setEstateCensusCode(
          result.data.estateCensusHakMilikAndSeksyenInfoByCode,
        );
        setFormData({
          ...formData,
          code,
        });

        setCodeCheckStatus({
          visible: false,
          message: {},
        });

        // console.log(result.data.estateCensusHakMilikAndSeksyenInfoByCode);
      }
    } catch (err) {
      notification.handleError(err);
    }
    hideLoadingSpinner();
  };

  const handleSave = async data => {
    showLoadingSpinner();
    try {
      let { _id, __typename, _createdAt, _updatedAt } = data;

      if (estateCensusCode._id === "ERR") {
        throw {
          message: "Estate Census Code Not Found!",
        };
      }

      let result = null;
      if (!_id) {
        const res = await createEstateCensusSeksyen({
          variables: {
            ...data,
            estateId: "" + parseInt(estateInformation.estateId),
          },
        });
        result = res.data.createEstateCensusSeksyen;
      } else {
        const res = await updateEstateCensusSeksyen({
          variables: {
            ...data,
          },
        });
        result = res.data.updateEstateCensusSeksyen;
      }

      if (result && result.message !== "ok") {
        setCodeCheckStatus({
          visible: true,
          message: result,
        });
        throw {
          message: "Error code validation",
        };
      } else {
        await fetching(estateInformation._id);
        setCodeCheckStatus({
          visible: false,
          message: {},
        });
        notification.addNotification({
          title: "Succeess!",
          message: `Seksyen saved!`,
          level: "success",
        });
        setFormData({
          alphabet: formData.alphabet,
          censusYear: router.query.estateYear
            ? parseInt(router.query.estateYear)
            : "",
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
        <title>Seksyen</title>
      </Head>

      <FormModal
        size="lg"
        title={`${!formData._id ? "New" : "Edit"} Seksyen`}
        visible={modalVisible}
        onClose={e => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            censusYear: router.query.estateYear
              ? parseInt(router.query.estateYear)
              : "",
          });
          setCodeCheckStatus({
            visible: false,
            message: {},
          });
        }}>
        <div className="form-group">
          <label>Tahun Banci *</label>
          <select
            className="form-control w-1/4"
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
        <div className="grid grid-cols-7 gap-4">
          <div className="form-group">
            <label>Alphabet Code</label>
            <select
              className="form-control"
              value={formData.alphabet || ""}
              onChange={e => {
                if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  alphabet: e.target.value,
                });
                setEstateCensusCode(null);
              }}>
              <option value="">Select Alphabet</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
              <option value="F">F</option>
              <option value="G">G</option>
              <option value="H">H</option>
              <option value="I">I</option>
              <option value="J">J</option>
              <option value="K">K</option>
              <option value="L">L</option>
              <option value="M">M</option>
              <option value="N">N</option>
              <option value="O">O</option>
            </select>
          </div>

          <div className="form-group">
            <label>Lajur</label>
            <input
              ref={lajurRef}
              className="form-control"
              value={formData.column || ""}
              onChange={e => {
                if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  column: e.target.value,
                });
                setEstateCensusCode(null);
              }}
              onBlur={e => {
                // if (e) e.preventDefault();
                let PREFIX = "000";
                if (isNaN(formData.column)) {
                  PREFIX = "0000";
                }
                const column = formData?.column?.length;
                const res =
                  PREFIX.slice(0, column * -1) + formData?.column || "";

                setFormData({
                  ...formData,
                  column: res,
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>Baris</label>
            <input
              className="form-control"
              value={formData.row || ""}
              onChange={e => {
                if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  row: e.target.value,
                });
                setEstateCensusCode(null);
              }}
              onBlur={e => {
                // if (e) e.preventDefault();
                fetchCode();
                let PREFIX = "00";
                if (isNaN(formData.row)) {
                  PREFIX = "000";
                }
                const row = formData?.row?.length;
                const res = PREFIX.slice(0, row * -1) + formData?.row || "";

                setFormData({
                  ...formData,
                  row: res,
                });
              }}
            />
          </div>

          <div className="form-group">
            <label>Value</label>
            <NumberFormat
              ref={valueRef}
              onBlur={async e => {
                if (e.type === "blur") {
                  await handleSave(formData);
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
          <div className="col-span-3">
            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-control bg-gray-200"
                value={estateCensusCode?.description || ""}
                disabled
              />
            </div>
            <div className="form-group">
              <label>Statement</label>
              <textarea
                className={`form-control ${estateCensusCode && estateCensusCode.lstate
                    ? ""
                    : "bg-gray-200"
                  }`}
                value={formData.statement || ""}
                onChange={e => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    statement: e.target.value,
                  });
                }}
                disabled={
                  estateCensusCode && estateCensusCode.lstate ? false : true
                }
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center mb-4">
          <button
            className="bg-mantis-500 px-4 py-2 px-4 rounded-md shadow-md"
            onClick={fetchCode}>
            <p className="text-md text-white">Code Check</p>
          </button>

          {estateCensusCode ? (
            <button
              className="bg-blue-500 px-4 py-2 px-4 rounded-md shadow-md mx-4"
              onClick={async e => {
                if (e) e.preventDefault();
                showLoadingSpinner();
                try {
                  let { _id, __typename, _createdAt, _updatedAt } = formData;

                  if (estateCensusCode._id === "ERR") {
                    throw {
                      message: "Estate Census Code Not Found!",
                    };
                  }

                  let result = null;
                  if (!_id) {
                    const res = await createEstateCensusSeksyen({
                      variables: {
                        ...formData,
                        estateId: "" + parseInt(estateInformation.estateId),
                      },
                    });
                    result = res.data.createEstateCensusSeksyen;
                  } else {
                    const res = await updateEstateCensusSeksyen({
                      variables: {
                        ...formData,
                      },
                    });
                    result = res.data.updateEstateCensusSeksyen;
                  }

                  if (result && result.message !== "ok") {
                    setCodeCheckStatus({
                      visible: true,
                      message: result,
                    });
                    throw {
                      message: "Error code validation",
                    };
                  } else {
                    await fetching(estateInformation._id);
                    setCodeCheckStatus({
                      visible: false,
                      message: {},
                    });
                    notification.addNotification({
                      title: "Succeess!",
                      message: `Seksyen saved!`,
                      level: "success",
                    });
                    setFormData({
                      alphabet: formData.alphabet,
                      censusYear: router.query.estateYear
                        ? parseInt(router.query.estateYear)
                        : "",
                    });
                  }
                } catch (e) {
                  notification.handleError(e);
                }
                hideLoadingSpinner();
              }}>
              <p className="text-md text-white">Save</p>
            </button>
          ) : null}
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
            data={maklumatBorangList}
            withoutHeader={true}
            onAdd={
              currentUserDontHavePrivilege(["Seksyen:Create"])
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
                      // censusYear:
                      //   allYearList.length > 0 ? allYearList[0].year : "",
                    });
                    setEstateCensusCode(null);
                  }
            }
            onRemove={
              currentUserDontHavePrivilege(["Seksyen:Delete"])
                ? null
                : async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} data?`,
                    );
                    if (yes) {
                      for (const row of rows) {
                        await deleteEstateCensusSeksyen({
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
              currentUserDontHavePrivilege(["Seksyen:Update"])
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
