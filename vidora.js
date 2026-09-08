/*
=========================================================
 ADSTRK SPONSORED POST ROUTER
 Version 4.0
=========================================================

 BEHAVIOR
 --------------------------------------------------------
 • First popup appears after 15 seconds
 • User must click Continue
 • Advertiser opens in a new tab
 • Sponsored popup closes immediately
 • Next popup appears 30 seconds later
 • No close/cancel button
 • No automatic redirects
 • No popunder behavior
 • Mobile responsive
 • Weighted advertiser rotation
 • Duplicate script protection
=========================================================
*/

(function () {
    "use strict";

    /* =====================================================
       DUPLICATE SCRIPT PROTECTION
    ===================================================== */

    if (window.__ADSTRK_SPONSORED_POST_ROUTER__) {
        return;
    }

    window.__ADSTRK_SPONSORED_POST_ROUTER__ = true;


    /* =====================================================
       CONFIGURATION
    ===================================================== */

    const ADSTRK = {

        // Time before first sponsored post
        initialDelay: 15000,

        // Time between successful sponsored posts
        repeatDelay: 30000,

        // Advertisers
        advertisers: [
            {
                url: "https://www.profitableratecpmnetwork.com/b1bentxe2?key=e084556a69f7401524a5aa0eb0e7f8cd",
                weight: 80
            },
          {
                url: "https://t.me/adstrkofficial",
                weight: 20
          }
        ]

    };


    /* =====================================================
       INTERNAL STATE
    ===================================================== */

    let popupTimer = null;
    let popupVisible = false;
    let pageActive = true;


    /* =====================================================
       UTILITY
    ===================================================== */

    function clearPopupTimer() {

        if (popupTimer !== null) {
            clearTimeout(popupTimer);
            popupTimer = null;
        }

    }


    /* =====================================================
       SELECT ADVERTISER
    ===================================================== */

    function selectAdvertiser() {

        const advertisers = ADSTRK.advertisers;

        if (!advertisers || advertisers.length === 0) {
            return null;
        }

        let totalWeight = 0;

        advertisers.forEach(function (advertiser) {

            const weight = Number(advertiser.weight);

            if (Number.isFinite(weight) && weight > 0) {
                totalWeight += weight;
            }

        });

        if (totalWeight <= 0) {
            return advertisers[0];
        }

        let random = Math.random() * totalWeight;

        for (let i = 0; i < advertisers.length; i++) {

            const advertiser = advertisers[i];

            const weight = Number(advertiser.weight);

            if (!Number.isFinite(weight) || weight <= 0) {
                continue;
            }

            random -= weight;

            if (random < 0) {
                return advertiser;
            }

        }

        return advertisers[advertisers.length - 1];

    }


    /* =====================================================
       CREATE STYLES
    ===================================================== */

    function injectStyles() {

        if (document.getElementById("adstrk-sponsored-styles")) {
            return;
        }

        const style = document.createElement("style");

        style.id = "adstrk-sponsored-styles";

        style.textContent = `
            #adstrk-sponsored-overlay {
                position: fixed;
                inset: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.72);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                box-sizing: border-box;
                z-index: 2147483647;
                font-family:
                    -apple-system,
                    BlinkMacSystemFont,
                    "Segoe UI",
                    Roboto,
                    Arial,
                    sans-serif;
            }

            #adstrk-sponsored-box {
                width: 100%;
                max-width: 430px;
                background: #ffffff;
                border-radius: 18px;
                padding: 28px 24px 24px;
                box-sizing: border-box;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
                animation: adstrkSponsoredIn 0.25s ease-out;
            }

            #adstrk-sponsored-label {
                display: inline-block;
                margin-bottom: 15px;
                padding: 6px 12px;
                border-radius: 999px;
                background: #f1f1f1;
                color: #666666;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.7px;
                text-transform: uppercase;
            }

            #adstrk-sponsored-title {
                margin: 0 0 10px;
                color: #111111;
                font-size: 23px;
                line-height: 1.25;
                font-weight: 750;
            }

            #adstrk-sponsored-text {
                margin: 0 auto 22px;
                max-width: 340px;
                color: #666666;
                font-size: 15px;
                line-height: 1.55;
            }

            #adstrk-sponsored-continue {
                width: 100%;
                min-height: 50px;
                border: 0;
                border-radius: 12px;
                padding: 13px 20px;
                box-sizing: border-box;
                background: #111111;
                color: #ffffff;
                font-size: 16px;
                font-weight: 700;
                cursor: pointer;
                transition:
                    transform 0.15s ease,
                    opacity 0.15s ease;
                -webkit-tap-highlight-color: transparent;
            }

            #adstrk-sponsored-continue:hover {
                transform: translateY(-1px);
            }

            #adstrk-sponsored-continue:active {
                transform: scale(0.98);
            }

            #adstrk-sponsored-continue:disabled {
                opacity: 0.65;
                cursor: default;
                transform: none;
            }

            @keyframes adstrkSponsoredIn {
                from {
                    opacity: 0;
                    transform: translateY(12px) scale(0.97);
                }

                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            @media (max-width: 480px) {

                #adstrk-sponsored-overlay {
                    padding: 16px;
                }

                #adstrk-sponsored-box {
                    max-width: 100%;
                    border-radius: 16px;
                    padding: 25px 20px 20px;
                }

                #adstrk-sponsored-title {
                    font-size: 21px;
                }

                #adstrk-sponsored-text {
                    font-size: 14px;
                }

            }
        `;

        document.head.appendChild(style);

    }


    /* =====================================================
       REMOVE POPUP
    ===================================================== */

    function removeSponsoredPost() {

        const existingPopup =
            document.getElementById("adstrk-sponsored-overlay");

        if (existingPopup) {
            existingPopup.remove();
        }

        popupVisible = false;

    }


    /* =====================================================
       OPEN ADVERTISER
    ===================================================== */

    function openAdvertiser() {

        const advertiser = selectAdvertiser();

        if (!advertiser || !advertiser.url) {
            return false;
        }

        const url = String(advertiser.url).trim();

        if (!url) {
            return false;
        }

        /*
         IMPORTANT:
         This runs directly from the user's click.
         */

        const newTab = window.open(
            url,
            "_blank",
            "noopener,noreferrer"
        );

        return !!newTab;

    }


    /* =====================================================
       SCHEDULE NEXT POPUP
    ===================================================== */

    function scheduleNextPopup() {

        clearPopupTimer();

        if (!pageActive) {
            return;
        }

        popupTimer = setTimeout(function () {

            popupTimer = null;

            if (!pageActive) {
                return;
            }

            removeSponsoredPost();
            createSponsoredPost();

        }, ADSTRK.repeatDelay);

    }


    /* =====================================================
       CREATE SPONSORED POST
    ===================================================== */

    function createSponsoredPost() {

        if (!pageActive) {
            return;
        }

        if (popupVisible) {
            return;
        }

        /*
         Make sure an old popup cannot remain.
        */

        removeSponsoredPost();

        popupVisible = true;


        /* =================================================
           OVERLAY
        ================================================= */

        const overlay = document.createElement("div");

        overlay.id = "adstrk-sponsored-overlay";

        overlay.setAttribute(
            "role",
            "dialog"
        );

        overlay.setAttribute(
            "aria-modal",
            "true"
        );


        /* =================================================
           POPUP BOX
        ================================================= */

        const box = document.createElement("div");

        box.id = "adstrk-sponsored-box";


        /* =================================================
           LABEL
        ================================================= */

        const label = document.createElement("div");

        label.id = "adstrk-sponsored-label";

        label.textContent = "Sponsored";


        /* =================================================
           TITLE
        ================================================= */

        const title = document.createElement("h2");

        title.id = "adstrk-sponsored-title";

        title.textContent = "Support our advertisers";


        /* =================================================
           DESCRIPTION
        ================================================= */

        const text = document.createElement("p");

        text.id = "adstrk-sponsored-text";

        text.textContent =
            "Continue to view the sponsored content. " +
            "The advertiser will open in a new tab.";


        /* =================================================
           CONTINUE BUTTON
        ================================================= */

        const continueButton =
            document.createElement("button");

        continueButton.id =
            "adstrk-sponsored-continue";

        continueButton.type = "button";

        continueButton.textContent = "Continue";


        /* =================================================
           CLICK HANDLER
        ================================================= */

        continueButton.addEventListener(
            "click",
            function () {

                if (!popupVisible) {
                    return;
                }

                /*
                 Prevent double clicks.
                */

                continueButton.disabled = true;

                /*
                 Remove popup BEFORE opening advertiser.
                 */

                removeSponsoredPost();

                /*
                 Open advertiser from the user's click.
                 */

                openAdvertiser();

                /*
                 Start 30-second countdown.
                 */

                scheduleNextPopup();

            },
            {
                once: true
            }
        );


        /* =================================================
           BUILD POPUP
        ================================================= */

        box.appendChild(label);
        box.appendChild(title);
        box.appendChild(text);
        box.appendChild(continueButton);

        overlay.appendChild(box);

        document.body.appendChild(overlay);

    }


    /* =====================================================
       START ROUTER
    ===================================================== */

    function startSponsoredPostRouter() {

        if (!document.body) {
            return;
        }

        injectStyles();

        clearPopupTimer();

        popupTimer = setTimeout(function () {

            popupTimer = null;

            if (!pageActive) {
                return;
            }

            createSponsoredPost();

        }, ADSTRK.initialDelay);

    }


    /* =====================================================
       PAGE LIFECYCLE
    ===================================================== */

    window.addEventListener(
        "pagehide",
        function () {

            pageActive = false;

            clearPopupTimer();

            removeSponsoredPost();

        }
    );


    /* =====================================================
       INITIALIZE
    ===================================================== */

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            startSponsoredPostRouter,
            {
                once: true
            }
        );

    } else {

        startSponsoredPostRouter();

    }


    /* =====================================================
       DEBUG INFORMATION
    ===================================================== */

    console.log(
        "ADSTRK Sponsored Post Router 4.0 loaded"
    );

})();
