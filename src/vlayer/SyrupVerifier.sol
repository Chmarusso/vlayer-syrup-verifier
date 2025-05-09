// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import {Proof} from "vlayer-0.1.0/Proof.sol";
import {Verifier} from "vlayer-0.1.0/Verifier.sol";

import {SyrupProver} from "./SyrupProver.sol";

contract SyrupVerifier is Verifier {
    address public prover;

    mapping(string => int256) public positionIdToDripsEarned;

    constructor(address _prover) {
        prover = _prover;
    }

    function verify(Proof calldata, string memory _positionId, int256 _dripsEarned) public onlyVerified(prover, SyrupProver.main.selector) {
        positionIdToDripsEarned[_positionId] = _dripsEarned;
    }
}
