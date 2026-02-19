import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { withApollo } from "../../libs/apollo";
import {
  showLoadingSpinner,
  hideLoadingSpinner,
  useNotification,
} from "../App";
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
import AdminArea from "../AdminArea";
import Table from "../Table";
import { FormModal } from "../Modal";

const QUERY = gql`
  query listQueries {
    allDivisions {
      _id
      code
      description
      Category {
        _id
        description
      }
    }
    allCategories {
      _id
      description
    }
  }
`;

const CREATE_DIVISION = gql`
  mutation createDivision(
    $code: String!
    $description: String!
    $categoryId: String!
  ) {
    createDivision(
      code: $code
      description: $description
      categoryId: $categoryId
    )
  }
`;

const UPDATE_DIVISION = gql`
  mutation updateDivision(
    $_id: String!
    $code: String
    $description: String
    $categoryId: String
  ) {
    updateDivision(
      _id: $_id
      code: $code
      description: $description
      categoryId: $categoryId
    )
  }
`;
const DELETE_DIVISION = gql`
  mutation deleteDivision($_id: String!) {
    deleteDivision(_id: $_id)
  }
`;
const Division = ({ currentUserDontHavePrivilege }) => {
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
      Header: "Category",
      accessor: "Category.description",
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
                  categoryId: propsTable.row.original.Category._id,
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
  const [createDivision] = useMutation(CREATE_DIVISION);
  const [updateDivision] = useMutation(UPDATE_DIVISION);
  const [deleteDivision] = useMutation(DELETE_DIVISION);
  let allDivisions = [];

  if (data?.allDivisions) {
    allDivisions = data.allDivisions;
  }

  let allCategories = [];
  if (data?.allCategories) {
    allCategories = data.allCategories;
  }

  return (
    <div>
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Division`}
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
              await createDivision({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateDivision({
                variables: {
                  ...formData,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Division saved!`,
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
            placeholder="description"
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
          <label>Category*</label>
          <select
            className="form-control"
            value={formData.categoryId || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                categoryId: e.target.value,
              });
            }}>
            <option value="" disabled>
              Select Category
            </option>
            {allCategories.map(category => (
              <option value={category._id}>{category.description}</option>
            ))}
          </select>
        </div>
      </FormModal>

      <Table
        loading={false}
        columns={columns}
        data={allDivisions}
        withoutHeader={true}
        onAdd={
          currentUserDontHavePrivilege(["Employment Division:Create"])
            ? null
            : e => {
                if (e) e.preventDefault();
                setModalVisible(true);
                setFormData({});
              }
        }
        onRemove={
          currentUserDontHavePrivilege(["Employment Division:Delete"])
            ? null
            : async ({ rows }) => {
                showLoadingSpinner();
                try {
                  let yes = confirm(
                    `Are you sure to delete ${rows.length} products?`,
                  );
                  if (yes) {
                    for (const row of rows) {
                      await deleteDivision({
                        variables: {
                          _id: row._id,
                        },
                      });
                    }
                    notification.addNotification({
                      title: "Success!",
                      message: `${rows.length} products deleted`,
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
          currentUserDontHavePrivilege(["Employment Division:Update"])
            ? null
            : customUtilities
        }
        customUtilitiesPosition="left"
      />

      <div className="flex mt-4">
        <p className="text-md">Total Data: </p>
        <p className="text-md font-bold mx-4">{allDivisions.length}</p>
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(Division);
