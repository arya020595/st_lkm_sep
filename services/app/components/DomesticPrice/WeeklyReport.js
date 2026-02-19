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
import WeeklySummaryReport from "./WeeklySummaryReport";
import WeeklyAverageReport from "./WeeklyAverageReport";
import WeeklyCocoaReport from "./WeeklyCocoaReport";
import dayjs from "dayjs";

const WeeklyReport = () => {
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
          <WeeklySummaryReport
            startDate={dayjs().format("YYYY-MM-DD")}
            endDate={dayjs().format("YYYY-MM-DD")}
          />
        </TabPanel>
        <TabPanel>
          <WeeklyAverageReport
            startDate={dayjs().format("YYYY-MM-DD")}
            endDate={dayjs().format("YYYY-MM-DD")}
          />
        </TabPanel>
        <TabPanel>
          <WeeklyCocoaReport
            startDate={dayjs().format("YYYY-MM-DD")}
            endDate={dayjs().format("YYYY-MM-DD")}
          />
        </TabPanel>
      </Tabs>
    </div>
  );
};
export default withApollo({ ssr: true })(WeeklyReport);
