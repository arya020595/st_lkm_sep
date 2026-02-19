import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { withApollo } from "../../libs/apollo";
import ConsumingCountryProfile from "./ConsumingCountryProfile";
import ProducingCountryProfile from "./ProducingCountryProfile";
const CountryProfile = ({ currentUserDontHavePrivilege }) => {
  const [countryType, setCountryType] = useState("consuming");
  return (
    <div className="my-5">
      <div className="flex">
        <button
          className={`${
            countryType === "consuming" ? "bg-mantis-200" : "bg-white"
          } shadow-md px-4 py-2 border border-mantis-500 rounded-md mx-4 font-bold`}
          onClick={e => {
            if (e) e.preventDefault();
            setCountryType("consuming");
          }}>
          Consuming Country
        </button>
        <button
          className={`${
            countryType === "producing" ? "bg-mantis-200" : "bg-white"
          } shadow-md px-4 py-2 border border-mantis-500 rounded-md font-bold`}
          onClick={e => {
            if (e) e.preventDefault();
            setCountryType("producing");
          }}>
          Producing Country
        </button>
      </div>

      {countryType === "consuming" ? (
        <ConsumingCountryProfile
          currentUserDontHavePrivilege={currentUserDontHavePrivilege}
        />
      ) : (
        <ProducingCountryProfile
          currentUserDontHavePrivilege={currentUserDontHavePrivilege}
        />
      )}
    </div>
  );
};
export default withApollo({ ssr: true })(CountryProfile);
