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
    allCountryRegion {
      _id
      code
      description
    }
  }
`;

const CREATE_COUNTRY_REGION = gql`
  mutation createCountryRegion($code: String!, $description: String!) {
    createCountryRegion(code: $code, description: $description)
  }
`;

const UPDATE_COUNTRY_REGION = gql`
  mutation updateCountryRegion(
    $_id: String!
    $code: String!
    $description: String!
  ) {
    updateCountryRegion(_id: $_id, code: $code, description: $description)
  }
`;
const DELETE_COUNTRY_REGION = gql`
  mutation deleteCountryRegion($_id: String!) {
    deleteCountryRegion(_id: $_id)
  }
`;
const CountryRegion = ({ currentUserDontHavePrivilege }) => {
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
      Header: "Description",
      accessor: "description",
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
                setFormData(propsTable.row.original);
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
  const [createCountryRegion] = useMutation(CREATE_COUNTRY_REGION);
  const [updateCountryRegion] = useMutation(UPDATE_COUNTRY_REGION);
  const [deleteCountryRegion] = useMutation(DELETE_COUNTRY_REGION);
  let allCountryRegion = [];

  if (data?.allCountryRegion) {
    allCountryRegion = data.allCountryRegion;
  }

  return (
    <div>
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Country Region`}
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
              await createCountryRegion({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateCountryRegion({
                variables: {
                  ...formData,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Country Region saved!`,
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
          <label>Description</label>
          <input
            placeholder="Description"
            className="form-control"
            value={formData.description || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                description: e.target.value,
              });
            }}
            required
          />
        </div>
      </FormModal>

      <Table
        loading={false}
        columns={columns}
        data={allCountryRegion}
        withoutHeader={true}
        onAdd={
          currentUserDontHavePrivilege(["Country Region:Create"])
            ? null
            : e => {
                if (e) e.preventDefault();
                setModalVisible(true);
                setFormData({});
              }
        }
        onRemove={
          currentUserDontHavePrivilege(["Country Region:Delete"])
            ? null
            : async ({ rows }) => {
                showLoadingSpinner();
                try {
                  let yes = confirm(
                    `Are you sure to delete ${rows.length} country regions?`,
                  );
                  if (yes) {
                    for (const row of rows) {
                      await deleteCountryRegion({
                        variables: {
                          _id: row._id,
                        },
                      });
                    }
                    notification.addNotification({
                      title: "Success!",
                      message: `${rows.length} country regions deleted`,
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
          currentUserDontHavePrivilege(["Country Region:Update"])
            ? null
            : customUtilities
        }
        customUtilitiesPosition="left"
      />
      <div className="flex mt-4">
        <p className="text-md">Total Data: </p>
        <p className="text-md font-bold mx-4">{allCountryRegion.length}</p>
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(CountryRegion);
