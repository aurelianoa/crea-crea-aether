//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.17;

import "erc721a/contracts/ERC721A.sol";

contract MintPass is ERC721A {
    constructor() ERC721A("MintPass", "MINTPASS") {}

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }

    function _startTokenId() internal view virtual override returns (uint256) {
      return 1;
    }

}