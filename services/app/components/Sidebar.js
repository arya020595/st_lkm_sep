import dayjs from "dayjs";
import router, { useRouter } from "next/router";
import { useEffect, useState } from "react";
import getConfig from "next/config";
import { useCurrentUser } from "./AdminArea";

const { publicRuntimeConfig } = getConfig();
let { MODE } = publicRuntimeConfig;

MODE = MODE.split(", ");

const Sidebar = ({ sidebarWidth, urlQuery, onClose }) => {
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const router = useRouter();
  const sidebarMenu = urlQuery.sidebarMenu;
  const { date, ...q } = urlQuery;

  const [menuState, setMenu] = useState("");
  const [showSubMenu, setShowSubMenu] = useState(true);
  const [subMenuState, setSubMenu] = useState("");
  const [appState, selectAppState] = useState("SEP");
  const selectSidebarMenu = menu => e => {
    if (e) e.preventDefault();
    setMenu(menu);
    // console.log({ menu });
    if (menu === "dashboard") {
      router.replace({
        pathname: "/dashboard",
        query: {
          // ...urlQuery,
          sidebarMenu: "dashboard",
          appState: "SEP",
        },
      });
    } else if (menu === "trade_data") {
      router.replace({
        pathname: "/trade_data/trade_data",
        query: {
          // ...urlQuery,
          sidebarMenu: "trade_data",
          appState: "SEP",
        },
      });
    } else if (menu === "user_management") {
      router.replace({
        pathname: "/user_management/user_management",
        query: {
          // ...urlQuery,
          sidebarMenu: "user_management",
          appState: "SEP",
        },
      });
    } else if (menu === "position_type") {
      router.replace({
        pathname: "/estate_census/position_type",
        query: {
          // ...urlQuery,
          sidebarMenu: "position_type",
          appState: "Estate",
        },
      });
    } else if (menu === "estate_information") {
      router.replace({
        pathname: "/estate_census/estate_information",
        query: {
          // ...urlQuery,
          sidebarMenu: "estate_information",
          appState: "Estate",
        },
      });
    } else if (menu === "estate-census-report") {
      router.replace({
        pathname: "/estate_census/estate-census-report",
        query: {
          // ...urlQuery,
          sidebarMenu: "estate-census-report",
          appState: "Estate",
        },
      });
    } else if (menu === "malaysian-report") {
      router.replace({
        pathname: "/estate_census/malaysian-report",
        query: {
          // ...urlQuery,
          sidebarMenu: "malaysian-report",
          appState: "Estate",
        },
      });
    } else if (menu === "semenanjung-report") {
      router.replace({
        pathname: "/estate_census/semenanjung-report",
        query: {
          // ...urlQuery,
          sidebarMenu: "semenanjung-report",
          appState: "Estate",
        },
      });
    } else if (menu === "sabah-report") {
      router.replace({
        pathname: "/estate_census/sabah-report",
        query: {
          // ...urlQuery,
          sidebarMenu: "sabah-report",
          appState: "Estate",
        },
      });
    } else if (menu === "sarawak-report") {
      router.replace({
        pathname: "/estate_census/sarawak-report",
        query: {
          // ...urlQuery,
          sidebarMenu: "sarawak-report",
          appState: "Estate",
        },
      });
    } else if (menu === "questionnare") {
      // console.log({ menu, urlQuery });
      if (urlQuery.appState === "Estate") {
        router.replace({
          pathname: "/estate_census/questionnare",
          query: {
            // ...urlQuery,
            sidebarMenu: "questionnare",
            appState: "Estate",
          },
        });
      } else if (urlQuery.appState === "Smallholder") {
        router.replace({
          pathname: "/smallholder-census/questionnare",
          query: {
            // ...urlQuery,
            sidebarMenu: "questionnare",
            appState: "Smallholder",
          },
        });
      }
    } else if (menu === "malaysian-smallholder-report") {
      router.replace({
        pathname: "/smallholder-census/malaysian-report",
        query: {
          // ...urlQuery,
          sidebarMenu: "malaysian-smallholder-report",
          appState: "Smallholder",
        },
      });
    } else if (menu === "semenanjung-smallholder-report") {
      router.replace({
        pathname: "/smallholder-census/semenanjung-report",
        query: {
          // ...urlQuery,
          sidebarMenu: "semenanjung-smallholder-report",
          appState: "Smallholder",
        },
      });
    } else if (menu === "sabah-smallholder-report") {
      router.replace({
        pathname: "/smallholder-census/sabah-report",
        query: {
          // ...urlQuery,
          sidebarMenu: "sabah-smallholder-report",
          appState: "Smallholder",
        },
      });
    } else if (menu === "sarawak-smallholder-report") {
      router.replace({
        pathname: "/smallholder-census/sarawak-report",
        query: {
          // ...urlQuery,
          sidebarMenu: "sarawak-smallholder-report",
          appState: "Smallholder",
        },
      });
    } else if (menu === "smallholder") {
      router.replace({
        pathname: "/smallholder-census/smallholder",
        query: {
          // ...urlQuery,
          sidebarMenu: "smallholder",
          appState: "Smallholder",
        },
      });
    } else if (menu === "validation-code") {
      router.replace({
        pathname: "/estate_census/validation-code",
        query: {
          // ...urlQuery,
          sidebarMenu: "validation-code",
          appState: "Estate",
        },
      });
    } else if (menu === "data-banci") {
      router.replace({
        pathname: "/smallholder-census/data-banci",
        query: {
          // ...urlQuery,
          sidebarMenu: "data-banci",
          appState: "Smallholder",
          componentName: "Sabah",
        },
      });
    } else if (menu === "estate_dashboard") {
      router.replace({
        pathname: "/estate_census/estate_dashboard",
        query: {
          // ...urlQuery,
          sidebarMenu: "estate_dashboard",
          appState: "Estate",
        },
      });
    } else if (menu === "cocoa-monitor") {
      router.replace({
        pathname: "/estate_census/cocoa-monitor",
        query: {
          // ...urlQuery,
          sidebarMenu: "cocoa-monitor",
          appState: "Estate",
        },
      });
    } else if (menuState === menu) {
      setShowSubMenu(!showSubMenu);
    } else {
      setShowSubMenu(true);
    }
  };

  useEffect(() => {
    if (router.query.estateYear) {
      setSubMenu(router.query.goTo);
    }
    setMenu(router.query.sidebarMenu);
  }, []);

  const selectSidebarSubMenu = (subMenu, subMenuName, componentName) => e => {
    if (e) e.preventDefault();
    setSubMenu(subMenu);
    setMenu(menuState);
    if (router.query.sidebarSubMenu !== subMenu) {
      router.replace({
        // pathname: `/${menuState}/${subMenu}`,
        pathname: `/${menuState}/${subMenu}`,
        query: {
          // ...urlQuery,
          sidebarMenu: menuState,
          sidebarSubMenu: subMenu,
          sidebarSubMenuName: subMenuName,
          componentName,
          appState: "SEP",
        },
      });
    }
  };

  const selectSidebarSubMenuEstate =
    (subMenu, subMenuName, componentName) => e => {
      if (e) e.preventDefault();
      setSubMenu(subMenu);
      setMenu(menuState);

      let estateUrlQuery = {};

      if (router.query.sidebarSubMenu !== subMenu) {
        if (router.query.estateId) {
          const { estateId, estateYear } = router.query;
          estateUrlQuery = {
            ...estateUrlQuery,
            estateId,
            estateYear,
          };
        }
        router.replace({
          // pathname: `/${menuState}/${subMenu}`,
          pathname: `/${menuState}/${subMenu}`,
          query: {
            // ...urlQuery,
            ...estateUrlQuery,
            sidebarMenu: menuState,
            sidebarSubMenu: subMenu,
            sidebarSubMenuName: subMenuName,
            componentName,
            appState: "Estate",
          },
        });
      }
    };

  const selectSidebarSubMenuSmallholder =
    (subMenu, subMenuName, componentName) => e => {
      if (e) e.preventDefault();
      // console.log({ subMenu, subMenuName, componentName, menuState });
      setSubMenu(subMenu);
      setMenu(menuState);

      router.replace({
        // pathname: `/${menuState}/${subMenu}`,
        pathname: `/${menuState}/${subMenu}`,
        query: {
          sidebarMenu: menuState,
          sidebarSubMenu: subMenu,
          sidebarSubMenuName: subMenuName,
          componentName,
          appState: "Smallholder",
        },
      });
    };

  return (
    <div className={`bg-white shadow-md h-screen overflow-y-scroll`}>
      <div className="sticky top-0 flex-1 bg-white pt-4">
        <div className="hidden md:flex items-center">
          <img className="h-12 md:h-20 pl-4" src="/lkm/images/lkm-logo.png" />
          <div className="mx-4">
            <p className="font-bold text-base md:text-xl">Sistem Ekonomi</p>
            <p className="font-bold text-base md:text-xl">Pintar</p>
          </div>
        </div>

        <a
          href="#"
          onClick={e => {
            if (e) e.preventDefault();
            if (onClose) onClose();
          }}
          className="flex md:hidden items-center justify-start">
          <img
            className="h-12 md:h-20 pl-4 flex-none"
            src="/lkm/images/lkm-logo.png"
          />
          <div className="mx-4 flex-none">
            <p className="font-bold text-base md:text-xl">Sistem Ekonomi</p>
            <p className="font-bold text-base md:text-xl">Pintar</p>
          </div>
          <div className="w-full text-right px-6">
            <i className="fa fa-times" />
          </div>
        </a>

        <hr className="bg-gray-200 h-1" />
      </div>
      <div className="w-full mb-4 pr-2 block">
        <select
          className="form-control"
          value={router.query.appState}
          onChange={e => {
            if (e) e.preventDefault();

            if (e.target.value === "SEP") {
              router.replace({
                pathname: "/dashboard",
                query: {
                  // ...urlQuery,
                  sidebarMenu: "dashboard",
                  appState: e.target.value,
                },
              });
            } else if (e.target.value === "Estate") {
              router.replace({
                pathname: "/estate_census/estate_information",
                query: {
                  // ...urlQuery,
                  sidebarMenu: "estate_information",
                  appState: e.target.value,
                },
              });
            } else {
              router.replace({
                pathname: "/smallholder-census/smallholder",
                query: {
                  // ...urlQuery,
                  sidebarMenu: "smallholder",
                  appState: e.target.value,
                },
              });
            }
          }}>
          <option value="SEP">SEP App</option>
          <option value="Estate">Estate Census App</option>
          <option value="Smallholder">Smallholder Census App</option>
        </select>
      </div>

      {router.query.appState === "SEP" ? (
        <div>
          <div
            className={`w-full mb-4 pr-2 ${
              !currentUserDontHavePrivilege(["Dashboard:Read"])
                ? "block"
                : "hidden"
            }`}>
            {menuState === "dashboard" ? (
              <div>
                <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                  <div
                    className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                    onClick={selectSidebarMenu("dashboard")}>
                    <img src="/lkm/images/menu-01_dasboard_icon.svg" />
                    <p className={"text-black font-bold text-lg  mx-2"}>
                      Dashboard
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarMenu("dashboard")}>
                  <img src="/lkm/images/menu-01_dasboard_icon.svg" />
                  <p className={"text-black font-bold text-lg  mx-2"}>
                    Dashboard
                  </p>
                </div>
              </div>
            )}
          </div>
          <div
            className={`w-full mb-4 pr-2 ${
              !currentUserDontHavePrivilege(["Prices:Read"], currentUser)
                ? "block"
                : "hidden"
            }`}>
            {menuState === "prices" ? (
              <div>
                <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                  <div
                    className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                    onClick={selectSidebarMenu("prices")}>
                    <img src="/lkm/images/menu-02_prices_icon.svg" />
                    <p className={"text-black font-bold text-lg  mx-2"}>
                      Prices
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarMenu("prices")}>
                  <img src="/lkm/images/menu-02_prices_icon.svg" />
                  <p className={"text-black font-bold text-lg  mx-2"}>Prices</p>
                </div>
              </div>
            )}

            {menuState === "prices" ? (
              <div className={`mt-2 ${!showSubMenu ? "hidden" : "block"}`}>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer
                  ${
                    !currentUserDontHavePrivilege(
                      ["Domestic Price:Read"],
                      currentUser,
                    )
                      ? "block"
                      : "hidden"
                  }
                  `}
                  onClick={selectSidebarSubMenu(
                    "domestic_price",
                    "Domestic Price",
                    "Input For PPE",
                  )}>
                  <svg
                    className="h-8"
                    // width="28"
                    // height="28"
                    viewBox="0 0 28 28"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M13.0255 0.302534C9.67871 0.541094 6.57603 1.98421 4.20555 4.40873C2.68655 5.95993 1.65587 7.6363 0.988908 9.64865C0.256428 11.8399 0.0884278 14.2376 0.500588 16.4941C1.50411 21.9944 5.81639 26.3773 11.2895 27.4732C12.304 27.6739 12.7976 27.7227 14.0016 27.7227C15.6833 27.7227 16.8114 27.5437 18.3139 27.0445C22.4744 25.6722 25.6748 22.4718 27.0471 18.3113C27.5517 16.7926 27.7253 15.6751 27.7197 13.9719C27.7197 12.4097 27.5676 11.3519 27.1501 9.98494C25.5609 4.82622 21.1128 1.07281 15.7698 0.383734C14.9783 0.286293 13.8065 0.248215 13.0255 0.302534ZM15.5749 3.16105C17.4899 3.42146 19.372 4.24606 20.9179 5.49346C21.4387 5.91121 22.3717 6.88198 22.7732 7.41369C25.3173 10.8093 25.686 15.3766 23.7115 19.1141C22.6645 21.0886 21.0915 22.6617 19.1169 23.7086C16.4861 25.0971 13.4159 25.3522 10.5845 24.4139C8.94623 23.8715 7.67167 23.1013 6.41867 21.897C4.61211 20.1503 3.52207 18.0184 3.15303 15.5177C3.03907 14.7365 3.03907 13.2665 3.15303 12.48C3.84183 7.74466 7.44907 4.02877 12.1575 3.19885C13.1664 3.01994 14.4628 3.00369 15.5749 3.16105Z"
                      fill={
                        subMenuState === "domestic_price" ||
                        q.sidebarSubMenu === "domestic_price"
                          ? "#68b064"
                          : "#B05056"
                      }
                    />
                    <path
                      d="M6.55947 10.0609C6.46175 10.1205 6.34247 10.2507 6.28815 10.3484C6.19603 10.5164 6.19043 10.7606 6.19043 14.0806C6.19043 17.4165 6.19575 17.6444 6.28815 17.8342C6.55387 18.3713 7.27543 18.3713 7.58987 17.8396C7.67667 17.6878 7.68759 17.5086 7.68759 16.1416L7.69291 14.612L8.27335 14.6338C8.80507 14.6501 8.88095 14.6663 9.08703 14.8018C9.41799 15.0242 9.68371 15.3985 10.3781 16.63C11.0997 17.921 11.208 18.0784 11.4684 18.1868C11.8753 18.3548 12.3961 18.1162 12.4829 17.715C12.6077 17.1564 11.425 15.1328 10.6494 14.5633L10.4433 14.4168L10.7309 14.3247C11.4578 14.0859 11.8809 13.7552 12.1413 13.2235C12.3149 12.8763 12.3202 12.8385 12.3202 12.209C12.3202 11.6504 12.2986 11.5093 12.19 11.2327C12.0111 10.7878 11.5174 10.2944 11.0725 10.1152C10.7525 9.99032 10.7144 9.98501 8.74011 9.96877C6.81987 9.95784 6.72775 9.95785 6.55947 10.0609ZM10.1776 11.2705C10.8558 11.5634 11.0347 12.5235 10.5192 13.0605C10.2479 13.3425 9.94439 13.4021 8.76727 13.4021H7.70943L7.69851 12.3443C7.68759 11.7638 7.69319 11.254 7.70943 11.2106C7.75283 11.1025 9.90631 11.1512 10.1776 11.2705Z"
                      fill={
                        subMenuState === "domestic_price" ||
                        q.sidebarSubMenu === "domestic_price"
                          ? "#68b064"
                          : "#B05056"
                      }
                    />
                    <path
                      d="M14.1485 10.0506C13.7688 10.2351 13.785 10.0722 13.785 14.0809C13.785 17.4493 13.7903 17.6991 13.8827 17.8671C14.1594 18.377 14.8319 18.377 15.0599 17.8671C15.1629 17.6448 15.1685 17.4874 15.1685 14.6829C15.1685 13.0612 15.1794 11.7429 15.1957 11.7592C15.2119 11.7701 15.5266 13.0827 15.8954 14.672C16.5951 17.6392 16.671 17.8943 16.9748 18.1166C17.1755 18.263 17.6798 18.2686 17.8915 18.1275C18.2225 17.9105 18.2278 17.8943 19.1011 14.1353C19.3887 12.8985 19.6381 11.8463 19.6597 11.8029C19.6815 11.7595 19.7084 13.0939 19.7249 14.77C19.7521 17.7534 19.7521 17.8184 19.8661 17.9704C19.9257 18.0519 20.0777 18.1549 20.197 18.1981C20.3869 18.2686 20.4465 18.2686 20.6201 18.1981C20.7341 18.1547 20.8752 18.0516 20.9401 17.9704C21.0541 17.8184 21.0541 17.7859 21.065 14.1462C21.0759 11.2767 21.065 10.4468 21.0107 10.3382C20.9726 10.2676 20.8589 10.1483 20.7612 10.0831C20.5932 9.96914 20.5171 9.95822 19.8663 9.95822C18.9659 9.95822 18.8684 10.0069 18.7001 10.5115C18.6405 10.7013 18.3585 11.8026 18.071 12.9688C17.7834 14.1297 17.5286 15.1819 17.4959 15.3012C17.4362 15.5073 17.4037 15.4042 16.8015 12.9688C16.4489 11.564 16.1236 10.3435 16.0799 10.2511C15.9444 10.0016 15.787 9.95822 15.0167 9.95822C14.4901 9.95822 14.284 9.98006 14.1485 10.0506Z"
                      fill={
                        subMenuState === "domestic_price" ||
                        q.sidebarSubMenu === "domestic_price"
                          ? "#68b064"
                          : "#B05056"
                      }
                    />
                  </svg>
                  {/* <img src="/lkm/images/sidebar-icon-beranda-button.svg" /> */}
                  <p
                    className={`${
                      subMenuState === "domestic_price" ||
                      q.sidebarSubMenu === "domestic_price"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Domestic Price
                  </p>
                </div>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${
                    !currentUserDontHavePrivilege(
                      ["Global Price:Read"],
                      currentUser,
                    )
                      ? "block"
                      : "hidden"
                  }`}
                  onClick={selectSidebarSubMenu(
                    "global_price",
                    "Global Price (ICCO Buletin)",
                    "ICCO Price",
                  )}>
                  <svg
                    className="h-8"
                    // width="31"
                    // height="31"
                    viewBox="0 0 31 31"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M15.5 0.1875C7.04395 0.1875 0.1875 7.04395 0.1875 15.5C0.1875 23.9561 7.04395 30.8125 15.5 30.8125C23.9561 30.8125 30.8125 23.9561 30.8125 15.5C30.8125 7.04395 23.9561 0.1875 15.5 0.1875ZM16.2622 22.9238L16.269 24.0073C16.269 24.1577 16.146 24.2842 15.9956 24.2842H15.0249C14.8745 24.2842 14.7515 24.1611 14.7515 24.0107V22.9375C11.7163 22.7119 10.2876 20.9824 10.1338 19.1025C10.1201 18.9419 10.2466 18.8052 10.4072 18.8052H11.9863C12.1196 18.8052 12.2358 18.9009 12.2563 19.0308C12.4307 20.1143 13.2749 20.9243 14.7891 21.126V16.2485L13.9448 16.0332C12.1572 15.606 10.4551 14.4917 10.4551 12.1812C10.4551 9.68945 12.3486 8.34961 14.7686 8.11377V6.98584C14.7686 6.83545 14.8916 6.7124 15.042 6.7124H16.0024C16.1528 6.7124 16.2759 6.83545 16.2759 6.98584V8.10352C18.6172 8.33936 20.374 9.70654 20.5791 11.8359C20.5962 11.9966 20.4697 12.1367 20.3057 12.1367H18.771C18.6343 12.1367 18.5181 12.0342 18.501 11.9009C18.3643 10.9028 17.5645 10.0894 16.2622 9.91162V14.502L17.1304 14.7036C19.3452 15.2505 20.8525 16.3101 20.8525 18.6821C20.8525 21.2559 18.9385 22.6914 16.2622 22.9238ZM12.5811 12.0239C12.5811 12.8921 13.1177 13.5654 14.2729 13.9824C14.4336 14.0474 14.5942 14.0986 14.7856 14.1533V9.91504C13.5244 10.0757 12.5811 10.7832 12.5811 12.0239ZM16.563 16.645C16.4673 16.6245 16.3716 16.6006 16.2622 16.5698V21.1396C17.7183 21.0098 18.7231 20.21 18.7231 18.8701C18.7231 17.8208 18.1797 17.1372 16.563 16.645Z"
                      fill={
                        subMenuState === "global_price" ||
                        q.sidebarSubMenu === "global_price"
                          ? "#68b064"
                          : "#B05056"
                      }
                    />
                  </svg>
                  {/* <img src="/lkm/images/sidebar-icon-beranda-button.svg" /> */}
                  <p
                    className={`${
                      subMenuState === "global_price" ||
                      q.sidebarSubMenu === "global_price"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Global Price (ICCO Buletin)
                  </p>
                </div>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${
                    !currentUserDontHavePrivilege(
                      ["Global Price Other:Read"],
                      currentUser,
                    )
                      ? "block"
                      : "hidden"
                  }`}
                  onClick={selectSidebarSubMenu(
                    "global-price-revinitv",
                    "Global Price Refinitv",
                    "Future Market",
                  )}>
                  <svg
                    className="h-8"
                    // width="31"
                    // height="31"
                    viewBox="0 0 31 31"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M15.5 0.1875C7.04395 0.1875 0.1875 7.04395 0.1875 15.5C0.1875 23.9561 7.04395 30.8125 15.5 30.8125C23.9561 30.8125 30.8125 23.9561 30.8125 15.5C30.8125 7.04395 23.9561 0.1875 15.5 0.1875ZM16.2622 22.9238L16.269 24.0073C16.269 24.1577 16.146 24.2842 15.9956 24.2842H15.0249C14.8745 24.2842 14.7515 24.1611 14.7515 24.0107V22.9375C11.7163 22.7119 10.2876 20.9824 10.1338 19.1025C10.1201 18.9419 10.2466 18.8052 10.4072 18.8052H11.9863C12.1196 18.8052 12.2358 18.9009 12.2563 19.0308C12.4307 20.1143 13.2749 20.9243 14.7891 21.126V16.2485L13.9448 16.0332C12.1572 15.606 10.4551 14.4917 10.4551 12.1812C10.4551 9.68945 12.3486 8.34961 14.7686 8.11377V6.98584C14.7686 6.83545 14.8916 6.7124 15.042 6.7124H16.0024C16.1528 6.7124 16.2759 6.83545 16.2759 6.98584V8.10352C18.6172 8.33936 20.374 9.70654 20.5791 11.8359C20.5962 11.9966 20.4697 12.1367 20.3057 12.1367H18.771C18.6343 12.1367 18.5181 12.0342 18.501 11.9009C18.3643 10.9028 17.5645 10.0894 16.2622 9.91162V14.502L17.1304 14.7036C19.3452 15.2505 20.8525 16.3101 20.8525 18.6821C20.8525 21.2559 18.9385 22.6914 16.2622 22.9238ZM12.5811 12.0239C12.5811 12.8921 13.1177 13.5654 14.2729 13.9824C14.4336 14.0474 14.5942 14.0986 14.7856 14.1533V9.91504C13.5244 10.0757 12.5811 10.7832 12.5811 12.0239ZM16.563 16.645C16.4673 16.6245 16.3716 16.6006 16.2622 16.5698V21.1396C17.7183 21.0098 18.7231 20.21 18.7231 18.8701C18.7231 17.8208 18.1797 17.1372 16.563 16.645Z"
                      fill={
                        subMenuState === "global-price-revinitv" ||
                        q.sidebarSubMenu === "global-price-revinitv"
                          ? "#68b064"
                          : "#B05056"
                      }
                    />
                  </svg>
                  {/* <img src="/lkm/images/sidebar-icon-beranda-button.svg" /> */}
                  <p
                    className={`${
                      subMenuState === "global-price-revinitv" ||
                      q.sidebarSubMenu === "global-price-revinitv"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Global Price (Refinitiv)
                  </p>
                </div>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer ${
                    !currentUserDontHavePrivilege(
                      ["Single Origin:Read"],
                      currentUser,
                    )
                      ? "block"
                      : "hidden"
                  }`}
                  onClick={selectSidebarSubMenu(
                    "single_origin",
                    "Single Origin",
                    "",
                  )}>
                  <svg
                    className="h-8"
                    // width="30"
                    // height="30"
                    viewBox="0 0 35 35"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M15 30C22.7727 30 29.1682 24.0818 29.9318 16.5C30.0136 15.6955 29.3727 15 28.5682 15C27.8727 15 27.2864 15.5182 27.2182 16.2C26.6182 22.4182 21.3682 27.2727 15 27.2727C10.7455 27.2727 6.99545 25.1045 4.8 21.8182H6.81818C7.56818 21.8182 8.18182 21.2045 8.18182 20.4545C8.18182 19.7045 7.56818 19.0909 6.81818 19.0909H1.36364C0.613636 19.0909 0 19.7045 0 20.4545V25.9091C0 26.6591 0.613636 27.2727 1.36364 27.2727C2.11364 27.2727 2.72727 26.6591 2.72727 25.9091V23.6318C5.44091 27.4773 9.92727 30 15 30ZM15 0C7.22727 0 0.831818 5.91818 0.0681818 13.5C-6.60392e-08 14.3045 0.627273 15 1.43182 15C2.12727 15 2.71364 14.4818 2.78182 13.8C3.38182 7.58182 8.63182 2.72727 15 2.72727C19.2545 2.72727 23.0045 4.89545 25.2 8.18182H23.1818C22.4318 8.18182 21.8182 8.79545 21.8182 9.54545C21.8182 10.2955 22.4318 10.9091 23.1818 10.9091H28.6364C29.3864 10.9091 30 10.2955 30 9.54545V4.09091C30 3.34091 29.3864 2.72727 28.6364 2.72727C27.8864 2.72727 27.2727 3.34091 27.2727 4.09091V6.36818C24.5591 2.52273 20.0727 0 15 0ZM13.8 6.65455C13.8 5.98636 14.3455 5.45455 15 5.45455C15.6545 5.45455 16.2 5.98636 16.2 6.65455V7.15909C17.6591 7.41818 18.5864 8.19545 19.1455 8.93182C19.6091 9.53182 19.3636 10.4045 18.6545 10.7045C18.1636 10.9091 17.5909 10.7455 17.2636 10.3227C16.8818 9.80455 16.2 9.27273 15.0818 9.27273C14.1273 9.27273 12.6136 9.77727 12.6136 11.1682C12.6136 12.4636 13.7864 12.9545 16.2136 13.7591C19.4864 14.8909 20.3182 16.5545 20.3182 18.4636C20.3182 22.0364 16.9091 22.7318 16.2 22.8545V23.3591C16.2 24.0136 15.6682 24.5591 15 24.5591C14.3318 24.5591 13.8 24.0273 13.8 23.3591V22.7864C12.9409 22.5818 11.1682 21.9545 10.1318 19.9227C9.81818 19.3227 10.1727 18.5318 10.8 18.2864C11.3591 18.0682 12.0273 18.2727 12.3136 18.8045C12.75 19.6364 13.6091 20.6727 15.2045 20.6727C16.4727 20.6727 17.9045 20.0182 17.9045 18.4773C17.9045 17.1682 16.95 16.4864 14.7955 15.7091C13.2955 15.1773 10.2273 14.3045 10.2273 11.1955C10.2273 11.0591 10.2409 7.92273 13.8 7.15909V6.65455Z"
                      fill={
                        subMenuState === "single_origin" ||
                        q.sidebarSubMenu === "single_origin"
                          ? "#68b064"
                          : "#B05056"
                      }
                    />
                  </svg>
                  {/* <img src="/lkm/images/sidebar-icon-beranda-button.svg" /> */}
                  <p
                    className={`${
                      subMenuState === "single_origin" ||
                      q.sidebarSubMenu === "single_origin"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Single Origin
                  </p>
                </div>
                {/* <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenu(
                    "domestic-daily-summary-report",
                    "Price Report",
                    "Domestic Daily Summary Report",
                  )}>
                  <p
                    className={`text-2xl mr-2  ${
                      subMenuState === "domestic-daily-summary-report" ||
                      q.sidebarSubMenu === "domestic-daily-summary-report"
                        ? "text-mantis-600"
                        : "text-matrix-500"
                    }`}>
                    <i className="fa fa-file-pdf" />
                  </p>
                  <p
                    className={`${
                      subMenuState === "domestic-daily-summary-report" ||
                      q.sidebarSubMenu === "domestic-daily-summary-report"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg mx-2 px-1`}>
                    Reports
                  </p>
                </div> */}
              </div>
            ) : null}
          </div>
          <div
            className={`w-full mb-4 pr-2 ${
              !currentUserDontHavePrivilege(
                ["Basic Cocoa Statistic:Read"],
                currentUser,
              )
                ? "block"
                : "hidden"
            }`}>
            {menuState === "basic_cocoa_statistic" ? (
              <div>
                <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                  <div
                    className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                    onClick={selectSidebarMenu("basic_cocoa_statistic")}>
                    <img src="/lkm/images/menu-03_basic_cocoa_statistic_icon.svg" />
                    <p className={"text-black font-bold text-lg  mx-2"}>
                      Basic Cocoa Statistic
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarMenu("basic_cocoa_statistic")}>
                  <img src="/lkm/images/menu-03_basic_cocoa_statistic_icon.svg" />
                  <p className={"text-black font-bold text-lg  mx-2"}>
                    Basic Cocoa Statistic
                  </p>
                </div>
              </div>
            )}

            {menuState === "basic_cocoa_statistic" ? (
              <div className={`mt-2 mb-2${!showSubMenu ? "hidden" : "block"}`}>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenu(
                    "domestic",
                    "Domestic",
                    "Cultivated Area",
                  )}>
                  <svg
                    className="h-6"
                    // width="19"
                    // height="21"
                    viewBox="0 0 19 21"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M11.0083 3.0756L10.1443 1.36972C9.94025 0.969715 9.52025 0.722656 9.06425 0.722656H1.40825C0.748252 0.722656 0.208252 1.25207 0.208252 1.89913V19.5462C0.208252 20.1932 0.748252 20.7227 1.40825 20.7227C2.06825 20.7227 2.60825 20.1932 2.60825 19.5462V12.4874H8.60825L9.47225 14.1932C9.67625 14.5932 10.0963 14.8403 10.5403 14.8403H17.0083C17.6683 14.8403 18.2083 14.3109 18.2083 13.6638V4.25207C18.2083 3.60501 17.6683 3.0756 17.0083 3.0756H11.0083ZM15.8083 12.4874H11.0083L9.80825 10.1344H2.60825V3.0756H8.60825L9.80825 5.42854H15.8083V12.4874Z"
                      // fill="#74C46F"
                      fill={
                        subMenuState === "domestic" ||
                        q.sidebarSubMenu === "domestic"
                          ? "#68b064"
                          : "#B05056"
                      }
                    />
                  </svg>
                  {/* <img src="/lkm/images/sidebar-icon-beranda-button.svg" /> */}
                  <p
                    className={`${
                      subMenuState === "domestic" ||
                      q.sidebarSubMenu === "domestic"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Domestic
                  </p>
                </div>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenu(
                    "global",
                    "Global",
                    "Production",
                  )}>
                  {/* <img src="/lkm/images/sidebar-icon-beranda-button.svg" /> */}
                  <svg
                    className="h-6"
                    // width="18"
                    // height="19"
                    viewBox="0 0 18 19"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M8.991 0.554688C4.023 0.554688 0 4.58669 0 9.55469C0 14.5227 4.023 18.5547 8.991 18.5547C13.968 18.5547 18 14.5227 18 9.55469C18 4.58669 13.968 0.554688 8.991 0.554688ZM15.228 5.95469H12.573C12.285 4.82969 11.871 3.74969 11.331 2.75069C12.987 3.31769 14.364 4.46969 15.228 5.95469ZM9 2.39069C9.747 3.47069 10.332 4.66769 10.719 5.95469H7.281C7.668 4.66769 8.253 3.47069 9 2.39069ZM2.034 11.3547C1.89 10.7787 1.8 10.1757 1.8 9.55469C1.8 8.93369 1.89 8.33069 2.034 7.75469H5.076C5.004 8.34869 4.95 8.94269 4.95 9.55469C4.95 10.1667 5.004 10.7607 5.076 11.3547H2.034ZM2.772 13.1547H5.427C5.715 14.2797 6.129 15.3597 6.669 16.3587C5.013 15.7917 3.636 14.6487 2.772 13.1547ZM5.427 5.95469H2.772C3.636 4.46069 5.013 3.31769 6.669 2.75069C6.129 3.74969 5.715 4.82969 5.427 5.95469ZM9 16.7187C8.253 15.6387 7.668 14.4417 7.281 13.1547H10.719C10.332 14.4417 9.747 15.6387 9 16.7187ZM11.106 11.3547H6.894C6.813 10.7607 6.75 10.1667 6.75 9.55469C6.75 8.94269 6.813 8.33969 6.894 7.75469H11.106C11.187 8.33969 11.25 8.94269 11.25 9.55469C11.25 10.1667 11.187 10.7607 11.106 11.3547ZM11.331 16.3587C11.871 15.3597 12.285 14.2797 12.573 13.1547H15.228C14.364 14.6397 12.987 15.7917 11.331 16.3587ZM12.924 11.3547C12.996 10.7607 13.05 10.1667 13.05 9.55469C13.05 8.94269 12.996 8.34869 12.924 7.75469H15.966C16.11 8.33069 16.2 8.93369 16.2 9.55469C16.2 10.1757 16.11 10.7787 15.966 11.3547H12.924Z"
                      fill={
                        subMenuState === "global" ||
                        q.sidebarSubMenu === "global"
                          ? "#68b064"
                          : "#B05056"
                      }
                    />
                  </svg>
                  <p
                    className={`${
                      subMenuState === "global" || q.sidebarSubMenu === "global"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Global
                  </p>
                </div>
              </div>
            ) : null}
          </div>
          <div
            className={`w-full mb-4 pr-2 ${
              !currentUserDontHavePrivilege(["Trade Data:Read"], currentUser)
                ? "block"
                : "hidden"
            }`}>
            {menuState === "trade_data" ? (
              <div>
                <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                  <div
                    className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                    onClick={selectSidebarMenu("trade_data")}>
                    <img src="/lkm/images/menu-04_trade_data_icon.svg" />
                    <p className={"text-black font-bold text-lg  mx-2"}>
                      Trade Data
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarMenu("trade_data")}>
                  <img src="/lkm/images/menu-04_trade_data_icon.svg" />
                  <p className={"text-black font-bold text-lg  mx-2"}>
                    Trade Data
                  </p>
                </div>
              </div>
            )}
          </div>
          <div
            className={`w-full mb-4 pr-2 ${
              !currentUserDontHavePrivilege(["Entrepreneur:Read"], currentUser)
                ? "block"
                : "hidden"
            }`}>
            {menuState === "entrepreneur" ? (
              <div>
                <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                  <div
                    className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                    onClick={selectSidebarMenu("entrepreneur")}>
                    <img src="/lkm/images/menu-05_entrepreneur_icon.svg" />
                    <p className={"text-black font-bold text-lg  mx-2"}>
                      Entrepreneur
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarMenu("entrepreneur")}>
                  <img src="/lkm/images/menu-05_entrepreneur_icon.svg" />
                  <p className={"text-black font-bold text-lg  mx-2"}>
                    Entrepreneur
                  </p>
                </div>
              </div>
            )}

            {menuState === "entrepreneur" ||
            q.subMenuState === "production_and_sales" ? (
              <div className={`mt-2 ${!showSubMenu ? "hidden" : "block"}`}>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenu(
                    "production_and_sales",
                    "Production And Sales",
                    "",
                  )}>
                  {/* <img src="/lkm/images/sidebar-icon-beranda-button.svg" /> */}
                  <p
                    className={`text-2xl mr-1 ${
                      subMenuState === "production_and_sales" ||
                      q.sidebarSubMenu === "production_and_sales"
                        ? "text-mantis-600"
                        : "text-matrix-600"
                    }`}>
                    <i className="fa fa-boxes" />
                  </p>
                  <p
                    className={`${
                      subMenuState === "production_and_sales" ||
                      q.sidebarSubMenu === "production_and_sales"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Production And Sales
                  </p>
                </div>
              </div>
            ) : null}

            {menuState === "entrepreneur" ||
            q.subMenuState === "production_and_sales_report" ? (
              <div className={`mt-2 ${!showSubMenu ? "hidden" : "block"}`}>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenu(
                    "production_and_sales_report",
                    "Production And Sales",
                    "",
                  )}>
                  {/* <img src="/lkm/images/sidebar-icon-beranda-button.svg" /> */}
                  <p
                    className={`text-2xl mr-1 ${
                      subMenuState === "production_and_sales_report" ||
                      q.sidebarSubMenu === "production_and_sales_report"
                        ? "text-mantis-600"
                        : "text-matrix-600"
                    }`}>
                    <i className="fa fa-print" />
                  </p>
                  <p
                    className={`${
                      subMenuState === "production_and_sales_report" ||
                      q.sidebarSubMenu === "production_and_sales_report"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Production And Sales Report
                  </p>
                </div>
              </div>
            ) : null}
          </div>
          <div
            className={`w-full mb-4 pr-2 ${
              !currentUserDontHavePrivilege(["Profile:Read"], currentUser)
                ? "block"
                : "hidden"
            }`}>
            {menuState === "profile" ? (
              <div>
                <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                  <div
                    className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                    onClick={selectSidebarMenu("profile")}>
                    <img src="/lkm/images/menu-06_profile_icon.svg" />
                    <p className={"text-black font-bold text-lg  mx-2"}>
                      Profile
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarMenu("profile")}>
                  <img src="/lkm/images/menu-06_profile_icon.svg" />
                  <p className={"text-black font-bold text-lg  mx-2"}>
                    Profile
                  </p>
                </div>
              </div>
            )}

            {menuState === "profile" ? (
              <div className={`mt-2 ${!showSubMenu ? "hidden" : "block"}`}>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenu(
                    "entrepreneur",
                    "Entrepreneurs",
                    "",
                  )}>
                  <svg
                    className="h-6 ml-1"
                    // width="30"
                    // height="25"
                    viewBox="0 0 30 25"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M22.3668 15.8602C21.3515 15.8602 20.4956 15.5178 19.7991 14.8331C19.1025 14.1484 18.7543 13.2983 18.7543 12.2831C18.7543 11.2678 19.0966 10.4119 19.7814 9.71536C20.4661 9.01884 21.3161 8.67057 22.3314 8.67057C23.3466 8.67057 24.2025 9.01293 24.8991 9.69766C25.5956 10.3824 25.9439 11.2324 25.9439 12.2477C25.9439 13.2629 25.6015 14.1188 24.9168 14.8154C24.2321 15.5119 23.3821 15.8602 22.3668 15.8602ZM16.3814 24.3956C16.0272 24.3956 15.7262 24.2775 15.4782 24.0414C15.2303 23.8053 15.1064 23.4984 15.1064 23.1206V22.3414C15.1064 21.6803 15.2539 21.1136 15.5491 20.6414C15.8442 20.1692 16.2515 19.8032 16.7709 19.5435C17.6446 19.0949 18.5477 18.7584 19.4803 18.5341C20.413 18.3098 21.3751 18.1977 22.3668 18.1977C23.3348 18.1977 24.2793 18.3098 25.2001 18.5341C26.1209 18.7584 27.03 19.0949 27.9272 19.5435C28.4466 19.8032 28.8539 20.1692 29.1491 20.6414C29.4442 21.1136 29.5918 21.6803 29.5918 22.3414V23.1206C29.5918 23.4984 29.4678 23.8053 29.2199 24.0414C28.972 24.2775 28.6709 24.3956 28.3168 24.3956H16.3814ZM12.273 11.7518C10.5966 11.7518 9.2272 11.2206 8.1647 10.1581C7.1022 9.09557 6.57095 7.72613 6.57095 6.04974C6.57095 4.37335 7.1022 3.00391 8.1647 1.94141C9.2272 0.878906 10.5966 0.347656 12.273 0.347656C13.9494 0.347656 15.3189 0.878906 16.3814 1.94141C17.4439 3.00391 17.9751 4.37335 17.9751 6.04974C17.9751 7.72613 17.4439 9.09557 16.3814 10.1581C15.3189 11.2206 13.9494 11.7518 12.273 11.7518ZM1.68345 24.3956C1.32928 24.3956 1.02824 24.2775 0.780322 24.0414C0.532405 23.8053 0.408447 23.4984 0.408447 23.1206V20.6768C0.408447 19.7088 0.615044 18.847 1.02824 18.0914C1.44143 17.3358 2.04942 16.781 2.8522 16.4268C4.57581 15.6713 6.19317 15.1164 7.70428 14.7622C9.21539 14.4081 10.7383 14.231 12.273 14.231C12.8397 14.231 13.3709 14.2428 13.8668 14.2664C14.3626 14.29 14.6932 14.3136 14.8584 14.3372V16.2497C14.6932 16.3442 14.5692 16.4268 14.4866 16.4977C14.4039 16.5685 14.3036 16.6747 14.1855 16.8164H12.273C10.9036 16.8164 9.56956 16.964 8.27095 17.2591C6.97234 17.5543 5.55567 18.0678 4.02095 18.7997C3.69039 18.9414 3.43657 19.1834 3.25949 19.5258C3.08241 19.8681 2.99386 20.2046 2.99386 20.5352V21.8102H13.3355V24.3956H1.68345ZM12.273 9.16641C13.1703 9.16641 13.914 8.87127 14.5043 8.28099C15.0946 7.69071 15.3897 6.94696 15.3897 6.04974C15.3897 5.15252 15.0946 4.40877 14.5043 3.81849C13.914 3.22821 13.1703 2.93307 12.273 2.93307C11.3758 2.93307 10.6321 3.22821 10.0418 3.81849C9.4515 4.40877 9.15636 5.15252 9.15636 6.04974C9.15636 6.94696 9.4515 7.69071 10.0418 8.28099C10.6321 8.87127 11.3758 9.16641 12.273 9.16641Z"
                      // fill="#74C46F"
                      fill={
                        subMenuState === "entrepreneur" ||
                        q.sidebarSubMenu === "entrepreneur"
                          ? "#68b064"
                          : "#B05056"
                      }
                    />
                  </svg>
                  {/* <img src="/lkm/images/sidebar-icon-beranda-button.svg" /> */}
                  <p
                    className={`${
                      subMenuState === "entrepreneur" ||
                      q.sidebarSubMenu === "entrepreneur"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Entrepreneur
                  </p>
                </div>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenu(
                    "manufacture",
                    "Manufactures",
                    "",
                  )}>
                  <svg
                    className="h-8 ml-1"
                    // width="28"
                    // height="28"
                    viewBox="0 0 28 28"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M2.89989 27.5336C2.211 27.5336 1.63322 27.3003 1.16655 26.8336C0.699886 26.3669 0.466553 25.7892 0.466553 25.1003V12.8003C0.466553 12.3114 0.594331 11.8614 0.849886 11.4503C1.10544 11.0391 1.46655 10.7336 1.93322 10.5336L8.56655 7.70026C8.96655 7.5447 9.34433 7.57804 9.69989 7.80026C10.0554 8.02248 10.2332 8.35582 10.2332 8.80026V9.66693L15.2666 7.63359C15.6666 7.47804 16.0388 7.52248 16.3832 7.76693C16.7277 8.01137 16.8999 8.34471 16.8999 8.76693V11.1003H27.5666V25.1003C27.5666 25.7892 27.3277 26.3669 26.8499 26.8336C26.3721 27.3003 25.7999 27.5336 25.1332 27.5336H2.89989ZM25.1332 13.5336H14.4666V10.5669L7.79989 13.2336V10.6336L2.89989 12.8003V25.1003H25.1332V13.5336ZM13.9999 22.2003C14.3332 22.2003 14.6221 22.0836 14.8666 21.8503C15.111 21.6169 15.2332 21.3336 15.2332 21.0003V17.6669C15.2332 17.3336 15.111 17.0447 14.8666 16.8003C14.6221 16.5558 14.3332 16.4336 13.9999 16.4336C13.6666 16.4336 13.3832 16.5558 13.1499 16.8003C12.9166 17.0447 12.7999 17.3336 12.7999 17.6669V21.0003C12.7999 21.3336 12.9166 21.6169 13.1499 21.8503C13.3832 22.0836 13.6666 22.2003 13.9999 22.2003ZM8.66655 22.2003C8.99989 22.2003 9.28877 22.0836 9.53322 21.8503C9.77766 21.6169 9.89989 21.3336 9.89989 21.0003V17.6669C9.89989 17.3336 9.77766 17.0447 9.53322 16.8003C9.28877 16.5558 8.99989 16.4336 8.66655 16.4336C8.33322 16.4336 8.04989 16.5558 7.81655 16.8003C7.58322 17.0447 7.46655 17.3336 7.46655 17.6669V21.0003C7.46655 21.3336 7.58322 21.6169 7.81655 21.8503C8.04989 22.0836 8.33322 22.2003 8.66655 22.2003ZM19.3332 22.2003C19.6666 22.2003 19.9554 22.0836 20.1999 21.8503C20.4443 21.6169 20.5666 21.3336 20.5666 21.0003V17.6669C20.5666 17.3336 20.4443 17.0447 20.1999 16.8003C19.9554 16.5558 19.6666 16.4336 19.3332 16.4336C18.9999 16.4336 18.7166 16.5558 18.4832 16.8003C18.2499 17.0447 18.1332 17.3336 18.1332 17.6669V21.0003C18.1332 21.3336 18.2499 21.6169 18.4832 21.8503C18.7166 22.0836 18.9999 22.2003 19.3332 22.2003V22.2003ZM27.5666 11.1003H21.1666L22.3666 1.50026C22.3888 1.18915 22.511 0.933594 22.7332 0.733594C22.9554 0.533594 23.2221 0.433594 23.5332 0.433594H25.1666C25.4554 0.433594 25.711 0.533594 25.9332 0.733594C26.1554 0.933594 26.2888 1.17804 26.3332 1.46693L27.5666 11.1003ZM25.1332 25.1003H2.89989H25.1332Z"
                      fill={
                        subMenuState === "manufacture" ||
                        q.sidebarSubMenu === "manufacture"
                          ? "#68b064"
                          : "#B05056"
                      }
                    />
                  </svg>
                  {/* <img src="/lkm/images/sidebar-icon-beranda-button.svg" /> */}
                  <p
                    className={`${
                      subMenuState === "manufacture" ||
                      q.sidebarSubMenu === "manufacture"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Manufacture
                  </p>
                </div>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenu("grinders", "Grinders", "")}>
                  <svg
                    className="h-8 ml-1"
                    // width="27"
                    // height="28"
                    viewBox="0 0 27 28"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M3.71579 28C3.13858 28 2.65757 27.8011 2.27276 27.4033C1.88796 27.0055 1.69555 26.5293 1.69555 25.9748C1.69555 25.4202 1.88796 24.9441 2.27276 24.5463C2.65757 24.1485 3.13858 23.9496 3.71579 23.9496H6.27715L2.52529 10.7133C1.70758 10.3516 1.08227 9.83928 0.649361 9.17626C0.216454 8.51324 0 7.67543 0 6.66282C0 5.45733 0.43892 4.41458 1.31676 3.53457C2.1946 2.65456 3.23478 2.21456 4.4373 2.21456C5.49551 2.21456 6.3974 2.49785 7.14297 3.06443C7.88853 3.63101 8.39359 4.38444 8.65814 5.32472H13.7809V3.40799C13.7809 3.04635 13.9011 2.73895 14.1416 2.48579C14.3821 2.23264 14.6948 2.10606 15.0796 2.10606C15.3923 2.10606 15.6388 2.19647 15.8191 2.3773C15.9995 2.55812 16.1138 2.78114 16.1619 3.04635L18.8675 0.406321C19.084 0.213443 19.3485 0.0868663 19.6612 0.0265917C19.9738 -0.0336828 20.2985 0.00850918 20.6352 0.153168L26.4434 2.93785C26.6599 3.0584 26.8222 3.25128 26.9304 3.51649C27.0387 3.78169 27.0206 4.0469 26.8763 4.31211C26.732 4.57732 26.5276 4.74006 26.263 4.80033C25.9985 4.86061 25.7459 4.83047 25.5054 4.70992L19.9498 2.03373L16.4144 5.65021V7.49461L19.9498 11.2919L25.5054 8.57955C25.77 8.459 26.0225 8.43489 26.263 8.50722C26.5035 8.57955 26.708 8.74832 26.8763 9.01352C26.9966 9.27873 27.0086 9.55599 26.9124 9.84531C26.8162 10.1346 26.6478 10.3396 26.4073 10.4601L20.7795 13.1363C20.4188 13.3051 20.0701 13.3834 19.7333 13.3714C19.3966 13.3593 19.108 13.2207 18.8675 12.9555L16.1619 10.3155C16.1138 10.653 15.9935 10.8941 15.8011 11.0387C15.6087 11.1834 15.3682 11.2557 15.0796 11.2557C14.6948 11.2557 14.3821 11.1292 14.1416 10.876C13.9011 10.6229 13.7809 10.3155 13.7809 9.95381V7.96475H8.58599C8.61004 8.22995 8.5439 8.50119 8.38757 8.77845C8.23125 9.05572 8.0689 9.26668 7.90055 9.41133L15.4404 23.9496H19.0479C19.6011 23.9496 20.0761 24.1485 20.4729 24.5463C20.8697 24.9441 21.0681 25.4202 21.0681 25.9748C21.0681 26.5293 20.8697 27.0055 20.4729 27.4033C20.0761 27.8011 19.6011 28 19.0479 28H3.71579ZM4.4373 8.47105C4.94236 8.47105 5.36925 8.30228 5.71798 7.96475C6.06671 7.62721 6.24108 7.19323 6.24108 6.66282C6.24108 6.1324 6.06671 5.69842 5.71798 5.36089C5.36925 5.02335 4.94236 4.85458 4.4373 4.85458C3.90819 4.85458 3.47528 5.02335 3.13858 5.36089C2.80187 5.69842 2.63352 6.1324 2.63352 6.66282C2.63352 7.19323 2.80187 7.62721 3.13858 7.96475C3.47528 8.30228 3.90819 8.47105 4.4373 8.47105ZM9.19927 23.9496H12.4822L6.45753 12.1599C6.40943 12.2081 6.30721 12.2563 6.15089 12.3045C5.99456 12.3527 5.8683 12.3889 5.77209 12.413L9.19927 23.9496Z"
                      fill={
                        subMenuState === "grinders" ||
                        q.sidebarSubMenu === "grinders"
                          ? "#68b064"
                          : "#B05056"
                      }
                    />
                  </svg>
                  {/* <img src="/lkm/images/sidebar-icon-beranda-button.svg" /> */}
                  <p
                    className={`${
                      subMenuState === "grinders" ||
                      q.sidebarSubMenu === "grinders"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Grinders
                  </p>
                </div>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenu("traders", "Traders", "")}>
                  <svg
                    className="h-8 ml-1 mr-1"
                    // width="24"
                    // height="30"
                    viewBox="0 0 24 30"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M2.50937 29.4547C1.84479 29.4547 1.26042 29.2026 0.75625 28.6984C0.252084 28.1943 0 27.6099 0 26.9453V8.93281C0 8.26823 0.252084 7.68385 0.75625 7.17969C1.26042 6.67552 1.84479 6.42344 2.50937 6.42344H6.15313V6.07969C6.15313 4.61302 6.66875 3.36979 7.7 2.35C8.73125 1.33021 10.0031 0.820312 11.5156 0.820312C13.0052 0.820312 14.2771 1.33021 15.3312 2.35C16.3854 3.36979 16.9125 4.61302 16.9125 6.07969V6.42344H20.5219C21.1865 6.42344 21.7708 6.67552 22.275 7.17969C22.7792 7.68385 23.0312 8.26823 23.0312 8.93281V26.9453C23.0312 27.6099 22.7792 28.1943 22.275 28.6984C21.7708 29.2026 21.1865 29.4547 20.5219 29.4547H2.50937ZM2.50937 26.9453H20.5219V8.93281H16.9125V11.8203C16.9125 12.1641 16.7865 12.4563 16.5344 12.6969C16.2823 12.9375 15.9844 13.0578 15.6406 13.0578C15.2969 13.0578 15.0047 12.9375 14.7641 12.6969C14.5234 12.4563 14.4031 12.1641 14.4031 11.8203V8.93281H8.6625V11.8203C8.6625 12.1641 8.53646 12.4563 8.28437 12.6969C8.03229 12.9375 7.73438 13.0578 7.39062 13.0578C7.04688 13.0578 6.75469 12.9375 6.51406 12.6969C6.27344 12.4563 6.15313 12.1641 6.15313 11.8203V8.93281H2.50937V26.9453ZM8.6625 6.42344H14.4031V6.07969C14.4031 5.32344 14.1224 4.67604 13.5609 4.1375C12.9995 3.59896 12.3177 3.32969 11.5156 3.32969C10.7135 3.32969 10.0375 3.59896 9.4875 4.1375C8.9375 4.67604 8.6625 5.32344 8.6625 6.07969V6.42344ZM2.50937 26.9453V8.93281V26.9453Z"
                      fill={
                        subMenuState === "traders" ||
                        q.sidebarSubMenu === "traders"
                          ? "#68b064"
                          : "#B05056"
                      }
                    />
                  </svg>
                  {/* <img src="/lkm/images/sidebar-icon-beranda-button.svg" /> */}
                  <p
                    className={`${
                      subMenuState === "traders" ||
                      q.sidebarSubMenu === "traders"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Traders
                  </p>
                </div>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenu(
                    "cocoa_warehouse",
                    "Cocoa Warehouse",
                    "Cocoa Warehouse",
                  )}>
                  <svg
                    className="h-6 ml-1 mr-1"
                    // width="28"
                    // height="26"
                    viewBox="0 0 28 26"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M13.9828 2.57497L2.51415 7.3315V23.3893H6.02706V14.663C6.02706 13.9477 6.26814 13.3338 6.75031 12.8212C7.23247 12.3086 7.82944 12.0523 8.54121 12.0523H19.4588C20.1476 12.0523 20.7388 12.3086 21.2325 12.8212C21.7261 13.3338 21.9729 13.9477 21.9729 14.663V23.3893H25.4859V7.3315L13.9828 2.57497ZM8.54121 26H2.51415C1.80238 26 1.20541 25.7497 0.723247 25.249C0.241082 24.7483 0 24.1284 0 23.3893V7.36726C0 6.84273 0.143501 6.35993 0.430504 5.91885C0.717507 5.47776 1.10209 5.14993 1.58426 4.93535L13.0873 0.178817C13.3629 0.0596057 13.6613 0 13.9828 0C14.3042 0 14.6142 0.0596057 14.9127 0.178817L26.3813 4.93535C26.8635 5.14993 27.2538 5.47776 27.5523 5.91885C27.8508 6.35993 28 6.84273 28 7.36726V23.3893C28 24.1284 27.7532 24.7483 27.2595 25.249C26.7659 25.7497 26.1747 26 25.4859 26H19.4588V14.663H8.54121V26ZM10.1599 26V23.3893H12.674V26H10.1599ZM12.7429 21.3508V18.74H15.2571V21.3508H12.7429ZM15.326 26V23.3893H17.8401V26H15.326ZM19.4588 12.0523H8.54121H19.4588Z"
                      fill={
                        subMenuState === "cocoa_warehouse" ||
                        q.sidebarSubMenu === "cocoa_warehouse"
                          ? "#68b064"
                          : "#B05056"
                      }
                    />
                  </svg>
                  {/* <img src="/lkm/images/sidebar-icon-beranda-button.svg" /> */}
                  <p
                    className={`${
                      subMenuState === "cocoa_warehouse" ||
                      q.sidebarSubMenu === "cocoa_warehouse"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Cocoa Warehouse
                  </p>
                </div>

                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenu(
                    "smallholder",
                    "Smallholder",
                    "",
                  )}>
                  <p
                    className={`text-2xl mr-1 ${
                      subMenuState === "smallholder" ||
                      q.sidebarSubMenu === "smallholder"
                        ? "text-mantis-600"
                        : "text-matrix-600"
                    }`}>
                    <i className="fa fa-tractor" />
                  </p>

                  {/* <img src="/lkm/images/sidebar-icon-beranda-button.svg" /> */}
                  <p
                    className={`${
                      subMenuState === "smallholder" ||
                      q.sidebarSubMenu === "smallholder"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg ml-2`}>
                    Smallholder
                  </p>
                </div>
              </div>
            ) : null}
          </div>
          <div
            className={`w-full mb-4 pr-2 ${
              !currentUserDontHavePrivilege(["Master Data:Read"], currentUser)
                ? "block"
                : "hidden"
            }`}>
            {menuState === "master_data" ? (
              <div>
                <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                  <div
                    className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                    onClick={selectSidebarMenu("master_data")}>
                    <img src="/lkm/images/menu-07_master-data_icon.svg" />
                    <p className={"text-black font-bold text-lg  mx-2"}>
                      Master Data
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarMenu("master_data")}>
                  <img src="/lkm/images/menu-07_master-data_icon.svg" />
                  <p className={"text-black font-bold text-lg  mx-2"}>
                    Master Data
                  </p>
                </div>
              </div>
            )}

            {menuState === "master_data" ? (
              <div className={`mt-2 ${!showSubMenu ? "hidden" : "block"}`}>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenu(
                    "location",
                    "Location",
                    "Country Region",
                  )}>
                  <svg
                    className="h-8"
                    // width="25"
                    // height="25"
                    viewBox="0 0 25 25"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M11.9833 17.6104C13.9502 16.019 15.4254 14.4955 16.4088 13.04C17.3923 11.5844 17.884 10.2259 17.884 8.96442C17.884 7.8582 17.6815 6.91695 17.2766 6.14065C16.8716 5.36436 16.3703 4.73362 15.7725 4.24844C15.1747 3.76326 14.5335 3.40907 13.849 3.18589C13.1644 2.96271 12.5425 2.85111 11.9833 2.85111C11.4241 2.85111 10.8022 2.96271 10.1176 3.18589C9.43308 3.40907 8.79191 3.76326 8.19413 4.24844C7.59634 4.73362 7.0998 5.36436 6.70449 6.14065C6.30918 6.91695 6.11153 7.8582 6.11153 8.96442C6.11153 10.2259 6.59843 11.5844 7.57224 13.04C8.54605 14.4955 10.0164 16.019 11.9833 17.6104ZM11.9833 19.9101C11.8483 19.9101 11.7037 19.8956 11.5494 19.8665C11.3952 19.8374 11.2602 19.7743 11.1445 19.6773C8.71478 17.7753 6.9166 15.9414 5.74996 14.1753C4.58332 12.4092 4 10.6723 4 8.96442C4 7.60591 4.24104 6.41721 4.72313 5.39832C5.20521 4.37944 5.8271 3.52552 6.58879 2.83656C7.35048 2.1476 8.20377 1.6236 9.14865 1.26457C10.0935 0.905531 11.0384 0.726013 11.9833 0.726013C12.9089 0.726013 13.849 0.905531 14.8035 1.26457C15.758 1.6236 16.6161 2.1476 17.3778 2.83656C18.1395 3.52552 18.7662 4.37944 19.2579 5.39832C19.7497 6.41721 19.9955 7.60591 19.9955 8.96442C19.9955 10.6723 19.4074 12.4092 18.2311 14.1753C17.0548 15.9414 15.2518 17.7753 12.8221 19.6773C12.7064 19.7743 12.5714 19.8374 12.4172 19.8665C12.2629 19.8956 12.1183 19.9101 11.9833 19.9101ZM11.9833 11.0022C12.6004 11.0022 13.1258 10.7839 13.5597 10.3472C13.9936 9.91053 14.2105 9.39138 14.2105 8.78975C14.2105 8.16872 13.9936 7.63987 13.5597 7.20321C13.1258 6.76654 12.6004 6.54821 11.9833 6.54821C11.3855 6.54821 10.8697 6.76654 10.4358 7.20321C10.0019 7.63987 9.785 8.16872 9.785 8.78975C9.785 9.39138 10.0019 9.91053 10.4358 10.3472C10.8697 10.7839 11.3855 11.0022 11.9833 11.0022ZM5.0413 24.6843C4.75205 24.6843 4.50619 24.5825 4.30371 24.3787C4.10124 24.1749 4 23.9275 4 23.6364C4 23.3452 4.10124 23.0929 4.30371 22.8795C4.50619 22.666 4.75205 22.5592 5.0413 22.5592H18.9253C19.2146 22.5592 19.4652 22.666 19.6774 22.8795C19.8895 23.0929 19.9955 23.3452 19.9955 23.6364C19.9955 23.9275 19.8895 24.1749 19.6774 24.3787C19.4652 24.5825 19.2146 24.6843 18.9253 24.6843H5.0413Z"
                      fill={
                        subMenuState === "location" ||
                        q.sidebarSubMenu === "location"
                          ? "#68b064"
                          : "#B05056"
                      }
                    />
                  </svg>
                  {/* <img src="/lkm/images/sidebar-icon-beranda-button.svg" /> */}
                  <p
                    className={`${
                      subMenuState === "location" ||
                      q.sidebarSubMenu === "location"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Location
                  </p>
                </div>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenu("centre", "Centre", "")}>
                  <svg
                    className="h-6 mr-1 pl-1"
                    // width="22"
                    // height="21"
                    viewBox="0 0 22 21"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M2.68921 2.24136C2.37083 2.24136 2.10717 2.1339 1.89823 1.91898C1.68929 1.70405 1.58482 1.43284 1.58482 1.10533C1.58482 0.798294 1.68929 0.537314 1.89823 0.322388C2.10717 0.107463 2.37083 0 2.68921 0H20.2103C20.5088 0 20.7625 0.107463 20.9715 0.322388C21.1804 0.537314 21.2849 0.798294 21.2849 1.10533C21.2849 1.43284 21.1804 1.70405 20.9715 1.91898C20.7625 2.1339 20.5088 2.24136 20.2103 2.24136H2.68921ZM2.80861 20.5714C2.51012 20.5714 2.25641 20.464 2.04747 20.249C1.83853 20.0341 1.73406 19.7731 1.73406 19.4661V12.5885H1.07739C0.719209 12.5885 0.435648 12.4503 0.226708 12.174C0.0177681 11.8977 -0.046904 11.5855 0.0326922 11.2375L1.40573 4.94328C1.44552 4.69765 1.56989 4.49296 1.77883 4.32921C1.98777 4.16546 2.21164 4.08358 2.45043 4.08358H20.4193C20.6581 4.08358 20.8769 4.16546 21.0759 4.32921C21.2749 4.49296 21.4043 4.69765 21.464 4.94328L22.837 11.2375C22.8967 11.5855 22.8221 11.8977 22.6131 12.174C22.4042 12.4503 22.1306 12.5885 21.7923 12.5885H21.1058V19.4354C21.1058 19.7629 21.0013 20.0341 20.7924 20.249C20.5834 20.464 20.3297 20.5714 20.0312 20.5714C19.7128 20.5714 19.4492 20.464 19.2402 20.249C19.0313 20.0341 18.9268 19.7629 18.9268 19.4354V12.5885H13.6138V19.4661C13.6138 19.7731 13.5093 20.0341 13.3004 20.249C13.0914 20.464 12.8377 20.5714 12.5392 20.5714H2.80861ZM3.91301 18.3301H11.4348V12.5885H3.91301V18.3301ZM2.36088 10.3471H20.479H2.36088ZM2.36088 10.3471H20.479L19.6134 6.32495H3.25634L2.36088 10.3471Z"
                      fill={
                        subMenuState === "centre" ||
                        q.sidebarSubMenu === "centre"
                          ? "#68b064"
                          : "#B05056"
                      }
                    />
                  </svg>
                  {/* <img src="/lkm/images/sidebar-icon-beranda-button.svg" /> */}
                  <p
                    className={`${
                      subMenuState === "centre" || q.sidebarSubMenu === "centre"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Centre
                  </p>
                </div>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenu("buyer", "Buyer", "")}>
                  <svg
                    className="h-6 mr-1 pl-1"
                    // width="22"
                    // height="21"
                    viewBox="0 0 22 21"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M2.68921 2.24136C2.37083 2.24136 2.10717 2.1339 1.89823 1.91898C1.68929 1.70405 1.58482 1.43284 1.58482 1.10533C1.58482 0.798294 1.68929 0.537314 1.89823 0.322388C2.10717 0.107463 2.37083 0 2.68921 0H20.2103C20.5088 0 20.7625 0.107463 20.9715 0.322388C21.1804 0.537314 21.2849 0.798294 21.2849 1.10533C21.2849 1.43284 21.1804 1.70405 20.9715 1.91898C20.7625 2.1339 20.5088 2.24136 20.2103 2.24136H2.68921ZM2.80861 20.5714C2.51012 20.5714 2.25641 20.464 2.04747 20.249C1.83853 20.0341 1.73406 19.7731 1.73406 19.4661V12.5885H1.07739C0.719209 12.5885 0.435648 12.4503 0.226708 12.174C0.0177681 11.8977 -0.046904 11.5855 0.0326922 11.2375L1.40573 4.94328C1.44552 4.69765 1.56989 4.49296 1.77883 4.32921C1.98777 4.16546 2.21164 4.08358 2.45043 4.08358H20.4193C20.6581 4.08358 20.8769 4.16546 21.0759 4.32921C21.2749 4.49296 21.4043 4.69765 21.464 4.94328L22.837 11.2375C22.8967 11.5855 22.8221 11.8977 22.6131 12.174C22.4042 12.4503 22.1306 12.5885 21.7923 12.5885H21.1058V19.4354C21.1058 19.7629 21.0013 20.0341 20.7924 20.249C20.5834 20.464 20.3297 20.5714 20.0312 20.5714C19.7128 20.5714 19.4492 20.464 19.2402 20.249C19.0313 20.0341 18.9268 19.7629 18.9268 19.4354V12.5885H13.6138V19.4661C13.6138 19.7731 13.5093 20.0341 13.3004 20.249C13.0914 20.464 12.8377 20.5714 12.5392 20.5714H2.80861ZM3.91301 18.3301H11.4348V12.5885H3.91301V18.3301ZM2.36088 10.3471H20.479H2.36088ZM2.36088 10.3471H20.479L19.6134 6.32495H3.25634L2.36088 10.3471Z"
                      fill={
                        subMenuState === "buyer" || q.sidebarSubMenu === "buyer"
                          ? "#68b064"
                          : "#B05056"
                      }
                    />
                  </svg>
                  {/* <img src="/lkm/images/sidebar-icon-beranda-button.svg" /> */}
                  <p
                    className={`${
                      subMenuState === "buyer" || q.sidebarSubMenu === "buyer"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Buyer
                  </p>
                </div>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenu(
                    "product",
                    "Product",
                    "Local Product",
                  )}>
                  <svg
                    className="h-6 pl-2 mr-1"
                    // width="21"
                    // height="24"
                    viewBox="0 0 21 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M8.42768 23.8421H1.70622C1.25812 23.8421 0.861726 23.6484 0.517036 23.2609C0.172345 22.8734 0 22.4278 0 21.9241V4.42977C0 3.92606 0.168037 3.48047 0.50411 3.093C0.840183 2.70552 1.20642 2.51179 1.60281 2.51179H6.66976C6.84211 1.81434 7.18249 1.24766 7.69091 0.811757C8.19933 0.375851 8.78099 0.157898 9.4359 0.157898C10.0736 0.157898 10.6466 0.375851 11.155 0.811757C11.6635 1.24766 12.0125 1.81434 12.202 2.51179H17.269C17.7171 2.51179 18.1135 2.70552 18.4582 3.093C18.8029 3.48047 18.9752 3.92606 18.9752 4.42977V10.5906H17.088V4.6332H14.6321V6.6093C14.6321 7.20988 14.4511 7.7136 14.0892 8.12044C13.7273 8.52729 13.2792 8.73071 12.7449 8.73071H6.23028C5.69601 8.73071 5.24791 8.52729 4.88599 8.12044C4.52406 7.7136 4.3431 7.20988 4.3431 6.6093V4.6332H1.88718V21.7207H8.42768V23.8421ZM13.3654 19.948L18.9494 13.671C19.1217 13.4772 19.3371 13.3852 19.5957 13.3949C19.8542 13.4046 20.0782 13.5063 20.2678 13.7C20.4401 13.9131 20.5263 14.1698 20.5263 14.4701C20.5263 14.7704 20.4401 15.0174 20.2678 15.2112L14.0375 22.2147C13.8479 22.4278 13.6239 22.5344 13.3654 22.5344C13.1069 22.5344 12.8914 22.4278 12.7191 22.2147L9.64272 18.7565C9.45314 18.5628 9.36266 18.3158 9.37127 18.0155C9.37989 17.7152 9.47899 17.4585 9.66857 17.2454C9.84091 17.0517 10.0607 16.9548 10.3278 16.9548C10.5949 16.9548 10.8233 17.0517 11.0129 17.2454L13.3654 19.948ZM9.74612 4.48789C10.0219 4.48789 10.2632 4.3765 10.47 4.1537C10.6768 3.9309 10.7802 3.65483 10.7802 3.32548C10.7802 3.0155 10.6768 2.74427 10.47 2.51179C10.2632 2.27931 10.0219 2.16306 9.74612 2.16306C9.45314 2.16306 9.20754 2.27931 9.00935 2.51179C8.81115 2.74427 8.71205 3.0155 8.71205 3.32548C8.71205 3.65483 8.81115 3.9309 9.00935 4.1537C9.20754 4.3765 9.45314 4.48789 9.74612 4.48789Z"
                      fill={
                        subMenuState === "product" ||
                        q.sidebarSubMenu === "product"
                          ? "#68b064"
                          : "#B05056"
                      }
                    />
                  </svg>
                  {/* <img src="/lkm/images/sidebar-icon-beranda-button.svg" /> */}
                  <p
                    className={`${
                      subMenuState === "product" ||
                      q.sidebarSubMenu === "product"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Product
                  </p>
                </div>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenu(
                    "employment",
                    "Employment",
                    "Category",
                  )}>
                  <svg
                    className="h-8 pl-1"
                    // width="26"
                    // height="28"
                    viewBox="0 0 26 28"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M21.3333 19.7067V12.6667L25.3333 8.66669L20 3.33335L16 7.33335H6.66667V6.00002H10.6667V0.666687H0V6.00002H4V14H0V19.3334H4V26H9.70667C9.93935 26.4031 10.2735 26.7382 10.6758 26.9721C11.0781 27.206 11.5346 27.3305 12 27.3334C12.4688 27.3362 12.93 27.2154 13.3372 26.9831C13.7444 26.7509 14.0832 26.4154 14.3194 26.0105C14.5556 25.6056 14.6809 25.1456 14.6827 24.6768C14.6845 24.208 14.5626 23.7471 14.3295 23.3404C14.0963 22.9337 13.76 22.5957 13.3546 22.3604C12.9492 22.1251 12.4889 22.0008 12.0201 22.0001C11.5513 21.9994 11.0906 22.1222 10.6845 22.3563C10.2783 22.5904 9.94106 22.9274 9.70667 23.3334H6.66667V19.3334H10.6667V14H6.66667V10H16L18.6667 12.6667V19.6934C18.1583 19.9869 17.761 20.4399 17.5363 20.9823C17.3117 21.5246 17.2723 22.1259 17.4242 22.6929C17.5761 23.26 17.9109 23.761 18.3766 24.1184C18.8424 24.4757 19.413 24.6694 20 24.6694C20.587 24.6694 21.1576 24.4757 21.6234 24.1184C22.0891 23.761 22.4239 23.26 22.5758 22.6929C22.7277 22.1259 22.6883 21.5246 22.4637 20.9823C22.239 20.4399 21.8417 19.9869 21.3333 19.6934V19.7067ZM1.33333 4.66669V2.00002H9.33333V4.66669H1.33333ZM12 23.3334C12.2637 23.3334 12.5215 23.4116 12.7408 23.5581C12.96 23.7046 13.1309 23.9128 13.2318 24.1564C13.3328 24.4001 13.3592 24.6682 13.3077 24.9268C13.2563 25.1854 13.1293 25.423 12.9428 25.6095C12.7563 25.796 12.5188 25.923 12.2601 25.9744C12.0015 26.0258 11.7334 25.9994 11.4898 25.8985C11.2461 25.7976 11.0379 25.6267 10.8914 25.4074C10.7449 25.1882 10.6667 24.9304 10.6667 24.6667C10.6667 24.3131 10.8071 23.9739 11.0572 23.7239C11.3072 23.4738 11.6464 23.3334 12 23.3334ZM9.33333 15.3334V18H1.33333V15.3334H9.33333ZM20 5.21335L23.4533 8.66669L20 12.12L16.5467 8.66669L20 5.21335ZM20 23.3334C19.7363 23.3334 19.4785 23.2552 19.2592 23.1086C19.04 22.9621 18.8691 22.7539 18.7682 22.5103C18.6672 22.2666 18.6408 21.9985 18.6923 21.7399C18.7437 21.4813 18.8707 21.2437 19.0572 21.0572C19.2437 20.8707 19.4812 20.7438 19.7399 20.6923C19.9985 20.6409 20.2666 20.6673 20.5102 20.7682C20.7539 20.8691 20.9621 21.04 21.1086 21.2593C21.2551 21.4785 21.3333 21.7363 21.3333 22C21.3333 22.3536 21.1929 22.6928 20.9428 22.9428C20.6928 23.1929 20.3536 23.3334 20 23.3334Z"
                      // fill="#B05056"
                      fill={
                        subMenuState === "employment" ||
                        q.sidebarSubMenu === "employment"
                          ? "#68b064"
                          : "#B05056"
                      }
                    />
                  </svg>
                  {/* <img src="/lkm/images/sidebar-icon-beranda-button.svg" /> */}
                  <p
                    className={`${
                      subMenuState === "employment" ||
                      q.sidebarSubMenu === "employment"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Employment
                  </p>
                </div>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenu(
                    "agri_input_type",
                    "Agri Input",
                    "Agri Input Type",
                  )}>
                  <svg
                    className="h-6 ml-1 mr-1"
                    // width="24"
                    // height="22"
                    viewBox="0 0 24 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M2.08325 21.5C1.59714 21.5 1.18395 21.3299 0.843669 20.9896C0.503391 20.6493 0.333252 20.2361 0.333252 19.75V2.25C0.333252 1.76389 0.503391 1.35069 0.843669 1.01042C1.18395 0.670139 1.59714 0.5 2.08325 0.5H9.95825C10.4444 0.5 10.8576 0.670139 11.1978 1.01042C11.5381 1.35069 11.7083 1.76389 11.7083 2.25V5.3125H21.9166C22.4027 5.3125 22.8159 5.48264 23.1562 5.82292C23.4964 6.16319 23.6666 6.57639 23.6666 7.0625V19.75C23.6666 20.2361 23.4964 20.6493 23.1562 20.9896C22.8159 21.3299 22.4027 21.5 21.9166 21.5H2.08325ZM2.08325 19.75H5.14575V16.6875H2.08325V19.75ZM2.08325 14.9375H5.14575V11.875H2.08325V14.9375ZM2.08325 10.125H5.14575V7.0625H2.08325V10.125ZM2.08325 5.3125H5.14575V2.25H2.08325V5.3125ZM6.89575 19.75H9.95825V16.6875H6.89575V19.75ZM6.89575 14.9375H9.95825V11.875H6.89575V14.9375ZM6.89575 10.125H9.95825V7.0625H6.89575V10.125ZM6.89575 5.3125H9.95825V2.25H6.89575V5.3125ZM11.7083 19.75H21.9166V7.0625H11.7083V10.125H14.0416V11.875H11.7083V14.9375H14.0416V16.6875H11.7083V19.75ZM17.1041 11.875V10.125H18.8541V11.875H17.1041ZM17.1041 16.6875V14.9375H18.8541V16.6875H17.1041Z"
                      // fill="#B05056"
                      fill={
                        subMenuState === "agri_input_type" ||
                        q.sidebarSubMenu === "agri_input_type"
                          ? "#68b064"
                          : "#B05056"
                      }
                    />
                  </svg>
                  {/* <img src="/lkm/images/sidebar-icon-beranda-button.svg" /> */}
                  <p
                    className={`${
                      subMenuState === "agri_input_type" ||
                      q.sidebarSubMenu === "agri_input_type"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Agri Input
                  </p>
                </div>
              </div>
            ) : null}
          </div>
          <div
            className={`w-full mb-4 pr-2 ${
              !currentUserDontHavePrivilege(
                ["User Management:Read"],
                currentUser,
              )
                ? "block"
                : "block"
            }`}>
            {menuState === "user_management" ? (
              <div>
                <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                  <div
                    className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                    onClick={selectSidebarMenu("user_management")}>
                    <img src="/lkm/images/menu-06_profile_icon.svg" />
                    <p className={"text-black font-bold text-lg  mx-2"}>
                      User Management
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarMenu("user_management")}>
                  <img src="/lkm/images/menu-06_profile_icon.svg" />
                  <p className={"text-black font-bold text-lg  mx-2"}>
                    User Management
                  </p>
                </div>
              </div>
            )}
          </div>

          <div
            className={`w-full mb-4 pr-2 ${
              !currentUserDontHavePrivilege(
                ["Unstructured Document:Read"],
                currentUser,
              )
                ? "block"
                : "hidden"
            }`}>
            {menuState === "unstructured_document" ? (
              <div>
                <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                  <div
                    className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                    onClick={selectSidebarMenu("unstructured_document")}>
                    <img src="/lkm/images/menu-08_unstructured-document_icon.svg" />
                    <p className={"text-black font-bold text-lg  mx-2"}>
                      Unstructured Document
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarMenu("unstructured_document")}>
                  <img src="/lkm/images/menu-08_unstructured-document_icon.svg" />
                  <p className={"text-black font-bold text-lg  mx-2"}>
                    Unstructured Document
                  </p>
                </div>
              </div>
            )}

            {menuState === "unstructured_document" ? (
              <div className={`mt-2 ${!showSubMenu ? "hidden" : "block"}`}>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenu("tariff", "Tariff", "")}>
                  {/* <img src="/lkm/images/sidebar-icon-beranda-button.svg" /> */}
                  <p
                    className={`${
                      subMenuState === "tariff" || q.sidebarSubMenu === "tariff"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-xl mx-2`}>
                    <i className="fa fa-file" /> Tariff
                  </p>
                </div>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenu(
                    "incentives",
                    "Incentives For Investment",
                    "",
                  )}>
                  {/* <img src="/lkm/images/sidebar-icon-beranda-button.svg" /> */}
                  <p
                    className={`${
                      subMenuState === "incentives" ||
                      q.sidebarSubMenu === "incentives"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-xl mx-2`}>
                    <i className="fa fa-file" /> Incentive For Investment
                  </p>
                </div>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenu(
                    "international_cocoa_standard",
                    "International Cocoa Standard",
                    "",
                  )}>
                  {/* <img src="/lkm/images/sidebar-icon-beranda-button.svg" /> */}
                  <p
                    className={`${
                      subMenuState === "international_cocoa_standard" ||
                      q.sidebarSubMenu === "international_cocoa_standard"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-xl mx-2`}>
                    <i className="fa fa-file" /> International Cocoa Standard
                  </p>
                </div>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenu("other-document", "Other", "")}>
                  {/* <img src="/lkm/images/sidebar-icon-beranda-button.svg" /> */}
                  <p
                    className={`${
                      subMenuState === "other-document" ||
                      q.sidebarSubMenu === "other-document"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-xl mx-2`}>
                    <i className="fa fa-file" /> Other
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : router.query.appState === "Estate" ? (
        <div>
          <div
            className={`w-full mb-4 pr-2 ${
              MODE.includes("FULL") || MODE.includes("POSITION TYPE")
                ? "block"
                : "hidden"
            }`}>
            {menuState === "position_type" ? (
              <div>
                <div className="bg-mantis-500 hidden rounded-l-lg rounded-r-2xl pr-4">
                  <div
                    className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                    onClick={selectSidebarMenu("position_type")}>
                    <img src="/lkm/images/Position-type-icon.svg" />
                    <p className={"text-black font-bold text-lg  mx-2"}>
                      Position Type
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`px-4 py-2 flex items-center hidden rounded-2xl cursor-pointer`}
                  onClick={selectSidebarMenu("position_type")}>
                  <img src="/lkm/images/Position-type-icon.svg" />
                  <p className={"text-black font-bold text-lg  mx-2"}>
                    Position Type
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className={`w-full mb-4 pr-2`}>
            {menuState === "estate_dashboard" ? (
              <div>
                <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                  <div
                    className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                    onClick={selectSidebarMenu("estate_dashboard")}>
                    <img src="/lkm/images/menu-01_dasboard_icon.svg" />
                    <p className={"text-black font-bold text-lg  mx-2"}>
                      Dashboard
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarMenu("estate_dashboard")}>
                  <img src="/lkm/images/menu-01_dasboard_icon.svg" />
                  <p className={"text-black font-bold text-lg  mx-2"}>
                    Dashboard
                  </p>
                </div>
              </div>
            )}
          </div>
          <div
            className={`w-full mb-4 pr-2 ${
              !currentUserDontHavePrivilege(
                ["Estate Information:Read"],
                currentUser,
              )
                ? "block"
                : "hidden"
            }`}>
            {menuState === "estate_information" ? (
              <div>
                <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                  <div
                    className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                    onClick={selectSidebarMenu("estate_information")}>
                    <img src="/lkm/images/estate-information-icon.svg" />
                    <p className={"text-black font-bold text-lg  mx-2"}>
                      Estate Information
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarMenu("estate_information")}>
                  <img src="/lkm/images/estate-information-icon.svg" />
                  <p className={"text-black font-bold text-lg  mx-2"}>
                    Estate Information
                  </p>
                </div>
              </div>
            )}
          </div>
          <div
            className={`w-full mb-4 pr-2 ${
              !currentUserDontHavePrivilege(["Census Data:Read"], currentUser)
                ? "block"
                : "hidden"
            }`}>
            {menuState === "census_data_estate" ? (
              <div>
                <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                  <div
                    className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                    onClick={selectSidebarMenu("census_data_estate")}>
                    <img src="/lkm/images/cencus-data-icon.svg" />
                    <p className={"text-black font-bold text-lg  mx-2"}>
                      Census Data
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarMenu("census_data_estate")}>
                  <img src="/lkm/images/cencus-data-icon.svg" />
                  <p className={"text-black font-bold text-lg  mx-2"}>
                    Census Data
                  </p>
                </div>
              </div>
            )}

            {menuState === "census_data_estate" ? (
              <div className={`mt-2 ${!showSubMenu ? "hidden" : "block"}`}>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenuEstate(
                    "tahun_banci",
                    "Tahun Banci",
                    "",
                  )}>
                  <img src="/lkm/images/makhlumat-borang-icon.svg" />
                  <p
                    className={`${
                      subMenuState === "tahun_banci" ||
                      q.sidebarSubMenu === "tahun_banci"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Tahun Banci
                  </p>
                </div>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenuEstate(
                    "maklumat_borang",
                    "Maklumat Borang",
                    "",
                  )}>
                  {/* <svg
                    width="33"
                    height="32"
                    viewBox="0 0 33 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M11.8557 23.6665H20.589C20.8779 23.6665 21.1168 23.5721 21.3057 23.3832C21.4946 23.1943 21.589 22.9554 21.589 22.6665C21.589 22.3776 21.4946 22.1387 21.3057 21.9498C21.1168 21.7609 20.8779 21.6665 20.589 21.6665H11.8557C11.5668 21.6665 11.3279 21.7609 11.139 21.9498C10.9501 22.1387 10.8557 22.3776 10.8557 22.6665C10.8557 22.9554 10.9501 23.1943 11.139 23.3832C11.3279 23.5721 11.5668 23.6665 11.8557 23.6665ZM11.8557 17.9998H20.589C20.8779 17.9998 21.1168 17.9054 21.3057 17.7165C21.4946 17.5276 21.589 17.2887 21.589 16.9998C21.589 16.7109 21.4946 16.4721 21.3057 16.2832C21.1168 16.0943 20.8779 15.9998 20.589 15.9998H11.8557C11.5668 15.9998 11.3279 16.0943 11.139 16.2832C10.9501 16.4721 10.8557 16.7109 10.8557 16.9998C10.8557 17.2887 10.9501 17.5276 11.139 17.7165C11.3279 17.9054 11.5668 17.9998 11.8557 17.9998ZM7.55566 29.3332C7.02233 29.3332 6.55566 29.1332 6.15566 28.7332C5.75566 28.3332 5.55566 27.8665 5.55566 27.3332V4.6665C5.55566 4.13317 5.75566 3.6665 6.15566 3.2665C6.55566 2.8665 7.02233 2.6665 7.55566 2.6665H18.7557C19.0223 2.6665 19.2834 2.72206 19.539 2.83317C19.7946 2.94428 20.0112 3.08873 20.189 3.2665L26.289 9.3665C26.4668 9.54428 26.6112 9.76095 26.7223 10.0165C26.8334 10.2721 26.889 10.5332 26.889 10.7998V27.3332C26.889 27.8665 26.689 28.3332 26.289 28.7332C25.889 29.1332 25.4223 29.3332 24.889 29.3332H7.55566ZM18.589 9.8665V4.6665H7.55566V27.3332H24.889V10.8665H19.589C19.3001 10.8665 19.0612 10.7721 18.8723 10.5832C18.6834 10.3943 18.589 10.1554 18.589 9.8665ZM7.55566 4.6665V10.8665V4.6665V27.3332V4.6665Z"
                      fill={
                        subMenuState === "maklumat_borang" ||
                        q.sidebarSubMenu === "maklumat_borang"
                          ? "#68b064"
                          : "#B05056"
                      }
                    />
                  </svg> */}
                  <img src="/lkm/images/makhlumat-borang-icon.svg" />
                  <p
                    className={`${
                      subMenuState === "maklumat_borang" ||
                      q.sidebarSubMenu === "maklumat_borang"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Maklumat Borang
                  </p>
                </div>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenuEstate(
                    "jenis-hak-milik-taraf-sah",
                    "Taraf Sah/Jenis Hak Milik",
                    "",
                  )}>
                  <img
                    src={`/lkm/images/${
                      subMenuState === "jenis-hak-milik-taraf-sah" ||
                      q.sidebarSubMenu === "jenis-hak-milik-taraf-sah"
                        ? "taraf-sah-icon-selected.svg"
                        : "taraf-sah-icon.svg"
                    }`}
                  />
                  <p
                    className={`${
                      subMenuState === "jenis-hak-milik-taraf-sah" ||
                      q.sidebarSubMenu === "jenis-hak-milik-taraf-sah"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Taraf Sah/Jenis Hak Milik
                  </p>
                </div>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenuEstate(
                    "pemilik-saham",
                    "Pemilik Saham",
                    "",
                  )}>
                  <svg
                    width="26"
                    height="25"
                    viewBox="0 0 26 25"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M4.9375 19.5312C6.25 18.6146 7.55208 17.9115 8.84375 17.4219C10.1354 16.9323 11.5208 16.6875 13 16.6875C14.4792 16.6875 15.8698 16.9323 17.1719 17.4219C18.474 17.9115 19.7812 18.6146 21.0938 19.5312C22.0104 18.4062 22.6615 17.2708 23.0469 16.125C23.4323 14.9792 23.625 13.7708 23.625 12.5C23.625 9.47917 22.6094 6.95312 20.5781 4.92188C18.5469 2.89062 16.0208 1.875 13 1.875C9.97917 1.875 7.45312 2.89062 5.42188 4.92188C3.39062 6.95312 2.375 9.47917 2.375 12.5C2.375 13.7708 2.57292 14.9792 2.96875 16.125C3.36458 17.2708 4.02083 18.4062 4.9375 19.5312ZM13 13.4375C11.7917 13.4375 10.776 13.026 9.95312 12.2031C9.13021 11.3802 8.71875 10.3646 8.71875 9.15625C8.71875 7.94792 9.13021 6.93229 9.95312 6.10938C10.776 5.28646 11.7917 4.875 13 4.875C14.2083 4.875 15.224 5.28646 16.0469 6.10938C16.8698 6.93229 17.2812 7.94792 17.2812 9.15625C17.2812 10.3646 16.8698 11.3802 16.0469 12.2031C15.224 13.026 14.2083 13.4375 13 13.4375ZM13 25C11.2917 25 9.67708 24.6719 8.15625 24.0156C6.63542 23.3594 5.30729 22.4635 4.17188 21.3281C3.03646 20.1927 2.14062 18.8646 1.48437 17.3438C0.828125 15.8229 0.5 14.2083 0.5 12.5C0.5 10.7708 0.828125 9.15104 1.48437 7.64062C2.14062 6.13021 3.03646 4.80729 4.17188 3.67188C5.30729 2.53646 6.63542 1.64062 8.15625 0.984375C9.67708 0.328125 11.2917 0 13 0C14.7292 0 16.349 0.328125 17.8594 0.984375C19.3698 1.64062 20.6927 2.53646 21.8281 3.67188C22.9635 4.80729 23.8594 6.13021 24.5156 7.64062C25.1719 9.15104 25.5 10.7708 25.5 12.5C25.5 14.2083 25.1719 15.8229 24.5156 17.3438C23.8594 18.8646 22.9635 20.1927 21.8281 21.3281C20.6927 22.4635 19.3698 23.3594 17.8594 24.0156C16.349 24.6719 14.7292 25 13 25ZM13 23.125C14.1458 23.125 15.2656 22.9583 16.3594 22.625C17.4531 22.2917 18.5312 21.7083 19.5938 20.875C18.5312 20.125 17.4479 19.5521 16.3438 19.1562C15.2396 18.7604 14.125 18.5625 13 18.5625C11.875 18.5625 10.7604 18.7604 9.65625 19.1562C8.55208 19.5521 7.46875 20.125 6.40625 20.875C7.46875 21.7083 8.54688 22.2917 9.64062 22.625C10.7344 22.9583 11.8542 23.125 13 23.125ZM13 11.5625C13.7083 11.5625 14.2865 11.3385 14.7344 10.8906C15.1823 10.4427 15.4062 9.86458 15.4062 9.15625C15.4062 8.44792 15.1823 7.86979 14.7344 7.42188C14.2865 6.97396 13.7083 6.75 13 6.75C12.2917 6.75 11.7135 6.97396 11.2656 7.42188C10.8177 7.86979 10.5938 8.44792 10.5938 9.15625C10.5938 9.86458 10.8177 10.4427 11.2656 10.8906C11.7135 11.3385 12.2917 11.5625 13 11.5625Z"
                      fill={
                        subMenuState === "pemilik-saham" ||
                        q.sidebarSubMenu === "pemilik-saham"
                          ? "#68b064"
                          : "#B05056"
                      }
                    />
                  </svg>
                  {/* <img src="/lkm/images/sidebar-icon-beranda-button.svg" /> */}
                  <p
                    className={`${
                      subMenuState === "pemilik-saham" ||
                      q.sidebarSubMenu === "pemilik-saham"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Pemilik Saham
                  </p>
                </div>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenuEstate(
                    "hak_milik_pertubuhan",
                    "Hak Milik Pertubuhan",
                    "",
                  )}>
                  <img
                    src={`/lkm/images/${
                      subMenuState === "seksyen" ||
                      q.sidebarSubMenu === "seksyen"
                        ? "hak-milik-pertubuhan-icon-selected.svg"
                        : "hak-milik-pertubuhan-icon.svg"
                    }`}
                  />
                  <p
                    className={`${
                      subMenuState === "hak_milik_pertubuhan" ||
                      q.sidebarSubMenu === "hak_milik_pertubuhan"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Hak Milik Pertubuhan
                  </p>
                </div>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenuEstate(
                    "seksyen",
                    "Seksyen",
                    "",
                  )}>
                  <img
                    src={`/lkm/images/${
                      subMenuState === "seksyen" ||
                      q.sidebarSubMenu === "seksyen"
                        ? "seksyen-icon-selected.svg"
                        : "seksyen-icon.svg"
                    }`}
                  />
                  <p
                    className={`${
                      subMenuState === "seksyen" ||
                      q.sidebarSubMenu === "seksyen"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Seksyen
                  </p>
                </div>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenuEstate("seller", "Seller", "")}>
                  <img
                    src={`/lkm/images/${
                      subMenuState === "seller" || q.sidebarSubMenu === "seller"
                        ? "penjual-icon-selected.svg"
                        : "penjual-icon.svg"
                    }`}
                  />
                  <p
                    className={`${
                      subMenuState === "seller" || q.sidebarSubMenu === "seller"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Seller
                  </p>
                </div>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenuEstate("buyer", "Buyer", "")}>
                  <img
                    src={`/lkm/images/${
                      subMenuState === "buyer" || q.sidebarSubMenu === "buyer"
                        ? "pembeli-icon-selected.svg"
                        : "pembeli-icon.svg"
                    }`}
                  />
                  <p
                    className={`${
                      subMenuState === "buyer" || q.sidebarSubMenu === "buyer"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Buyer
                  </p>
                </div>
              </div>
            ) : null}
          </div>
          <div
            className={`w-full mb-4 pr-2 ${
              !currentUserDontHavePrivilege(
                ["Validation Code:Read"],
                currentUser,
              )
                ? "block"
                : "hidden"
            }`}>
            {menuState === "validation-code" ? (
              <div>
                <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                  <div
                    className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                    onClick={selectSidebarMenu("validation-code")}>
                    <img src="/lkm/images/code.svg" className="h-12" />
                    <p className={"text-black font-bold text-lg  mx-2"}>
                      Validation Code
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarMenu("validation-code")}>
                  <img src="/lkm/images/code.svg" className="h-12" />
                  <p className={"text-black font-bold text-lg  mx-2"}>
                    Validation Code
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className={`w-full mb-4 pr-2 block`}>
            {menuState === "questionnare" ? (
              <div>
                <div className="bg-mantis-500 hidden rounded-l-lg rounded-r-2xl pr-4">
                  <div
                    className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                    onClick={selectSidebarMenu("questionnare")}>
                    <img src="/lkm/images/estate-information-icon.svg" />
                    <p className={"text-black font-bold text-lg  mx-2"}>
                      Questionnare
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`px-4 py-2 flex hidden items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarMenu("questionnare")}>
                  <img src="/lkm/images/estate-information-icon.svg" />
                  <p className={"text-black font-bold text-lg  mx-2"}>
                    Questionnare
                  </p>
                </div>
              </div>
            )}
          </div>
          <div
            className={`w-full mb-4 pr-2 ${
              !currentUserDontHavePrivilege(
                ["Estate Census Report:Read"],
                currentUser,
              )
                ? "block"
                : "hidden"
            }`}>
            {menuState === "estate-census-report" ? (
              <div>
                <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                  <div
                    className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                    onClick={selectSidebarMenu("estate-census-report")}>
                    <img src="/lkm/images/menu-08_unstructured-document_icon.svg" />
                    <p className={"text-black font-bold text-lg  mx-2"}>
                      Estate Census Report
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarMenu("estate-census-report")}>
                  <img src="/lkm/images/menu-08_unstructured-document_icon.svg" />
                  <p className={"text-black font-bold text-lg  mx-2"}>
                    Estate Census Report
                  </p>
                </div>
              </div>
            )}
          </div>

          <div
            className={`w-full mb-4 pr-2 ${
              !currentUserDontHavePrivilege(
                ["Estate Census Report:Read"],
                currentUser,
              )
                ? "block"
                : "hidden"
            }`}>
            {menuState === "malaysian-report" ? (
              <div>
                <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                  <div
                    className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                    onClick={selectSidebarMenu("malaysian-report")}>
                    <img src="/lkm/images/menu-08_unstructured-document_icon.svg" />
                    <p className={"text-black font-bold text-lg  mx-2"}>
                      Malaysian Report
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarMenu("malaysian-report")}>
                  <img src="/lkm/images/menu-08_unstructured-document_icon.svg" />
                  <p className={"text-black font-bold text-lg  mx-2"}>
                    Malaysian Report
                  </p>
                </div>
              </div>
            )}
          </div>
          <div
            className={`w-full mb-4 pr-2 ${
              !currentUserDontHavePrivilege(
                ["Estate Census Report:Read"],
                currentUser,
              )
                ? "block"
                : "hidden"
            }`}>
            {menuState === "semenanjung-report" ? (
              <div>
                <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                  <div
                    className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                    onClick={selectSidebarMenu("semenanjung-report")}>
                    <img src="/lkm/images/menu-08_unstructured-document_icon.svg" />
                    <p className={"text-black font-bold text-lg  mx-2"}>
                      Semenanjung Report
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarMenu("semenanjung-report")}>
                  <img src="/lkm/images/menu-08_unstructured-document_icon.svg" />
                  <p className={"text-black font-bold text-lg  mx-2"}>
                    Semenanjung Report
                  </p>
                </div>
              </div>
            )}
          </div>
          <div
            className={`w-full mb-4 pr-2 ${
              !currentUserDontHavePrivilege(
                ["Estate Census Report:Read"],
                currentUser,
              )
                ? "block"
                : "hidden"
            }`}>
            {menuState === "sabah-report" ? (
              <div>
                <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                  <div
                    className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                    onClick={selectSidebarMenu("sabah-report")}>
                    <img src="/lkm/images/menu-08_unstructured-document_icon.svg" />
                    <p className={"text-black font-bold text-lg  mx-2"}>
                      Sabah Report
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarMenu("sabah-report")}>
                  <img src="/lkm/images/menu-08_unstructured-document_icon.svg" />
                  <p className={"text-black font-bold text-lg  mx-2"}>
                    Sabah Report
                  </p>
                </div>
              </div>
            )}
          </div>
          <div
            className={`w-full mb-4 pr-2 ${
              !currentUserDontHavePrivilege(
                ["Estate Census Report:Read"],
                currentUser,
              )
                ? "block"
                : "hidden"
            }`}>
            {menuState === "sarawak-report" ? (
              <div>
                <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                  <div
                    className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                    onClick={selectSidebarMenu("sarawak-report")}>
                    <img src="/lkm/images/menu-08_unstructured-document_icon.svg" />
                    <p className={"text-black font-bold text-lg  mx-2"}>
                      Sarawak Report
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarMenu("sarawak-report")}>
                  <img src="/lkm/images/menu-08_unstructured-document_icon.svg" />
                  <p className={"text-black font-bold text-lg  mx-2"}>
                    Sarawak Report
                  </p>
                </div>
              </div>
            )}
          </div>

          <div
            className={`w-full mb-4 pr-2 ${
              !currentUserDontHavePrivilege(
                ["Estate Census Report:Read"],
                currentUser,
              )
                ? "block"
                : "hidden"
            }`}>
            {menuState === "cocoa-monitor" ? (
              <div>
                <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                  <div
                    className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                    onClick={selectSidebarMenu("cocoa-monitor")}>
                    <img src="/lkm/images/menu-08_unstructured-document_icon.svg" />
                    <p className={"text-black font-bold text-lg  mx-2"}>
                      Cocoa Monitor
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarMenu("cocoa-monitor")}>
                  <img src="/lkm/images/menu-08_unstructured-document_icon.svg" />
                  <p className={"text-black font-bold text-lg  mx-2"}>
                    Cocoa Monitor
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div
            className={`w-full mb-4 pr-2 ${
              !currentUserDontHavePrivilege(
                ["Smallholder Profile Ecocoa:Read"],
                currentUser,
              )
                ? "block"
                : "hidden"
            }`}>
            {menuState === "smallholder" ? (
              <div>
                <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                  <div
                    className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                    onClick={selectSidebarMenu("smallholder")}>
                    <img src="/lkm/images/estate-information-icon.svg" />
                    <p className={"text-black font-bold text-lg  mx-2"}>
                      Smallholder Profile (eCocoa)
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarMenu("smallholder")}>
                  <img src="/lkm/images/estate-information-icon.svg" />
                  <p className={"text-black font-bold text-lg  mx-2"}>
                    Smallholder Profile (eCocoa)
                  </p>
                </div>
              </div>
            )}
          </div>

          <div
            className={`w-full mb-4 pr-2 ${
              !currentUserDontHavePrivilege(
                ["Smallholder Profile Cosis:Read"],
                currentUser,
              )
                ? "block"
                : "hidden"
            }`}>
            {menuState === "data-banci" ? (
              <div>
                <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                  <div
                    className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                    onClick={selectSidebarMenu("data-banci")}>
                    <img src="/lkm/images/estate-information-icon.svg" />
                    <p className={"text-black font-bold text-lg  mx-2"}>
                      Smallholder Profile (Cosis)
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarMenu("data-banci")}>
                  <img src="/lkm/images/estate-information-icon.svg" />
                  <p className={"text-black font-bold text-lg  mx-2"}>
                    Smallholder Profile (Cosis)
                  </p>
                </div>
              </div>
            )}
          </div>

          <div
            className={`w-full mb-4 pr-2 ${
              !currentUserDontHavePrivilege(["Question Bank:Read"], currentUser)
                ? "block"
                : "hidden"
            }`}>
            <div
              className={`${
                menuState === "question-bank" ? "bg-mantis-500" : ""
              } rounded-l-lg rounded-r-2xl pr-4`}>
              <div
                className={`${
                  menuState === "question-bank" ? "bg-mantis-200" : ""
                } px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                onClick={e => {
                  setMenu("question-bank");
                  router.replace({
                    pathname: "/smallholder-census/question-bank",
                    query: {
                      // ...urlQuery,
                      sidebarMenu: "question-bank",
                      appState: "Smallholder",
                    },
                  });
                }}>
                <img src="/lkm/images/estate-information-icon.svg" />
                <p className={"text-black font-bold text-lg  mx-2"}>
                  Question Bank
                </p>
              </div>
            </div>
          </div>

          <div
            className={`w-full mb-4 pr-2 ${
              !currentUserDontHavePrivilege(
                ["Set Questionnaire:Read"],
                currentUser,
              )
                ? "block"
                : "hidden"
            }`}>
            <div
              className={`${
                menuState === "questionnare-forms" ? "bg-mantis-500" : ""
              } rounded-l-lg rounded-r-2xl pr-4`}>
              <div
                className={`${
                  menuState === "questionnare-forms" ? "bg-mantis-200" : ""
                } px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                onClick={e => {
                  setMenu("questionnare-forms");
                  router.replace({
                    pathname: "/smallholder-census/questionnare-forms",
                    query: {
                      // ...urlQuery,
                      sidebarMenu: "questionnare-forms",
                      appState: "Smallholder",
                    },
                  });
                }}>
                <img src="/lkm/images/estate-information-icon.svg" />
                <p className={"text-black font-bold text-lg  mx-2"}>
                  Set Questionnaire
                </p>
              </div>
            </div>
          </div>

          <div
            className={`w-full mb-4 pr-2 ${
              !currentUserDontHavePrivilege(
                ["Input Data Banci:Read"],
                currentUser,
              )
                ? "block"
                : "hidden"
            }`}>
            <div
              className={`${
                menuState === "questionnare-data" ? "bg-mantis-500" : ""
              } rounded-l-lg rounded-r-2xl pr-4`}>
              <div
                className={`${
                  menuState === "questionnare-data" ? "bg-mantis-200" : ""
                } px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                onClick={e => {
                  setMenu("questionnare-data");
                  router.replace({
                    pathname: "/smallholder-census/questionnare-data",
                    query: {
                      // ...urlQuery,
                      sidebarMenu: "questionnare-data",
                      appState: "Smallholder",
                    },
                  });
                }}>
                <img src="/lkm/images/estate-information-icon.svg" />
                <p className={"text-black font-bold text-lg  mx-2"}>
                  Input Data Banci
                </p>
              </div>
            </div>
          </div>

          <div
            className={`w-full mb-4 pr-2 ${
              !currentUserDontHavePrivilege(
                ["Input Data Banci:Read"],
                currentUser,
              )
                ? "block"
                : "hidden"
            }`}>
            {menuState === "malaysian-smallholder-report" ? (
              <div>
                <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                  <div
                    className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                    onClick={selectSidebarMenu("malaysian-smallholder-report")}>
                    <img src="/lkm/images/menu-08_unstructured-document_icon.svg" />
                    <p className={"text-black font-bold text-lg  mx-2"}>
                      Malaysian Report
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarMenu("malaysian-smallholder-report")}>
                  <img src="/lkm/images/menu-08_unstructured-document_icon.svg" />
                  <p className={"text-black font-bold text-lg  mx-2"}>
                    Malaysian Report
                  </p>
                </div>
              </div>
            )}
          </div>
          <div
            className={`w-full mb-4 pr-2 ${
              !currentUserDontHavePrivilege(
                ["Input Data Banci:Read"],
                currentUser,
              )
                ? "block"
                : "hidden"
            }`}>
            {menuState === "semenanjung-smallholder-report" ? (
              <div>
                <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                  <div
                    className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                    onClick={selectSidebarMenu(
                      "semenanjung-smallholder-report",
                    )}>
                    <img src="/lkm/images/menu-08_unstructured-document_icon.svg" />
                    <p className={"text-black font-bold text-lg  mx-2"}>
                      Semenanjung Report
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarMenu("semenanjung-smallholder-report")}>
                  <img src="/lkm/images/menu-08_unstructured-document_icon.svg" />
                  <p className={"text-black font-bold text-lg  mx-2"}>
                    Semenanjung Report
                  </p>
                </div>
              </div>
            )}
          </div>
          <div
            className={`w-full mb-4 pr-2 ${
              !currentUserDontHavePrivilege(
                ["Input Data Banci:Read"],
                currentUser,
              )
                ? "block"
                : "hidden"
            }`}>
            {menuState === "sabah-smallholder-report" ? (
              <div>
                <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                  <div
                    className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                    onClick={selectSidebarMenu("sabah-smallholder-report")}>
                    <img src="/lkm/images/menu-08_unstructured-document_icon.svg" />
                    <p className={"text-black font-bold text-lg  mx-2"}>
                      Sabah Report
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarMenu("sabah-smallholder-report")}>
                  <img src="/lkm/images/menu-08_unstructured-document_icon.svg" />
                  <p className={"text-black font-bold text-lg  mx-2"}>
                    Sabah Report
                  </p>
                </div>
              </div>
            )}
          </div>
          <div
            className={`w-full mb-4 pr-2 ${
              !currentUserDontHavePrivilege(
                ["Input Data Banci:Read"],
                currentUser,
              )
                ? "block"
                : "hidden"
            }`}>
            {menuState === "sarawak-smallholder-report" ? (
              <div>
                <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                  <div
                    className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                    onClick={selectSidebarMenu("sarawak-smallholder-report")}>
                    <img src="/lkm/images/menu-08_unstructured-document_icon.svg" />
                    <p className={"text-black font-bold text-lg  mx-2"}>
                      Sarawak Report
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarMenu("sarawak-smallholder-report")}>
                  <img src="/lkm/images/menu-08_unstructured-document_icon.svg" />
                  <p className={"text-black font-bold text-lg  mx-2"}>
                    Sarawak Report
                  </p>
                </div>
              </div>
            )}
          </div>

          <div
            className={`w-full mb-4 pr-2 ${
              !currentUserDontHavePrivilege(
                ["Master Data Smallholder:Read"],
                currentUser,
              )
                ? "block"
                : "hidden"
            }`}>
            {menuState === "master-data-smallholder-census" ? (
              <div>
                <div className="bg-mantis-500 rounded-l-lg rounded-r-2xl pr-4">
                  <div
                    className={`bg-mantis-200 px-4 py-2 flex items-center rounded-l-lg cursor-pointer`}
                    onClick={selectSidebarMenu(
                      "master-data-smallholder-census",
                    )}>
                    <img src="/lkm/images/menu-07_master-data_icon.svg" />
                    <p className={"text-black font-bold text-lg  mx-2"}>
                      Master Data
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  className={`px-4 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarMenu("master-data-smallholder-census")}>
                  <img src="/lkm/images/menu-07_master-data_icon.svg" />
                  <p className={"text-black font-bold text-lg  mx-2"}>
                    Master Data
                  </p>
                </div>
              </div>
            )}

            {menuState === "master-data-smallholder-census" ? (
              <div className={`mt-2 ${!showSubMenu ? "hidden" : "block"}`}>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenuSmallholder(
                    "negeri",
                    "Negeri",
                    "",
                  )}>
                  {/* <svg
                    className="h-8"
                    // width="25"
                    // height="25"
                    viewBox="0 0 25 25"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M11.9833 17.6104C13.9502 16.019 15.4254 14.4955 16.4088 13.04C17.3923 11.5844 17.884 10.2259 17.884 8.96442C17.884 7.8582 17.6815 6.91695 17.2766 6.14065C16.8716 5.36436 16.3703 4.73362 15.7725 4.24844C15.1747 3.76326 14.5335 3.40907 13.849 3.18589C13.1644 2.96271 12.5425 2.85111 11.9833 2.85111C11.4241 2.85111 10.8022 2.96271 10.1176 3.18589C9.43308 3.40907 8.79191 3.76326 8.19413 4.24844C7.59634 4.73362 7.0998 5.36436 6.70449 6.14065C6.30918 6.91695 6.11153 7.8582 6.11153 8.96442C6.11153 10.2259 6.59843 11.5844 7.57224 13.04C8.54605 14.4955 10.0164 16.019 11.9833 17.6104ZM11.9833 19.9101C11.8483 19.9101 11.7037 19.8956 11.5494 19.8665C11.3952 19.8374 11.2602 19.7743 11.1445 19.6773C8.71478 17.7753 6.9166 15.9414 5.74996 14.1753C4.58332 12.4092 4 10.6723 4 8.96442C4 7.60591 4.24104 6.41721 4.72313 5.39832C5.20521 4.37944 5.8271 3.52552 6.58879 2.83656C7.35048 2.1476 8.20377 1.6236 9.14865 1.26457C10.0935 0.905531 11.0384 0.726013 11.9833 0.726013C12.9089 0.726013 13.849 0.905531 14.8035 1.26457C15.758 1.6236 16.6161 2.1476 17.3778 2.83656C18.1395 3.52552 18.7662 4.37944 19.2579 5.39832C19.7497 6.41721 19.9955 7.60591 19.9955 8.96442C19.9955 10.6723 19.4074 12.4092 18.2311 14.1753C17.0548 15.9414 15.2518 17.7753 12.8221 19.6773C12.7064 19.7743 12.5714 19.8374 12.4172 19.8665C12.2629 19.8956 12.1183 19.9101 11.9833 19.9101ZM11.9833 11.0022C12.6004 11.0022 13.1258 10.7839 13.5597 10.3472C13.9936 9.91053 14.2105 9.39138 14.2105 8.78975C14.2105 8.16872 13.9936 7.63987 13.5597 7.20321C13.1258 6.76654 12.6004 6.54821 11.9833 6.54821C11.3855 6.54821 10.8697 6.76654 10.4358 7.20321C10.0019 7.63987 9.785 8.16872 9.785 8.78975C9.785 9.39138 10.0019 9.91053 10.4358 10.3472C10.8697 10.7839 11.3855 11.0022 11.9833 11.0022ZM5.0413 24.6843C4.75205 24.6843 4.50619 24.5825 4.30371 24.3787C4.10124 24.1749 4 23.9275 4 23.6364C4 23.3452 4.10124 23.0929 4.30371 22.8795C4.50619 22.666 4.75205 22.5592 5.0413 22.5592H18.9253C19.2146 22.5592 19.4652 22.666 19.6774 22.8795C19.8895 23.0929 19.9955 23.3452 19.9955 23.6364C19.9955 23.9275 19.8895 24.1749 19.6774 24.3787C19.4652 24.5825 19.2146 24.6843 18.9253 24.6843H5.0413Z"
                      fill={
                        subMenuState === "master-data-smallholder-census" ||
                        q.sidebarSubMenu === "negeri"
                          ? "#68b064"
                          : "#B05056"
                      }
                    />
                  </svg> */}

                  {subMenuState === "master-data-smallholder-census" ||
                  q.sidebarSubMenu === "negeri" ? (
                    <img
                      src="/lkm/images/icon-info-color-green.svg"
                      className="h-8"
                    />
                  ) : (
                    <img
                      src="/lkm/images/icon-info-color-brown.svg"
                      className="h-8"
                    />
                  )}

                  <p
                    className={`${
                      subMenuState === "master-data-smallholder-census" ||
                      q.sidebarSubMenu === "negeri"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Negeri
                  </p>
                </div>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenuSmallholder(
                    "bangsa",
                    "Bangsa",
                    "",
                  )}>
                  {subMenuState === "master-data-smallholder-census" ||
                  q.sidebarSubMenu === "bangsa" ? (
                    <img
                      src="/lkm/images/icon-info-color-green.svg"
                      className="h-8"
                    />
                  ) : (
                    <img
                      src="/lkm/images/icon-info-color-brown.svg"
                      className="h-8"
                    />
                  )}

                  <p
                    className={`${
                      subMenuState === "master-data-smallholder-census" ||
                      q.sidebarSubMenu === "bangsa"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Bangsa
                  </p>
                </div>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenuSmallholder(
                    "daerah",
                    "Daerah",
                    "",
                  )}>
                  {subMenuState === "master-data-smallholder-census" ||
                  q.sidebarSubMenu === "daerah" ? (
                    <img
                      src="/lkm/images/icon-info-color-green.svg"
                      className="h-8"
                    />
                  ) : (
                    <img
                      src="/lkm/images/icon-info-color-brown.svg"
                      className="h-8"
                    />
                  )}

                  <p
                    className={`${
                      subMenuState === "master-data-smallholder-census" ||
                      q.sidebarSubMenu === "daerah"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Daerah
                  </p>
                </div>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenuSmallholder(
                    "mukim",
                    "Mukim",
                    "",
                  )}>
                  {subMenuState === "master-data-smallholder-census" ||
                  q.sidebarSubMenu === "mukim" ? (
                    <img
                      src="/lkm/images/icon-info-color-green.svg"
                      className="h-8"
                    />
                  ) : (
                    <img
                      src="/lkm/images/icon-info-color-brown.svg"
                      className="h-8"
                    />
                  )}

                  <p
                    className={`${
                      subMenuState === "master-data-smallholder-census" ||
                      q.sidebarSubMenu === "mukim"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Mukim
                  </p>
                </div>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenuSmallholder(
                    "kampung",
                    "Kampung",
                    "",
                  )}>
                  {subMenuState === "master-data-smallholder-census" ||
                  q.sidebarSubMenu === "kampung" ? (
                    <img
                      src="/lkm/images/icon-info-color-green.svg"
                      className="h-8"
                    />
                  ) : (
                    <img
                      src="/lkm/images/icon-info-color-brown.svg"
                      className="h-8"
                    />
                  )}
                  <p
                    className={`${
                      subMenuState === "master-data-smallholder-census" ||
                      q.sidebarSubMenu === "kampung"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Kampung
                  </p>
                </div>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenuSmallholder(
                    "parlimen",
                    "Parlimen",
                    "",
                  )}>
                  {subMenuState === "master-data-smallholder-census" ||
                  q.sidebarSubMenu === "parlimen" ? (
                    <img
                      src="/lkm/images/icon-info-color-green.svg"
                      className="h-8"
                    />
                  ) : (
                    <img
                      src="/lkm/images/icon-info-color-brown.svg"
                      className="h-8"
                    />
                  )}

                  <p
                    className={`${
                      subMenuState === "master-data-smallholder-census" ||
                      q.sidebarSubMenu === "parlimen"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Parlimen
                  </p>
                </div>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenuSmallholder(
                    "parlimen-dun",
                    "Dun",
                    "",
                  )}>
                  {subMenuState === "master-data-smallholder-census" ||
                  q.sidebarSubMenu === "parlimen-dun" ? (
                    <img
                      src="/lkm/images/icon-info-color-green.svg"
                      className="h-8"
                    />
                  ) : (
                    <img
                      src="/lkm/images/icon-info-color-brown.svg"
                      className="h-8"
                    />
                  )}

                  <p
                    className={`${
                      subMenuState === "master-data-smallholder-census" ||
                      q.sidebarSubMenu === "parlimen-dun"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Dun
                  </p>
                </div>
                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenuSmallholder(
                    "banci",
                    "Ref Banci",
                    "",
                  )}>
                  {subMenuState === "master-data-smallholder-census" ||
                  q.sidebarSubMenu === "banci" ? (
                    <img
                      src="/lkm/images/icon-info-color-green.svg"
                      className="h-8"
                    />
                  ) : (
                    <img
                      src="/lkm/images/icon-info-color-brown.svg"
                      className="h-8"
                    />
                  )}

                  <p
                    className={`${
                      subMenuState === "master-data-smallholder-census" ||
                      q.sidebarSubMenu === "banci"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Ref Banci
                  </p>
                </div>

                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenuSmallholder(
                    "section",
                    "Section",
                    "",
                  )}>
                  {subMenuState === "master-data-smallholder-census" ||
                  q.sidebarSubMenu === "section" ? (
                    <img
                      src="/lkm/images/icon-info-color-green.svg"
                      className="h-8"
                    />
                  ) : (
                    <img
                      src="/lkm/images/icon-info-color-brown.svg"
                      className="h-8"
                    />
                  )}

                  <p
                    className={`${
                      subMenuState === "master-data-smallholder-census" ||
                      q.sidebarSubMenu === "section"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Section
                  </p>
                </div>

                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenuSmallholder(
                    "sub-section",
                    "Sub Section",
                    "",
                  )}>
                  {subMenuState === "master-data-smallholder-census" ||
                  q.sidebarSubMenu === "sub-section" ? (
                    <img
                      src="/lkm/images/icon-info-color-green.svg"
                      className="h-8"
                    />
                  ) : (
                    <img
                      src="/lkm/images/icon-info-color-brown.svg"
                      className="h-8"
                    />
                  )}

                  <p
                    className={`${
                      subMenuState === "master-data-smallholder-census" ||
                      q.sidebarSubMenu === "sub-section"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Sub Section
                  </p>
                </div>

                <div
                  className={`ml-10 py-2 flex items-center rounded-2xl cursor-pointer`}
                  onClick={selectSidebarSubMenuSmallholder(
                    "question-code",
                    "Question Code",
                    "",
                  )}>
                  {subMenuState === "master-data-smallholder-census" ||
                  q.sidebarSubMenu === "question-code" ? (
                    <img
                      src="/lkm/images/icon-info-color-green.svg"
                      className="h-8"
                    />
                  ) : (
                    <img
                      src="/lkm/images/icon-info-color-brown.svg"
                      className="h-8"
                    />
                  )}

                  <p
                    className={`${
                      subMenuState === "master-data-smallholder-census" ||
                      q.sidebarSubMenu === "question-code"
                        ? "text-mantis-600"
                        : "text-black"
                    } font-bold text-lg  mx-2`}>
                    Question Code
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <div className="pl-4 mb-4">
        <div className="mb-4 px-4">
          <a href={"/public/template/User-Manual-SEPv2.0.pdf"}>
            <button className="bg-matrix-600 text-white font-bold w-full rounded-md shadow-md py-2">
              <p className="text-md">
                <i className="fa fa-file" /> Manual Book
              </p>
            </button>
          </a>

          <p className="text-md text-center my-2">Powered By ST Advisory</p>
        </div>
        <div
          className={`px-4 py-2 flex items-center rounded-l-lg cursor-pointer hover:bg-gray-100`}
          onClick={e => {
            if (e) e.preventDefault();
            window.location.href = "/lkm/logout";
          }}>
          <i className="fa fa-arrow-left" />
          <p className={"text-black font-bold text-lg  mx-2"}>Logout</p>
        </div>
      </div>
    </div>
  );
};
export default Sidebar;
