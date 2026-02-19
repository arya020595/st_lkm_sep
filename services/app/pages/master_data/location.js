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
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import { FormModal } from "../../components/Modal";
import CountryRegion from "../../components/MasterDataLocation/CountryRegion";
import Country from "../../components/MasterDataLocation/Country";
import Citizenship from "../../components/MasterDataLocation/Citizenship";
import LocalRegion from "../../components/MasterDataLocation/LocalRegion";
import LocalState from "../../components/MasterDataLocation/LocalState";
import SubRegion from "../../components/MasterDataLocation/SubRegion";
import { DropDownMenu } from "../../components/DropDownMenu";

const Location = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Master Data Location</title>
      </Head>

      <div className="mt-26">
        <div className=" pr-0 md:pr-10 py-4 bg-white h-full">
          <DropDownMenu componentName={router.query.componentName}>
            {currentUserDontHavePrivilege(["Country Region:Read"]) ? null : (
              <div
                className={`${
                  router.query.componentName === "Country Region"
                    ? "bg-mantis-200 text-black font-bold"
                    : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
                onClick={e => {
                  if (e) e.preventDefault();
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      componentName: "Country Region",
                    },
                  });
                }}>
                <p className="text-lg font-semibold">Country Region</p>
              </div>
            )}

            {currentUserDontHavePrivilege(["Sub Region:Read"]) ? null : (
              <div
                className={`${
                  router.query.componentName === "Sub Region"
                    ? "bg-mantis-200 text-black font-bold"
                    : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
                onClick={e => {
                  if (e) e.preventDefault();
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      componentName: "Sub Region",
                    },
                  });
                }}>
                <p className="text-lg font-semibold">Sub Region</p>
              </div>
            )}

            {currentUserDontHavePrivilege(["Country:Read"]) ? null : (
              <div
                className={`${
                  router.query.componentName === "Country"
                    ? "bg-mantis-200 text-black font-bold"
                    : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
                onClick={e => {
                  if (e) e.preventDefault();
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      componentName: "Country",
                    },
                  });
                }}>
                <p className="text-lg font-semibold">Country</p>
              </div>
            )}
            {currentUserDontHavePrivilege(["Citizenship:Read"]) ? null : (
              <div
                className={`${
                  router.query.componentName === "Citizenship"
                    ? "bg-mantis-200 text-black font-bold"
                    : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
                onClick={e => {
                  if (e) e.preventDefault();
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      componentName: "Citizenship",
                    },
                  });
                }}>
                <p className="text-lg font-semibold">Citizenship</p>
              </div>
            )}

            {currentUserDontHavePrivilege(["Local Region:Read"]) ? null : (
              <div
                className={`${
                  router.query.componentName === "Local Region"
                    ? "bg-mantis-200 text-black font-bold"
                    : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
                onClick={e => {
                  if (e) e.preventDefault();
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      componentName: "Local Region",
                    },
                  });
                }}>
                <p className="text-lg font-semibold">Local Region</p>
              </div>
            )}

            {currentUserDontHavePrivilege(["Local State:Read"]) ? null : (
              <div
                className={`${
                  router.query.componentName === "Local State"
                    ? "bg-mantis-200 text-black font-bold"
                    : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
                onClick={e => {
                  if (e) e.preventDefault();
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      componentName: "Local State",
                    },
                  });
                }}>
                <p className="text-lg font-semibold">Local State</p>
              </div>
            )}
          </DropDownMenu>
          {router.query.componentName === "Country Region" ? (
            currentUserDontHavePrivilege(["Country Region:Read"]) ? null : (
              <CountryRegion
                currentUserDontHavePrivilege={currentUserDontHavePrivilege}
              />
            )
          ) : router.query.componentName === "Sub Region" ? (
            <SubRegion
              currentUserDontHavePrivilege={currentUserDontHavePrivilege}
            />
          ) : router.query.componentName === "Country" ? (
            currentUserDontHavePrivilege(["Country:Read"]) ? null : (
              <Country
                currentUserDontHavePrivilege={currentUserDontHavePrivilege}
              />
            )
          ) : router.query.componentName === "Citizenship" ? (
            currentUserDontHavePrivilege(["Citizenship:Read"]) ? null : (
              <Citizenship
                currentUserDontHavePrivilege={currentUserDontHavePrivilege}
              />
            )
          ) : router.query.componentName === "Local Region" ? (
            currentUserDontHavePrivilege(["Local Region:Read"]) ? null : (
              <LocalRegion
                currentUserDontHavePrivilege={currentUserDontHavePrivilege}
              />
            )
          ) : router.query.componentName === "Local State" ? (
            currentUserDontHavePrivilege(["Local State:Read"]) ? null : (
              <LocalState
                currentUserDontHavePrivilege={currentUserDontHavePrivilege}
              />
            )
          ) : (
            <div />
          )}
        </div>
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Location);
