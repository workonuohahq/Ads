/* =========================================================
   ADSTRK SPONSORED POST ROUTER
   Version 3.31

   FEATURES
   - Initial 10-second delay
   - Sponsored Post popup only
   - No close/cancel button
   - Weighted advertiser rotation
   - Random advertiser selection
   - User-click initiated advertiser opening
   - Popup closes immediately on Continue
   - 15-second delay before next Sponsored Post
   - Repeats while page remains open
   - Duplicate-load protection
   - Mobile responsive
   - No external libraries
   ========================================================= */

(function () {
    "use strict";


    /* =====================================================
       DUPLICATE LOAD PROTECTION
       ===================================================== */

    if (window.__ADSTRK_SPONSORED_POST_LOADED__) {
        return;
    }

    window.__ADSTRK_SPONSORED_POST_LOADED__ = true;


    /* =====================================================
       CONFIGURATION
       ===================================================== */

    const ADSTRK = {

        /*
         * Time before the first Sponsored Post.
         * 10 seconds.
         */
        initialDelay: 10000,

        /*
         * Time between Sponsored Posts.
         * 15 seconds after Continue is tapped.
         */
        repeatDelay: 15000,

        /*
         * Advertisers.
         *
         * Higher weight = higher probability.
         *
         * 40 + 25 + 15 + 10 + 10 = 100
         */
        links: [

            {
                url: "https://oopsie.bio/chelsiaalovess",
                weight: 40
            },

            {
                url: "https://www.profitableratecpmnetwork.com/b1bentxe2?key=e084556a69f7401524a5aa0eb0e7f8cd",
                weight: 25
            },

            {
                url: "https://t.me/adstrkofficial",
                weight: 15
            },

            {
                url: "https://t.me/adstrkbot",
                weight: 10
            },

            {
                url: "https://advertiser5.com",
                weight: 10
            }

        ]

    };


    /* =====================================================
       INTERNAL STATE
       ===================================================== */

    let popupVisible = false;

    let nextPopupTimer = null;

    let initialTimer = null;

    let systemStarted = false;


    /* =====================================================
       UTILITY
       ===================================================== */

    function getOverlay() {

        return document.getElementById(
            "adstrk-sponsored-overlay"
        );

    }


    function getStyle() {

        return document.getElementById(
            "adstrk-sponsored-style"
        );

    }


    /* =====================================================
       VALIDATE ADVERTISERS
       ===================================================== */

    function getValidLinks() {

        return ADSTRK.links.filter(function (ad) {

            return (
                ad &&
                typeof ad.url === "string" &&
                ad.url.trim() !== "" &&
                Number(ad.weight) > 0
            );

        });

    }


    /* =====================================================
       WEIGHTED RANDOM ADVERTISER
       ===================================================== */

    function selectAdvertiser() {

        const links = getValidLinks();

        if (!links.length) {

            console.warn(
                "Adstrk: No valid advertisers configured."
            );

            return null;

        }


        const totalWeight = links.reduce(
            function (total, ad) {

                return total + Number(ad.weight);

            },
            0
        );


        let random =
            Math.random() * totalWeight;


        for (
            let i = 0;
            i < links.length;
            i++
        ) {

            random -= Number(
                links[i].weight
            );


            if (random <= 0) {

                return links[i];

            }

        }


        return links[
            links.length - 1
        ];

    }


    /* =====================================================
       REMOVE SPONSORED POST
       ===================================================== */

    function removeSponsoredPost() {

        const overlay = getOverlay();

        if (overlay) {

            overlay.remove();

        }


        popupVisible = false;

    }


    /* =====================================================
       CREATE STYLE
       ===================================================== */

    function createStyle() {

        /*
         * Don't inject the stylesheet more than once.
         */

        if (getStyle()) {
            return;
        }


        const style =
            document.createElement("style");


        style.id =
            "adstrk-sponsored-style";


        style.textContent = `

            /* =============================================
               FULL SCREEN OVERLAY
               ============================================= */

            #adstrk-sponsored-overlay {

                position: fixed;

                inset: 0;

                z-index: 2147483647;

                display: flex;

                align-items: center;

                justify-content: center;

                width: 100%;

                height: 100%;

                padding: 20px;

                box-sizing: border-box;

                background:
                    rgba(0, 0, 0, .48);

                backdrop-filter:
                    blur(5px);

                -webkit-backdrop-filter:
                    blur(5px);

                animation:
                    adstrkFadeIn
                    .35s
                    ease
                    forwards;

            }


            /* =============================================
               MODAL
               ============================================= */

            .adstrk-modal {

                position: relative;

                width: 430px;

                max-width:
                    calc(100% - 10px);

                padding:
                    28px 24px 20px;

                box-sizing: border-box;

                border-radius: 22px;

                text-align: center;

                background:
                    linear-gradient(
                        145deg,
                        #111827,
                        #080b14
                    );

                border:
                    1px solid
                    rgba(
                        255,
                        255,
                        255,
                        .12
                    );

                color: #ffffff;

                font-family:
                    Arial,
                    Helvetica,
                    sans-serif;

                box-shadow:
                    0 30px 100px
                    rgba(0,0,0,.65);

                overflow: hidden;

                animation:
                    adstrkModalIn
                    .55s
                    cubic-bezier(
                        .16,
                        1,
                        .3,
                        1
                    )
                    forwards;

            }


            /* =============================================
               DECORATIVE GLOW
               ============================================= */

            .adstrk-glow {

                position: absolute;

                width: 190px;

                height: 190px;

                top: -120px;

                left: 50%;

                transform:
                    translateX(-50%);

                border-radius: 50%;

                background:
                    rgba(
                        115,
                        92,
                        255,
                        .32
                    );

                filter:
                    blur(45px);

                pointer-events: none;

                animation:
                    adstrkGlow
                    2.5s
                    ease-in-out
                    infinite;

            }


            /* =============================================
               PULSE
               ============================================= */

            .adstrk-pulse {

                position: absolute;

                top: 18px;

                right: 20px;

                width: 9px;

                height: 9px;

                border-radius: 50%;

                background:
                    #735cff;

                box-shadow:
                    0 0 0 0
                    rgba(
                        115,
                        92,
                        255,
                        .7
                    );

                animation:
                    adstrkPulse
                    1.7s
                    infinite;

            }


            /* =============================================
               ICON
               ============================================= */

            .adstrk-icon {

                position: relative;

                display: flex;

                align-items: center;

                justify-content: center;

                width: 58px;

                height: 58px;

                margin:
                    0 auto 16px;

                border-radius: 17px;

                background:
                    rgba(
                        115,
                        92,
                        255,
                        .15
                    );

                border:
                    1px solid
                    rgba(
                        115,
                        92,
                        255,
                        .35
                    );

                font-size: 27px;

                font-weight: 800;

                box-shadow:
                    0 10px 35px
                    rgba(
                        115,
                        92,
                        255,
                        .15
                    );

            }


            /* =============================================
               TITLE
               ============================================= */

            .adstrk-title {

                position: relative;

                font-size: 20px;

                line-height: 1.3;

                font-weight: 800;

                letter-spacing: -.3px;

                margin-bottom: 8px;

            }


            /* =============================================
               DESCRIPTION
               ============================================= */

            .adstrk-description {

                position: relative;

                max-width: 330px;

                margin: 0 auto;

                font-size: 13px;

                line-height: 1.6;

                color:
                    rgba(
                        255,
                        255,
                        255,
                        .65
                    );

            }


            /* =============================================
               CONTINUE BUTTON
               ============================================= */

            #adstrk-sponsored-button {

                position: relative;

                display: flex;

                align-items: center;

                justify-content: center;

                width: 100%;

                margin-top: 23px;

                padding: 15px 18px;

                border: 0;

                border-radius: 14px;

                background:
                    linear-gradient(
                        135deg,
                        #735cff,
                        #5a43e8
                    );

                color: #ffffff;

                font-size: 14px;

                font-weight: 800;

                cursor: pointer;

                box-shadow:
                    0 12px 35px
                    rgba(
                        115,
                        92,
                        255,
                        .3
                    );

                transition:
                    transform .15s ease,
                    box-shadow .15s ease;

                -webkit-tap-highlight-color:
                    transparent;

            }


            #adstrk-sponsored-button span {

                display: inline-block;

                margin-left: 9px;

                font-size: 18px;

                transition:
                    transform .2s ease;

            }


            #adstrk-sponsored-button:hover {

                transform:
                    translateY(-2px);

                box-shadow:
                    0 16px 42px
                    rgba(
                        115,
                        92,
                        255,
                        .45
                    );

            }


            #adstrk-sponsored-button:hover span {

                transform:
                    translateX(5px);

            }


            #adstrk-sponsored-button:active {

                transform:
                    scale(.97);

            }


            /* =============================================
               FOOTER
               ============================================= */

            .adstrk-secure {

                position: relative;

                margin-top: 13px;

                text-align: center;

                font-size: 10px;

                color:
                    rgba(
                        255,
                        255,
                        255,
                        .32
                    );

            }


            /* =============================================
               ANIMATIONS
               ============================================= */

            @keyframes adstrkFadeIn {

                from {
                    opacity: 0;
                }

                to {
                    opacity: 1;
                }

            }


            @keyframes adstrkModalIn {

                from {

                    opacity: 0;

                    transform:
                        translateY(25px)
                        scale(.92);

                }

                to {

                    opacity: 1;

                    transform:
                        translateY(0)
                        scale(1);

                }

            }


            @keyframes adstrkPulse {

                0% {

                    box-shadow:
                        0 0 0 0
                        rgba(
                            115,
                            92,
                            255,
                            .7
                        );

                }

                70% {

                    box-shadow:
                        0 0 0 10px
                        rgba(
                            115,
                            92,
                            255,
                            0
                        );

                }

                100% {

                    box-shadow:
                        0 0 0 0
                        rgba(
                            115,
                            92,
                            255,
                            0
                        );

                }

            }


            @keyframes adstrkGlow {

                0%,
                100% {

                    opacity: .45;

                    transform:
                        translateX(-50%)
                        scale(1);

                }

                50% {

                    opacity: .9;

                    transform:
                        translateX(-50%)
                        scale(1.15);

                }

            }


            /* =============================================
               MOBILE
               ============================================= */

            @media (max-width: 480px) {

                #adstrk-sponsored-overlay {

                    padding: 14px;

                }


                .adstrk-modal {

                    width: 100%;

                    max-width: 100%;

                    padding:
                        25px 20px 18px;

                    border-radius: 20px;

                }


                .adstrk-title {

                    font-size: 19px;

                }


                .adstrk-description {

                    font-size: 12.5px;

                }

            }

        `;


        document.head.appendChild(style);

    }


    /* =====================================================
       CREATE SPONSORED POST
       ===================================================== */

    function createSponsoredPost() {

        /*
         * Never create two popups.
         */

        if (popupVisible) {
            return;
        }


        if (getOverlay()) {
            return;
        }


        popupVisible = true;


        /* Make sure CSS exists. */

        createStyle();


        /* =================================================
           OVERLAY
           ================================================= */

        const overlay =
            document.createElement("div");


        overlay.id =
            "adstrk-sponsored-overlay";


        /* =================================================
           POPUP CONTENT
           ================================================= */

        overlay.innerHTML = `

            <div class="adstrk-modal">

                <div class="adstrk-glow"></div>

                <div class="adstrk-pulse"></div>

                <div class="adstrk-icon">
                    &#8599;
                </div>

                <div class="adstrk-title">
                    Sponsored Post
                </div>

                <div class="adstrk-description">
                    A sponsored page is ready.
                    Tap below to continue.
                </div>

                <button
                    type="button"
                    id="adstrk-sponsored-button"
                >
                    Continue
                    <span>&rarr;</span>
                </button>

                <div class="adstrk-secure">
                    Sponsored | Adstrk
                </div>

            </div>

        `;


        document.body.appendChild(
            overlay
        );


        /* =================================================
           BUTTON
           ================================================= */

        const button =
            overlay.querySelector(
                "#adstrk-sponsored-button"
            );


        if (!button) {

            removeSponsoredPost();

            return;

        }


        /* =================================================
           CONTINUE CLICK
           ================================================= */

        button.addEventListener(
            "click",
            function () {

                /*
                 * Prevent double taps.
                 */

                if (!popupVisible) {
                    return;
                }


                /*
                 * Select advertiser BEFORE removing
                 * the popup so we know where to send
                 * the user.
                 */

                const advertiser =
                    selectAdvertiser();


                if (!advertiser) {

                    console.warn(
                        "Adstrk: No advertiser available."
                    );

                    return;

                }


                console.log(
                    "Adstrk Sponsored Post:",
                    advertiser.url
                );


                /*
                 * =================================================
                 * CRITICAL STEP
                 *
                 * REMOVE POPUP FIRST.
                 *
                 * We do NOT wait for window.open().
                 * We do NOT check a window reference.
                 * We do NOT wait for the new tab.
                 * =================================================
                 */

                removeSponsoredPost();


                /*
                 * =================================================
                 * OPEN ADVERTISER
                 *
                 * This still happens inside the original
                 * user click event.
                 * =================================================
                 */

                try {

                    window.open(
                        advertiser.url,
                        "_blank",
                        "noopener,noreferrer"
                    );

                }

                catch (error) {

                    console.warn(
                        "Adstrk: Advertiser could not be opened.",
                        error
                    );

                }


                /*
                 * =================================================
                 * START 15-SECOND COUNTDOWN
                 * =================================================
                 */

                scheduleNextPopup();

            },
            {
                once: true
            }
        );

    }


    /* =====================================================
       SCHEDULE NEXT POPUP
       ===================================================== */

    function scheduleNextPopup() {

        /*
         * Remove an existing timer first.
         */

        if (nextPopupTimer !== null) {

            clearTimeout(
                nextPopupTimer
            );

            nextPopupTimer = null;

        }


        /*
         * 15-second countdown.
         */

        nextPopupTimer =
            window.setTimeout(
                function () {

                    nextPopupTimer = null;


                    /*
                     * Make absolutely sure
                     * no old popup exists.
                     */

                    removeSponsoredPost();


                    /*
                     * Show fresh Sponsored Post.
                     */

                    createSponsoredPost();

                },
                ADSTRK.repeatDelay
            );

    }


    /* =====================================================
       START SYSTEM
       ===================================================== */

    function start() {

        if (systemStarted) {
            return;
        }

        systemStarted = true;


        /*
         * First popup after 10 seconds.
         */

        initialTimer =
            window.setTimeout(
                function () {

                    initialTimer = null;

                    createSponsoredPost();

                },
                ADSTRK.initialDelay
            );

    }


    /* =====================================================
       CLEANUP WHEN PAGE IS UNLOADED
       ===================================================== */

    window.addEventListener(
        "pagehide",
        function () {

            if (initialTimer !== null) {

                clearTimeout(
                    initialTimer
                );

                initialTimer = null;

            }


            if (nextPopupTimer !== null) {

                clearTimeout(
                    nextPopupTimer
                );

                nextPopupTimer = null;

            }

        }
    );


    /* =====================================================
       DOM READY
       ===================================================== */

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            start,
            {
                once: true
            }
        );

    }

    else {

        start();

    }

})();
