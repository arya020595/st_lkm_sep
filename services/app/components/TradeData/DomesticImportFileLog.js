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
import Table from "../Table";
import dayjs from "dayjs";

const QUERY = gql`
  query allTradeDataImportLogs($type: String!) {
    allTradeDataImportLogs(type: $type) {
      _id
      type
      urlFile
      fileName
      _createdAt
    }
  }
`;

const DomesticImportLog = ({ type }) => {
  const router = useRouter();
  const { data, error, loading, refetch } = useQuery(QUERY, {
    variables: {
      type,
    },
  });

  let allTradeDataImportLogs = [];
  if (data?.allTradeDataImportLogs) {
    allTradeDataImportLogs = data.allTradeDataImportLogs;
  }

  const columns = useMemo(() => [
    {
      Header: "Log ID",
      accessor: "_id",
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
    },
    {
      Header: "Import Date",
      accessor: "_createdAt",
      style: {
        fontSize: 20,
      },
      Cell: props => <span>{dayjs(props.value).format("YYYY-MM-DD")}</span>,
    },
    {
      Header: "File Location",
      accessor: "urlFile",
      style: {
        fontSize: 20,
      },
      Cell: props => (
        <span>
          <a href={props.value} target="__blank" className="text-blue-400 underline">
            {props.value}
          </a>
        </span>
      ),
    },
  ]);

  return (
    <div className="w-full px-4 mt-4">
      <div className="flex justify-between mb-4">
        <div>
          <p
            className="text-xl font-bold cursor-pointer"
            onClick={e => {
              if (e) e.preventDefault();
              router.replace({
                pathname: router.pathname,
                query: {
                  sidebarMenu: "trade_data",
                  appState: "SEP",
                },
              });
            }}>
            <i className="fa fa-arrow-left" /> Back
          </p>
        </div>
        <div>
          <p className="text-xl font-bold">
            <i className="fa fa-history" /> Import File Logs
          </p>
        </div>
      </div>
      <Table
        loading={loading}
        columns={columns}
        data={allTradeDataImportLogs}
        withoutHeader={true}
      />
    </div>
  );
};
export default withApollo({ ssr: true })(DomesticImportLog);
