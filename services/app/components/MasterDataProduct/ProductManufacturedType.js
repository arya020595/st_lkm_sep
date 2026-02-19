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
    allProductManufacturedTypes {
      _id
      type
      code
      name
    }
  }
`;

const CREATE_PRODUCT_MANUFACTURED_TYPE = gql`
  mutation createProductManufacturedType(
    $type: String!
    $code: String!
    $name: String!
  ) {
    createProductManufacturedType(type: $type, code: $code, name: $name)
  }
`;

const UPDATE_PRODUCT_MANUFACTURED_TYPE = gql`
  mutation updateProductManufacturedType(
    $_id: String!
    $type: String
    $code: String
    $name: String
  ) {
    updateProductManufacturedType(
      _id: $_id
      type: $type
      code: $code
      name: $name
    )
  }
`;
const DELETE_PRODUCT_MANUFACTURED_TYPE = gql`
  mutation deleteProductManufacturedType($_id: String!) {
    deleteProductManufacturedType(_id: $_id)
  }
`;
const ProductManufacturedType = ({ currentUserDontHavePrivilege }) => {
  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();
  const columns = useMemo(() => [
    {
      Header: "Type",
      accessor: "type",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Code",
      accessor: "code",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Name",
      accessor: "name",
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
                console.log(propsTable.row.original);
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
  const [createProductManufacturedType] = useMutation(
    CREATE_PRODUCT_MANUFACTURED_TYPE,
  );
  const [updateProductManufacturedType] = useMutation(
    UPDATE_PRODUCT_MANUFACTURED_TYPE,
  );
  const [deleteProductManufacturedType] = useMutation(
    DELETE_PRODUCT_MANUFACTURED_TYPE,
  );
  let allProductManufacturedTypes = [];

  if (data?.allProductManufacturedTypes) {
    allProductManufacturedTypes = data.allProductManufacturedTypes;
  }

  return (
    <div>
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Product Manufactured Type`}
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
              await createProductManufacturedType({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateProductManufacturedType({
                variables: {
                  ...formData,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Product Manufactured Type saved!`,
              level: "success",
            });
            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}>
        <div className="form-group">
          <label>Type</label>
          <select
            className="form-control"
            required
            value={formData.type || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                type: e.target.value,
              });
            }}>
            <option value="" disabled>
              Select Type
            </option>
            <option value="Cocoa">Cocoa</option>
            <option value="Non-Cocoa">Non-Cocoa</option>
            <option value="Non-Food">Non-Food</option>
          </select>
        </div>

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
          <label>Name</label>
          <input
            placeholder="Name"
            className="form-control"
            value={formData.name || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                name: e.target.value,
              });
            }}
            required
          />
        </div>
      </FormModal>

      <Table
        loading={false}
        columns={columns}
        data={allProductManufacturedTypes}
        withoutHeader={true}
        onAdd={
          currentUserDontHavePrivilege(["Product Manufactured Type:Create"])
            ? null
            : e => {
                if (e) e.preventDefault();
                setModalVisible(true);
                setFormData({});
              }
        }
        onRemove={
          currentUserDontHavePrivilege(["Product Manufactured Type:Delete"])
            ? null
            : async ({ rows }) => {
                showLoadingSpinner();
                try {
                  let yes = confirm(
                    `Are you sure to delete ${rows.length} products?`,
                  );
                  if (yes) {
                    for (const row of rows) {
                      await deleteProductManufacturedType({
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
          currentUserDontHavePrivilege(["Product Manufactured Type:Update"])
            ? null
            : customUtilities
        }
        customUtilitiesPosition="left"
      />
      <div className="flex mt-4">
        <p className="text-md">Total Data: </p>
        <p className="text-md font-bold mx-4">{allProductManufacturedTypes.length}</p>
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(ProductManufacturedType);
