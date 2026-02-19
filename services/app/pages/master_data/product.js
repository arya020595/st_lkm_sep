import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { withApollo } from "../../libs/apollo";
import { useRouter } from "next/router";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import LocalSITCProduct from "../../components/MasterDataProduct/LocalSITCProduct";
import GlobalSITCProduct from "../../components/MasterDataProduct/GlobalSITCProduct";
import Source from "../../components/MasterDataProduct/Source";
import ProductManufacturedType from "../../components/MasterDataProduct/ProductManufacturedType";
import { DropDownMenu } from "../../components/DropDownMenu";

const Location = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  return (
    <AdminArea urlQuery={router.query}>
      <div className="mt-26">
        <div className=" pr-0 md:pr-10 py-4 bg-white h-full">
          <DropDownMenu componentName={router.query.componentName}>
            {currentUserDontHavePrivilege(["Local Product:Read"]) ? null : (
              <div
                className={`${
                  router.query.componentName === "Local Product"
                    ? "bg-mantis-200 text-black font-bold"
                    : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
                onClick={e => {
                  if (e) e.preventDefault();
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      componentName: "Local Product",
                    },
                  });
                }}>
                <p className="text-lg font-semibold">Local Product</p>
              </div>
            )}

            {currentUserDontHavePrivilege([
              "International Product:Read",
            ]) ? null : (
              <div
                className={`${
                  router.query.componentName === "International Product"
                    ? "bg-mantis-200 text-black font-bold"
                    : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
                onClick={e => {
                  if (e) e.preventDefault();
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      componentName: "International Product",
                    },
                  });
                }}>
                <p className="text-lg font-semibold">International Product</p>
              </div>
            )}

            {currentUserDontHavePrivilege(["Source Product:Read"]) ? null : (
              <div
                className={`${
                  router.query.componentName === "Source"
                    ? "bg-mantis-200 text-black font-bold"
                    : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
                onClick={e => {
                  if (e) e.preventDefault();
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      componentName: "Source",
                    },
                  });
                }}>
                <p className="text-lg font-semibold">Source</p>
              </div>
            )}
            {currentUserDontHavePrivilege([
              "Product Manufactured Type:Read",
            ]) ? null : (
              <div
                className={`${
                  router.query.componentName === "Product Manufactured Type"
                    ? "bg-mantis-200 text-black font-bold"
                    : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
                onClick={e => {
                  if (e) e.preventDefault();
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      componentName: "Product Manufactured Type",
                    },
                  });
                }}>
                <p className="text-lg font-semibold">
                  Product Manufactured Type
                </p>
              </div>
            )}
          </DropDownMenu>
          {router.query.componentName === "Local Product" ? (
            currentUserDontHavePrivilege(["Local Product:Read"]) ? null : (
              <LocalSITCProduct
                currentUserDontHavePrivilege={currentUserDontHavePrivilege}
              />
            )
          ) : router.query.componentName === "International Product" ? (
            currentUserDontHavePrivilege([
              "International Product:Read",
            ]) ? null : (
              <GlobalSITCProduct
                currentUserDontHavePrivilege={currentUserDontHavePrivilege}
              />
            )
          ) : router.query.componentName === "Source" ? (
            currentUserDontHavePrivilege(["Source Product:Read"]) ? null : (
              <Source
                currentUserDontHavePrivilege={currentUserDontHavePrivilege}
              />
            )
          ) : router.query.componentName === "Product Manufactured Type" ? (
            currentUserDontHavePrivilege([
              "Product Manufactured Type:Read",
            ]) ? null : (
              <ProductManufacturedType
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
export default withApollo({ ssr: true })(Location);
