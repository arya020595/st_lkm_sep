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
    allSmallholderCensusRefParlimen {
      _id
      code
      region
      LDescription
      SDescription
    }
    allLocalRegion {
      _id
      code
      description
    }
  }
`;

const CREATE_REF_PARLIMEN = gql`
  mutation createSmallholderRefParlimen($input: JSON) {
    createSmallholderRefParlimen(input: $input)
  }
`;

const UPDATE_REF_PARLIMEN = gql`
  mutation updateSmallholderRefParlimen($_id: String!, $input: JSON) {
    updateSmallholderRefParlimen(_id: $_id, input: $input)
  }
`;
const DELETE_REF_PARLIMEN = gql`
  mutation deleteSmallholderRefParlimen($_id: String!) {
    deleteSmallholderRefParlimen(_id: $_id)
  }
`;

const Parlimen = () => {
  const router = useRouter();
  const notification = useNotification();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const { data, loading, error, refetch } = useQuery(QUERY);
  const [createSmallholderRefParlimen] = useMutation(CREATE_REF_PARLIMEN);
  const [updateSmallholderRefParlimen] = useMutation(UPDATE_REF_PARLIMEN);
  const [deleteSmallholderRefParlimen] = useMutation(DELETE_REF_PARLIMEN);

  let allSmallholderCensusRefParlimen = [];

  if (data?.allSmallholderCensusRefParlimen) {
    allSmallholderCensusRefParlimen = data.allSmallholderCensusRefParlimen;
  }

  const allLocalRegion = data?.allLocalRegion || [];
  const columns = useMemo(() => [
    {
      Header: "Code",
      accessor: "code",
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
    {
      Header: "LDescription",
      accessor: "LDescription",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "SDescription",
      accessor: "SDescription",
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
        <title>Parlimen</title>
      </Head>

      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Parlimen`}
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
              await createSmallholderRefParlimen({
                variables: {
                  input: {
                    ...formData,
                  },
                },
              });
            } else {
              await updateSmallholderRefParlimen({
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
              message: `Parlimen saved!`,
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
            {allLocalRegion.map(region => (
              <option value={region.code}>{region.description}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Long Description</label>
          <input
            placeholder="Long Description"
            className="form-control"
            value={formData.LDescription || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                LDescription: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Short Description</label>
          <input
            placeholder="Short Description"
            className="form-control"
            value={formData.SDescription || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                SDescription: e.target.value,
              });
            }}
          />
        </div>
      </FormModal>

      <div className="mt-26">
        <div className=" pr-0 md:pr-10 py-4 bg-white h-full">
          <Table
            loading={loading}
            columns={columns}
            data={allSmallholderCensusRefParlimen}
            withoutHeader={true}
            onAdd={
              currentUserDontHavePrivilege([
                "Master Data Smallholder Parlimen:Create",
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
                "Master Data Smallholder Parlimen:Delete",
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
                          await deleteSmallholderRefParlimen({
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
                "Master Data Smallholder Parliment:Update",
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
export default withApollo({ ssr: true })(Parlimen);
