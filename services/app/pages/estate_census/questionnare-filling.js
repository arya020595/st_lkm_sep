import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import appConfig from "../../app.json";
import { withApollo } from "../../libs/apollo";
import { useRouter } from "next/router";
import AdminArea from "../../components/AdminArea";
import Table from "../../components/Table";

import { useMutation, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import {
  hideLoadingSpinner,
  showLoadingSpinner,
  useNotification,
} from "../../components/App";
import dayjs from "dayjs";

const QUERY = gql`
  query Query($formId: String!) {
    estateCensusForm(_id: $formId) {
      _id
      name
      description
      specs
    }
    allEstateCensusFormFillings(formId: $formId) {
      _id
      _createdAt
      _updatedAt
      formId
      name
      description
      # specs
      data
    }
  }
`;

const CREATE = gql`
  mutation createEstateCensusFormFilling(
    $formId: String!
    $name: String!
    $description: String!
  ) {
    createEstateCensusFormFilling(
      formId: $formId
      name: $name
      description: $description
    ) {
      _id
      _createdAt
      _updatedAt
      formId
      name
      description
      # specs
      data
    }
  }
`;

const UPDATE = gql`
  mutation updateEstateCensusFormFilling(
    $_id: String!
    $name: String!
    $description: String!
    $specs: JSON
    $data: JSON
  ) {
    updateEstateCensusFormFilling(
      _id: $_id
      name: $name
      description: $description
      specs: $specs
      data: $data
    )
  }
`;

const DELETE = gql`
  mutation deleteEstateCensusFormFilling($_id: String!) {
    deleteEstateCensusFormFilling(_id: $_id)
  }
`;

const Questionnare = () => {
  const router = useRouter();
  const notification = useNotification();

  const [createEstateCensusFormFilling] = useMutation(CREATE);
  const [updateEstateCensusFormFilling] = useMutation(UPDATE);
  const [deleteEstateCensusFormFilling] = useMutation(DELETE);
  const { data, loading, error, refetch } = useQuery(QUERY, {
    variables: {
      formId: router.query.formId || "",
    },
  });
  let allEstateCensusFormFillings = data?.allEstateCensusFormFillings || [];
  let estateCensusForm = data?.estateCensusForm || {};

  const columns = useMemo(() => [
    {
      Header: "Date",
      accessor: "_createdAt",
      style: {
        fontSize: 20,
        width: 120,
      },
      Cell: props => dayjs(props.cell.value).format("DD MMM YYYY HH:mm"),
    },
    {
      Header: "Content",
      accessor: "data",
      style: {
        fontSize: 20,
        // width: 300,
      },
      Cell: props =>
        props.cell.value ? (
          <div>
            {Object.entries(props.cell.value)
              .slice(0, 3)
              .map(([key, value]) => (
                <div key={key}>
                  {key.split("-").join(", ")}: {value}
                </div>
              ))}
            <div>....</div>
          </div>
        ) : (
          <span className="italic text-gray-300">No content</span>
        ),
    },
  ]);

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Questionnaire Filling</title>
      </Head>

      <div className="pt-24"></div>

      <div className="pt-8 px-6 flex justify-center items-center">
        <div className="font-bold text-2xl">
          Questionnaire Filling for{" "}
          <span className="text-green-600">{estateCensusForm?.name}</span>
        </div>
      </div>

      <div className="pr-0 md:pr-10 py-4 bg-white">
        <Table
          loading={false}
          columns={columns}
          data={allEstateCensusFormFillings}
          withoutHeader={true}
          onAdd={async e => {
            if (e) e.preventDefault();
            showLoadingSpinner();
            try {
              let result = await createEstateCensusFormFilling({
                variables: {
                  formId: router.query.formId,
                  ...estateCensusForm,
                },
              });
              await refetch();
              router.push({
                pathname: "/estate_census/questionnare-input",
                query: {
                  ...router.query,
                  fillingId: result.data.createEstateCensusFormFilling._id,
                },
              });
              // window.location.href =
              //   "/lkm/estate_census/questionnare-input?fillingId=" +
              //   result.data.createEstateCensusFormFilling._id;
            } catch (err) {
              notification.handleError(err);
            }
            hideLoadingSpinner();
          }}
          onEdit={props => {
            console.log({ props });
            router.push({
              pathname: "/estate_census/questionnare-input",
              query: {
                ...router.query,
                fillingId: props.row._id,
              },
            });
          }}
          onRemove={async props => {
            // console.log(props);
            showLoadingSpinner();
            try {
              let yes = confirm(
                `Are you sure to remove ${props.rows.length} form(s)?`,
              );
              if (yes) {
                for (const row of props.rows) {
                  await deleteEstateCensusFormFilling({
                    variables: {
                      _id: row._id,
                    },
                  });
                }
                await refetch();
              }
            } catch (err) {
              notification.handleError(err);
            }
            hideLoadingSpinner();
          }}
        />
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Questionnare);
