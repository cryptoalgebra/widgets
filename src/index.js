'use strict'

const input = document.querySelector('.input')
const title = document.querySelector('.title')
const button100 = document.querySelector('.sto')

input.addEventListener('input', (e) => {
    title.textContent = e.target.value
})
button100.addEventListener('click', () => {
    title.textContent = '100'
    input.value = 100
})