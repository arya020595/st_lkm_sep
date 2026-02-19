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
    allUnstructuredDocumentIncentives {
      _id
      incentiveInvestment
      description
      fileName
      fileUrl
      mimeType
      _createdAt
    }
  }
`;

const CREATE_INCENTIVE_UNSTRUCTURED_DOCUMENT = gql`
  mutation createUnstructuredDocumentIncentives(
    $incentiveInvestment: String
    $description: String
    $fileName: String
    $fileUrl: String
  ) {
    createUnstructuredDocumentIncentives(
      incentiveInvestment: $incentiveInvestment
      description: $description
      fileName: $fileName
      fileUrl: $fileUrl
    )
  }
`;

const UPDATE_INCENTIVE_UNSTRUCTURED_DOCUMENT = gql`
  mutation updateUnstructuredDocumentIncentives(
    $_id: String!
    $incentiveInvestment: String
    $description: String
    $fileName: String
    $fileUrl: String
  ) {
    updateUnstructuredDocumentIncentives(
      _id: $_id
      incentiveInvestment: $incentiveInvestment
      description: $description
      fileName: $fileName
      fileUrl: $fileUrl
    )
  }
`;
const DELETE_INCENTIVE_UNSTRUCTURED_DOCUMENT = gql`
  mutation deleteUnstructuredDocumentIncentives($_id: String!) {
    deleteUnstructuredDocumentIncentives(_id: $_id)
  }
`;
const UnstructuredDocumentIncentives = () => {
  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();
  const columns = useMemo(() => [
    {
      Header: "Incentive Investment",
      accessor: "incentiveInvestment",
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
  const [createUnstructuredDocumentIncentives] = useMutation(
    CREATE_INCENTIVE_UNSTRUCTURED_DOCUMENT,
  );
  const [updateUnstructuredDocumentIncentives] = useMutation(
    UPDATE_INCENTIVE_UNSTRUCTURED_DOCUMENT,
  );
  const [deleteUnstructuredDocumentIncentives] = useMutation(
    DELETE_INCENTIVE_UNSTRUCTURED_DOCUMENT,
  );
  let allUnstructuredDocumentIncentives = [];

  if (data?.allUnstructuredDocumentIncentives) {
    allUnstructuredDocumentIncentives = data.allUnstructuredDocumentIncentives;
  }

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Incentive for Investment</title>
      </Head>
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Incentive for Investment`}
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
              await createUnstructuredDocumentIncentives({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateUnstructuredDocumentIncentives({
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
          <label>Incentive Investment</label>
          <input
            placeholder="Incentive Investment"
            className="form-control"
            value={formData.incentiveInvestment || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                incentiveInvestment: e.target.value,
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
            data={allUnstructuredDocumentIncentives}
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
                  `Are you sure to delete ${rows.length} document ?`,
                );
                if (yes) {
                  for (const row of rows) {
                    await deleteUnstructuredDocumentIncentives({
                      variables: {
                        _id: row._id,
                      },
                    });
                  }
                  notification.addNotification({
                    title: "Success!",
                    message: `${rows.length} document deleted`,
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
export default withApollo({ ssr: true })(UnstructuredDocumentIncentives);
