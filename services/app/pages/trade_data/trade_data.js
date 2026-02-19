import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import appConfig from "../../app.json";
import { withApollo } from "../../libs/apollo";
import { useRouter } from "next/router";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import DomesticTradeData from "../../components/TradeData/DomesticTradeData";
import GlobalTradeData from "../../components/TradeData/GlobalTradeData";
import DomesticTradeReport from "../../components/TradeData/DomesticTradeReport";
import GlobalTradeReport from "../../components/TradeData/GlobalTradeReport";
import dayjs from "dayjs";
import { DropDownMenu } from "../../components/DropDownMenu";

const TradeData = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const YEARS = useMemo(() => {
    const toYear = parseInt(dayjs().get("year"));
    const fromYear = 1980;
    // console.log([...new Array(toYear - fromYear)])

    let result = [...new Array(toYear - fromYear)].map((_, index) => {
      // console.log(index, toYear, toYear - index)
      return String(toYear - index);
    });

    result = result.map(t => {
      const current = parseInt(t);
      let next = String(current + 1);
      next = next.slice(2, 4);
      return `${current}/${next}`;
    });
    return result;
  }, []);

  const [tradeDataType, setTradeDataType] = useState("DOMESTIC");
  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>TradeData</title>
      </Head>

      <div className="mt-26">
        <div className="pr-0 md:pr-10 py-4 bg-white h-full">
          <DropDownMenu componentName={tradeDataType}>
            {currentUserDontHavePrivilege(["Domestic Trade:Read"]) ? null : (
              <div
                className={`${
                  tradeDataType === "DOMESTIC"
                    ? "bg-mantis-200 text-black font-bold"
                    : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
                onClick={e => {
                  if (e) e.preventDefault();
                  setTradeDataType("DOMESTIC");
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      years: dayjs().format("YYYY"),
                    },
                  });
                }}>
                <p className="text-lg font-semibold">Domestic Trade</p>
              </div>
            )}

            {currentUserDontHavePrivilege(["Global Trade:Read"]) ? null : (
              <div
                className={`${
                  tradeDataType === "GLOBAL"
                    ? "bg-mantis-200 text-black font-bold"
                    : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
                onClick={e => {
                  if (e) e.preventDefault();
                  setTradeDataType("GLOBAL");
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      years: YEARS[0],
                    },
                  });
                }}>
                <p className="text-lg font-semibold">Global Trade</p>
              </div>
            )}

            {currentUserDontHavePrivilege([
              "Global Trade Domestic Report:Read",
            ]) ? null : (
              <div
                className={`${
                  tradeDataType === "DOMESTIC REPORT"
                    ? "bg-mantis-200 text-black font-bold"
                    : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
                onClick={e => {
                  if (e) e.preventDefault();
                  setTradeDataType("DOMESTIC REPORT");
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      years: YEARS[0],
                    },
                  });
                }}>
                <p className="text-lg font-semibold">Domestic Report</p>
              </div>
            )}

            {currentUserDontHavePrivilege([
              "Global Trade Global Report:Read",
            ]) ? null : (
              <div
                className={`${
                  tradeDataType === "GLOBAL REPORT"
                    ? "bg-mantis-200 text-black font-bold"
                    : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
                onClick={e => {
                  if (e) e.preventDefault();
                  setTradeDataType("GLOBAL REPORT");
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      years: YEARS[0],
                    },
                  });
                }}>
                <p className="text-lg font-semibold">Global Report</p>
              </div>
            )}
          </DropDownMenu>
        </div>

        {tradeDataType === "DOMESTIC" ? (
          <DomesticTradeData
            currentUserDontHavePrivilege={currentUserDontHavePrivilege}
          />
        ) : tradeDataType === "GLOBAL" ? (
          <GlobalTradeData
            currentUserDontHavePrivilege={currentUserDontHavePrivilege}
          />
        ) : tradeDataType === "DOMESTIC REPORT" ? (
          <DomesticTradeReport
            currentUserDontHavePrivilege={currentUserDontHavePrivilege}
          />
        ) : tradeDataType === "GLOBAL REPORT" ? (
          <GlobalTradeReport
            currentUserDontHavePrivilege={currentUserDontHavePrivilege}
          />
        ) : null}
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(TradeData);
