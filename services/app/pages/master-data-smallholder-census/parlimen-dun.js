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
    allSmallholderCensusRefParlimenDun {
      _id
      parlimen
      region
      description
      dun
      negeri
    }
    allSmallholderCensusRefParlimen {
      _id
      code
      LDescription
    }
    allLocalRegion {
      _id
      code
      description
    }
    allSmallholderCensusRefNegeri {
      _id
      code
      LDescription
    }
  }
`;

const CREATE_REF_PARLIMEN_DUN = gql`
  mutation createSmallholderRefParlimenDun($input: JSON) {
    createSmallholderRefParlimenDun(input: $input)
  }
`;

const UPDATE_REF_PARLIMEN_DUN = gql`
  mutation updateSmallholderRefParlimenDun($_id: String!, $input: JSON) {
    updateSmallholderRefParlimenDun(_id: $_id, input: $input)
  }
`;
const DELETE_REF_PARLIMEN_DUN = gql`
  mutation deleteSmallholderRefParlimenDun($_id: String!) {
    deleteSmallholderRefParlimenDun(_id: $_id)
  }
`;

const ParlimenDun = () => {
  const router = useRouter();
  const notification = useNotification();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const { data, loading, error, refetch } = useQuery(QUERY);
  const [createSmallholderRefParlimenDun] = useMutation(
    CREATE_REF_PARLIMEN_DUN,
  );
  const [updateSmallholderRefParlimenDun] = useMutation(
    UPDATE_REF_PARLIMEN_DUN,
  );
  const [deleteSmallholderRefParlimenDun] = useMutation(
    DELETE_REF_PARLIMEN_DUN,
  );

  let allSmallholderCensusRefParlimenDun = [];

  if (data?.allSmallholderCensusRefParlimenDun) {
    allSmallholderCensusRefParlimenDun =
      data.allSmallholderCensusRefParlimenDun;
  }
  const allSmallholderCensusRefNegeri =
    data?.allSmallholderCensusRefNegeri || [];
  const allLocalRegion = data?.allLocalRegion || [];
  const allSmallholderCensusRefParlimen =
    data?.allSmallholderCensusRefParlimen || [];

  const columns = useMemo(() => [
    {
      Header: "Parlimen",
      accessor: "parlimen",
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
      Header: "Description",
      accessor: "description",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Dun",
      accessor: "dun",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Negeri",
      accessor: "negeri",
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
        <title>Dun</title>
      </Head>

      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Dun`}
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
              await createSmallholderRefParlimenDun({
                variables: {
                  input: {
                    ...formData,
                  },
                },
              });
            } else {
              await updateSmallholderRefParlimenDun({
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
              message: `Dun saved!`,
              level: "success",
            });
            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}>
        <div className="form-group">
          <label>Parlimen</label>
          <select
            className="form-control"
            value={formData.parlimen || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                parlimen: e.target.value,
              });
            }}>
            <option value={""} disabled>
              Parlimen
            </option>
            {allSmallholderCensusRefParlimen.map(p => (
              <option value={p.code}>{p.LDescription}</option>
            ))}
          </select>
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
          <label>Dun</label>
          <input
            placeholder="Dun"
            className="form-control"
            value={formData.dun || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                dun: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Negeri</label>
          <select
            className="form-control"
            value={formData.negeri || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                negeri: e.target.value,
              });
            }}>
            <option value={""} disabled>
              Negeri
            </option>
            {allSmallholderCensusRefNegeri.map(negeri => (
              <option value={negeri.code}>{negeri.LDescription}</option>
            ))}
          </select>
        </div>
      </FormModal>

      <div className="mt-26">
        <div className=" pr-0 md:pr-10 py-4 bg-white h-full">
          <Table
            loading={loading}
            columns={columns}
            data={allSmallholderCensusRefParlimenDun}
            withoutHeader={true}
            onAdd={
              currentUserDontHavePrivilege([
                "Master Data Smallholder Dun:Create",
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
                "Master Data Smallholder Dun:Delete",
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
                          await deleteSmallholderRefParlimenDun({
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
                "Master Data Smallholder Dun:Update",
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
export default withApollo({ ssr: true })(ParlimenDun);
