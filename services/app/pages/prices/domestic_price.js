import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import appConfig from "../../app.json";
import { withApollo } from "../../libs/apollo";
import { useRouter } from "next/router";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import PPEInput from "../../components/DomesticPrice/PPEInput";
import PKKInput from "../../components/DomesticPrice/PKKInput";
import DailyReport from "../../components/DomesticPrice/DailyReport";
import WeeklyReport from "../../components/DomesticPrice/WeeklyReport";
import MonthlyReport from "../../components/DomesticPrice/MonthlyReport";
import QuarterlyReport from "../../components/DomesticPrice/QuarterlyReport";
import YearlyReport from "../../components/DomesticPrice/YearlyReport";
import dayjs from "dayjs";
import { DropDownMenu } from "../../components/DropDownMenu";

const Domestic = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Prices | Domestic</title>
      </Head>

      <div className="mt-26">
        <div className="pr-0 md:pr-10 py-4 bg-white h-full">
          <DropDownMenu componentName={router.query.componentName}>
            <div
              className={`${router.query.componentName === "Input For PPE"
                  ? "bg-mantis-200 text-black font-bold"
                  : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
              ${currentUserDontHavePrivilege(["Input For PPE:Read"])
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
                    componentName: "Input For PPE",
                    date: dayjs().format("YYYY-MM-DD")
                  },
                });
              }}>
              <p className="text-lg font-semibold">Input For PPE</p>
            </div>
            <div
              className={`${router.query.componentName === "Input From PKK"
                  ? "bg-mantis-200 text-black font-bold"
                  : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
              
              ${currentUserDontHavePrivilege(["Input From PKK:Read"])
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
                    componentName: "Input From PKK",
                    date: dayjs().format("YYYY-MM-DD"),
                  },
                });
              }}>
              <p className="text-lg font-semibold">Input From PKK</p>
            </div>
            <div
              className={`${router.query.componentName === "Daily Report"
                  ? "bg-mantis-200 text-black font-bold"
                  : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
              
              ${currentUserDontHavePrivilege([
                  "Domestic Price Daily Report:Read",
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
                    componentName: "Daily Report",
                  },
                });
              }}>
              <p className="text-lg font-semibold">Daily Report</p>
            </div>
            <div
              className={`${router.query.componentName === "Weekly Report"
                  ? "bg-mantis-200 text-black font-bold"
                  : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
              
              ${currentUserDontHavePrivilege([
                  "Domestic Price Weekly Report:Read",
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
                    componentName: "Weekly Report",
                  },
                });
              }}>
              <p className="text-lg font-semibold">Weekly Report</p>
            </div>
            <div
              className={`${router.query.componentName === "Monthly Report"
                  ? "bg-mantis-200 text-black font-bold"
                  : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
              
              ${currentUserDontHavePrivilege([
                  "Domestic Price Monthly Report:Read",
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
                    componentName: "Monthly Report",
                  },
                });
              }}>
              <p className="text-lg font-semibold">Monthly Report</p>
            </div>
            <div
              className={`${router.query.componentName === "Quarterly Report"
                  ? "bg-mantis-200 text-black font-bold"
                  : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
              
              ${currentUserDontHavePrivilege([
                  "Domestic Price Quarterly Report:Read",
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
                    componentName: "Quarterly Report",
                  },
                });
              }}>
              <p className="text-lg font-semibold">Quarterly Report</p>
            </div>
            <div
              className={`${router.query.componentName === "Yearly Report"
                  ? "bg-mantis-200 text-black font-bold"
                  : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
              
              ${currentUserDontHavePrivilege([
                  "Domestic Price Monthly Report:Read",
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
                    componentName: "Yearly Report",
                  },
                });
              }}>
              <p className="text-lg font-semibold">Yearly Report</p>
            </div>
          </DropDownMenu>

          {router.query.componentName === "Input For PPE" ? (
            currentUserDontHavePrivilege(["Input For PPE:Read"]) ? null : (
              <PPEInput
                currentUserDontHavePrivilege={currentUserDontHavePrivilege}
              />
            )
          ) : router.query.componentName === "Input From PKK" ? (
            currentUserDontHavePrivilege(["Input From PKK:Read"]) ? null : (
              <PKKInput
                currentUserDontHavePrivilege={currentUserDontHavePrivilege}
              />
            )
          ) : router.query.componentName === "Daily Report" ? (
            currentUserDontHavePrivilege([
              "Domestic Price Daily Report:Read",
            ]) ? null : (
              <DailyReport />
            )
          ) : router.query.componentName === "Weekly Report" ? (
            currentUserDontHavePrivilege([
              "Domestic Price Weekly Report:Read",
            ]) ? null : (
              <WeeklyReport />
            )
          ) : router.query.componentName === "Monthly Report" ? (
            currentUserDontHavePrivilege([
              "Domestic Price Monthly Report:Read",
            ]) ? null : (
              <MonthlyReport />
            )
          ) : router.query.componentName === "Quarterly Report" ? (
            currentUserDontHavePrivilege([
              "Domestic Price Quarterly Report:Read",
            ]) ? null : (
              <QuarterlyReport />
            )
          ) : router.query.componentName === "Yearly Report" ? (
            currentUserDontHavePrivilege([
              "Domestic Price Yearly Report:Read",
            ]) ? null : (
              <YearlyReport />
            )
          ) : null}
        </div>
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Domestic);
