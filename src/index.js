import {BigNumber} from "@ethersproject/bignumber"
import {formatEther, parseUnits} from "@ethersproject/units"
import html from './calc.html'
import style from './calc.css'

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
                histories(where: { date_gte: ${Math.floor(Date.now() / 1000) - 31 * 24 * 60 * 60}}) {
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
    const regex = /^[0-9]*[.]?[0-9]*$/

    if (e.key === '.' && e.target.value === '') {
        e.preventDefault()
        e.target.value = '0.'
        return;
    }


    if (techKeys.includes(e.keyCode) && (e.ctrlKey || e.metaKey)) return

    if (allowKeys.includes(e.key)) return

    if (!regex.test(e.key) || (e.key === '.' && e.target.value.indexOf('.') > 0)) {
        e.preventDefault()
    }
}

const checkPaste = (e) => {
    const data = e.clipboardData || window.clipboardData

    if (!/^[0-9]*[.]?[0-9]*$/.test(data.getData('Text'))) {
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

            this.currentAprPlaceholder = DOM.documentElement.querySelector('#currentApr')

            this.startInput = DOM.documentElement.querySelector('.start-value')
            this.startInput.addEventListener('keypress', checkInput)
            this.startInput.addEventListener('input', e => this.startInputChange(e))
            this.startInput.addEventListener('focus', () => this.closeResultInput())
            this.startInput.addEventListener('paste', (e) => checkPaste(e))
            this.startInput.disabled = true
            this.startInput.placeholder = 'Loading...'

            this.secondCurrency = DOM.documentElement.querySelector('.calculator__input__currency')

            this.calculatorSwap = DOM.documentElement.querySelector('.calculator__swap')
            this.calculatorSwap.addEventListener('click', () => this.changeCurrency())

            this.inputCurrency = DOM.documentElement.querySelector('.calculator__input__input div')

            this.inputSymbol = DOM.documentElement.querySelector('.calculator__input__symbol')

            this.amountButtons = DOM.documentElement.querySelectorAll('.price')
            this.amountButtons.forEach(el => this.changeAmount(el))

            this.durationButtons = DOM.documentElement.querySelectorAll('.calculator__durations .period')
            this.durationButtons.forEach(el => el.addEventListener('click', e => this.changeDuration(e)))

            this.resultInput = DOM.documentElement.querySelector('.calculator__result__input input')
            this.resultInput.addEventListener('input', (e) => this.resultInputChange(e))
            this.resultInput.addEventListener('keypress', checkInput)
            this.resultInput.addEventListener('paste', (e) => checkPaste(e))

            this.resultDiv = DOM.documentElement.querySelector('.calculator__result__input div')
            this.resultDiv.addEventListener('click', () => this.toggleResultInput())

            this.resCurrency = DOM.documentElement.querySelector('.result__currency')
            this.resAlgb = DOM.documentElement.querySelector('.algb__income')

            this.incomePercent = DOM.documentElement.querySelector('.calculator__result__percent')

            this.calculator = main
            this.shadowRoot.append(STYLE, main)
        }

        async connectedCallback() {

            if (!this.balance) {
                this.amountButtons[this.amountButtons.length - 1].remove()
            }

            this.albgCourse = await getAlgbCourse()
            this.aprPercent = await getAPR()

            this.currentAprPlaceholder.textContent = `Current APR: ${(+this.aprPercent * 100).toFixed(2)}%`
            this.startInput.placeholder = 'Enter an amount'
            this.startInput.disabled = false
            this.amountButtons.forEach(el => el.disabled = false)
            this.durationButtons.forEach(el => el.disabled = false)
        }

        attributeChangedCallback(attrName, oldValue, newValue) {
            if (oldValue !== newValue) {
                this.calculator.setAttribute('balance', newValue)
            }
        }

        startInputChange(e) {

            if (e.inputType === 'insertText' && !/^[0-9]*[.]?[0-9]*$/.test(e.data)) {
                e.preventDefault()
                return
            }

            this.inputValue = e.target.value
            this.calcSecondCurrency(this.inputValue)
            this.calcIncome()

            this.calcIncomePercent(this.resultDiv.textContent)
        }

        calcSecondCurrency(e) {
            const inputValue = parseFloat(e === '' ? 0 : e)

            if (this.isAlgb) {
                this.secondCurrency.textContent = `${(inputValue * this.albgCourse).toFixed(2)}`
            } else {
                this.secondCurrency.textContent = `${(inputValue / this.albgCourse).toFixed(2)}`
            }
        }

        changeCurrency() {
            this.isAlgb = !this.isAlgb

            const temp = this.startInput.value
            this.startInput.value = this.secondCurrency.textContent
            this.secondCurrency.textContent = temp || '0.00'

            if (this.isAlgb) {
                this.inputCurrency.textContent = 'ALGB'
                this.inputSymbol.textContent = 'USD'
            } else {
                this.inputCurrency.textContent = 'USD'
                this.inputSymbol.textContent = 'ALGB'
            }
        }

        changeAmount(el) {
            el.disabled = true
            el.addEventListener('click', (e) => {
                if (e.target.textContent !== 'My balance') {
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
                this.calcIncomePercent(this.resultInput.value)
                return
            }
            this.calcIncome()
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
            const resInputVal = this.resultInput.value === '' ? 0 : this.resultInput.value

            this.startInput.value = _amount / ((1 + this.aprPercent / earnTicks) ** (this.stakeDuration * earnTicks) - 1)
            this.calcIncomePercent(resInputVal)
            this.resAlgb.textContent = '~ ' + (_amount / this.albgCourse).toFixed(2) + ' ALGB'
        }

        calcIncomePercent(income) {
            if (this.startInput.value === '' || income === '' || +this.startInput.value === 0) {
                this.incomePercent.textContent = '+ 0.00%'
                return
            }

            const divValue = this.isAlgb ? parseFloat(this.startInput.value * this.albgCourse) : parseFloat(this.startInput.value)

            this.incomePercent.textContent = '+ ' + (income * 100 / divValue).toFixed(2) + '%'
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