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
import dayjs from "dayjs";

const QUERY = gql`
  query listQueries {
    allUnstructuredDocumentInternationalCocoaStandards {
      _id
      standard
      year
      fileName
      fileUrl
      mimeType
      _createdAt
    }
  }
`;

const CREATE_INTERNATIONAL_COCOA_STANDARD = gql`
  mutation createUnstructuredDocumentInternationalCocoaStandards(
    $standard: String
    $year: Int
    $fileName: String
    $fileUrl: String
  ) {
    createUnstructuredDocumentInternationalCocoaStandards(
      standard: $standard
      year: $year
      fileName: $fileName
      fileUrl: $fileUrl
    )
  }
`;

const UPDATE_INTERNATIONAL_COCOA_STANDARD = gql`
  mutation updateUnstructuredDocumentInternationalCocoaStandards(
    $_id: String!
    $standard: String
    $year: Int
    $fileName: String
    $fileUrl: String
  ) {
    updateUnstructuredDocumentInternationalCocoaStandards(
      _id: $_id
      standard: $standard
      year: $year
      fileName: $fileName
      fileUrl: $fileUrl
    )
  }
`;
const DELETE_INTERNATIONAL_COCOA_STANDARD = gql`
  mutation deleteUnstructuredDocumentInternationalCocoaStandards(
    $_id: String!
  ) {
    deleteUnstructuredDocumentInternationalCocoaStandards(_id: $_id)
  }
`;
const InternationalCocoaStandard = () => {
  const notification = useNotification();
  const [formData, setFormData] = useState({
    year: parseInt(dayjs().format("YYYY")),
  });
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  const YEARS = useMemo(() => {
    const toYear = parseInt(dayjs().get("year"));
    const fromYear = 1940;
    // console.log([...new Array(toYear - fromYear)])
    return [...new Array(toYear - fromYear)].map((_, index) => {
      // console.log(index, toYear, toYear - index)
      return String(toYear - index);
    });
  }, []);

  const columns = useMemo(() => [
    {
      Header: "Standard",
      accessor: "standard",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Year",
      accessor: "year",
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
  const [createUnstructuredDocumentInternationalCocoaStandards] = useMutation(
    CREATE_INTERNATIONAL_COCOA_STANDARD,
  );
  const [updateUnstructuredDocumentInternationalCocoaStandards] = useMutation(
    UPDATE_INTERNATIONAL_COCOA_STANDARD,
  );
  const [deleteUnstructuredDocumentInternationalCocoaStandards] = useMutation(
    DELETE_INTERNATIONAL_COCOA_STANDARD,
  );
  let allUnstructuredDocumentInternationalCocoaStandards = [];

  if (data?.allUnstructuredDocumentInternationalCocoaStandards) {
    allUnstructuredDocumentInternationalCocoaStandards =
      data.allUnstructuredDocumentInternationalCocoaStandards;
  }

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>International Cocoa Standard</title>
      </Head>
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} International Cocoa Standard`}
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
              await createUnstructuredDocumentInternationalCocoaStandards({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateUnstructuredDocumentInternationalCocoaStandards({
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
          <label>Standard</label>
          <input
            placeholder="Standard"
            className="form-control"
            value={formData.standard || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                standard: e.target.value,
              });
            }}
            required
          />
        </div>
        <div className="form-group">
          <label>Year*</label>
          <select
            className="form-control"
            value={formData.year}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                year: parseInt(e.target.value),
              });
            }}
            required>
            {YEARS.map(y => (
              <option value={y}>{y}</option>
            ))}
          </select>
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
            data={allUnstructuredDocumentInternationalCocoaStandards}
            withoutHeader={true}
            onAdd={e => {
              if (e) e.preventDefault();
              setModalVisible(true);
              setFormData({
                year: parseInt(dayjs().format("YYYY")),
              });
            }}
            onRemove={async ({ rows }) => {
              showLoadingSpinner();
              try {
                let yes = confirm(
                  `Are you sure to delete ${rows.length} tariff document?`,
                );
                if (yes) {
                  for (const row of rows) {
                    await deleteUnstructuredDocumentInternationalCocoaStandards(
                      {
                        variables: {
                          _id: row._id,
                        },
                      },
                    );
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
export default withApollo({ ssr: true })(InternationalCocoaStandard);
