import "react-toastify/dist/ReactToastify.css"

import { ToastContainer } from "react-toastify"

export const NotificationsContainer = () => (
  <ToastContainer
    toastClassName="!bg-secondary-solid !rounded-md w-[330px] right-6 !font-sans mr-0 mb-xs border border-primary"
    bodyClassName="!px-2 !py-0"
    className="!left-auto !right-0 !top-6 !w-auto"
    progressClassName={"helloprogress"}
  />
)
