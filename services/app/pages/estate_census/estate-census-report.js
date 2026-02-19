import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import appConfig from "../../app.json";
import { withApollo } from "../../libs/apollo";
import { useRouter } from "next/router";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import EstateCensusReport from "../../components/EstateCensus/EstateCensusReport";
import dayjs from "dayjs";
import { DropDownMenu } from "../../components/DropDownMenu";

const EstateCensus = () => {
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

  const [estateCensusReportType, setEstateCensusReportType] =
    useState("DOMESTIC REPORT");
  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Estate Census Report</title>
      </Head>

      <div className="mt-26">
        {/* <div className="pr-0 md:pr-10 py-4 bg-white h-full">
          <DropDownMenu componentName={estateCensusReportType}>
            {currentUserDontHavePrivilege([
              "Global Trade Domestic Report:Read",
            ]) ? null : (
              <div
                className={`${
                  estateCensusReportType === "DOMESTIC REPORT"
                    ? "bg-mantis-200 text-black font-bold"
                    : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
                onClick={e => {
                  if (e) e.preventDefault();
                  setEstateCensusReportType("DOMESTIC REPORT");
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      years: YEARS[0],
                    },
                  });
                }}>
                <p className="text-lg font-semibold">Report</p>
              </div>
            )}
          </DropDownMenu>
        </div> */}

        {estateCensusReportType === "DOMESTIC REPORT" ? (
          <EstateCensusReport
            currentUserDontHavePrivilege={currentUserDontHavePrivilege}
          />
        ) : null}
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(EstateCensus);
