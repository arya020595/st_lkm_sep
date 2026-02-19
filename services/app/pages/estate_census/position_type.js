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

import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();
const { MODE } = publicRuntimeConfig;

const QUERY = gql`
  query listQueries {
    allPositionTypes {
      _id
      code
      description
      Division {
        _id
        description
      }
    }

    allDivisions {
      _id
      code
      description
    }
  }
`;

const CREATE_POSITION_TYPE = gql`
  mutation createPositionType(
    $code: String!
    $description: String!
    $divisionId: String!
  ) {
    createPositionType(
      code: $code
      description: $description
      divisionId: $divisionId
    )
  }
`;

const UPDATE_POSITION_TYPE = gql`
  mutation updatePositionType(
    $_id: String!
    $code: String!
    $description: String!
    $divisionId: String!
  ) {
    updatePositionType(
      _id: $_id
      code: $code
      description: $description
      divisionId: $divisionId
    )
  }
`;
const DELETE_POSITION_TYPE = gql`
  mutation deletePositionType($_id: String!) {
    deletePositionType(_id: $_id)
  }
`;

const PositionType = () => {
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
    {
      Header: "Division",
      accessor: "Division.description",
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
  const [createPositionType] = useMutation(CREATE_POSITION_TYPE);
  const [updatePositionType] = useMutation(UPDATE_POSITION_TYPE);
  const [deletePositionType] = useMutation(DELETE_POSITION_TYPE);
  let allPositionTypes = [];
  if (data?.allPositionTypes) {
    allPositionTypes = data.allPositionTypes;
  }

  let allDivisions = [];
  if (data?.allDivisions) {
    allDivisions = data.allDivisions;
  }

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Position Type</title>
      </Head>
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Position Type`}
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
              await createPositionType({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updatePositionType({
                variables: {
                  ...formData,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Position type saved!`,
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
          <label>Description*</label>
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
        <div className="form-group">
          <label>Division*</label>
          <select
            className="form-control"
            value={formData.divisionId || ""}
            onChange={e => {
              if (e) e.preventDefault();

              setFormData({
                ...formData,
                divisionId: e.target.value,
              });
            }}>
            <option value="" disabled>
              Select Division
            </option>
            {allDivisions.map(division => (
              <option value={division._id}>{division.description}</option>
            ))}
          </select>
        </div>
      </FormModal>

      <div className="mt-26">
        <Table
          loading={loading}
          columns={columns}
          data={allPositionTypes}
          withoutHeader={true}
          onAdd={e => {
            if (e) e.preventDefault();
            setModalVisible(true);
            setFormData({});
          }}
          onRemove={async ({ rows }) => {
            showLoadingSpinner();
            try {
              let yes = confirm(
                `Are you sure to delete ${rows.length} position types?`,
              );
              if (yes) {
                for (const row of rows) {
                  await deletePositionType({
                    variables: {
                      _id: row._id,
                    },
                  });
                }
                notification.addNotification({
                  title: "Success!",
                  message: `${rows.length} position types deleted`,
                  level: "success",
                });
                await refetch();
              }
            } catch (err) {
              handleError(err);
            }
            hideLoadingSpinner();
          }}
          customUtilities={customUtilities}
        />
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(PositionType);
