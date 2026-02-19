import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import appConfig from "../../app.json";
import { withApollo } from "../../libs/apollo";
import { useRouter } from "next/router";
import AdminArea from "../../components/AdminArea";
import UserAdmin from "../../components/UserManagement/UserAdmin";
import UserRole from "../../components/UserManagement/UserRole";
import { DropDownMenu } from "../../components/DropDownMenu";

const UserManagement = () => {
  const router = useRouter();
  const [managementType, setManagementType] = useState("ROLE");
  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>User Management</title>
      </Head>

      <div className="mt-26">
        <div className="pr-0 md:pr-10 py-4 bg-white h-full">
          <DropDownMenu componentName={router.query.componentName}>
            <div
              className={`${
                managementType === "ADMIN"
                  ? "bg-mantis-200 text-black font-bold"
                  : "bg-white text-black border border-gray-300"
              } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
              onClick={e => {
                if (e) e.preventDefault();
                setManagementType("ADMIN");
              }}>
              <p className="text-lg font-semibold">User Admin</p>
            </div>
            <div
              className={`${
                managementType === "ROLE"
                  ? "bg-mantis-200 text-black font-bold"
                  : "bg-white text-black border border-gray-300"
              } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
              onClick={e => {
                if (e) e.preventDefault();
                setManagementType("ROLE");
              }}>
              <p className="text-lg font-semibold">User Role</p>
            </div>
          </DropDownMenu>
        </div>

        {managementType === "ADMIN" ? <UserAdmin /> : <UserRole />}
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(UserManagement);
