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

const QUERY = gql`
  query listQueries {
    allSmallholderCensusRefBangsa {
      _id
      code
      description
      region
      subCode
    }
    allLocalRegion {
      _id
      code
      description
    }
  }
`;

const CREATE_REF_BANGSA = gql`
  mutation createSmallholderRefBangsa($input: JSON) {
    createSmallholderRefBangsa(input: $input)
  }
`;

const UPDATE_REF_BANGSA = gql`
  mutation updateSmallholderRefBangsa($_id: String!, $input: JSON) {
    updateSmallholderRefBangsa(_id: $_id, input: $input)
  }
`;
const DELETE_REF_BANGSA = gql`
  mutation deleteSmallholderRefBangsa($_id: String!) {
    deleteSmallholderRefBangsa(_id: $_id)
  }
`;

const Bangsa = () => {
  const router = useRouter();
  const notification = useNotification();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const { data, loading, error, refetch } = useQuery(QUERY);
  const [createSmallholderRefBangsa] = useMutation(CREATE_REF_BANGSA);
  const [updateSmallholderRefBangsa] = useMutation(UPDATE_REF_BANGSA);
  const [deleteSmallholderRefBangsa] = useMutation(DELETE_REF_BANGSA);

  let allSmallholderCensusRefBangsa = [];

  if (data?.allSmallholderCensusRefBangsa) {
    allSmallholderCensusRefBangsa = data.allSmallholderCensusRefBangsa;
  }
  let allLocalRegion = [];

  if (data?.allLocalRegion) {
    allLocalRegion = data.allLocalRegion;
  }

  const columns = useMemo(() => [
    {
      Header: "Code",
      accessor: "code",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Sub Code",
      accessor: "subCode",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Description",
      accessor: "description",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Region",
      accessor: "region",
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

                // console.log(propsTable.row.original);
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
  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Bangsa</title>
      </Head>
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Bangsa`}
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
              await createSmallholderRefBangsa({
                variables: {
                  input: {
                    ...formData,
                  },
                },
              });
            } else {
              await updateSmallholderRefBangsa({
                variables: {
                  _id: formData._id,
                  input: {
                    ...formData,
                  },
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Bangsa saved!`,
              level: "success",
            });
            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}>
        <div className="form-group">
          <label>Code</label>
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
          <label>Sub Code</label>
          <input
            placeholder="Sub Code"
            className="form-control"
            value={formData.subCode || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                subCode: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <input
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
          <label>Region</label>
          <select
            className="form-control"
            value={formData.region || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                region: e.target.value,
              });
            }}>
            <option value={""} disabled>
              Region
            </option>
            {allLocalRegion.map(reg => (
              <option value={reg.code}>{reg.description}</option>
            ))}
          </select>
        </div>
      </FormModal>
      <div className="mt-26">
        <div className=" pr-0 md:pr-10 py-4 bg-white h-full">
          <Table
            loading={loading}
            columns={columns}
            data={allSmallholderCensusRefBangsa}
            withoutHeader={true}
            onAdd={
              currentUserDontHavePrivilege([
                "Master Data Smallholder Bangsa:Create",
              ])
                ? null
                : e => {
                    if (e) e.preventDefault();
                    setModalVisible(true);
                    setFormData({});
                  }
            }
            onRemove={
              currentUserDontHavePrivilege([
                "Master Data Smallholder Bangsa:Delete",
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
                          await deleteSmallholderRefBangsa({
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
              currentUserDontHavePrivilege([
                "Master Data Smallholder Bangsa:Update",
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
export default withApollo({ ssr: true })(Bangsa);
