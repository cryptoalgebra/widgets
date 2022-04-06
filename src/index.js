import {BigNumber} from "@ethersproject/bignumber"
import {formatEther, parseUnits} from "@ethersproject/units"
import html from './calc.html'
import style from './calc.css'

console.log(style)
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
        .catch(e => console.error(e.message))

}

const getAPR = () => {
    const apiLink = 'https://api.thegraph.com/subgraphs/name/iliaazhel/staker'
    const algbCourseQuery = `
            query stake {
                histories(where: { date_gte: 1642626000}) {
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
        .then(res => res.data.histories.map(item => BigNumber.from(item.ALGBfromVault).mul(BigNumber.from(parseUnits('365', 18))).mul(BigNumber.from(100)).div(BigNumber.from(item.ALGBbalance))))
        .then(res => Math.floor(formatEther(res.reduce((prev, cur) => prev.add(cur), BigNumber.from('0')))) / res.length)
        .then(res => res / 100)
        .catch(e => console.error(e.message))

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

            this.albgCourse = 0
            this.aprPercent = 0
            this.isAlgb = false
            this.inputValue = ''
            this.resInputValue = ''
            this.stakeDuration = 7 / 365
            this.openDetails = false
            this.openResultInput = false

            this.attachShadow({mode: 'open'})

            const DOM = new DOMParser().parseFromString(html, 'text/html')
            const STYLE = document.createElement('style')
            STYLE.textContent = style

            const main = DOM.documentElement.querySelector('#main-point')

            this.startInput = DOM.documentElement.querySelector('.start-value')
            this.startInput.addEventListener('keypress', checkInput)
            this.startInput.addEventListener('input', e => this.startInputChange(e))
            this.startInput.addEventListener('focus', () => this.closeResultInput())
            this.startInput.disabled = true
            this.startInput.placeholder = 'Loading...'

            this.secondCurrency = DOM.documentElement.querySelector('.calculator__input__currency')

            this.calculatorSwap = DOM.documentElement.querySelector('.calculator__swap')
            this.calculatorSwap.addEventListener('click', () => this.changeCurrency())

            this.inputCurrency = DOM.documentElement.querySelector('.calculator__input__input div')

            this.amountButtons = DOM.documentElement.querySelectorAll('.price')
            this.amountButtons.forEach(el => this.changeAmount(el))

            this.durationButtons = DOM.documentElement.querySelectorAll('.calculator__durations .period')
            this.durationButtons.forEach(el => el.addEventListener('click', e => this.changeDuration(e)))

            this.resultInput = DOM.documentElement.querySelector('.calculator__result__input input')
            this.resultInput.addEventListener('input', (e) => this.resultInputChange(e))
            this.resultInput.addEventListener('keypress', checkInput)

            this.resultDiv = DOM.documentElement.querySelector('.calculator__result__input div')
            this.resultDiv.addEventListener('click', () => this.toggleResultInput())

            this.resCurrency = DOM.documentElement.querySelector('.result__currency')
            this.resAlgb = DOM.documentElement.querySelector('.algb__income')

            this.showResultInput = DOM.documentElement.querySelector('.show__result__input')
            this.showResultInput.addEventListener('click', () => this.toggleResultInput())

            this.incomePercent = DOM.documentElement.querySelector('.calculator__result__percent')

            this.buttonHide = DOM.documentElement.querySelector('.calculator__footer__toggle')
            this.buttonHide.addEventListener('click', () => this.showDetails())

            this.buttonHideSvg = DOM.documentElement.querySelector('.calculator__footer__toggle svg')

            this.footerContent = DOM.documentElement.querySelector('.calculator__footer__content')

            this.footerApr = DOM.documentElement.querySelector('.calculator__footer__apr span')

            this.calculator = main
            this.shadowRoot.append(STYLE, main)
        }

        async connectedCallback() {
            this.albgCourse = await getAlgbCourse()
            this.aprPercent = await getAPR()

            this.startInput.placeholder = '0.00'
            this.startInput.disabled = false
            this.amountButtons.forEach(el => el.disabled = false)

            this.footerApr.textContent = (this.aprPercent * 100).toFixed(2) + '%'
            if (this.attributes.length === 0) {
                this.amountButtons[this.amountButtons.length - 1].disabled = true
            }
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

            this.calcIncomePercent(this.resultDiv.textContent)
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

            this.calcSecondCurrency(this.startInput.value)
            this.calcIncome()

            if (this.isAlgb) {
                this.inputCurrency.textContent = 'ALGB'
            } else {
                this.inputCurrency.textContent = 'USD'
            }
        }

        changeAmount(el) {
            el.disabled = true
            el.addEventListener('click', (e) => {
                if (e.target.textContent !== 'MY BALANCE') {
                    if (this.isAlgb) {
                        this.changeCurrency()
                    }
                    this.startInput.value = e.target.textContent
                    this.calcSecondCurrency(e.target.textContent)
                } else {
                    this.startInput.value = this.isAlgb ? this.balance : this.balance * this.albgCourse
                    this.calcSecondCurrency(this.isAlgb ? this.balance : this.balance * this.albgCourse)
                }
                this.calcIncome()
                this.calcIncomePercent(this.resultDiv.textContent)
            })
        }

        changeDuration(days) {
            this.stakeDuration = days.target.value / 365

            if (this.openResultInput) {
                this.calcStartAmount(this.resInputValue)
            } else {
                this.calcIncome()
            }
            this.calcIncomePercent(this.resultDiv.textContent)
        }

        calcIncome() {
            const earnTicks = 12 * 30 * 24
            const _amount = parseFloat(this.startInput.value === '' ? 0 : this.startInput.value)
            const amount = (_amount * (1 + this.aprPercent / earnTicks) ** (this.stakeDuration * earnTicks))
            const res = this.isAlgb ? ((amount - _amount) * this.albgCourse).toFixed(2) : (amount - _amount).toFixed(2)
            this.resultDiv.textContent = res
            this.resAlgb.textContent = '~ ' + (res / this.albgCourse).toFixed(2) + ' ALGB'
        }

        showDetails() {
            this.openDetails = !this.openDetails

            if (this.openDetails) {
                this.buttonHideSvg.style.transform = 'rotate(180deg)'
                this.footerContent.style.display = 'block'
            } else {
                this.buttonHideSvg.style.transform = 'rotate(0deg)'
                this.footerContent.style.display = 'none'
            }
        }

        resultInputChange(e) {
            this.resInputValue = e.target.value
            this.calcStartAmount(this.resInputValue)
            this.calcSecondCurrency(this.startInput.value)
        }

        toggleResultInput() {
            this.openResultInput = !this.openResultInput

            if (this.openResultInput) {
                this.resultInput.style.display = 'block'
                this.resultDiv.style.display = 'none'
                this.resultInput.value = this.resultDiv.textContent
            } else {
                this.resultInput.style.display = 'none'
                this.resultDiv.style.display = 'block'
                this.resultDiv.textContent = this.resultInput.value
            }
        }

        closeResultInput() {
            this.openResultInput = false

            this.resultInput.style.display = 'none'
            this.resultDiv.style.display = 'block'
        }

        calcStartAmount(amount) {

            const earnTicks = 12 * 30 * 24
            const _amount = parseFloat(amount === '' ? 0 : amount)

            this.startInput.value = _amount / ((1 + this.aprPercent / earnTicks) ** (this.stakeDuration * earnTicks) -1)
            this.calcIncomePercent(this.resultInput.value)
        }

        calcIncomePercent(income) {
            if (this.startInput.value === '') {
                this.incomePercent.textContent = '+ 0.00%'
                return
            }

            this.incomePercent.textContent = '+ ' + (income * 100 / parseFloat(this.startInput.value)).toFixed(2) + '%'
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