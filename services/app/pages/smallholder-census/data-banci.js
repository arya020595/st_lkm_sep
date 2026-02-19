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
import DataBanciSabah from "../../components/SmallholderCensus/DataBanciSabah";
import DataBanciSarawak from "../../components/SmallholderCensus/DataBanciSarawak";
import DataBanciSemenanjung from "../../components/SmallholderCensus/DataBanciSemenanjung";
import { DropDownMenu } from "../../components/DropDownMenu";

const DataBanci = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  return (
    <AdminArea urlQuery={router.query} title="Smallholder Profile (Cosis)">
      <Head>
        <title>Smallholder Profile (Cosis)</title>
      </Head>

      <div className="mt-26">
        <div className=" pr-0 md:pr-10 py-4 bg-white h-full">
          <DropDownMenu componentName={router.query.componentName}>
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
            <div
              className={`${
                router.query.componentName === "Report"
                  ? "bg-mantis-200 text-black font-bold"
                  : "bg-white text-black border border-gray-300"
              } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
              onClick={e => {
                if (e) e.preventDefault();
                router.replace({
                  pathname: router.pathname,
                  query: {
                    ...router.query,
                    componentName: "Report",
                  },
                });
              }}>
              <p className="text-lg font-semibold">Generate Report</p>
            </div>
          </DropDownMenu>

          {router.query.componentName === "Sabah" ? (
            <DataBanciSabah
              currentUserDontHavePrivilege={currentUserDontHavePrivilege}
            />
          ) : router.query.componentName === "Sarawak" ? (
            <DataBanciSarawak
              currentUserDontHavePrivilege={currentUserDontHavePrivilege}
            />
          ) : router.query.componentName === "Semenanjung" ? (
            <DataBanciSemenanjung
              currentUserDontHavePrivilege={currentUserDontHavePrivilege}
            />
          ) : (
            <div />
          )}
        </div>
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(DataBanci);
