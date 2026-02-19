import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { withApollo } from "../../libs/apollo";
import { useRouter } from "next/router";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import Category from "../../components/MasterDataEmployment/Category";
import Division from "../../components/MasterDataEmployment/Division";
import { DropDownMenu } from "../../components/DropDownMenu";

const EmploymentPage = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  return (
    <AdminArea urlQuery={router.query}>
      <div className="mt-26">
        <div className=" pr-0 md:pr-10 py-4 bg-white h-full">
          <DropDownMenu componentName={router.query.componentName}>
            {currentUserDontHavePrivilege([
              "Employment Category:Read",
            ]) ? null : (
              <div
                className={`${
                  router.query.componentName === "Category"
                    ? "bg-mantis-200 text-black font-bold"
                    : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
                onClick={e => {
                  if (e) e.preventDefault();
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      componentName: "Category",
                    },
                  });
                }}>
                <p className="text-lg font-semibold">Category</p>
              </div>
            )}

            {currentUserDontHavePrivilege([
              "Employment Division:Read",
            ]) ? null : (
              <div
                className={`${
                  router.query.componentName === "Division"
                    ? "bg-mantis-200 text-black font-bold"
                    : "bg-white text-black border border-gray-300"
                } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
                onClick={e => {
                  if (e) e.preventDefault();
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      componentName: "Division",
                    },
                  });
                }}>
                <p className="text-lg font-semibold">Division</p>
              </div>
            )}
          </DropDownMenu>
          {router.query.componentName === "Category" ? (
            currentUserDontHavePrivilege([
              "Employment Category:Read",
            ]) ? null : (
              <Category
                currentUserDontHavePrivilege={currentUserDontHavePrivilege}
              />
            )
          ) : router.query.componentName === "Division" ? (
            currentUserDontHavePrivilege([
              "Employment Division:Read",
            ]) ? null : (
              <Division
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
export default withApollo({ ssr: true })(EmploymentPage);
