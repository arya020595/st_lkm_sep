import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import appConfig from "../../app.json";
import { withApollo } from "../../libs/apollo";
import { useRouter } from "next/router";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import FutureMarket from "../../components/GlobalPriceRevinitiv/FutureMarket";
import FutureReport from "../../components/GlobalPriceRevinitiv/FutureReport";
import ICCOReport from "../../components/GlobalPriceRevinitiv/ICCOReport";
import { DropDownMenu } from "../../components/DropDownMenu";

const Global = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Prices | Global</title>
      </Head>

      <div className="mt-26">
        <div className="pr-0 md:pr-10 py-4 bg-white h-full">
          <DropDownMenu componentName={router.query.componentName}>
            <div
              className={`${
                router.query.componentName === "Future Market"
                  ? "bg-mantis-200 text-black font-bold"
                  : "bg-white text-black border border-gray-300"
              } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
              
              ${
                currentUserDontHavePrivilege([
                  "Global Price Future Market:Read",
                ])
                  ? "hidden"
                  : "block"
              }
              
              `}
              onClick={e => {
                if (e) e.preventDefault();
                router.replace({
                  pathname: router.pathname,
                  query: {
                    ...router.query,
                    componentName: "Future Market",
                  },
                });
              }}>
              <p className="text-lg font-semibold">Future Market</p>
            </div>
            <div
              className={`${
                router.query.componentName === "Future Price Report"
                  ? "bg-mantis-200 text-black font-bold"
                  : "bg-white text-black border border-gray-300"
              } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
              
              ${
                currentUserDontHavePrivilege(["Future Price Report:Read"])
                  ? "hidden"
                  : "block"
              }
              `}
              onClick={e => {
                if (e) e.preventDefault();
                router.replace({
                  pathname: router.pathname,
                  query: {
                    ...router.query,
                    componentName: "Future Price Report",
                  },
                });
              }}>
              <p className="text-lg font-semibold">Future Price Report</p>
            </div>

            <div
              className={`${
                router.query.componentName === "ICCO Report"
                  ? "bg-mantis-200 text-black font-bold"
                  : "bg-white text-black border border-gray-300"
              } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
              
              ${
                currentUserDontHavePrivilege([
                  "ICCO Price Report Revinitiv:Read",
                ])
                  ? "hidden"
                  : "block"
              }
              `}
              onClick={e => {
                if (e) e.preventDefault();
                router.replace({
                  pathname: router.pathname,
                  query: {
                    ...router.query,
                    componentName: "ICCO Report",
                  },
                });
              }}>
              <p className="text-lg font-semibold">ICCO Report</p>
            </div>
          </DropDownMenu>

          {router.query.componentName === "Future Market" ? (
            currentUserDontHavePrivilege([
              "Global Price Future Market:Read",
            ]) ? null : (
              <FutureMarket
                currentUserDontHavePrivilege={currentUserDontHavePrivilege}
              />
            )
          ) : router.query.componentName === "Future Price Report" ? (
            currentUserDontHavePrivilege([
              "Future Price Report:Read",
            ]) ? null : (
              <FutureReport
                currentUserDontHavePrivilege={currentUserDontHavePrivilege}
              />
            )
          ) : router.query.componentName === "ICCO Report" ? (
            currentUserDontHavePrivilege([
              "ICCO Price Report Revinitiv:Read",
            ]) ? null : (
              <ICCOReport
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
export default withApollo({ ssr: true })(Global);
