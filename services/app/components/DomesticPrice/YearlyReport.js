import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { withApollo } from "../../libs/apollo";
import {
  showLoadingSpinner,
  hideLoadingSpinner,
  useNotification,
} from "../App";
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
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import dayjs from "dayjs";

import YearlySummaryReport from "./YearlySummaryReport";
import YearlyAverageReport from "./YearlyAverageReport";
import YearlyCocoaReport from "./YearlyCocoaReport";
import YearlyAverageCentreReport from "./YearlyAverageCentreReport";

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
            <p className="text-md font-semibold">Summary</p>
          </Tab>
          <Tab>
            <p className="text-md font-semibold">Average</p>
          </Tab>
          <Tab>
            <p className="text-md font-semibold">Cocoa</p>
          </Tab>
          <Tab>
            <p className="text-md font-semibold">Average (Centre)</p>
          </Tab>
        </TabList>
        <TabPanel>
          <YearlySummaryReport
            year={parseInt(dayjs().format("YYYY"))}
            years={YEARS}
          />
        </TabPanel>
        <TabPanel>
          <YearlyAverageReport
            year={parseInt(dayjs().format("YYYY"))}
            years={YEARS}
          />
        </TabPanel>
        <TabPanel>
          <YearlyCocoaReport
            year={parseInt(dayjs().format("YYYY"))}
            years={YEARS}
          />
        </TabPanel>
        <TabPanel>
          <YearlyAverageCentreReport
            year={parseInt(dayjs().format("YYYY"))}
            years={YEARS}
          />
        </TabPanel>
      </Tabs>
    </div>
  );
};
export default withApollo({ ssr: true })(YearlyReport);
