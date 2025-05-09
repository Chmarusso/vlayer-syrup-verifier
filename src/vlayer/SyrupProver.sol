// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import {Strings} from "@openzeppelin-contracts-5.0.1/utils/Strings.sol";

import {Proof} from "vlayer-0.1.0/Proof.sol";
import {Prover} from "vlayer-0.1.0/Prover.sol";
import {Web, WebProof, WebProofLib, WebLib} from "vlayer-0.1.0/WebProof.sol";

contract SyrupProver is Prover {
    using Strings for string;
    using WebProofLib for WebProof;
    using WebLib for Web;

    string public constant DATA_URL = "https://api.maple.finance/v2/graphql";

    function main(WebProof calldata webProof) public view returns (Proof memory, string memory, int256) {
        Web memory web = webProof.verify(DATA_URL);

        int256 dripsEarned = web.jsonGetInt("data.accountById.dripsEarned");
        string memory positionId = web.jsonGetString("data.poolV2Positions[0].id");

        return (proof(), positionId, dripsEarned);
    }
}
