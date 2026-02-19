import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { withApollo } from "../../libs/apollo";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import dayjs from "dayjs";

import DomesticTradeExportImportReport from "./DomesticTradeExportImportReport";
import DomesticTradeExportDestinationSourceReport from "./DomesticTradeExportDestinationSourceReport";
import DomesticTradeContributionOfExportByRegionReport from "./DomesticTradeContributionOfExportByRegionReport";
import DomesticTradeCocoaBeansExportReport from "./DomesticTradeCocoaBeansExportReport";
import DomesticTradeExportImportSelectedCountryReport from "./DomesticTradeExportImportSelectedCountryReport";

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
      <Tabs
        selectedIndex={tabIndex}
        onSelect={index => {
          setTabIndex(index);
        }}>
        <TabList>
          <Tab>
            <p className="text-md font-semibold">Export/Import</p>
          </Tab>
          <Tab>
            <p className="text-md font-semibold">Export Destinations/Source</p>
          </Tab>
          <Tab>
            <p className="text-md font-semibold">
              Contribution of Export by Region
            </p>
          </Tab>
          <Tab>
            <p className="text-md font-semibold">
              Malaysian Cocoa Beans Export
            </p>
          </Tab>
          <Tab>
            <p className="text-md font-semibold">
              Export/Import From Selected Country
            </p>
          </Tab>
        </TabList>
        <TabPanel>
          <DomesticTradeExportImportReport
            year={parseInt(dayjs().format("YYYY"))}
            years={YEARS}
          />
        </TabPanel>
        <TabPanel>
          <DomesticTradeExportDestinationSourceReport
            year={parseInt(dayjs().format("YYYY"))}
            years={YEARS}
          />
        </TabPanel>
        <TabPanel>
          <DomesticTradeContributionOfExportByRegionReport
            year={parseInt(dayjs().format("YYYY"))}
            years={YEARS}
          />
        </TabPanel>
        <TabPanel>
          <DomesticTradeCocoaBeansExportReport
            year={parseInt(dayjs().format("YYYY"))}
            years={YEARS}
          />
        </TabPanel>
        <TabPanel>
          <DomesticTradeExportImportSelectedCountryReport
            year={parseInt(dayjs().format("YYYY"))}
            years={YEARS}
          />
        </TabPanel>
      </Tabs>
    </div>
  );
};
export default withApollo({ ssr: true })(YearlyReport);
