import React, { useState, useEffect, useMemo, useCallback } from "react";
import Head from "next/head";
import appConfig from "../../app.json";
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
import Table from "../../components/TableAsync";
import { FormModal } from "../../components/Modal";
import NumberFormat from "react-number-format";

const QUERY = gql`
  query listQueries($pageIndex: Int, $pageSize: Int, $filters: String) {
    countValidationCode
    paginatedEstateCensusHakMilikPertubuhanAndSeksyenInformation(
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    ) {
      _id
      code
      description
      ncheck
      cvalid1
      cvalid2
      cvalid3
    }
  }
`;

const CREATE_VALIDATION_CODE = gql`
  mutation createEstateCensusHakMilikPertubuhanAndSeksyenCode(
    $code: String
    $description: String
    $ncheck: String
    $cvalid1: String
    $cvalid2: String
    $cvalid3: String
  ) {
    createEstateCensusHakMilikPertubuhanAndSeksyenCode(
      code: $code
      description: $description
      ncheck: $ncheck
      cvalid1: $cvalid1
      cvalid2: $cvalid2
      cvalid3: $cvalid3
    )
  }
`;

const UPDATE_VALIDATION_CODE = gql`
  mutation updateEstateCensusHakMilikPertubuhanAndSeksyenCode(
    $_id: String!
    $code: String
    $description: String
    $ncheck: String
    $cvalid1: String
    $cvalid2: String
    $cvalid3: String
  ) {
    updateEstateCensusHakMilikPertubuhanAndSeksyenCode(
      _id: $_id
      code: $code
      description: $description
      ncheck: $ncheck
      cvalid1: $cvalid1
      cvalid2: $cvalid2
      cvalid3: $cvalid3
    )
  }
`;

const DELETE_VALIDATION_CODE = gql`
  mutation deleteEstateCensusHakMilikPertubuhanAndSeksyenCode($_id: String!) {
    deleteEstateCensusHakMilikPertubuhanAndSeksyenCode(_id: $_id)
  }
`;
const ValidationCode = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  const columns = useMemo(() => [
    {
      Header: "Code",
      accessor: "code",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Description",
      accessor: "description",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "N Check",
      accessor: "ncheck",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "C Valid 1",
      accessor: "cvalid1",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "C Valid 2",
      accessor: "cvalid2",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "C Valid 3",
      accessor: "cvalid3",
      style: {
        fontSize: 20,
        width: 250,
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

  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const { data, loading, error, refetch } = useQuery(QUERY, {
    variables: {
      pageIndex: router.query.pageIndex ? parseInt(router.query.pageIndex) : 0,
      pageSize: router.query.pageSize ? parseInt(router.query.pageSize) : 10,
      filters: router.query.filters || "",
    },
  });

  const [createEstateCensusHakMilikPertubuhanAndSeksyenCode] = useMutation(
    CREATE_VALIDATION_CODE,
  );
  const [updateEstateCensusHakMilikPertubuhanAndSeksyenCode] = useMutation(
    UPDATE_VALIDATION_CODE,
  );
  const [deleteEstateCensusHakMilikPertubuhanAndSeksyenCode] = useMutation(
    DELETE_VALIDATION_CODE,
  );

  let paginatedEstateCensusHakMilikPertubuhanAndSeksyenInformation = [];
  if (data?.paginatedEstateCensusHakMilikPertubuhanAndSeksyenInformation) {
    paginatedEstateCensusHakMilikPertubuhanAndSeksyenInformation =
      data.paginatedEstateCensusHakMilikPertubuhanAndSeksyenInformation;
  }
  // console.log({ paginatedEstateCensusHakMilikPertubuhanAndSeksyenInformation });
  let countValidationCode = data?.countValidationCode || 0;
  let [internalLoading, setInternalLoading] = useState(false);
  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countValidationCode) return 1;
    return Math.ceil(countValidationCode / pageSize);
  }, [countValidationCode, pageSize]);
  const handlePageChange = useCallback(
    async ({ pageIndex, pageSize, filters }) => {
      // console.log("filters", JSON.stringify(filters));
      router.replace(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            pageIndex,
            pageSize,
            filters: JSON.stringify(filters),
          },
        },
        null,
        {
          scroll: false,
        },
      );
    },
    [],
  );

  let filters = useMemo(() => {
    // console.log("router.query.filters", router.query.filters);
    if (!router.query.filters) return [];
    try {
      let filters = JSON.parse(router.query.filters);
      // console.log({ filters });
      return filters;
    } catch (err) {
      console.warn(err);
    }
    return [];
  }, [router.query.filters]);
  // console.log(router.query.filters, { filters });

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Validation Code</title>
      </Head>

      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Validation Code`}
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
              await createEstateCensusHakMilikPertubuhanAndSeksyenCode({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateEstateCensusHakMilikPertubuhanAndSeksyenCode({
                variables: {
                  ...formData,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Data saved!`,
              level: "success",
            });
            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}>
        <div className="form-group">
          <label>Code*</label>
          <input
            placeholder="Code"
            className="form-control"
            value={formData.code || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                code: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Description*</label>
          <textarea
            placeholder="Description"
            className="form-control"
            value={formData.description || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                description: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>N Check*</label>
          <input
            placeholder="N Check"
            className="form-control"
            value={formData.ncheck || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                ncheck: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>C Valid 1</label>
          <textarea
            placeholder="C Valid 1"
            className="form-control"
            value={formData.cvalid1 || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                cvalid1: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>C Valid 2</label>
          <textarea
            placeholder="C Valid 2"
            className="form-control"
            value={formData.cvalid2 || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                cvalid2: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>C Valid 3</label>
          <textarea
            placeholder="C Valid 3"
            className="form-control"
            value={formData.cvalid3 || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                cvalid3: e.target.value,
              });
            }}
          />
        </div>
      </FormModal>

      <div className="mt-26  pr-0 md:pr-10 py-4 bg-white h-full">
        <Table
          loading={loading}
          columns={columns}
          data={paginatedEstateCensusHakMilikPertubuhanAndSeksyenInformation}
          withoutHeader={true}
          controlledFilters={filters}
          controlledPageIndex={pageIndex}
          controlledPageCount={pageCount}
          controlledPageSize={pageSize}
          onPageChange={handlePageChange}
          onAdd={
            currentUserDontHavePrivilege(["Validation Code:Create"])
              ? null
              : e => {
                  if (e) e.preventDefault();
                  setModalVisible(true);
                  setFormData({
                    ncheck: "" + countValidationCode + 1,
                  });
                }
          }
          onRemove={
            currentUserDontHavePrivilege(["Validation Code:Delete"])
              ? null
              : async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} data?`,
                    );
                    if (yes) {
                      for (const row of rows) {
                        await deleteEstateCensusHakMilikPertubuhanAndSeksyenCode(
                          {
                            variables: {
                              _id: row._id,
                            },
                          },
                        );
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
            currentUserDontHavePrivilege(["Validation Code:Update"])
              ? null
              : customUtilities
          }
          customUtilitiesPosition="left"
        />

        <div className="flex mt-4">
          <p className="text-md">Total Data: </p>
          <p className="text-md font-bold mx-4">{countValidationCode}</p>
        </div>
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(ValidationCode);
