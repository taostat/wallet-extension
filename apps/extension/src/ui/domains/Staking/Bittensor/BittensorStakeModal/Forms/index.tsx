import { useBittensorStakeWizard } from "../../hooks/useBittensorStakeWizard"
import { BittensorStakeFollowUp } from "../BittensorStakeFollowUp"
import { BittensorRootStakeForm } from "./BittensorRootStakeForm"
import { BittensorRootStakeReview } from "./BittensorRootStakeReview"
import { BittensorStakingPositionSelect } from "./BittensorStakingPositionSelect"
import { BittensorSubnetStakeForm } from "./BittensorSubnetStakeForm"
import { BittensorSubnetStakeReview } from "./BittensorSubnetStakeReview"
import { BittensorSubnetSelect } from "./BittensorSubnetSelect"
import { BittensorValidatorSelect } from "./BittensorValidatorSelect"

export const BittensorStakeModalRouter = () => {
  const { step, stakeType } = useBittensorStakeWizard()

  switch (step) {
    case "form":
      return stakeType === "subnet" ? <BittensorSubnetStakeForm /> : <BittensorRootStakeForm />
    case "select-delegate":
      return <BittensorValidatorSelect />
    case "select-subnet":
      return <BittensorSubnetSelect />
    case "select-position":
      return <BittensorStakingPositionSelect />
    case "review":
      return stakeType === "subnet" ? <BittensorSubnetStakeReview /> : <BittensorRootStakeReview />
    case "follow-up":
      return <BittensorStakeFollowUp />
  }
}
