/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/content/index.ts":
/*!******************************!*\
  !*** ./src/content/index.ts ***!
  \******************************/
/***/ (function() {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Listen for messages from the webpage
window.addEventListener('message', (event) => __awaiter(void 0, void 0, void 0, function* () {
    // Only accept messages from the same frame
    if (event.source !== window)
        return;
    const message = event.data;
    // Handle different message types
    switch (message.type) {
        case 'SOLANA_WALLET_CONNECT':
            handleConnect(event);
            break;
        case 'SOLANA_WALLET_SIGN_TRANSACTION':
            handleSignTransaction(message.transaction, event);
            break;
    }
}));
function handleConnect(event) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            // Get wallet from storage
            const result = yield chrome.storage.local.get(['wallet']);
            if (!result.wallet) {
                (_a = event.source) === null || _a === void 0 ? void 0 : _a.postMessage({ type: 'SOLANA_WALLET_CONNECT_ERROR', error: 'No wallet found' }, { targetOrigin: '*' });
                return;
            }
            // Send public key back to dApp
            (_b = event.source) === null || _b === void 0 ? void 0 : _b.postMessage({
                type: 'SOLANA_WALLET_CONNECT_SUCCESS',
                publicKey: result.wallet.publicKey
            }, { targetOrigin: '*' });
        }
        catch (error) {
            (_c = event.source) === null || _c === void 0 ? void 0 : _c.postMessage({
                type: 'SOLANA_WALLET_CONNECT_ERROR',
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }, { targetOrigin: '*' });
        }
    });
}
function handleSignTransaction(transaction, event) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            // Send transaction to background script for signing
            chrome.runtime.sendMessage({ type: 'SIGN_TRANSACTION', transaction }, (response) => {
                var _a, _b;
                if (response.error) {
                    (_a = event.source) === null || _a === void 0 ? void 0 : _a.postMessage({
                        type: 'SOLANA_WALLET_SIGN_ERROR',
                        error: response.error
                    }, { targetOrigin: '*' });
                }
                else {
                    (_b = event.source) === null || _b === void 0 ? void 0 : _b.postMessage({
                        type: 'SOLANA_WALLET_SIGN_SUCCESS',
                        signature: response.signature
                    }, { targetOrigin: '*' });
                }
            });
        }
        catch (error) {
            (_a = event.source) === null || _a === void 0 ? void 0 : _a.postMessage({
                type: 'SOLANA_WALLET_SIGN_ERROR',
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }, { targetOrigin: '*' });
        }
    });
}
// Inject provider into webpage as an external script
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
document.documentElement.appendChild(script);


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/content/index.ts"]();
/******/ 	
/******/ })()
;