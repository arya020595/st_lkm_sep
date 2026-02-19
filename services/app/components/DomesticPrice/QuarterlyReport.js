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
import QuarterlySummaryReport from "./QuarterlySummaryReport";
import QuarterlyAverageReport from "./QuarterlyAverageReport";
import QuarterlyCocoaReport from "./QuarterlyCocoaReport";
import dayjs from "dayjs";

const QuarterlyReport = () => {
  const [tabIndex, setTabIndex] = useState(0);
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
        </TabList>
        <TabPanel>
          <QuarterlySummaryReport
            startDate={dayjs().format("YYYY-MM-DD")}
            endDate={dayjs().format("YYYY-MM-DD")}
          />
        </TabPanel>
        <TabPanel>
          <QuarterlyAverageReport
            startDate={dayjs().format("YYYY-MM-DD")}
            endDate={dayjs().format("YYYY-MM-DD")}
          />
        </TabPanel>
        <TabPanel>
          <QuarterlyCocoaReport
            startDate={dayjs().format("YYYY-MM-DD")}
            endDate={dayjs().format("YYYY-MM-DD")}
          />
        </TabPanel>
      </Tabs>
    </div>
  );
};
export default withApollo({ ssr: true })(QuarterlyReport);
