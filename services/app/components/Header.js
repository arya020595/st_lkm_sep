import Head from "next/head";
import appConfig from "../app.json";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useRouter } from "next/router";
import { showLoadingSpinner, hideLoadingSpinner, useNotification } from "./App";
import { useState } from "react";

const QUERY = gql`
  query currentUser {
    currentUser {
      _id
      employeeId
      name
    }
  }
`;

const LOGOUT = gql`
  mutation logOut {
    logOut
  }
`;
const Header = ({ onClickOpenSidebar, title }) => {
  const router = useRouter();
  const notification = useNotification();
  const q = router.query;

  const { data, loading, error, refetch } = useQuery(QUERY, {
    variables: {},
  });
  const currentUser = data?.currentUser || {};
  let parentMenu = title || "";
  let subMenu = q?.sidebarSubMenuName || "";

  if (q.reportPage) {
    subMenu = q.reportPage;
  }
  if (q.sidebarMenu === "dashboard") {
    parentMenu = "Dashboard";
  } else if (q.sidebarMenu === "master_data") {
    parentMenu = "Master Data";
  } else if (q.sidebarMenu === "basic_cocoa_statistic") {
    parentMenu = "Basic Cocoa Statistic";
  } else if (q.sidebarMenu === "profile") {
    parentMenu = "Profile";
  } else if (q.sidebarMenu === "prices") {
    parentMenu = "Prices";
  } else if (q.sidebarMenu === "trade_data") {
    parentMenu = "Trade Data";
  } else if (q.sidebarMenu === "entrepreneur") {
    parentMenu = "Entrepreneur";
  } else if (q.sidebarMenu === "user_management") {
    parentMenu = "User Management";
  } else if (q.sidebarMenu === "estate_information") {
    parentMenu = "Estate Information";
  } else if (q.sidebarMenu === "census_data_estate") {
    parentMenu = "Census Data";
  } else if (q.sidebarMenu === "estate_information") {
    parentMenu = "Estate Information";
  } else if (q.sidebarMenu === "estate-census-report") {
    parentMenu = "Estate Census Report";
  } else if (q.sidebarMenu === "unstructured_document") {
    parentMenu = "Unstructured Document";
  } else if (q.sidebarMenu === "questionnare") {
    parentMenu = "Questionnare";
  } else if (q.sidebarMenu === "pangkalan-data") {
    parentMenu = "Pangkalan Data";
  } else if (q.sidebarMenu === "validation-code") {
    parentMenu = "Validation Code";
  } else if (q.sidebarMenu === "smallholder") {
    parentMenu = "Smallholder";
  } else if (q.sidebarMenu === "data-banci") {
    parentMenu = "Data Banci";
  } else if (q.sidebarMenu === "master-data-smallholder-census") {
    parentMenu = "Master Data";
  } else if (q.sidebarMenu === "estate_dashboard") {
    parentMenu = "Dashboard";
  } else if (q.sidebarMenu === "cocoa-monitor") {
    parentMenu = "Cocoa Monitor";
  }
  const [logOut] = useMutation(LOGOUT);
  const handleLogout = async () => {
    try {
      await logOut({});
      setTimeout(() => (window.location.href = "/schooltalk/logout"), 2000);

      // let getSession = await localforage.getItem(
      //   "accountSession",
      //   (err, val) => {
      //     if (err !== null) {
      //       return null;
      //     }
      //     return val;
      //   }
      // );

      // await localforage.clear();

      // notification.addNotification({
      //   title: "Logout",
      //   message: "Logout! Redirecting..",
      //   level: "danger",
      // });

      // setTimeout(() => {
      //   window.location.href = "/schooltalk/login";
      // }, 2000);
    } catch (err) {
      notification.handleError(err);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-white px-4 py-4 md:py-6 w-full shadow-lg z-10">
      <div className="grid grid-cols-12 gap-0">
        <div className="hidden md:block col-span-2">
          {/* <div className="flex items-center">
            <img className="h-20 pl-4" src="/lkm/images/lkm-logo.png" />
            <div className="mx-4">
              <p className="font-bold text-xl">Lembaga Koko</p>
              <p className="font-bold text-xl">Malaysia</p>
            </div>
          </div> */}
        </div>
        <div className="col-span-8 md:col-span-6 md:ml-4 flex items-center">
          <div className="flex items-center">
            <img
              className="h-12 mr-2"
              src={
                "/lkm/images/menu-01_dasboard_icon.svg"
                // router.pathname === "/dashboard"
                //   ? "/lkm/images/sidebar-icon-beranda-button.svg"
                //   : ""
              }
            />
            <p className="text-lg md:text-2xl">
              {title || parentMenu}
              {subMenu ? " / " + subMenu : null}
            </p>
          </div>
        </div>
        <div className="col-span-4 hidden md:flex items-center justify-end">
          <img
            className="h-10 w-10 rounded-full"
            src={"/lkm/images/user-dummy.jpg"}
          />
          <div className="px-4">
            User{" "}
            <span className="font-bold">
              {currentUser?.name || currentUser?.employeeId}
            </span>
          </div>
        </div>
        <a
          href="#"
          onClick={e => {
            if (e) e.preventDefault();
            console.log("onClickOpenSidebar...");
            if (onClickOpenSidebar) onClickOpenSidebar();
          }}
          className="col-span-4 flex md:hidden items-center justify-end hover:opacity-50">
          <img
            className="h-10 w-10 rounded-full"
            src={"/lkm/images/user-dummy.jpg"}
          />
          <div className="px-4 text-gray-400">
            <i className="fa fa-bars" />
          </div>
        </a>
        {/* <div className="col-span-4 flex justify-center">
          <div
            className="flex items-center cursor-pointer"
            onClick={(e) => {
              if (e) e.preventDefault();
              router.replace({
                pathname: "/dashboard",
                query: {
                  // ...urlQuery,
                  ...q,
                },
              });
            }}
          >
            <img
              className="h-10 mr-2"
              src={
                router.pathname === "/dashboard"
                  ? "/schooltalk/images/st-header-icon-schoollife-button-on.svg"
                  : "/schooltalk/images/st-header-icon-schoollife-button-off.svg"
              }
            />
            <p className="font-bold text-sm">School Life</p>
          </div>
          <div className="flex items-center ml-8">
            <img
              className="h-10 mr-2"
              src="/schooltalk/images/header-icon-course-button-off.svg"
            />
            <p className="font-bold text-sm text-gray-500">Kursus</p>
          </div>
          <div className="flex items-center ml-8">
            <img
              className="h-10 mr-2"
              src="/schooltalk/images/header-icon-chat-button-off.svg"
            />
            <p className="font-bold text-sm text-gray-500">Pesan</p>
          </div>
          <div
            className="flex items-center ml-8"
            onClick={(e) => {
              if (e) e.preventDefault();
              router.replace({
                pathname: "/profile",
                query: {
                  // ...urlQuery,
                  ...q,
                },
              });
            }}
          >
            <img
              className="h-10 mr-2 cursor-pointer"
              src={
                router.pathname !== "/profile"
                  ? "/schooltalk/images/st-header-icon-profile-button-off.svg"
                  : "/schooltalk/images/st-header-icon-profile-button-on.svg"
              }
            />
            <p className="font-bold text-sm text-gray-500 cursor-pointer">
              Profile
            </p>
          </div>

          <div className="flex items-center ml-8">
            <img
              className="h-10 mr-2"
              src="/schooltalk/images/header-icon-notification-button-off.svg"
            />
            <p className="font-bold text-sm text-gray-500">Notifikasi</p>
          </div>
        </div>

        <div className="flex justify-center items-center">
          <button
            className="bg-red-500 px-12 py-2 shadow-md rounded-full"
            onClick={handleLogout}
          >
            <div className="flex items-center">
              <img
                className="text-center self-center mr-2 h-4"
                src="/schooltalk/images/header-icon-logout-button.svg"
              />
              <p className="text-white font-bold text-sm">Logout</p>
            </div>
          </button>
        </div> */}
      </div>
    </div>
  );
};
export default Header;
