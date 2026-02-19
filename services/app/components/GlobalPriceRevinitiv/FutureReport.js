import React, { useState, useEffect, useMemo } from "react";
import { withApollo } from "../../libs/apollo";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import FutureDailyPriceLondonReport from "../GlobalPrice/FutureDailyPriceLondonReport";
import FutureMonthlyPriceLondonReport from "../GlobalPrice/FutureMonthlyPriceLondonReport";
import FutureYearlyPriceLondonReport from "../GlobalPrice/FutureYearlyPriceLondonReport";
import FutureDailyPriceNewYorkReport from "../GlobalPrice/FutureDailyPriceNewYorkReport";
import FutureMonthlyPriceNewYorkReport from "../GlobalPrice/FutureMonthlyPriceNewYorkReport";
import FutureYearlyPriceNewYorkReport from "../GlobalPrice/FutureYearlyPriceNewYorkReport";
import FutureDailyPriceGhanaReport from "../GlobalPrice/FutureDailyPriceGhanaReport";
import FutureMonthlyPriceGhanaReport from "../GlobalPrice/FutureMonthlyPriceGhanaReport";
import FutureYearlyPriceGhanaReport from "../GlobalPrice/FutureYearlyPriceGhanaReport";
import dayjs from "dayjs";

const MonthlyReport = () => {
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
            <p className="text-md font-semibold">
              Daily International Cocoa Price - London
            </p>
          </Tab>
          <Tab>
            <p className="text-md font-semibold">
              Monthly International Cocoa Price - London
            </p>
          </Tab>
          <Tab>
            <p className="text-md font-semibold">
              Yearly International Cocoa Price - London
            </p>
          </Tab>
          <Tab>
            <p className="text-md font-semibold">
              Daily International Cocoa Price - New York
            </p>
          </Tab>
          <Tab>
            <p className="text-md font-semibold">
              Monthly International Cocoa Price - New York
            </p>
          </Tab>
          <Tab>
            <p className="text-md font-semibold">
              Yearly International Cocoa Price - New York
            </p>
          </Tab>
          <Tab>
            <p className="text-md font-semibold">
              Daily International Cocoa Price - Ghana
            </p>
          </Tab>
          <Tab>
            <p className="text-md font-semibold">
              Monthly International Cocoa Price - Ghana
            </p>
          </Tab>
          <Tab>
            <p className="text-md font-semibold">
              Yearly International Cocoa Price - Ghana
            </p>
          </Tab>
        </TabList>
        <TabPanel>
          <FutureDailyPriceLondonReport
            startDate={dayjs().format("YYYY-MM-DD")}
            endDate={dayjs().format("YYYY-MM-DD")}
          />
        </TabPanel>
        <TabPanel>
          <FutureMonthlyPriceLondonReport
            startDate={dayjs().format("YYYY-MM-DD")}
            endDate={dayjs().format("YYYY-MM-DD")}
          />
        </TabPanel>
        <TabPanel>
          <FutureYearlyPriceLondonReport
            startDate={dayjs().format("YYYY-MM-DD")}
            endDate={dayjs().format("YYYY-MM-DD")}
          />
        </TabPanel>
        <TabPanel>
          <FutureDailyPriceNewYorkReport
            startDate={dayjs().format("YYYY-MM-DD")}
            endDate={dayjs().format("YYYY-MM-DD")}
          />
        </TabPanel>
        <TabPanel>
          <FutureMonthlyPriceNewYorkReport
            startDate={dayjs().format("YYYY-MM-DD")}
            endDate={dayjs().format("YYYY-MM-DD")}
          />
        </TabPanel>
        <TabPanel>
          <FutureYearlyPriceNewYorkReport
            startDate={dayjs().format("YYYY-MM-DD")}
            endDate={dayjs().format("YYYY-MM-DD")}
          />
        </TabPanel>
        <TabPanel>
          <FutureDailyPriceGhanaReport
            startDate={dayjs().format("YYYY-MM-DD")}
            endDate={dayjs().format("YYYY-MM-DD")}
          />
        </TabPanel>
        <TabPanel>
          <FutureMonthlyPriceGhanaReport
            startDate={dayjs().format("YYYY-MM-DD")}
            endDate={dayjs().format("YYYY-MM-DD")}
          />
        </TabPanel>
        <TabPanel>
          <FutureYearlyPriceGhanaReport
            startDate={dayjs().format("YYYY-MM-DD")}
            endDate={dayjs().format("YYYY-MM-DD")}
          />
        </TabPanel>
      </Tabs>
    </div>
  );
};
export default withApollo({ ssr: true })(MonthlyReport);
