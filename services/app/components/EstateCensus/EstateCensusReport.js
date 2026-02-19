import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { withApollo } from "../../libs/apollo";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import dayjs from "dayjs";

import EstateCensusReportLuasKawasanKoko from "./EstateCensusReportLuasKawasanKoko";

const YearlyReport = () => {
  const [tabIndex, setTabIndex] = useState(0);

  const YEARS = useMemo(() => {
    const toYear = parseInt(dayjs().get("year"));
    const fromYear = 1940;
    // console.log([...new Array(toYear - fromYear)])
    return [...new Array(toYear - fromYear)].map((_, index) => {
      // console.log(index, toYear, toYear - index)
      return String(toYear - index);
    });
  }, []);

  return (
    <div className="mt-2 md:mt-10">
      {/* <Tabs
        selectedIndex={tabIndex}
        onSelect={index => {
          setTabIndex(index);
        }}>
        <TabList>
          <Tab>
            <p className="text-md font-semibold">Report</p>
          </Tab>
        </TabList>
        <TabPanel>
          <EstateCensusReportLuasKawasanKoko
            year={parseInt(dayjs().format("YYYY"))}
            years={YEARS}
          />
        </TabPanel>
      </Tabs> */}

      <EstateCensusReportLuasKawasanKoko
        year={parseInt(dayjs().format("YYYY"))}
        years={YEARS}
      />
    </div>
  );
};
export default withApollo({ ssr: true })(YearlyReport);
