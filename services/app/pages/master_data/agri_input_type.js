import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { withApollo } from "../../libs/apollo";
import { useRouter } from "next/router";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import AgriInputType from "../../components/MasterDataAgriInput/AgriInputType";
import ProductType from "../../components/MasterDataAgriInput/ProductType";
import { DropDownMenu } from "../../components/DropDownMenu";

const AgriInputTypePage = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  return (
    <AdminArea urlQuery={router.query}>
      <div className="mt-26">
        <div className=" pr-0 md:pr-10 py-4 bg-white h-full">
          <DropDownMenu componentName={router.query.componentName}>
            {currentUserDontHavePrivilege(["Agri Input Type:Read"]) ? null : (
              <div
                className={`${
                  router.query.componentName === "Agri Input Type"
                    ? "bg-mantis-200 text-black font-bold"
                    : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
                onClick={e => {
                  if (e) e.preventDefault();
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      componentName: "Agri Input Type",
                    },
                  });
                }}>
                <p className="text-lg font-semibold">Agri Input Type</p>
              </div>
            )}
            {currentUserDontHavePrivilege([
              "Agri Input Product Type:Read",
            ]) ? null : (
              <div
                className={`${
                  router.query.componentName === "Product Type"
                    ? "bg-mantis-200 text-black font-bold"
                    : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
                onClick={e => {
                  if (e) e.preventDefault();
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      componentName: "Product Type",
                    },
                  });
                }}>
                <p className="text-lg font-semibold">Product Type</p>
              </div>
            )}
          </DropDownMenu>

          {router.query.componentName === "Agri Input Type" ? (
            currentUserDontHavePrivilege(["Agri Input Type:Read"]) ? null : (
              <AgriInputType
                currentUserDontHavePrivilege={currentUserDontHavePrivilege}
              />
            )
          ) : router.query.componentName === "Product Type" ? (
            currentUserDontHavePrivilege(["Agri Input Type:Read"]) ? null : (
              <ProductType
                currentUserDontHavePrivilege={currentUserDontHavePrivilege}
              />
            )
          ) : (
            <div />
          )}
        </div>
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(AgriInputTypePage);
