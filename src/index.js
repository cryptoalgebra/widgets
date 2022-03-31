
(function (window) {
    function calculator() {

        const styles=`
            <style>
                .hkdfjsdf1 {
                color: blue;
                }
            </style>
        `

        const html = `
            <div>
                <input/>
                <h1 class="hkdfjsdf1">hi</h1>
                <button>CLick</button>
            </div>
        `
        const DOM = new DOMParser().parseFromString(html,'text/html')
        const STYLE = new DOMParser().parseFromString(styles, 'text/html')

        const wrapper = DOM.querySelector('div')
        const input = DOM.querySelector('input')
        const title = DOM.querySelector('h1')
        const button100 = DOM.querySelector('button')

        const style = STYLE.querySelector('style')

        input.oninput = (e) => {
            title.textContent = e.target.value
        }

        button100.onclick = () => {
            title.textContent = '100'
            input.value = '100'
        }

        return {
            Calculator: wrapper,
            CalculatorStyle: style,
            buttonC: button100.onclick
        }
    }
    window.Calculator = calculator()
})(window)