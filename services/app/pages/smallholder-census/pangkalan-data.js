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
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import Table from "../../components/TableAsync";
import { FormModal } from "../../components/Modal";
import dayjs from "dayjs";
import PangkalanDataSabah from "../../components/SmallholderCensus/PangkalanDataSabah";
import PangkalanDataSarawak from "../../components/SmallholderCensus/PangkalanDataSarawak";
import PangkalanDataSemenanjung from "../../components/SmallholderCensus/PangkalanDataSemenanjung";

const PangkalanData = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Smallholder | Pangkalan Data</title>
      </Head>

      <div className="mt-26">
        <div className=" pr-0 md:pr-10 py-4 bg-white h-full">
          <div className="flex">
            <div
              className={`${
                router.query.componentName === "Sabah"
                  ? "bg-mantis-200 text-black font-bold"
                  : "bg-white text-black border border-gray-300"
              } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
              onClick={e => {
                if (e) e.preventDefault();
                router.replace({
                  pathname: router.pathname,
                  query: {
                    ...router.query,
                    componentName: "Sabah",
                  },
                });
              }}>
              <p className="text-lg font-semibold">Sabah</p>
            </div>
            <div
              className={`${
                router.query.componentName === "Semenanjung"
                  ? "bg-mantis-200 text-black font-bold"
                  : "bg-white text-black border border-gray-300"
              } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
              onClick={e => {
                if (e) e.preventDefault();
                router.replace({
                  pathname: router.pathname,
                  query: {
                    ...router.query,
                    componentName: "Semenanjung",
                  },
                });
              }}>
              <p className="text-lg font-semibold">Semenanjung</p>
            </div>
            <div
              className={`${
                router.query.componentName === "Sarawak"
                  ? "bg-mantis-200 text-black font-bold"
                  : "bg-white text-black border border-gray-300"
              } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
              onClick={e => {
                if (e) e.preventDefault();
                router.replace({
                  pathname: router.pathname,
                  query: {
                    ...router.query,
                    componentName: "Sarawak",
                  },
                });
              }}>
              <p className="text-lg font-semibold">Sarawak</p>
            </div>
          </div>

          {router.query.componentName === "Sabah" ? (
            <PangkalanDataSabah />
          ) : router.query.componentName === "Sarawak" ? (
            <PangkalanDataSarawak />
          ) : (
            <PangkalanDataSemenanjung />
          )}
        </div>
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(PangkalanData);
