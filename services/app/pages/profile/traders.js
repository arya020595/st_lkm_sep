import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import appConfig from "../../app.json";
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
    allTraders {
      _id
      name
      address
      branch
      correspondenceState
      Country {
        _id
        name
      }
      telephone
      email
      website
    }
  }
`;

const Trader = () => {
  const router = useRouter();

  const columns = useMemo(() => [
    {
      Header: "Name",
      accessor: "name",
      style: {
        fontSize: 20,
        width: 500,
      },
    },
    {
      Header: "Address",
      accessor: "address",
      style: {
        fontSize: 20,
        width: 500,
      },
    },
    {
      Header: "State",
      accessor: "correspondenceState",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Country",
      accessor: "Country.name",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Telephone",
      accessor: "telephone",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Email",
      accessor: "email",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Website",
      accessor: "website",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Branch",
      accessor: "branch",
      style: {
        fontSize: 20,
      },
    },
  ]);

  const { data, loading, error, refetch } = useQuery(QUERY);

  let allTraders = [];

  if (data?.allTraders) {
    allTraders = data.allTraders;
  }

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Profile | Trader</title>
      </Head>

      <div className="mt-26  pr-0 md:pr-10 py-4 bg-white h-full">
        <Table
          loading={false}
          columns={columns}
          data={allTraders}
          withoutHeader={true}
        />
        <div className="flex mt-4">
          <p className="text-md">Total Data: </p>
          <p className="text-md font-bold mx-4">{allTraders.length}</p>
        </div>
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Trader);
