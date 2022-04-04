const getAlgbCourse = () => {
    const apiLink = 'https://api.thegraph.com/subgraphs/name/cryptoalgebra/algebra'
    const algbCourseQuery = `
            {
              bundles {
                maticPriceUSD
              }
              token(id: "0x0169ec1f8f639b32eec6d923e24c2a2ff45b9dd6") {
                derivedMatic
              }
            }
            `
    return fetch(apiLink, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query: algbCourseQuery
        })
    })
        .then(res => res.json())
        .then(res => res.data.token.derivedMatic * res.data.bundles[0].maticPriceUSD)
        .catch(e => console.log(e.message()))

}

const getAPR = () => {
    const apiLink = 'https://api.thegraph.com/subgraphs/name/iliaazhel/staker'
    const algbCourseQuery = `
            query stake {
                histories(where: { date_gte: ${Math.floor(new Date(`${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`).getTime() / 1000)},}) {
                    ALGBbalance
                    ALGBfromVault
                }
            }`
    return fetch(apiLink, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query: algbCourseQuery
        })
    })
        .then(res => res.json())
        .then(res => ethers.BigNumber.from(res.data.histories[0].ALGBfromVault).mul(ethers.BigNumber.from(ethers.utils.parseUnits('365', 18))).mul(ethers.BigNumber.from(100)).div(ethers.BigNumber.from(res.data.histories[0].ALGBbalance)))
        .then(res => Math.floor(ethers.utils.formatEther(res)))
        .catch(e => console.log(e.message()))

}

const checkInput = (e) => {
    const allowKeys = ['Delete', 'ArrowLeft', 'ArrowRight', 'Backspace']
    const techKeys = [65, 67, 82, 86]
    const regex = /^[0-9]*[.,]?[0-9]*$/

    if (techKeys.includes(e.keyCode) && (e.ctrlKey || e.metaKey)) return

    if (allowKeys.includes(e.key)) return

    if (!regex.test(e.key)) {
        e.preventDefault()
    }
}

