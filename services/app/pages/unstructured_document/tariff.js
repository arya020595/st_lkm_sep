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
    allUnstruturedDocumentTariffs {
      _id
      productTariff
      description
      fileName
      fileUrl
      mimeType
      _createdAt
    }
  }
`;

const CREATE_TARIFF = gql`
  mutation createUnstruturedDocumentTariffs(
    $productTariff: String
    $description: String
    $fileName: String
    $fileUrl: String
  ) {
    createUnstruturedDocumentTariffs(
      productTariff: $productTariff
      description: $description
      fileName: $fileName
      fileUrl: $fileUrl
    )
  }
`;

const UPDATE_TARIFF = gql`
  mutation updateUnstruturedDocumentTariffs(
    $_id: String!
    $productTariff: String
    $description: String
    $fileName: String
    $fileUrl: String
  ) {
    updateUnstruturedDocumentTariffs(
      _id: $_id
      productTariff: $productTariff
      description: $description
      fileName: $fileName
      fileUrl: $fileUrl
    )
  }
`;
const DELETE_TARIFF = gql`
  mutation deleteUnstruturedDocumentTariffs($_id: String!) {
    deleteUnstruturedDocumentTariffs(_id: $_id)
  }
`;
const Tariff = () => {
  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();
  const columns = useMemo(() => [
    {
      Header: "Product Tariff",
      accessor: "productTariff",
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
      Header: "File Name",
      accessor: "fileName",
      style: {
        fontSize: 20,
      },
      Cell: props => {
        if (props.row.original.fileUrl) {
          return (
            <p className="text-blue-500">
              <a href={props.row.original.fileUrl} target="__blank">
                {props.value}
              </a>
            </p>
          );
        } else {
          return <div />;
        }
      },
    },
    {
      Header: "File Type",
      accessor: "mimeType",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Time",
      accessor: "_createdAt",
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
  const [createUnstruturedDocumentTariffs] = useMutation(CREATE_TARIFF);
  const [updateUnstruturedDocumentTariffs] = useMutation(UPDATE_TARIFF);
  const [deleteUnstruturedDocumentTariffs] = useMutation(DELETE_TARIFF);
  let allUnstruturedDocumentTariffs = [];

  if (data?.allUnstruturedDocumentTariffs) {
    allUnstruturedDocumentTariffs = data.allUnstruturedDocumentTariffs;
  }

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Tariff</title>
      </Head>
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Tariff`}
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
              await createUnstruturedDocumentTariffs({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateUnstruturedDocumentTariffs({
                variables: {
                  ...formData,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Incentive saved!`,
              level: "success",
            });
            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}>
        <div className="form-group">
          <label>Product Tariff</label>
          <input
            placeholder="Product Tariff"
            className="form-control"
            value={formData.productTariff || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                productTariff: e.target.value,
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
        <div className="form-group">
          <label>File Name</label>
          <input
            placeholder="Description"
            className="form-control"
            value={formData.fileName || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                fileName: e.target.value,
              });
            }}
            required
          />
        </div>

        <div className="form-group">
          <label>Attachment File</label>
          <input
            type="file"
            accept="*"
            className="form-control"
            required
            // value={documentData.url}
            onChange={e => {
              if (e) e.preventDefault;
              const file = e.target.files[0];

              let reader = new FileReader();
              reader.onloadend = async () => {
                setFormData({
                  ...formData,
                  fileUrl: reader.result,
                });
              };
              reader.readAsDataURL(file);
            }}
          />
        </div>
      </FormModal>

      <div className="mt-26">
        <div className=" pr-0 md:pr-10 py-4 bg-white h-full">
          <Table
            loading={false}
            columns={columns}
            data={allUnstruturedDocumentTariffs}
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
                  `Are you sure to delete ${rows.length} tariff document?`,
                );
                if (yes) {
                  for (const row of rows) {
                    await deleteUnstruturedDocumentTariffs({
                      variables: {
                        _id: row._id,
                      },
                    });
                  }
                  notification.addNotification({
                    title: "Success!",
                    message: `${rows.length} tariff document deleted`,
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
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Tariff);
