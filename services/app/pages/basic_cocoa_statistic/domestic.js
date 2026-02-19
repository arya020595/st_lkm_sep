import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import appConfig from "../../app.json";
import { withApollo } from "../../libs/apollo";
import { useRouter } from "next/router";
import CultivatedArea from "../../components/BasicCocoaStatisticDomestic/CultivatedArea";
import Production from "../../components/BasicCocoaStatisticDomestic/Production";
import AgriInput from "../../components/BasicCocoaStatisticDomestic/AgriInput";
import Employment from "../../components/BasicCocoaStatisticDomestic/Employment";
import Grindings from "../../components/BasicCocoaStatisticDomestic/Grindings";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import { DropDownMenu } from "../../components/DropDownMenu";

const Domestic = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Basic Cocoa Statistic | Domestic</title>
      </Head>

      <div className="mt-26">
        <div className=" pr-0 md:pr-10 py-4 bg-white h-full">
          <DropDownMenu componentName={router.query.componentName}>
            {currentUserDontHavePrivilege([
              "BCS Domestic Cultivated Area:Read",
            ]) ? null : (
              <div
                className={`${
                  router.query.componentName === "Cultivated Area"
                    ? "bg-mantis-200 text-black font-bold"
                    : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
                onClick={e => {
                  if (e) e.preventDefault();
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      componentName: "Cultivated Area",
                    },
                  });
                }}>
                <p className="text-lg font-semibold">Cultivated Area</p>
              </div>
            )}

            {currentUserDontHavePrivilege([
              "BCS Domestic Production:Read",
            ]) ? null : (
              <div
                className={`${
                  router.query.componentName === "Production"
                    ? "bg-mantis-200 text-black font-bold"
                    : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
                onClick={e => {
                  if (e) e.preventDefault();
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      componentName: "Production",
                    },
                  });
                }}>
                <p className="text-lg font-semibold">Production</p>
              </div>
            )}

            {currentUserDontHavePrivilege([
              "BCS Domestic Grindings:Read",
            ]) ? null : (
              <div
                className={`${
                  router.query.componentName === "Grindings"
                    ? "bg-mantis-200 text-black font-bold"
                    : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
                onClick={e => {
                  if (e) e.preventDefault();
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      componentName: "Grindings",
                    },
                  });
                }}>
                <p className="text-lg font-semibold">Grindings</p>
              </div>
            )}

            {currentUserDontHavePrivilege([
              "BCS Domestic Employment:Read",
            ]) ? null : (
              <div
                className={`${
                  router.query.componentName === "Employment"
                    ? "bg-mantis-200 text-black font-bold"
                    : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
                onClick={e => {
                  if (e) e.preventDefault();
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      componentName: "Employment",
                    },
                  });
                }}>
                <p className="text-lg font-semibold">Employment</p>
              </div>
            )}

            {currentUserDontHavePrivilege([
              "BCS Domestic Employment:Read",
            ]) ? null : (
              <div
                className={`${
                  router.query.componentName === "Input Agri"
                    ? "bg-mantis-200 text-black font-bold"
                    : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
                onClick={e => {
                  if (e) e.preventDefault();
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      componentName: "Input Agri",
                    },
                  });
                }}>
                <p className="text-lg font-semibold">
                  Input Agri (i.e Fertilizer)
                </p>
              </div>
            )}
          </DropDownMenu>
          
          {router.query.componentName === "Cultivated Area" ? (
            currentUserDontHavePrivilege([
              "BCS Domestic Cultivated Area:Read",
            ]) ? null : (
              <CultivatedArea
                currentUserDontHavePrivilege={currentUserDontHavePrivilege}
              />
            )
          ) : router.query.componentName === "Production" ? (
            currentUserDontHavePrivilege([
              "BCS Domestic Production:Read",
            ]) ? null : (
              <Production
                currentUserDontHavePrivilege={currentUserDontHavePrivilege}
              />
            )
          ) : router.query.componentName === "Input Agri" ? (
            currentUserDontHavePrivilege([
              "BCS Domestic Input Agri Fertilizer:Read",
            ]) ? null : (
              <AgriInput
                currentUserDontHavePrivilege={currentUserDontHavePrivilege}
              />
            )
          ) : router.query.componentName === "Employment" ? (
            currentUserDontHavePrivilege([
              "BCS Domestic Employment:Read",
            ]) ? null : (
              <Employment
                currentUserDontHavePrivilege={currentUserDontHavePrivilege}
              />
            )
          ) : router.query.componentName === "Grindings" ? (
            currentUserDontHavePrivilege([
              "BCS Domestic Grindings:Read",
            ]) ? null : (
              <Grindings
                currentUserDontHavePrivilege={currentUserDontHavePrivilege}
              />
            )
          ) : (
            <div className="min-h-screen" />
          )}
        </div>
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Domestic);
