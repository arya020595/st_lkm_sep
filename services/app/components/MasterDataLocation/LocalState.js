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
import AdminArea from "../../components/AdminArea";
import Table from "../../components/Table";
import { FormModal } from "../../components/Modal";

const QUERY = gql`
  query listQueries {
    allLocalRegion {
      _id
      code
      description
    }
    allLocalState {
      _id
      code
      description
      LocalRegion {
        _id
        description
      }
    }
  }
`;

const CREATE_LOCAL_STATE = gql`
  mutation createLocalState(
    $code: String!
    $description: String
    $regionId: String
  ) {
    createLocalState(
      code: $code
      description: $description
      regionId: $regionId
    )
  }
`;

const UPDATE_LOCAL_STATE = gql`
  mutation updateLocalState(
    $_id: String!
    $code: String!
    $description: String
    $regionId: String
  ) {
    updateLocalState(
      _id: $_id
      code: $code
      description: $description
      regionId: $regionId
    )
  }
`;
const DELETE_LOCAL_STATE = gql`
  mutation deleteLocalState($_id: String!) {
    deleteLocalState(_id: $_id)
  }
`;
const LocalState = ({ currentUserDontHavePrivilege }) => {
  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();
  const columns = useMemo(() => [
    {
      Header: "Code",
      accessor: "code",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Local State Description",
      accessor: "description",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Local Region",
      accessor: "LocalRegion.description",
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
                setModalVisible(true);
                setFormData({
                  ...propsTable.row.original,
                  regionId: propsTable.row.original.LocalRegion._id,
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

  const { data, loading, error, refetch } = useQuery(QUERY);
  const [createLocalState] = useMutation(CREATE_LOCAL_STATE);
  const [updateLocalState] = useMutation(UPDATE_LOCAL_STATE);
  const [deleteLocalState] = useMutation(DELETE_LOCAL_STATE);

  let allLocalRegion = [];
  if (data?.allLocalRegion) {
    allLocalRegion = data.allLocalRegion;
  }

  let allLocalState = [];
  if (data?.allLocalState) {
    allLocalState = data.allLocalState;
  }

  return (
    <div>
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Local State`}
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
              await createLocalState({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateLocalState({
                variables: {
                  ...formData,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Local State saved!`,
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
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                code: e.target.value,
              });
            }}
            required
          />
        </div>
        <div className="form-group">
          <label>Local State Description</label>
          <input
            placeholder="Local State Description"
            className="form-control"
            value={formData.description || ""}
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
          <label>Local Region</label>
          <select
            className="form-control"
            value={formData.regionId || ""}
            onChange={e => {
              setFormData({
                ...formData,
                regionId: e.target.value,
              });
            }}
            required>
            <option value="" disabled>
              Select Region
            </option>
            {allLocalRegion.map(reg => (
              <option value={reg._id}>{reg.description}</option>
            ))}
          </select>
        </div>
      </FormModal>

      <Table
        loading={false}
        columns={columns}
        data={allLocalState}
        withoutHeader={true}
        onAdd={
          currentUserDontHavePrivilege(["Local State:Create"])
            ? null
            : e => {
                if (e) e.preventDefault();
                setModalVisible(true);
                setFormData({});
              }
        }
        onRemove={
          currentUserDontHavePrivilege(["Local State:Delete"])
            ? null
            : async ({ rows }) => {
                showLoadingSpinner();
                try {
                  let yes = confirm(
                    `Are you sure to delete ${rows.length} states ?`,
                  );
                  if (yes) {
                    for (const row of rows) {
                      await deleteLocalState({
                        variables: {
                          _id: row._id,
                        },
                      });
                    }
                    notification.addNotification({
                      title: "Success!",
                      message: `${rows.length} states deleted`,
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
          currentUserDontHavePrivilege(["Local State:Update"])
            ? null
            : customUtilities
        }
        customUtilitiesPosition="left"
      />
      <div className="flex mt-4">
        <p className="text-md">Total Data: </p>
        <p className="text-md font-bold mx-4">{allLocalState.length}</p>
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(LocalState);