(function () {
    class Calculator extends HTMLElement {

        static get observedAttributes() {
            return ['balance']
        }

        constructor() {
            super();

            this.styles = `
            .calculator {
                border-radius: 24px;
                width: 345px;
                background-color: #26343f;
                color: white;
                font-family: sans-serif;
            }
            .calculator__title {
                display: flex;
                align-items: center;
                color: white;
                justify-content: space-between;
                background-color: #1c2a35;
                padding: 1rem 1rem 1.5rem;
                border-top-right-radius: 24px;
                border-top-left-radius: 24px;
                
            }
            .calculator__title__button {
                background-color: transparent;
                border: none;
                height: 30px;
                padding: 5px;
                border-radius: 8px;
                stroke: #2797ff;
                fill: #2797ff;
                cursor: pointer;
            }
            .calculator__title__button:hover {
               opacity: .8;
            }
            
            .calculator__body {
                padding: 1rem;
            }
            
            .calculator__input {
                background-color: #385368;
                border-radius: 12px;
                padding: 1rem;
                display: flex;
                align-items: center;
                justify-content: flex-end;
                margin: .5rem 0;
            }
            
            .calculator__input__input {
                display: flex;
                justify-content: flex-end;
                align-items: center;
            }
            
            .calculator__input__input input {
               background: transparent;
               border: none;
               outline: none;
               color: white;
               text-align: right;
               padding: 0.5rem;
               width: 100%;
            }
            
            .calculator__input__currency {
                text-align: right;
                font-size: 12px;
            }
            
            .calculator__swap {
                background: transparent;
                border: none;
                stroke: white;
                fill: white;
                padding: 0 .5rem;
                cursor: pointer;
            }
            .calculator__swap:hover {
                opacity: .8;
            }
            
            .calculator__amounts {
                display: grid;
                grid-template-columns: 68px 68px 120px 16px;
                column-gap: 0.75rem;
                margin: .5rem 0;
            }
            
            .button {
                color: #2797ff;
                background: #385368;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                padding: .25rem .5rem;
                cursor: pointer;
            }
            .button:hover {
               opacity: .8;
            }
            
            .price span:after {
                content: "$";
                margin-left: 2px;
            }
            
            .price:disabled {
                opacity: .6;
                cursor: default;
            }
            
            .help {
                display: flex;
                justify-content: center;
                align-items: center;
                fill: #2797ff;
                cursor: pointer;
            }
            .help:hover {
                opacity: .8;
            }
            
            .calculator__durations {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                column-gap: .5rem;
                margin: .5rem 0;
            }
            
            .arrow-down {
                display: flex;
                justify-content: center;
                fill: white;
                margin: 1.5rem 0;
            }
            
            .calculator__result {
                  background: #385368;
                  border-radius: 12px;
                  padding: 1.5rem;
            }
            .calculator__result h5 {
                margin: 0;
                text-transform: uppercase;
                color: #2797ff;
            }
            .calculator__result__input {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 1rem 0;
            }
            .calculator__result__input div {
                font-size: 1.25rem;
                font-weight: 600;
            }
            
            .calculator__result__input div:after {
                content: "$";
                margin-left: 2px;
            }
            .calculator__result__input button {
                background: transparent;
                border: none;
                fill: #2797ff;
                cursor: pointer;
            }
            .calculator__result__input button:hover {
                opacity: .8;
            }
            .calculator__result__currency {
                font-size: 0.85rem;
            }
            
            .calculator__footer {
                background-color: #171e24;
                padding: 1.5rem 1rem 1rem;
                border-bottom-left-radius: 24px;
                border-bottom-right-radius: 24px;
            }
            
            .calculator__footer__toggle {
                background: transparent;
                border: none;
                color: #2797ff;
                fill: #2797ff;
                font-size: 16px;
                font-weight: 600;
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 10px 0;
            }
            
            .calculator__footer__apr {
                display: flex;
                 justify-content: space-between;
                 font-size: 0.9rem;
            }
            
            .calculator__footer ul {
                padding: 0 0 0 1rem;
                font-size: 0.75rem;
            }
            
            .calculator__footer ul li {
                margin: .5rem 0;
            }
            .calculator__footer__link {
                display: flex;
                align-items: center;
                justify-content: center;
                color: #2797ff;
                text-decoration: none;
                font-weight: 600;
            }
            .calculator__footer__link svg {
                margin-left: .5rem;
                fill: #2797ff;
            }
        `
            this.html = `
            <div id="main-point" class="calculator">
                <div class="calculator__title">
                    <span>ROI Calculator</span>
                    <button class="calculator__title__button" aria-label="Close the dialog">
                        <svg viewBox="0 0 24 24" color="primary" width="20px" xmlns="http://www.w3.org/2000/svg" class="sc-5a69fd5e-0 dwUojQ"><path d="M18.3 5.70997C17.91 5.31997 17.28 5.31997 16.89 5.70997L12 10.59L7.10997 5.69997C6.71997 5.30997 6.08997 5.30997 5.69997 5.69997C5.30997 6.08997 5.30997 6.71997 5.69997 7.10997L10.59 12L5.69997 16.89C5.30997 17.28 5.30997 17.91 5.69997 18.3C6.08997 18.69 6.71997 18.69 7.10997 18.3L12 13.41L16.89 18.3C17.28 18.69 17.91 18.69 18.3 18.3C18.69 17.91 18.69 17.28 18.3 16.89L13.41 12L18.3 7.10997C18.68 6.72997 18.68 6.08997 18.3 5.70997Z"></path></svg>
                    </button>
                </div>
                <div class="calculator__body">
                    <div class="">
                        <div class="">
                            <div class="">
                                 <div class="">ALGB staked</div>
                                  <div class="calculator__input">
                                     <div style="width: 100%">
                                        <div class="calculator__input__input">
                                            <input pattern="^[0-9]*[.,]?[0-9]*$" inputmode="decimal" min="0" placeholder="0.00"  class="start-value" value="">
                                            <div class="">USD</div>
                                        </div>
                                        <div class="calculator__input__currency">0.00 ALGB</div>
                                    </div>
                                    <button class="calculator__swap">
                                        <svg viewBox="0 0 24 25" color="textSubtle" width="20px" xmlns="http://www.w3.org/2000/svg" class="sc-5a69fd5e-0 doneTG">
                                        <path d="M16 17.01V11C16 10.45 15.55 10 15 10C14.45 10 14 10.45 14 11V17.01H12.21C11.76 17.01 11.54 17.55 11.86 17.86L14.65 20.64C14.85 20.83 15.16 20.83 15.36 20.64L18.15 17.86C18.47 17.55 18.24 17.01 17.8 17.01H16ZM8.65003 3.35002L5.86003 6.14002C5.54003 6.45002 5.76003 6.99002 6.21003 6.99002H8.00003V13C8.00003 13.55 8.45003 14 9.00003 14C9.55003 14 10 13.55 10 13V6.99002H11.79C12.24 6.99002 12.46 6.45002 12.14 6.14002L9.35003 3.35002C9.16003 3.16002 8.84003 3.16002 8.65003 3.35002Z"></path>
                                        </svg>
                                    </button>
                                 </div>
                            </div>
                            <div class="calculator__amounts">
                                <button class="button price"><span>100</span></button>
                                <button class="button price"><span>1000</span></button>
                                <button class="button price">MY BALANCE</button>
                                <span class="help">
                                    <svg viewBox="0 0 24 24" width="16px" height="16px" color="textSubtle" xmlns="http://www.w3.org/2000/svg" class="sc-5a69fd5e-0 doneTG"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM11 16H13V18H11V16ZM12.61 6.04C10.55 5.74 8.73 7.01 8.18 8.83C8 9.41 8.44 10 9.05 10H9.25C9.66 10 9.99 9.71 10.13 9.33C10.45 8.44 11.4 7.83 12.43 8.05C13.38 8.25 14.08 9.18 14 10.15C13.9 11.49 12.38 11.78 11.55 13.03C11.55 13.04 11.54 13.04 11.54 13.05C11.53 13.07 11.52 13.08 11.51 13.1C11.42 13.25 11.33 13.42 11.26 13.6C11.25 13.63 11.23 13.65 11.22 13.68C11.21 13.7 11.21 13.72 11.2 13.75C11.08 14.09 11 14.5 11 15H13C13 14.58 13.11 14.23 13.28 13.93C13.3 13.9 13.31 13.87 13.33 13.84C13.41 13.7 13.51 13.57 13.61 13.45C13.62 13.44 13.63 13.42 13.64 13.41C13.74 13.29 13.85 13.18 13.97 13.07C14.93 12.16 16.23 11.42 15.96 9.51C15.72 7.77 14.35 6.3 12.61 6.04Z"></path></svg>
                                </span>
                            </div>
                            <div class="">Staked for</div>
                            <div class="calculator__durations">
                                <button class="button period" value="7">7D</button>
                                <button class="button period" value="30">30D</button>
                                <button class="button period" value="90">3M</button>
                                <button class="button period" value="180">6M</button>
                                <button class="button period" value="365">1Y</button>
                            </div>
                        </div>
                        <div class="arrow-down">
                            <svg viewBox="0 0 24 24" width="24px" height="24px" color="textSubtle" xmlns="http://www.w3.org/2000/svg" class="sc-5a69fd5e-0 doneTG"><path d="M11 5V16.17L6.11997 11.29C5.72997 10.9 5.08997 10.9 4.69997 11.29C4.30997 11.68 4.30997 12.31 4.69997 12.7L11.29 19.29C11.68 19.68 12.31 19.68 12.7 19.29L19.29 12.7C19.68 12.31 19.68 11.68 19.29 11.29C18.9 10.9 18.27 10.9 17.88 11.29L13 16.17V5C13 4.45 12.55 4 12 4C11.45 4 11 4.45 11 5Z"></path></svg>
                        </div>
                        <div class="calculator__result">
                            <h5 class="">ROI at current rates</h5>
                            <div class="">
                                <div class="calculator__result__input">
                                    <div class="">0.00</div>
                                    <button class="">
                                        <svg viewBox="0 0 19 19" color="primary" width="20px" xmlns="http://www.w3.org/2000/svg" class="sc-5a69fd5e-0 dwUojQ"><path d="M0 15.46V18.5C0 18.78 0.22 19 0.5 19H3.54C3.67 19 3.8 18.95 3.89 18.85L14.81 7.94L11.06 4.19L0.15 15.1C0.0500001 15.2 0 15.32 0 15.46ZM17.71 5.04C18.1 4.65 18.1 4.02 17.71 3.63L15.37 1.29C14.98 0.899998 14.35 0.899998 13.96 1.29L12.13 3.12L15.88 6.87L17.71 5.04Z"></path></svg>
                                    </button>
                                </div>
                            </div>
                            <div class="calculator__result__currency">~ 0 CAKE (0.00%)</div>
                        </div>
                    </div>
                </div>
                <div class="calculator__footer">
                    <button class="calculator__footer__toggle" aria-label="Hide or show expandable content">Details
                        <svg viewBox="0 0 24 24" color="primary" width="20px" xmlns="http://www.w3.org/2000/svg" class="sc-5a69fd5e-0 ksqmbY"><path d="M8.11997 9.29006L12 13.1701L15.88 9.29006C16.27 8.90006 16.9 8.90006 17.29 9.29006C17.68 9.68006 17.68 10.3101 17.29 10.7001L12.7 15.2901C12.31 15.6801 11.68 15.6801 11.29 15.2901L6.69997 10.7001C6.30997 10.3101 6.30997 9.68006 6.69997 9.29006C7.08997 8.91006 7.72997 8.90006 8.11997 9.29006Z"></path></svg>
                    </button>
                    <div class="calculator__footer__apr">
                            <div>APR</div>
                            <div>50.04%</div>
                        </div>
                        <ul>
                            <li><div>Calculated based on current rates.</div></li>
                            <li><div>All figures are estimates provided for your convenience only, and by no means represent guaranteed returns.</div></li>
                            <li><div>All estimated rates take into account this pool’s 2% performance fee</div></li>
                        </ul>
                        <a target="_blank" rel="noreferrer noopener" href="https://app.algebra.finance/#/swap" class="calculator__footer__link">Get ALGB
                            <svg viewBox="0 0 24 24" color="primary" width="20px" xmlns="http://www.w3.org/2000/svg"><path d="M18 19H6C5.45 19 5 18.55 5 18V6C5 5.45 5.45 5 6 5H11C11.55 5 12 4.55 12 4C12 3.45 11.55 3 11 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V13C21 12.45 20.55 12 20 12C19.45 12 19 12.45 19 13V18C19 18.55 18.55 19 18 19ZM14 4C14 4.55 14.45 5 15 5H17.59L8.46 14.13C8.07 14.52 8.07 15.15 8.46 15.54C8.85 15.93 9.48 15.93 9.87 15.54L19 6.41V9C19 9.55 19.45 10 20 10C20.55 10 21 9.55 21 9V4C21 3.45 20.55 3 20 3H15C14.45 3 14 3.45 14 4Z"></path></svg>
                        </a>
                </div>
            </div>
        `
            this.albgCourse = 0
            this.aprPercent = 0
            this.isAlgb = false
            this.inputValue = ''
            this.stakeDuration = 7 / 365

            this.attachShadow({mode: 'open'})

            const DOM = new DOMParser().parseFromString(this.html, 'text/html')
            const STYLE = document.createElement('style')
            STYLE.textContent = this.styles

            const main = DOM.documentElement.querySelector('#main-point')

            this.startInput = DOM.documentElement.querySelector('.start-value')
            this.startInput.addEventListener('keypress', checkInput)
            this.startInput.addEventListener('input', (e) => this.startInputChange(e))

            this.secondCurrency = DOM.documentElement.querySelector('.calculator__input__currency')

            this.calculatorSwap = DOM.documentElement.querySelector('.calculator__swap')
            this.calculatorSwap.addEventListener('click', () => this.changeCurrency())

            this.inputCurrency = DOM.documentElement.querySelector('.calculator__input__input div')

            this.amountButtons = DOM.documentElement.querySelectorAll('.price')
            this.amountButtons.forEach(el => this.changeAmount(el))

            this.durationButtons = DOM.documentElement.querySelectorAll('.calculator__durations .period')
            this.durationButtons.forEach(el => el.addEventListener('click', (e) => this.changeDuration(e.target.value)))

            this.resultInput = DOM.documentElement.querySelector('.calculator__result__input div')

            this.calculator = main
            this.shadowRoot.append(STYLE, main)
        }

        async connectedCallback() {
            this.albgCourse = await getAlgbCourse()
            this.aprPercent = await getAPR() / 100
        }

        attributeChangedCallback(attrName, oldValue, newValue) {
            if (oldValue !== newValue) {
                this.calculator.setAttribute('balance', newValue)
            }
        }

        startInputChange(e) {
            this.inputValue = e.target.value
            this.calcSecondCurrency(this.inputValue)
            this.calcIncome()
        }

        calcSecondCurrency(e) {
            const inputValue = parseFloat(e === '' ? 0 : e)
            if (this.isAlgb) {
                this.secondCurrency.textContent = `${inputValue * this.albgCourse} USD`
            } else {
                this.secondCurrency.textContent = `${inputValue / this.albgCourse} ALGB`
            }
        }

        changeCurrency() {
            this.isAlgb = !this.isAlgb

            this.calcSecondCurrency(this.inputValue)
            this.calcIncome()

            if (this.isAlgb) {
                this.inputCurrency.textContent = 'ALGB'
            } else {
                this.inputCurrency.textContent = 'USD'
            }
        }

        changeAmount(el) {
            if (!this.attributes.balance.value && el.innerHTML === 'MY BALANCE') {
                el.disabled = true
            }
            el.addEventListener('click', (e) => {
                if (e.target.textContent !== 'MY BALANCE') {
                    if (this.isAlgb) {
                        this.changeCurrency()
                    }
                    this.startInput.value = e.target.textContent
                    this.calcSecondCurrency(e.target.textContent)
                    console.log(this.balance)
                } else {
                    this.startInput.value = this.isAlgb ? this.balance : this.balance * this.albgCourse
                    this.calcSecondCurrency(this.isAlgb ? this.balance : this.balance * this.albgCourse)
                }
            })
        }

        changeDuration(days) {
            this.stakeDuration = days / 365
            this.calcIncome()
        }

        calcIncome() {
            if (this.inputValue === '') return

            const earnTicks = 12 * 30 * 24
            const amount = this.isAlgb ? parseFloat(this.inputValue) : parseFloat(this.inputValue) * this.albgCourse

            this.resultInput.textContent = (amount * (1 + this.aprPercent / earnTicks) ** (this.stakeDuration * earnTicks)).toString()
        }

        get balance() {
            return this.calculator?.getAttribute('balance')
        }

        set balance(accountBalance) {
            this.setAttribute('balance', accountBalance)
        }
    }

    customElements.define('calculator-algb', Calculator)
})()