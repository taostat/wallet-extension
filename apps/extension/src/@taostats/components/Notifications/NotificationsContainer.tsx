import "react-toastify/dist/ReactToastify.css"

import { ToastContainer } from "react-toastify"

export const NotificationsContainer = () => (
  <ToastContainer
    toastClassName="!bg-secondary !rounded-md w-[33rem] right-12 !font-sans mr-0 mb-xs border border-primary"
    bodyClassName="!px-4 !py-0"
    className="!left-auto !right-0 !top-12 !w-auto"
    progressClassName={"helloprogress"}
  />
)
