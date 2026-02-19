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
    allProductTypes {
      _id
      description
      AgriInputType {
        _id
        description
      }
    }

    allAgriInputType {
      _id
      description
    }
  }
`;

const CREATE_PRODUCT_TYPE = gql`
  mutation createProductType($description: String!, $agriInputTypeId: String!) {
    createProductType(
      description: $description
      agriInputTypeId: $agriInputTypeId
    )
  }
`;

const UPDATE_PRODUCT_TYPE = gql`
  mutation updateProductType(
    $_id: String!
    $description: String
    $agriInputTypeId: String
  ) {
    updateProductType(
      _id: $_id
      description: $description
      agriInputTypeId: $agriInputTypeId
    )
  }
`;
const DELETE_PRODUCT_TYPE = gql`
  mutation deleteProductType($_id: String!) {
    deleteProductType(_id: $_id)
  }
`;
const ProductType = () => {
  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();
  const columns = useMemo(() => [
    {
      Header: "Product Type Desc",
      accessor: "description",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Agri Input Type Desc",
      accessor: "AgriInputType.description",
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
                  agriInputTypeId: propsTable.row.original.AgriInputType._id,
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
  const [createProductType] = useMutation(CREATE_PRODUCT_TYPE);
  const [updateProductType] = useMutation(UPDATE_PRODUCT_TYPE);
  const [deleteProductType] = useMutation(DELETE_PRODUCT_TYPE);
  let allProductTypes = [];

  if (data?.allProductTypes) {
    allProductTypes = data.allProductTypes;
  }

  let allAgriInputType = [];
  if (data?.allAgriInputType) {
    allAgriInputType = data.allAgriInputType;
  }

  return (
    <div>
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Product Type`}
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
              await createProductType({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateProductType({
                variables: {
                  ...formData,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Product Type saved!`,
              level: "success",
            });
            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}>
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
        <div className="form-group">
          <label>Agri Input Type</label>
          <select
            className="form-control"
            value={formData.agriInputTypeId || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                agriInputTypeId: e.target.value,
              });
            }}>
            <option value="" disabled>
              Select Agri Type
            </option>
            {allAgriInputType.map(type => (
              <option value={type._id}>{type.description}</option>
            ))}
          </select>
        </div>
      </FormModal>

      <Table
        loading={false}
        columns={columns}
        data={allProductTypes}
        withoutHeader={true}
        onAdd={e => {
          if (e) e.preventDefault();
          setModalVisible(true);
          setFormData({});
        }}
        onRemove={async ({ rows }) => {
          showLoadingSpinner();
          try {
            let yes = confirm(`Are you sure to delete ${rows.length} types?`);
            if (yes) {
              for (const row of rows) {
                await deleteProductType({
                  variables: {
                    _id: row._id,
                  },
                });
              }
              notification.addNotification({
                title: "Success!",
                message: `${rows.length} types deleted`,
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
      <div className="flex mt-4">
        <p className="text-md">Total Data: </p>
        <p className="text-md font-bold mx-4">{allProductTypes.length}</p>
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(ProductType);
