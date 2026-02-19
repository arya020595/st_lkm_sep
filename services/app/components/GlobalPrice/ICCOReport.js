import React, { useState, useEffect, useMemo } from "react";
import { withApollo } from "../../libs/apollo";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
// import ICCODailyPriceReport from "./ICCODailyPriceReport";
// import ICCOMonthlyPriceReport from "./ICCOMonthlyPriceReport";
// import ICCOYearlyPriceReport from "./ICCOYearlyPriceReport";
import ICCOCocoaBeanPriceOfInternationalSignificanceReport from "./ICCOCocoaBeanPriceOfInternationalSignificanceReport";
import ICCOCocoaBeanMonthlyAverageAndHighLowReport from "./ICCOCocoaBeanMonthlyAverageAndHighLowReport";
import ICCOCocoaBeanMonthlyandAnnualAverageReport from "./ICCOCocoaBeanMonthlyandAnnualAverageReport";
import ICCODailyPriceOfCocoaBeansReport from "./ICCODailyPriceOfCocoaBeansReport";
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
          {/* <Tab>
            <p className="text-md font-semibold">Daily Price</p>
          </Tab>
          <Tab>
            <p className="text-md font-semibold">Monthly Price</p>
          </Tab>
          <Tab>
            <p className="text-md font-semibold">Yearly Price</p>
          </Tab> */}
          <Tab>
            <p className="text-md font-semibold">
              Cocoa Bean Price of International Significance
            </p>
          </Tab>
          <Tab>
            <p className="text-md font-semibold">
              Monthly Average and High/Low
              {/* (ICCO) */}
            </p>
          </Tab>
          <Tab>
            <p className="text-md font-semibold">
              Monthly and Annual Average
              {/* (ICCO) */}
            </p>
          </Tab>
          <Tab>
            <p className="text-md font-semibold">
              Daily Price Of Cocoa Beans Report
              {/* (ICCO) */}
            </p>
          </Tab>
        </TabList>
        {/* <TabPanel>
          <ICCODailyPriceReport
            startDate={dayjs().format("YYYY-MM-DD")}
            endDate={dayjs().format("YYYY-MM-DD")}
          />
        </TabPanel>
        <TabPanel>
          <ICCOMonthlyPriceReport
            startDate={dayjs().format("YYYY-MM-DD")}
            endDate={dayjs().format("YYYY-MM-DD")}
          />
        </TabPanel>
        <TabPanel>
          <ICCOYearlyPriceReport
            startDate={dayjs().format("YYYY-MM-DD")}
            endDate={dayjs().format("YYYY-MM-DD")}
          />
        </TabPanel> */}
        <TabPanel>
          <ICCOCocoaBeanPriceOfInternationalSignificanceReport
            startDate={dayjs().format("YYYY-MM-DD")}
            endDate={dayjs().format("YYYY-MM-DD")}
          />
        </TabPanel>
        <TabPanel>
          <ICCOCocoaBeanMonthlyAverageAndHighLowReport
            startDate={dayjs().format("YYYY-MM-DD")}
            endDate={dayjs().format("YYYY-MM-DD")}
          />
        </TabPanel>
        <TabPanel>
          <ICCOCocoaBeanMonthlyandAnnualAverageReport
            startDate={dayjs().format("YYYY-MM-DD")}
            endDate={dayjs().format("YYYY-MM-DD")}
          />
        </TabPanel>
        <TabPanel>
          <ICCODailyPriceOfCocoaBeansReport
            startDate={dayjs().format("YYYY-MM-DD")}
            endDate={dayjs().format("YYYY-MM-DD")}
          />
        </TabPanel>
      </Tabs>
    </div>
  );
};
export default withApollo({ ssr: true })(MonthlyReport);
