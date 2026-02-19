import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import appConfig from "../../app.json";
import { withApollo } from "../../libs/apollo";
import { useRouter } from "next/router";
import Production from "../../components/BasicCocoaStatisticGlobal/Production";
import Grinding from "../../components/BasicCocoaStatisticGlobal/Grinding";
import ICCOPrice from "../../components/BasicCocoaStatisticGlobal/ICCOPrice";
import WorldCocoaProduction from "../../components/BasicCocoaStatisticGlobal/WorldCocoaProduction";
import ReuterPrice from "../../components/BasicCocoaStatisticGlobal/ReuterPrice";
import CountryProfile from "../../components/BasicCocoaStatisticGlobal/CountryProfile";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import { DropDownMenu } from "../../components/DropDownMenu";
import dayjs from "dayjs";

const Global = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Basic Cocoa Statistic | Global</title>
      </Head>

      <div className="mt-26">
        <div className=" pr-0 md:pr-10 py-4 bg-white h-full">
          <DropDownMenu componentName={router.query.componentName}>
            {currentUserDontHavePrivilege([
              "BCS Global Production:Read",
            ]) ? null : (
              <div
                className={`${
                  router.query.componentName === "Production"
                    ? "bg-mantis-200 text-black font-bold"
                    : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
                onClick={e => {
                  if (e) e.preventDefault();
                  const { date, year, ...q } = router.query;
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...q,
                      componentName: "Production",
                    },
                  });
                }}>
                <p className="text-lg font-semibold">Production</p>
              </div>
            )}

            {currentUserDontHavePrivilege([
              "BCS Global Grinding:Read",
            ]) ? null : (
              <div
                className={`${
                  router.query.componentName === "Grinding"
                    ? "bg-mantis-200 text-black font-bold"
                    : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
                onClick={e => {
                  if (e) e.preventDefault();
                  const { date, year, ...q } = router.query;
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...q,
                      componentName: "Grinding",
                    },
                  });
                }}>
                <p className="text-lg font-semibold">Grinding</p>
              </div>
            )}

            {currentUserDontHavePrivilege([
              "BCS Global Country Profile:Read",
            ]) ? null : (
              <div
                className={`${
                  router.query.componentName === "Country Profile"
                    ? "bg-mantis-200 text-black font-bold"
                    : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
                onClick={e => {
                  if (e) e.preventDefault();
                  const { date, year, ...q } = router.query;
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...q,
                      componentName: "Country Profile",
                    },
                  });
                }}>
                <p className="text-lg font-semibold">Country Profile</p>
              </div>
            )}

            {/* {currentUserDontHavePrivilege([
              "BCS Global ICCO Price:Read",
            ]) ? null : (
              <div
                className={`${
                  router.query.componentName === "Price ICCO"
                    ? "bg-mantis-200 text-black font-bold"
                    : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
                onClick={e => {
                  if (e) e.preventDefault();
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      year: dayjs().format("YYYY-MM"),
                      componentName: "Price ICCO",
                    },
                  });
                }}>
                <p className="text-lg font-semibold">Price (ICCO)</p>
              </div>
            )} */}

            {/* {currentUserDontHavePrivilege([
              "BCS Global Reuters Price:Read",
            ]) ? null : (
              <div
                className={`${
                  router.query.componentName === "Price Reuters"
                    ? "bg-mantis-200 text-black font-bold"
                    : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
                onClick={e => {
                  if (e) e.preventDefault();
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      year: dayjs().format("YYYY-MM"),
                      componentName: "Price Reuters",
                    },
                  });
                }}>
                <p className="text-lg font-semibold">Price (Reuters)</p>
              </div>
            )} */}

            {currentUserDontHavePrivilege([
              "BCS Global World Cocoa Production:Read",
            ]) ? null : (
              <div
                className={`${
                  router.query.componentName === "World Cocoa Production"
                    ? "bg-mantis-200 text-black font-bold"
                    : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
                onClick={e => {
                  if (e) e.preventDefault();
                  const { date, year, ...q } = router.query;
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...q,
                      componentName: "World Cocoa Production",
                    },
                  });
                }}>
                <p className="text-lg font-semibold">World Cocoa Production</p>
              </div>
            )}
          </DropDownMenu>

          {router.query.componentName === "Production" ? (
            currentUserDontHavePrivilege([
              "BCS Global Production:Read",
            ]) ? null : (
              <Production
                currentUserDontHavePrivilege={currentUserDontHavePrivilege}
              />
            )
          ) : router.query.componentName === "Grinding" ? (
            currentUserDontHavePrivilege([
              "BCS Global Grinding:Read",
            ]) ? null : (
              <Grinding
                currentUserDontHavePrivilege={currentUserDontHavePrivilege}
              />
            )
          ) : router.query.componentName === "Price ICCO" ? (
            currentUserDontHavePrivilege([
              "BCS Global ICCO Price:Read",
            ]) ? null : (
              <ICCOPrice
                currentUserDontHavePrivilege={currentUserDontHavePrivilege}
              />
            )
          ) : router.query.componentName === "World Cocoa Production" ? (
            currentUserDontHavePrivilege([
              "BCS Global World Cocoa Production:Read",
            ]) ? null : (
              <WorldCocoaProduction
                currentUserDontHavePrivilege={currentUserDontHavePrivilege}
              />
            )
          ) : router.query.componentName === "Price Reuters" ? (
            currentUserDontHavePrivilege(["BCS Global Reuters Price:Read"]) ? (
              <ReuterPrice
                currentUserDontHavePrivilege={currentUserDontHavePrivilege}
              />
            ) : (
              <ReuterPrice
                currentUserDontHavePrivilege={currentUserDontHavePrivilege}
              />
            )
          ) : router.query.componentName === "Country Profile" ? (
            currentUserDontHavePrivilege([
              "BCS Global Country Profile:Read",
            ]) ? null : (
              <CountryProfile
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
export default withApollo({ ssr: true })(Global);
