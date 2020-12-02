import {join} from "path";
import {expect} from "chai";
import {BeaconState} from "@chainsafe/lodestar-types";
import {config} from "@chainsafe/lodestar-config/lib/presets/mainnet";
import {EpochContext} from "@chainsafe/lodestar-beacon-state-transition";
import {processDeposit} from "@chainsafe/lodestar-beacon-state-transition/lib/fast/block";
import {createCachedValidatorsBeaconState} from "@chainsafe/lodestar-beacon-state-transition/lib/fast/util/interface";
import {describeDirectorySpecTest} from "@chainsafe/lodestar-spec-test-util/lib/single";
import {IProcessDepositTestCase} from "./type";
import {SPEC_TEST_LOCATION} from "../../../utils/specTestCases";

describeDirectorySpecTest<IProcessDepositTestCase, BeaconState>(
  "process deposit mainnet",
  join(SPEC_TEST_LOCATION, "/tests/mainnet/phase0/operations/deposit/pyspec_tests"),
  (testcase) => {
    const state = testcase.pre;
    const epochCtx = new EpochContext(config);
    epochCtx.loadState(state);
    const wrappedState = createCachedValidatorsBeaconState(state);
    processDeposit(epochCtx, wrappedState, testcase.deposit);
    return state;
  },
  {
    sszTypes: {
      pre: config.types.BeaconState,
      post: config.types.BeaconState,
      deposit: config.types.Deposit,
    },
    timeout: 100000000,
    shouldError: (testCase) => !testCase.post,
    getExpected: (testCase) => testCase.post,
    expectFunc: (testCase, expected, actual) => {
      expect(config.types.BeaconState.equals(actual, expected)).to.be.true;
    },
  }
);
