import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import Table from "../../components/TableAsync";
import { FormModal } from "../../components/Modal";
import dayjs from "dayjs";

const QUERY = gql`
  query listQueries($pageIndex: Int, $pageSize: Int, $filters: String) {
    countSmallholders
    allSmallholders(
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    ) {
      _id
      name
      nric
      oric
      citizenship
      ethnic
      gender
      religion
      maritalStatus
      dateOfBirth
      educationStatus
      occupation
      totalDependants
      maleFamilyWorker
      femaleFamilyWorker
      farmWorkedBy
      residenceAddress
      telephoneNo
      isActive
      isFamilyRelated
      stateName
      dunName
      perlimentName
      mukimName
      is_native
      postCode
      city
      status
      statusDescription
      kampungKelompok
      award
      typeOfSmallholder

      LocalState {
        _id
        description
      }
    }
  }
`;

const Smallholder = () => {
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
      Header: "NRIC",
      accessor: "nric",
      style: {
        fontSize: 20,
        width: 350,
      },
    },
    {
      Header: "ORIC",
      accessor: "oric",
      style: {
        fontSize: 20,
        width: 350,
      },
    },
    {
      Header: "Citizenship",
      accessor: "citizenship",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "Ethnic",
      accessor: "ethnic",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "Gender",
      accessor: "gender",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "Religion",
      accessor: "religion",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "Telephone",
      accessor: "telephoneNo",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "State",
      accessor: "LocalState.description",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "Smallholder Type",
      accessor: "typeOfSmallholder",
      style: {
        fontSize: 20,
      },
    },
  ]);

  const { data, loading, error, refetch } = useQuery(QUERY, {
    variables: {
      pageIndex: router.query.pageIndex ? parseInt(router.query.pageIndex) : 0,
      pageSize: router.query.pageSize ? parseInt(router.query.pageSize) : 10,
      filters: router.query.filters || "",
    },
  });

  let allSmallholders = [];
  if (data?.allSmallholders) {
    allSmallholders = data.allSmallholders;
  }
  // console.log({ allSmallholders });
  let countSmallholders = data?.countSmallholders || 0;
  let [internalLoading, setInternalLoading] = useState(false);
  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countSmallholders) return 1;
    return Math.ceil(countSmallholders / pageSize);
  }, [countSmallholders, pageSize]);
  const handlePageChange = useCallback(
    async ({ pageIndex, pageSize, filters }) => {
      // console.log("filters", JSON.stringify(filters));
      router.replace(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            pageIndex,
            pageSize,
            filters: JSON.stringify(filters),
          },
        },
        null,
        {
          scroll: false,
        },
      );
    },
    [],
  );

  let filters = useMemo(() => {
    // console.log("router.query.filters", router.query.filters);
    if (!router.query.filters) return [];
    try {
      let filters = JSON.parse(router.query.filters);
      // console.log({ filters });
      return filters;
    } catch (err) {
      console.warn(err);
    }
    return [];
  }, [router.query.filters]);
  // console.log(router.query.filters, { filters });

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Profile | Smallholder</title>
      </Head>

      <div className="mt-26  pr-0 md:pr-10 py-4 bg-white h-full">
        <Table
          loading={loading}
          columns={columns}
          data={allSmallholders}
          withoutHeader={true}
          controlledFilters={filters}
          controlledPageIndex={pageIndex}
          controlledPageCount={pageCount}
          controlledPageSize={pageSize}
          onPageChange={handlePageChange}
        />

        <div className="flex mt-4">
          <p className="text-md">Total Data: </p>
          <p className="text-md font-bold mx-4">{countSmallholders}</p>
        </div>
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Smallholder);
