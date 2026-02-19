import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import appConfig from "../../app.json";
import { withApollo } from "../../libs/apollo";
import { useRouter } from "next/router";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import FutureMarket from "../../components/GlobalPriceRevinitiv/FutureMarket";
import ICCOPrices from "../../components/GlobalPrice/ICCOPrices";
import FuturePrice from "../../components/GlobalPrice/FuturePrice";
import ICCOReport from "../../components/GlobalPrice/ICCOReport";
import FutureReport from "../../components/GlobalPriceRevinitiv/FutureReport";

import InternationalSignificance from "../../components/GlobalPrice/InternationalSignificance";
import MonthlyAnnualAverageICCO from "../../components/GlobalPrice/MonthlyAnnualAverageICCO";
import MonthlyAnnualAverageHighLowICCO from "../../components/GlobalPrice/MonthlyAnnualAverageHighLowICCO";
import dayjs from "dayjs";
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
            {/* <div
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
            </div> */}
            <div
              className={`${
                router.query.componentName === "ICCO Price"
                  ? "bg-mantis-200 text-black font-bold"
                  : "bg-white text-black border border-gray-300"
              } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
              
              ${
                currentUserDontHavePrivilege(["Global Price ICCO Price:Read"])
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
                    componentName: "ICCO Price",
                    date: dayjs().format("YYYY-MM-DD"),
                  },
                });
              }}>
              <p className="text-lg font-semibold">ICCO Price</p>
            </div>

            <div
              className={`${
                router.query.componentName === "Future Price"
                  ? "bg-mantis-200 text-black font-bold"
                  : "bg-white text-black border border-gray-300"
              } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
              
              ${
                currentUserDontHavePrivilege(["Global Price Future Price:Read"])
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
                    componentName: "Future Price",
                    date: dayjs().format("YYYY-MM-DD"),
                  },
                });
              }}>
              <p className="text-lg font-semibold">Future Price</p>
            </div>

            <div
              className={`${
                router.query.componentName === "Monthly Annual Average ICCO"
                  ? "bg-mantis-200 text-black font-bold"
                  : "bg-white text-black border border-gray-300"
              } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
              
              ${
                currentUserDontHavePrivilege([
                  "Global Price ICCO Buletin Monthly Annual Average:Read",
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
                    componentName: "Monthly Annual Average ICCO",
                  },
                });
              }}>
              <p className="text-lg font-semibold">
                Monthly Annual Average ICCO
              </p>
            </div>
            <div
              className={`${
                router.query.componentName === "Monthly Average High Low ICCO"
                  ? "bg-mantis-200 text-black font-bold"
                  : "bg-white text-black border border-gray-300"
              } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
              
              ${
                currentUserDontHavePrivilege([
                  "Global Price ICCO Buletin Monthly Average High Low:Read",
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
                    componentName: "Monthly Average High Low ICCO",
                  },
                });
              }}>
              <p className="text-lg font-semibold">
                Monthly Average & High/Low ICCO
              </p>
            </div>

            <div
              className={`${
                router.query.componentName === "International Significance"
                  ? "bg-mantis-200 text-black font-bold"
                  : "bg-white text-black border border-gray-300"
              } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
              
              ${
                currentUserDontHavePrivilege([
                  "Global Price ICCO Buletin International Significance:Read",
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
                    componentName: "International Significance",
                  },
                });
              }}>
              <p className="text-lg font-semibold">
                International Significance
              </p>
            </div>
            <div
              className={`${
                router.query.componentName === "ICCO Price Report"
                  ? "bg-mantis-200 text-black font-bold"
                  : "bg-white text-black border border-gray-300"
              } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
              
              ${
                currentUserDontHavePrivilege(["ICCO Price Report:Read"])
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
                    componentName: "ICCO Price Report",
                    date: dayjs().format("YYYY-MM-DD"),
                  },
                });
              }}>
              <p className="text-lg font-semibold">ICCO Price Report</p>
            </div>
            {/* 

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
                    date: dayjs().format("YYYY-MM-DD"),
                  },
                });
              }}>
              <p className="text-lg font-semibold">Future Price Report</p>
            </div> */}
          </DropDownMenu>

          {
            // router.query.componentName === "Future Market" ? (
            //   currentUserDontHavePrivilege([
            //     "Global Price Future Market:Read",
            //   ]) ? null : (
            //     <FutureMarket
            //       currentUserDontHavePrivilege={currentUserDontHavePrivilege}
            //     />
            //   )
            // ) :

            router.query.componentName === "ICCO Price" ? (
              currentUserDontHavePrivilege([
                "Global Price ICCO Price:Read",
              ]) ? null : (
                <ICCOPrices
                  currentUserDontHavePrivilege={currentUserDontHavePrivilege}
                />
              )
            ) : router.query.componentName === "Future Price" ? (
              currentUserDontHavePrivilege([
                "Global Price Future Price:Read",
              ]) ? null : (
                <FuturePrice
                  currentUserDontHavePrivilege={currentUserDontHavePrivilege}
                />
              )
            ) : router.query.componentName === "Monthly Annual Average ICCO" ? (
              currentUserDontHavePrivilege([
                "Global Price ICCO Buletin Monthly Annual Average:Read",
              ]) ? null : (
                <MonthlyAnnualAverageICCO
                  currentUserDontHavePrivilege={currentUserDontHavePrivilege}
                />
              )
            ) : router.query.componentName ===
              "Monthly Average High Low ICCO" ? (
              currentUserDontHavePrivilege([
                "Global Price ICCO Buletin Monthly Average High Low:Read",
              ]) ? null : (
                <MonthlyAnnualAverageHighLowICCO
                  currentUserDontHavePrivilege={currentUserDontHavePrivilege}
                />
              )
            ) : router.query.componentName === "International Significance" ? (
              currentUserDontHavePrivilege([
                "Global Price ICCO Buletin International Significance:Read",
              ]) ? null : (
                <InternationalSignificance
                  currentUserDontHavePrivilege={currentUserDontHavePrivilege}
                />
              )
            ) : router.query.componentName === "ICCO Price Report" ? (
              currentUserDontHavePrivilege([
                "ICCO Price Report:Read",
              ]) ? null : (
                <ICCOReport
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
            ) : (
              <div />
            )
          }
        </div>
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Global);
